"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function FakeCallUI() {
  const [callState, setCallState] = useState<"ringing" | "active" | "ended">("ringing");
  const [duration, setDuration] = useState(0);
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Create ringtone using Web Audio API
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    let playing = true;

    const playRing = () => {
      if (!playing || callState !== "ringing") return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      setTimeout(() => { if (playing && callState === "ringing") playRing(); }, 1500);
    };

    if (callState === "ringing") playRing();

    return () => {
      playing = false;
      ctx.close();
    };
  }, [callState]);

  useEffect(() => {
    if (callState === "active") {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const accept = () => setCallState("active");
  const decline = () => { setCallState("ended"); setTimeout(() => router.push("/dashboard"), 1500); };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-between py-16 px-6">
      {/* Caller Info */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-5xl shadow-2xl">
          👩
        </div>
        <h2 className="text-white text-3xl font-light">Mom</h2>
        <p className="text-gray-400 text-sm">
          {callState === "ringing" ? "Incoming Call..." : callState === "active" ? formatTime(duration) : "Call Ended"}
        </p>
        {callState === "ringing" && (
          <div className="flex gap-1 mt-1">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Active call controls */}
      {callState === "active" && (
        <div className="grid grid-cols-3 gap-6 text-center">
          {[
            { icon: "🔇", label: "Mute" },
            { icon: "⌨️", label: "Keypad" },
            { icon: "🔊", label: "Speaker" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <button className="w-14 h-14 rounded-full bg-gray-700 text-2xl flex items-center justify-center">{icon}</button>
              <span className="text-gray-400 text-xs">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-16">
        {callState === "ringing" ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <button onClick={decline} className="w-16 h-16 rounded-full bg-red-500 text-white text-3xl flex items-center justify-center shadow-lg shadow-red-500/40 active:scale-95 transition-transform">
                📵
              </button>
              <span className="text-gray-400 text-xs">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button onClick={accept} className="w-16 h-16 rounded-full bg-green-500 text-white text-3xl flex items-center justify-center shadow-lg shadow-green-500/40 animate-pulse active:scale-95 transition-transform">
                📞
              </button>
              <span className="text-gray-400 text-xs">Accept</span>
            </div>
          </>
        ) : callState === "active" ? (
          <div className="flex flex-col items-center gap-2">
            <button onClick={decline} className="w-16 h-16 rounded-full bg-red-500 text-white text-3xl flex items-center justify-center shadow-lg shadow-red-500/40 active:scale-95 transition-transform">
              📵
            </button>
            <span className="text-gray-400 text-xs">End Call</span>
          </div>
        ) : (
          <p className="text-gray-400 text-lg">Call Ended</p>
        )}
      </div>
    </div>
  );
}
