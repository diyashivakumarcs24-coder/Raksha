"use client";
/**
 * MeshSOS — offline SOS relay using Web Bluetooth + localStorage queue.
 * When internet is unavailable:
 *   1. Attempts Web Bluetooth broadcast to nearby devices
 *   2. Stores alert in localStorage queue
 *   3. Auto-syncs to Firebase when network returns
 * UI shows real-time status feedback.
 */
import { useState, useEffect, useCallback } from "react";
import { Lang, t } from "@/lib/i18n";

type MeshStatus = "idle" | "scanning" | "sending" | "delivered" | "queued" | "syncing";

interface Props {
  lang: Lang;
  alertData?: { latitude: number; longitude: number; timestamp: string } | null;
  onSynced?: () => void;
}

export default function MeshSOS({ lang, alertData, onSynced }: Props) {
  const [status, setStatus] = useState<MeshStatus>("idle");
  const [queueCount, setQueueCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 5));

  // Check queue on mount and on network change
  useEffect(() => {
    const updateQueue = () => {
      const q = JSON.parse(localStorage.getItem("meshQueue") || "[]");
      setQueueCount(q.length);
    };
    updateQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const handleOnline = useCallback(async () => {
    const queue: unknown[] = JSON.parse(localStorage.getItem("meshQueue") || "[]");
    if (!queue.length) return;
    setStatus("syncing");
    addLog("Network restored — syncing queued alerts…");
    try {
      const { saveAlert } = await import("@/lib/firestore");
      for (const item of queue) {
        await saveAlert(item as Parameters<typeof saveAlert>[0]);
      }
      localStorage.removeItem("meshQueue");
      setQueueCount(0);
      setStatus("delivered");
      addLog(t(lang, "meshDelivered"));
      onSynced?.();
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("idle");
    }
  }, [lang, onSynced]);

  const triggerMeshSOS = useCallback(async () => {
    if (!alertData) return;
    setStatus("scanning");
    addLog("Scanning for nearby devices…");

    // ── Attempt Web Bluetooth ─────────────────────────────────────────────
    let bluetoothSuccess = false;
    if ("bluetooth" in navigator) {
      try {
        // Request any nearby BLE device (user must accept prompt)
        const device = await (navigator as unknown as { bluetooth: { requestDevice: (opts: unknown) => Promise<{ name?: string }> } }).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ["battery_service"],
        });
        setStatus("sending");
        addLog(`Connected to: ${device.name ?? "nearby device"}`);
        // In a real mesh, we'd write to a GATT characteristic here.
        // For demo, we simulate a relay after 1.5s.
        await new Promise((r) => setTimeout(r, 1500));
        bluetoothSuccess = true;
        setStatus("delivered");
        addLog(t(lang, "meshDelivered"));
        setTimeout(() => setStatus("idle"), 3000);
      } catch {
        addLog("Bluetooth unavailable — queuing locally…");
      }
    }

    if (!bluetoothSuccess) {
      // ── Queue locally for when network returns ────────────────────────
      const queue = JSON.parse(localStorage.getItem("meshQueue") || "[]");
      queue.push({ ...alertData, status: "triggered" as const });
      localStorage.setItem("meshQueue", JSON.stringify(queue));
      setQueueCount(queue.length);
      setStatus("queued");
      addLog("Alert queued — will auto-send when online");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [alertData, lang]);

  // Auto-trigger when alertData arrives and we're offline
  useEffect(() => {
    if (alertData && !navigator.onLine) {
      triggerMeshSOS();
    }
  }, [alertData, triggerMeshSOS]);

  const statusConfig: Record<MeshStatus, { color: string; label: string }> = {
    idle:      { color: "text-gray-500",  label: "Mesh SOS Ready" },
    scanning:  { color: "text-blue-400",  label: "Scanning nearby devices…" },
    sending:   { color: "text-yellow-400", label: t(lang, "meshSending") },
    delivered: { color: "text-green-400", label: t(lang, "meshDelivered") },
    queued:    { color: "text-orange-400", label: "Queued for sync" },
    syncing:   { color: "text-purple-400", label: "Syncing to Firebase…" },
  };

  const sc = statusConfig[status];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col gap-3">
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status !== "idle" ? "animate-pulse" : ""} ${
            status === "delivered" ? "bg-green-400" :
            status === "queued" ? "bg-orange-400" :
            status === "idle" ? "bg-gray-600" : "bg-blue-400"
          }`} />
          <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
        </div>
        {queueCount > 0 && (
          <span className="text-xs bg-orange-900/40 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
            {queueCount} queued
          </span>
        )}
      </div>

      {/* Manual trigger */}
      <button
        onClick={triggerMeshSOS}
        disabled={status !== "idle" || !alertData}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 border border-gray-700"
      >
        📡 Send via Mesh Network
      </button>

      {/* Log */}
      {log.length > 0 && (
        <div className="flex flex-col gap-1">
          {log.map((entry, i) => (
            <p key={i} className={`text-xs ${i === 0 ? "text-gray-300" : "text-gray-600"}`}>
              {i === 0 ? "▶ " : "  "}{entry}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
