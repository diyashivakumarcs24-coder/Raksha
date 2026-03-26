"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAlerts, AlertData } from "@/lib/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import ShieldLogo from "@/components/ShieldLogo";

function PoliceContent() {
  const [alerts, setAlerts] = useState<(AlertData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getAlerts().then((a) => { setAlerts(a); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-md mx-auto">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-black/90 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <ShieldLogo size={32} />
          <div>
            <h1 className="text-white font-bold text-base leading-none">Raksha</h1>
            <p className="text-blue-400 text-xs">Police Dashboard</p>
          </div>
        </div>
        <button onClick={async () => { await signOut(auth); router.replace("/auth"); }}
          className="text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full">Sign Out</button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Incident Reports</h2>
          <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-full">
            {alerts.length} total
          </span>
        </div>
        {loading ? (
          <p className="text-gray-500 text-sm animate-pulse">Loading incidents…</p>
        ) : alerts.length === 0 ? (
          <p className="text-gray-600 text-sm">No incidents reported.</p>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="bg-gray-900 border border-blue-500/20 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 text-xs font-semibold uppercase">Incident #{a.id.slice(0, 6)}</span>
                <span className="text-gray-500 text-xs">{new Date(a.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-white text-sm font-mono">
                {a.latitude.toFixed(6)}, {a.longitude.toFixed(6)}
              </p>
              {a.userId && <p className="text-gray-500 text-xs">User: {a.userId}</p>}
              <div className="flex gap-2 mt-1">
                <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                  📍 View Location
                </a>
                {a.audioURL && (
                  <a href={a.audioURL} target="_blank" rel="noopener noreferrer"
                    className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-gray-700">
                    🎤 Audio
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default function PolicePage() {
  return (
    <ProtectedRoute allowedRoles={["police"]}>
      <PoliceContent />
    </ProtectedRoute>
  );
}
