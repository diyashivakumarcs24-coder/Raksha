"use client";
/**
 * Guardian Dashboard — shows:
 * - Live location of linked users
 * - SOS alerts from linked users
 * - Evidence videos from linked users
 * Reuses existing components. Does NOT duplicate user dashboard.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getAlerts, AlertData,
  getEvidenceByUser, EvidenceData,
  getLinkedUsers, UserProfile,
} from "@/lib/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import ShieldLogo from "@/components/ShieldLogo";
import { useAuth } from "@/lib/authContext";

type GuardianTab = "alerts" | "evidence" | "location";

function GuardianContent() {
  const [alerts, setAlerts] = useState<(AlertData & { id: string })[]>([]);
  const [evidence, setEvidence] = useState<(EvidenceData & { id: string })[]>([]);
  const [linkedUsers, setLinkedUsers] = useState<UserProfile[]>([]);
  const [tab, setTab] = useState<GuardianTab>("alerts");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get users linked to this guardian
      const users = await getLinkedUsers(user.uid);
      setLinkedUsers(users);

      // Fetch all alerts (guardian sees all for now; filter by linked user if needed)
      const allAlerts = await getAlerts();
      setAlerts(allAlerts);

      // Fetch evidence for each linked user
      const allEvidence: (EvidenceData & { id: string })[] = [];
      for (const u of users) {
        const ev = await getEvidenceByUser(u.uid);
        allEvidence.push(...ev);
      }
      // If no linked users, still show all evidence
      if (!users.length) {
        const ev = await getEvidenceByUser(user.uid);
        allEvidence.push(...ev);
      }
      setEvidence(allEvidence);
      setLoading(false);
    };
    load();
  }, [user]);

  const tabs: { id: GuardianTab; label: string }[] = [
    { id: "alerts",   label: "🚨 Alerts"   },
    { id: "evidence", label: "🎥 Evidence" },
    { id: "location", label: "📍 Location" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-black/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <ShieldLogo size={32} />
          <div>
            <h1 className="text-white font-bold text-base leading-none">Raksha</h1>
            <p className="text-purple-400 text-xs">Guardian Dashboard</p>
          </div>
        </div>
        <button
          onClick={async () => { await signOut(auth); router.replace("/auth"); }}
          className="text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
        >
          Sign Out
        </button>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-4">
        {[
          { label: "Linked Users", value: linkedUsers.length, color: "text-purple-400" },
          { label: "SOS Alerts",   value: alerts.length,      color: "text-red-400"    },
          { label: "Evidence",     value: evidence.length,    color: "text-blue-400"   },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-3 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <nav className="flex gap-2 px-4 pt-4 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === t.id ? "bg-purple-600 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-3 pb-24 flex flex-col gap-3">
        {loading ? (
          <p className="text-gray-500 text-sm animate-pulse text-center pt-8">Loading…</p>
        ) : (
          <>
            {/* ALERTS */}
            {tab === "alerts" && (
              alerts.length === 0 ? (
                <p className="text-gray-600 text-sm text-center pt-8">No SOS alerts yet.</p>
              ) : (
                alerts.map((a) => (
                  <div key={a.id} className="bg-gray-900 border border-red-500/30 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-red-400 text-xs font-bold uppercase">🚨 {a.status}</span>
                      <span className="text-gray-500 text-xs">{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-white text-sm font-mono">
                      📍 {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                    </p>
                    {a.userId && <p className="text-gray-600 text-xs">User: {a.userId.slice(0, 12)}…</p>}
                    <a
                      href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-xs underline"
                    >
                      Open in Google Maps ↗
                    </a>
                    {a.audioURL && <audio controls src={a.audioURL} className="w-full mt-1" />}
                    {a.videoURL && (
                      <a href={a.videoURL} target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-blue-900/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-full text-center">
                        🎥 View Evidence Video
                      </a>
                    )}
                  </div>
                ))
              )
            )}

            {/* EVIDENCE */}
            {tab === "evidence" && (
              evidence.length === 0 ? (
                <p className="text-gray-600 text-sm text-center pt-8">No evidence recorded yet.</p>
              ) : (
                evidence.map((ev) => (
                  <div key={ev.id} className="bg-gray-900 border border-blue-500/20 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 text-xs font-semibold">🎥 Evidence</span>
                      <span className="text-gray-500 text-xs">{new Date(ev.timestamp).toLocaleString()}</span>
                    </div>
                    <video controls src={ev.videoUrl} className="w-full rounded-xl mt-1 max-h-48 bg-black" />
                    <a
                      href={ev.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 underline text-center"
                    >
                      Open full video ↗
                    </a>
                  </div>
                ))
              )
            )}

            {/* LIVE LOCATION */}
            {tab === "location" && (
              linkedUsers.length === 0 ? (
                <div className="flex flex-col gap-3 pt-4">
                  <p className="text-gray-500 text-sm text-center">No linked users found.</p>
                  <p className="text-gray-600 text-xs text-center">
                    Ask the user to enter your UID during signup to link accounts.
                  </p>
                  <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
                    <p className="text-gray-400 text-xs font-semibold mb-1">Your Guardian UID:</p>
                    <p className="text-white text-xs font-mono break-all">{user?.uid}</p>
                  </div>
                </div>
              ) : (
                linkedUsers.map((u) => {
                  // Find latest alert for this user
                  const latestAlert = alerts.find((a) => a.userId === u.uid);
                  return (
                    <div key={u.uid} className="bg-gray-900 border border-purple-500/20 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
                        <div>
                          <p className="text-white text-sm font-medium">{u.email}</p>
                          <p className="text-gray-500 text-xs">{u.role}</p>
                        </div>
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      </div>
                      {latestAlert ? (
                        <>
                          <iframe
                            title={`Location of ${u.email}`}
                            width="100%"
                            height="180"
                            loading="lazy"
                            src={`https://maps.google.com/maps?q=${latestAlert.latitude},${latestAlert.longitude}&z=15&output=embed`}
                            className="w-full border-b border-gray-800"
                          />
                          <div className="px-4 py-2">
                            <p className="text-gray-400 text-xs">
                              Last seen: {new Date(latestAlert.timestamp).toLocaleString()}
                            </p>
                            <a
                              href={`https://maps.google.com/?q=${latestAlert.latitude},${latestAlert.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 text-xs underline"
                            >
                              Open in Maps ↗
                            </a>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-600 text-xs px-4 py-3">No location data yet.</p>
                      )}
                    </div>
                  );
                })
              )
            )}
          </>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-black/95 border-t border-gray-800 flex z-20">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              tab === t.id ? "text-purple-400" : "text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function GuardianPage() {
  return (
    <ProtectedRoute allowedRoles={["guardian"]}>
      <GuardianContent />
    </ProtectedRoute>
  );
}
