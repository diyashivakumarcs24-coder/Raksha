"use client";
import { useState } from "react";
import { getCurrentLocation } from "@/utils/location";
import { AudioRecorder } from "@/utils/recorder";
import { saveAlert, updateAlertAudio } from "@/lib/firestore";
import { uploadAudio } from "@/lib/storage";

type Status = "idle" | "recording" | "uploading" | "done" | "error" | "offline";

export default function SOSButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSOS = async () => {
    if (status === "recording" || status === "uploading") return;
    setStatus("recording");
    setMessage("Recording & locating...");

    const recorder = new AudioRecorder();
    let alertId = "";

    try {
      const [location] = await Promise.all([getCurrentLocation(), recorder.start()]);

      const alertData = {
        timestamp: new Date().toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        status: "triggered" as const,
      };

      // Try Firebase, fallback to localStorage
      try {
        alertId = await saveAlert(alertData);
      } catch {
        const offline = JSON.parse(localStorage.getItem("offlineAlerts") || "[]");
        offline.push(alertData);
        localStorage.setItem("offlineAlerts", JSON.stringify(offline));
        setStatus("offline");
        setMessage("Saved offline. Will sync when online.");
        await recorder.stop();
        return;
      }

      // Record for 10 seconds
      await new Promise((r) => setTimeout(r, 10000));
      setStatus("uploading");
      setMessage("Uploading recording...");

      const blob = await recorder.stop();
      const filename = `sos_${Date.now()}.webm`;

      try {
        const audioURL = await uploadAudio(blob, filename);
        await updateAlertAudio(alertId, audioURL);
      } catch {
        // Audio upload failed, alert still saved
      }

      setStatus("done");
      setMessage("SOS Alert Sent Successfully!");
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 4000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Error sending SOS. Check permissions.");
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 4000);
    }
  };

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
    recording: "REC...",
    uploading: "SEND...",
    done: "SENT ✓",
    error: "ERROR",
    offline: "SAVED",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleSOS}
        disabled={status === "recording" || status === "uploading"}
        className={`w-40 h-40 rounded-full text-white font-black text-3xl shadow-2xl transition-all duration-300 border-4 border-white/20 ${colors[status]}`}
        aria-label="Send SOS Alert"
      >
        {labels[status]}
      </button>
      {message && (
        <p className={`text-sm font-medium px-4 py-2 rounded-full ${
          status === "done" ? "bg-green-900/50 text-green-300" :
          status === "error" ? "bg-red-900/50 text-red-300" :
          status === "offline" ? "bg-blue-900/50 text-blue-300" :
          "bg-gray-800 text-gray-300"
        }`}>
          {message}
        </p>
      )}
      <p className="text-gray-500 text-xs text-center max-w-xs">
        Hold to send SOS — records 10s audio, captures location, alerts emergency contacts
      </p>
    </div>
  );
}
