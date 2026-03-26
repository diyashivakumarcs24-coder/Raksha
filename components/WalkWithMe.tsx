"use client";
/**
 * WalkWithMe — safety timer that auto-triggers SOS if user doesn't check in.
 * State persisted in localStorage so it survives page refreshes.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Lang, t } from "@/lib/i18n";

interface WalkState {
  active: boolean;
  destination: string;
  durationMin: number;
  startedAt: number; // epoch ms
}

const STORAGE_KEY = "raksha_walk_state";

interface Props {
  lang: Lang;
  onSOSTrigger: () => void; // calls the existing SOS handler
}

export default function WalkWithMe({ lang, onSOSTrigger }: Props) {
  const [destination, setDestination] = useState("");
  const [durationMin, setDurationMin] = useState(15);
  const [walkState, setWalkState] = useState<WalkState | null>(null);
  const [remaining, setRemaining] = useState(0); // seconds
  const [expired, setExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore persisted state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const ws: WalkState = JSON.parse(saved);
      if (ws.active) {
        const elapsed = (Date.now() - ws.startedAt) / 1000;
        const totalSec = ws.durationMin * 60;
        if (elapsed < totalSec) {
          setWalkState(ws);
          setRemaining(Math.ceil(totalSec - elapsed));
        } else {
          // Already expired while away
          localStorage.removeItem(STORAGE_KEY);
          setExpired(true);
        }
      }
    }
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!walkState?.active) return;
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [walkState]);

  const startWalk = () => {
    if (!destination.trim()) return;
    const ws: WalkState = {
      active: true,
      destination,
      durationMin,
      startedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
    setWalkState(ws);
    setRemaining(durationMin * 60);
    setExpired(false);
  };

  const confirmSafe = useCallback(() => {
    clearInterval(timerRef.current!);
    localStorage.removeItem(STORAGE_KEY);
    setWalkState(null);
    setExpired(false);
    setRemaining(0);
    setDestination("");
  }, []);

  const triggerSOS = useCallback(() => {
    confirmSafe();
    onSOSTrigger();
  }, [confirmSafe, onSOSTrigger]);

  // Auto-trigger SOS when timer expires
  useEffect(() => {
    if (expired) {
      const timeout = setTimeout(() => {
        triggerSOS();
      }, 8000); // 8s grace period to press "I'm Safe"
      return () => clearTimeout(timeout);
    }
  }, [expired, triggerSOS]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const progress = walkState
    ? 1 - remaining / (walkState.durationMin * 60)
    : 0;

  // ── Expired state ─────────────────────────────────────────────────────────
  if (expired) {
    return (
      <div className="bg-red-900/30 border-2 border-red-500/60 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
        <p className="text-red-300 text-sm font-bold text-center">
          ⏰ Timer expired! Are you safe?
        </p>
        <p className="text-red-400 text-xs text-center">
          SOS will trigger automatically in a few seconds…
        </p>
        <div className="flex gap-2">
          <button
            onClick={confirmSafe}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            ✅ I&apos;m Safe
          </button>
          <button
            onClick={triggerSOS}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            🆘 Send SOS
          </button>
        </div>
      </div>
    );
  }

  // ── Active walk ───────────────────────────────────────────────────────────
  if (walkState?.active) {
    const circumference = 2 * Math.PI * 36;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚶‍♀️</span>
            <span className="text-white text-sm font-semibold">Walk With Me</span>
          </div>
          <span className="text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded-full">Active</span>
        </div>

        <p className="text-gray-400 text-xs">To: <span className="text-white">{walkState.destination}</span></p>

        {/* Circular progress */}
        <div className="flex items-center justify-center py-2">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#374151" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke={remaining < 60 ? "#ef4444" : "#22c55e"}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-black font-mono ${remaining < 60 ? "text-red-400" : "text-white"}`}>
                {formatTime(remaining)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={confirmSafe}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            ✅ I&apos;m Safe
          </button>
          <button
            onClick={triggerSOS}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            🆘 SOS Now
          </button>
        </div>
      </div>
    );
  }

  // ── Setup form ────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🚶‍♀️</span>
        <span className="text-white text-sm font-semibold">Walk With Me</span>
      </div>
      <p className="text-gray-500 text-xs">Set a timer — SOS triggers if you don&apos;t check in</p>

      <input
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination (e.g. Home, Office)"
        className="bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm border border-gray-700 focus:border-purple-500 focus:outline-none placeholder-gray-600"
      />

      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-xs flex-shrink-0">Duration:</span>
        <input
          type="range"
          min={5} max={120} step={5}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          className="flex-1 accent-purple-500"
        />
        <span className="text-white text-xs font-semibold w-12 text-right">{durationMin} min</span>
      </div>

      <button
        onClick={startWalk}
        disabled={!destination.trim()}
        className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
      >
        🚶‍♀️ Start Walk
      </button>
    </div>
  );
}
