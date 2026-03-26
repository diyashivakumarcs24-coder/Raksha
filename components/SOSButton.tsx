"use client";
/**
 * SOSButton — core SOS trigger (extended, not replaced).
 *
 * Flow:
 * 1. Get location + start audio recording (parallel)
 * 2. If online  → save alert to Firestore → start camera (non-blocking)
 * 3. If offline → queue locally → SMS fallback to emergency contacts
 * 4. After 10s audio → upload audio to Storage
 * 5. Camera stop → upload video → save to "evidence" collection → share link via SMS
 * 6. Show "Data sent successfully" popup
 *
 * Triggers: button tap | double-tap screen | double-press V key
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentLocation } from "@/utils/location";
import { AudioRecorder } from "@/utils/recorder";
import {
  saveAlert, updateAlertAudio, updateAlertVideo,
  getUserProfile, saveEvidence,
} from "@/lib/firestore";
import { uploadAudio } from "@/lib/storage";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { Lang, t } from "@/lib/i18n";

type Status = "idle" | "recording" | "uploading" | "done" | "error" | "offline";

interface Props { lang?: Lang }

export default function SOSButton({ lang = "en" }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraChunksRef = useRef<Blob[]>([]);
  const cameraAlertIdRef = useRef<string>("");
  const lastTapRef = useRef<number>(0);
  const lastVPressRef = useRef<number>(0);

  const { user } = useAuth();

  useEffect(() => {
    return () => { cameraStream?.getTracks().forEach((tr) => tr.stop()); };
  }, [cameraStream]);

  // ── SMS fallback (offline or error) ──────────────────────────────────────
  const sendSMSFallback = useCallback(async (lat: number, lng: number, setMsg?: (m: string) => void) => {
    setMsg?.("No internet. Sending SMS…");
    const contacts: string[] = [];
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.emergencyContacts?.length) contacts.push(...profile.emergencyContacts);
      } catch { /* ignore */ }
    }

    if (!contacts.length) {
      setMsg?.("No contacts saved. Alert stored locally.");
      return;
    }

    const body = encodeURIComponent(
      `🚨 SOS from Raksha! I may be in danger. My location: https://maps.google.com/?q=${lat},${lng}`
    );

    // Try sending to each contact via sms: URI
    for (const number of contacts) {
      try {
        window.location.href = `sms:${number}?body=${body}`;
        await new Promise((r) => setTimeout(r, 900));
      } catch { /* browser may block — user sees pre-filled SMS */ }
    }
    setMsg?.("SMS sent to emergency contacts.");
  }, [user]);

  // ── Store alert locally for retry ────────────────────────────────────────
  const queueOfflineAlert = (data: object) => {
    const queue = JSON.parse(localStorage.getItem("offlineAlerts") || "[]");
    queue.push({ ...data, queuedAt: Date.now() });
    localStorage.setItem("offlineAlerts", JSON.stringify(queue));
  };

  // ── Camera: start front-facing recording ─────────────────────────────────
  const startCameraRecording = useCallback(async (alertId: string) => {
    cameraAlertIdRef.current = alertId;
    cameraChunksRef.current = [];
    let stream: MediaStream | null = null;
    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      setCameraStream(stream);
      setCameraActive(true);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) cameraChunksRef.current.push(e.data); };
      mr.start(1000);
    } catch (err) {
      console.warn("Camera start failed:", err);
      stream?.getTracks().forEach((tr) => tr.stop());
    }
  }, []);

  // ── Camera: stop + upload + save evidence + share via SMS ─────────────────
  const stopCameraRecording = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      setCameraActive(false);
      cameraStream?.getTracks().forEach((tr) => tr.stop());
      setCameraStream(null);
      return;
    }
    mr.stop();
    await new Promise<void>((resolve) => { mr.onstop = () => resolve(); });
    cameraStream?.getTracks().forEach((tr) => tr.stop());
    setCameraStream(null);
    setCameraActive(false);

    const blob = new Blob(cameraChunksRef.current, { type: "video/webm" });
    if (blob.size < 100) return;

    // Local download as backup
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `raksha_evidence_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(blobUrl);

    // Upload to Firebase Storage
    try {
      const filename = `evidence/${user?.uid ?? "anon"}/sos_${Date.now()}.webm`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob, { contentType: "video/webm" });
      const videoUrl = await getDownloadURL(storageRef);

      // Update alert record
      if (cameraAlertIdRef.current) {
        await updateAlertVideo(cameraAlertIdRef.current, videoUrl);
      }

      // Save to "evidence" collection
      if (user?.uid) {
        await saveEvidence({
          userId: user.uid,
          videoUrl,
          timestamp: new Date().toISOString(),
          alertId: cameraAlertIdRef.current || undefined,
        });
      }

      // Share video link with emergency contacts via SMS
      if (user?.uid) {
        const profile = await getUserProfile(user.uid);
        const contacts = profile?.emergencyContacts ?? [];
        const smsBody = encodeURIComponent(`🎥 Raksha evidence video: ${videoUrl}`);
        for (const number of contacts) {
          window.location.href = `sms:${number}?body=${smsBody}`;
          await new Promise((r) => setTimeout(r, 800));
        }
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.warn("Video upload failed:", err);
    }
  }, [cameraStream, user]);

  // ── Core SOS handler ─────────────────────────────────────────────────────
  const handleSOS = useCallback(async () => {
    if (status === "recording" || status === "uploading") return;
    setStatus("recording");
    setMessage(t(lang, "sosRecording"));

    const recorder = new AudioRecorder();
    let alertId = "";
    let lat = 0, lng = 0;

    try {
      const [location] = await Promise.all([getCurrentLocation(), recorder.start()]);
      lat = location.latitude;
      lng = location.longitude;

      const alertData = {
        userId: user?.uid ?? "anonymous",
        timestamp: new Date().toISOString(),
        latitude: lat,
        longitude: lng,
        status: "triggered" as const,
      };

      // ── Online path ───────────────────────────────────────────────────────
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          alertId = await saveAlert(alertData);
          // Camera starts non-blocking — does NOT delay SOS
          startCameraRecording(alertId).catch(console.warn);
        } catch {
          // Firebase failed even though online — queue + SMS
          queueOfflineAlert(alertData);
          setStatus("offline");
          await recorder.stop();
          await sendSMSFallback(lat, lng, setMessage);
          setTimeout(() => { setStatus("idle"); setMessage(""); }, 5000);
          return;
        }
      } else {
        // ── Offline path ────────────────────────────────────────────────────
        queueOfflineAlert(alertData);
        setStatus("offline");
        await recorder.stop();
        await sendSMSFallback(lat, lng, setMessage);
        setTimeout(() => { setStatus("idle"); setMessage(""); }, 5000);
        return;
      }

      // Record 10s audio
      await new Promise((r) => setTimeout(r, 10000));
      setStatus("uploading");
      setMessage(t(lang, "sosSending"));

      const blob = await recorder.stop();
      try {
        const audioURL = await uploadAudio(blob, `sos_${Date.now()}.webm`);
        await updateAlertAudio(alertId, audioURL);
      } catch { /* audio upload failed — alert still saved */ }

      setStatus("done");
      setMessage(t(lang, "sosSent"));
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 5000);
    } catch (err) {
      console.error(err);
      if (lat && lng) await sendSMSFallback(lat, lng, setMessage);
      setStatus("error");
      setMessage(t(lang, "sosError"));
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 5000);
    }
  }, [status, user, lang, sendSMSFallback, startCameraRecording]);

  // ── Double-tap ────────────────────────────────────────────────────────────
  const handleScreenTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 500) handleSOS();
    lastTapRef.current = now;
  }, [handleSOS]);

  // ── Double-V key ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "v") return;
      const now = Date.now();
      if (now - lastVPressRef.current < 500) handleSOS();
      lastVPressRef.current = now;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSOS]);

  // Auto-retry queued offline alerts when network returns
  useEffect(() => {
    const onOnline = async () => {
      const queue: object[] = JSON.parse(localStorage.getItem("offlineAlerts") || "[]");
      if (!queue.length) return;
      try {
        for (const item of queue) {
          await saveAlert(item as Parameters<typeof saveAlert>[0]);
        }
        localStorage.removeItem("offlineAlerts");
      } catch { /* will retry next time */ }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const colors: Record<Status, string> = {
    idle:      "bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600",
    recording: "bg-orange-500 animate-pulse",
    uploading: "bg-yellow-500 animate-pulse",
    done:      "bg-green-500",
    error:     "bg-gray-600",
    offline:   "bg-blue-500",
  };

  const labels: Record<Status, string> = {
    idle:      t(lang, "sosButton"),
    recording: t(lang, "sosRecording"),
    uploading: t(lang, "sosSending"),
    done:      t(lang, "sosSent"),
    error:     t(lang, "sosError"),
    offline:   t(lang, "sosOffline"),
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Camera overlay */}
      {cameraActive && (
        <div className="w-full bg-black border-2 border-red-500 rounded-2xl overflow-hidden relative">
          <video ref={videoPreviewRef} muted playsInline className="w-full h-40 object-cover" />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 rounded-full px-3 py-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-xs font-semibold">{t(lang, "recordingEvidence")}</span>
          </div>
          <button
            onClick={stopCameraRecording}
            className="absolute bottom-2 right-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          >
            {t(lang, "stopRecording")}
          </button>
        </div>
      )}

      {/* Success popup */}
      {showSuccess && (
        <div className="w-full bg-green-900/40 border border-green-500/50 rounded-2xl px-4 py-3 text-center">
          <p className="text-green-300 text-sm font-semibold">{t(lang, "dataSent")}</p>
        </div>
      )}

      {/* SOS Button */}
      <button
        onClick={() => { handleScreenTap(); handleSOS(); }}
        onTouchEnd={(e) => { e.preventDefault(); handleScreenTap(); }}
        disabled={status === "recording" || status === "uploading"}
        className={`w-44 h-44 rounded-full text-white font-black text-3xl shadow-2xl transition-all duration-300 border-4 border-white/20 active:scale-95 ${colors[status]}`}
        aria-label="Send SOS Alert"
        style={{
          boxShadow: status === "idle"
            ? "0 0 48px rgba(239,68,68,0.5), 0 8px 32px rgba(0,0,0,0.6)"
            : undefined,
        }}
      >
        {labels[status]}
      </button>

      {message && (
        <p className={`text-sm font-medium px-4 py-2 rounded-full text-center max-w-xs ${
          status === "done"    ? "bg-green-900/50 text-green-300" :
          status === "error"   ? "bg-red-900/50 text-red-300" :
          status === "offline" ? "bg-blue-900/50 text-blue-300" :
          "bg-gray-800/80 text-gray-300"
        }`}>
          {message}
        </p>
      )}

      <p className="text-gray-600 text-xs text-center">
        Tap · Double-tap · Double-press V
      </p>
    </div>
  );
}
