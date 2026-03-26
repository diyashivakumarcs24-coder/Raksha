"use client";
/**
 * SOSButton — core SOS trigger with:
 * - Geolocation capture
 * - Audio recording (MediaRecorder)
 * - Camera recording (environment/front fallback)
 * - Firebase Firestore alert save (with userId)
 * - Firebase Storage upload (audio + video)
 * - Offline SMS fallback via window.location.href
 * - Double-tap (screen) OR double-press "V" key trigger
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentLocation } from "@/utils/location";
import { AudioRecorder } from "@/utils/recorder";
import { saveAlert, updateAlertAudio, updateAlertVideo, getUserProfile } from "@/lib/firestore";
import { uploadAudio } from "@/lib/storage";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";

type Status = "idle" | "recording" | "uploading" | "done" | "error" | "offline";

export default function SOSButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  // Double-tap / double-V detection refs
  const lastTapRef = useRef<number>(0);
  const lastVPressRef = useRef<number>(0);

  // ── Offline SMS fallback ──────────────────────────────────────────────────
  const sendOfflineSMS = useCallback(
    async (lat: number, lng: number) => {
      const contacts: string[] = [];
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile?.emergencyContacts?.length) {
            contacts.push(...profile.emergencyContacts);
          }
        } catch {
          // ignore — use empty list
        }
      }
      const body = encodeURIComponent(
        `🚨 SOS ALERT from Raksha! I may be in danger. Location: https://maps.google.com/?q=${lat},${lng}`
      );
      // Trigger SMS for each contact sequentially
      for (const number of contacts) {
        window.location.href = `sms:${number}?body=${body}`;
        await new Promise((r) => setTimeout(r, 800));
      }
    },
    [user]
  );

  // ── Camera recording ──────────────────────────────────────────────────────
  const recordCamera = async (
    alertId: string,
    lat: number,
    lng: number
  ): Promise<void> => {
    let stream: MediaStream | null = null;
    try {
      // Prefer back camera, fallback to front
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      const chunks: Blob[] = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      mr.start(1000);
      await new Promise((r) => setTimeout(r, 10000)); // record 10s
      mr.stop();
      await new Promise<void>((resolve) => { mr.onstop = () => resolve(); });

      stream.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunks, { type: "video/webm" });
      const filename = `evidence/${user?.uid ?? "anon"}/sos_${Date.now()}.webm`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob, { contentType: "video/webm" });
      const videoURL = await getDownloadURL(storageRef);
      await updateAlertVideo(alertId, videoURL);

      // Also offer local download as backup
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `raksha_evidence_${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Camera recording failed:", err);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    }
  };

  // ── Core SOS handler ─────────────────────────────────────────────────────
  const handleSOS = useCallback(async () => {
    if (status === "recording" || status === "uploading") return;
    setStatus("recording");
    setMessage("Recording & locating…");

    const recorder = new AudioRecorder();
    let alertId = "";
    let lat = 0;
    let lng = 0;

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

      // ── Try Firebase ──────────────────────────────────────────────────────
      try {
        alertId = await saveAlert(alertData);
      } catch {
        // Firebase failed → offline fallback
        const offline = JSON.parse(localStorage.getItem("offlineAlerts") || "[]");
        offline.push(alertData);
        localStorage.setItem("offlineAlerts", JSON.stringify(offline));
        setStatus("offline");
        setMessage("Offline — sending SMS…");
        await recorder.stop();
        await sendOfflineSMS(lat, lng);
        setMessage("SMS sent. Alert saved locally.");
        setTimeout(() => { setStatus("idle"); setMessage(""); }, 5000);
        return;
      }

      // ── Record 10s audio ─────────────────────────────────────────────────
      await new Promise((r) => setTimeout(r, 10000));
      setStatus("uploading");
      setMessage("Uploading evidence…");

      const blob = await recorder.stop();
      const filename = `sos_${Date.now()}.webm`;

      try {
        const audioURL = await uploadAudio(blob, filename);
        await updateAlertAudio(alertId, audioURL);
      } catch {
        // Audio upload failed — alert still saved, continue
      }

      // ── Camera recording (non-blocking) ──────────────────────────────────
      recordCamera(alertId, lat, lng).catch(console.warn);

      setStatus("done");
      setMessage("🚨 SOS Alert Sent!");
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 5000);
    } catch (err) {
      console.error(err);
      // Last resort — try SMS even on unexpected error
      if (lat && lng) await sendOfflineSMS(lat, lng);
      setStatus("error");
      setMessage("Error — check location/mic permissions.");
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 5000);
    }
  }, [status, user, sendOfflineSMS]);

  // ── Double-tap on screen ──────────────────────────────────────────────────
  const handleScreenTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 500) {
      handleSOS();
    }
    lastTapRef.current = now;
  }, [handleSOS]);

  // ── Double-press "V" key ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "v") return;
      const now = Date.now();
      if (now - lastVPressRef.current < 500) {
        handleSOS();
      }
      lastVPressRef.current = now;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSOS]);

  const colors: Record<Status, string> = {
    idle: "bg-red-600 hover:bg-red-500 shadow-red-500/50",
    recording: "bg-orange-500 animate-pulse shadow-orange-500/50",
    uploading: "bg-yellow-500 animate-pulse shadow-yellow-500/50",
    done: "bg-green-500 shadow-green-500/50",
    error: "bg-gray-600 shadow-gray-500/50",
    offline: "bg-blue-500 shadow-blue-500/50",
  };

  const labels: Record<Status, string> = {
    idle: "SOS",
    recording: "REC…",
    uploading: "SEND…",
    done: "SENT ✓",
    error: "ERROR",
    offline: "SMS…",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={() => { handleScreenTap(); handleSOS(); }}
        onTouchEnd={handleScreenTap}
        disabled={status === "recording" || status === "uploading"}
        className={`w-40 h-40 rounded-full text-white font-black text-3xl shadow-2xl transition-all duration-300 border-4 border-white/20 ${colors[status]}`}
        aria-label="Send SOS Alert"
      >
        {labels[status]}
      </button>

      {message && (
        <p
          className={`text-sm font-medium px-4 py-2 rounded-full ${
            status === "done"
              ? "bg-green-900/50 text-green-300"
              : status === "error"
              ? "bg-red-900/50 text-red-300"
              : status === "offline"
              ? "bg-blue-900/50 text-blue-300"
              : "bg-gray-800 text-gray-300"
          }`}
        >
          {message}
        </p>
      )}

      <p className="text-gray-500 text-xs text-center max-w-xs">
        Tap SOS · Double-tap screen · Double-press V key
      </p>
    </div>
  );
}
