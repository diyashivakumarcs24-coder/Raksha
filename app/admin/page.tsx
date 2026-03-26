"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { getAlerts, AlertData } from "@/lib/firestore";
import { collection, getDocs } from "firebase/firestore";
import { UserProfile } from "@/lib/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import ShieldLogo from "@/components/ShieldLogo";

function AdminContent() {
  const [alerts, setAlerts] = useState<(AlertData & { id: string })[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tab, setTab] = useState<"alerts" | "users">("alerts");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      getAlerts(),
      getDocs(collection(db, "users")).then((snap) =>
        snap.docs.map((d) => d.data() as UserProfile)
      ),
    ]).then(([a, u]) => {
      setAlerts(a);
      setUsers(u);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-md mx-auto">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-black/90 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <ShieldLogo size={32} />
          <div>
            <h1 className="text-white font-bold text-base leading-none">Raksha</h1>
            <p className="text-yellow-400 text-xs">Admin Dashboard</p>
          </div>
        </div>
        <button onClick={async () => { await signOut(auth); router.replace("/auth"); }}
          className="text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full">Sign Out</button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-red-400">{alerts.length}</p>
          <p className="text-gray-400 text-xs mt-1">Total Alerts</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-purple-400">{users.length}</p>
          <p className="text-gray-400 text-xs mt-1">Registered Users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4">
        {(["alerts", "users"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t ? "bg-yellow-600 text-white" : "bg-gray-900 text-gray-400"
            }`}>
            {t === "alerts" ? "🚨 Alerts" : "👥 Users"}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-8 flex flex-col gap-3">
        {loading ? (
          <p className="text-gray-500 text-sm animate-pulse">Loading…</p>
        ) : tab === "alerts" ? (
          alerts.map((a) => (
            <div key={a.id} className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-4 flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-yellow-400 text-xs font-semibold">🚨 {a.status.toUpperCase()}</span>
                <span className="text-gray-500 text-xs">{new Date(a.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-white text-xs font-mono">{a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}</p>
              {a.userId && <p className="text-gray-500 text-xs">uid: {a.userId}</p>}
            </div>
          ))
        ) : (
          users.map((u) => (
            <div key={u.uid} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-1">
              <p className="text-white text-sm font-medium">{u.email}</p>
              <div className="flex gap-2 items-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  u.role === "admin" ? "bg-yellow-900/40 text-yellow-300" :
                  u.role === "police" ? "bg-blue-900/40 text-blue-300" :
                  u.role === "guardian" ? "bg-green-900/40 text-green-300" :
                  "bg-purple-900/40 text-purple-300"
                }`}>{u.role}</span>
                <span className="text-gray-600 text-xs">{u.emergencyContacts?.length ?? 0} contacts</span>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}
