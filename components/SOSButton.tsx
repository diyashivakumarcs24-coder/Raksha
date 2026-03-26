"use client";
/**
 * SOSButton — core SOS trigger.
 * Features:
 * - Geolocation + Audio recording (non-blocking)
 * - FRONT camera recording with live overlay + stop button
 * - Firebase Firestore alert (with userId)
 * - Firebase Storage upload (audio + video evidence)
 * - Offline SMS fallback
 * - Double-tap screen OR double-press "V" key
 * - "Data sent successfully" popup after upload
 * - Does NOT delay SOS trigger — camera starts in parallel
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentLocation } from "@/utils/location";
import { AudioRecorder } from "@/utils/recorder";
import { saveAlert, updateAlertAudio, updateAlertVideo, getUserProfile } from "@/lib/firestore";
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

  // Camera overlay state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraChunksRef = useRef<Blob[]>([]);
  const cameraAlertIdRef = useRef<string>("");

  const { user } = useAuth();
  const lastTapRef = useRef<number>(0);
  const lastVPressRef = useRef<number>(0);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => { cameraStream?.getTracks().forEach((t) => t.stop()); };
  }, [cameraStream]);

  // ── Offline SMS fallback ──────────────────────────────────────────────────
  const sendOfflineSMS = useCallback(async (lat: number, lng: number) => {
    const contacts: string[] = [];
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.emergencyContacts?.length) contacts.push(...profile.emergencyContacts);
      } catch { /* ignore */ }
    }
    const body = encodeURIComponent(
      `🚨 SOS ALERT from Raksha! I may be in danger. Location: https://maps.google.com/?q=${lat},${lng}`
    );
    for (const number of contacts) {
      window.location.href = `sms:${number}?body=${body}`;
      await new Promise((r) => setTimeout(r, 800));
    }
  }, [user]);

  // ── Start front camera recording with overlay ─────────────────────────────
  const startCameraRecording = useCallback(async (alertId: string) => {
    cameraAlertIdRef.current = alertId;
    cameraChunksRef.current = [];
    let stream: MediaStream | null = null;
    try {
      // Prefer FRONT camera for evidence
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }, audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      setCameraStream(stream);
      setCameraActive(true);

      // Attach to preview element
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
      stream?.getTracks().forEach((t) => t.stop());
    }
  }, []);

  // ── Stop camera + upload ──────────────────────────────────────────────────
  const stopCameraRecording = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      setCameraActive(false);
      cameraStream?.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
      return;
    }

    mr.stop();
    await new Promise<void>((resolve) => { mr.onstop = () => resolve(); });

    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setCameraActive(false);

    const blob = new Blob(cameraChunksRef.current, { type: "video/webm" });
    if (blob.size < 100) return; // nothing recorded

    // Local download backup
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `raksha_evidence_${Date.now()}.webm`; a.click();
    URL.revokeObjectURL(url);

    // Upload to Firebase Storage
    try {
      const filename = `evidence/${user?.uid ?? "anon"}/sos_${Date.now()}.webm`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob, { contentType: "video/webm" });
      const videoURL = await getDownloadURL(storageRef);
      if (cameraAlertIdRef.current) {
        await updateAlertVideo(cameraAlertIdRef.current, videoURL);
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
      // Location + audio start in parallel — camera starts after alertId is saved
      const [location] = await Promise.all([getCurrentLocation(), recorder.start()]);
      lat = location.latitude;
      lng = location.longitude;

      const alertData = {
        userId: user?.uid ?? "anonymous",
        timestamp: new Date().toISOString(),
        latitude: lat, longitude: lng,
        status: "triggered" as const,
      };

      try {
        alertId = await saveAlert(alertData);
        // Start camera AFTER alert is saved — non-blocking, does NOT delay SOS
        startCameraRecording(alertId).catch(console.warn);
      } catch {
        // Firebase offline fallback
        const offline = JSON.parse(localStorage.getItem("offlineAlerts") || "[]");
        offline.push(alertData);
        localStorage.setItem("offlineAlerts", JSON.stringify(offline));
        setStatus("offline");
        setMessage(t(lang, "sosOffline"));
        await recorder.stop();
        await sendOfflineSMS(lat, lng);
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
      if (lat && lng) await sendOfflineSMS(lat, lng);
      setStatus("error");
      setMessage(t(lang, "sosError"));
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 5000);
    }
  }, [status, user, lang, sendOfflineSMS, startCameraRecording]);

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

  const colors: Record<Status, string> = {
    idle:      "bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-500/60",
    recording: "bg-orange-500 animate-pulse shadow-orange-500/60",
    uploading: "bg-yellow-500 animate-pulse shadow-yellow-500/60",
    done:      "bg-green-500 shadow-green-500/60",
    error:     "bg-gray-600 shadow-gray-500/60",
    offline:   "bg-blue-500 shadow-blue-500/60",
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
      {/* ── Camera overlay ── */}
      {cameraActive && (
        <div className="w-full bg-black border-2 border-red-500 rounded-2xl overflow-hidden relative">
          <video
            ref={videoPreviewRef}
            muted
            playsInline
            className="w-full h-40 object-cover"
          />
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

      {/* ── Success popup ── */}
      {showSuccess && (
        <div className="w-full bg-green-900/40 border border-green-500/50 rounded-2xl px-4 py-3 text-center">
          <p className="text-green-300 text-sm font-semibold">{t(lang, "dataSent")}</p>
        </div>
      )}

      {/* ── SOS Button ── */}
      <button
        onClick={() => { handleScreenTap(); handleSOS(); }}
        onTouchEnd={(e) => { e.preventDefault(); handleScreenTap(); }}
        disabled={status === "recording" || status === "uploading"}
        className={`w-44 h-44 rounded-full text-white font-black text-3xl shadow-2xl transition-all duration-300 border-4 border-white/20 active:scale-95 ${colors[status]}`}
        aria-label="Send SOS Alert"
        style={{ boxShadow: status === "idle" ? "0 0 40px rgba(239,68,68,0.4), 0 8px 32px rgba(0,0,0,0.5)" : undefined }}
      >
        {labels[status]}
      </button>

      {message && (
        <p className={`text-sm font-medium px-4 py-2 rounded-full ${
          status === "done"    ? "bg-green-900/50 text-green-300" :
          status === "error"   ? "bg-red-900/50 text-red-300" :
          status === "offline" ? "bg-blue-900/50 text-blue-300" :
          "bg-gray-800 text-gray-300"
        }`}>
          {message}
        </p>
      )}

      <p className="text-gray-600 text-xs text-center max-w-xs">
        Tap SOS · Double-tap screen · Double-press V
      </p>
    </div>
  );
}
