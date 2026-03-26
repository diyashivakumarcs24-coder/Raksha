"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import SOSButton from "@/components/SOSButton";
import LocationCard from "@/components/LocationCard";
import ShieldLogo from "@/components/ShieldLogo";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/authContext";

type SafetyLevel = "safe" | "caution" | "danger";

const EMERGENCY_CALLS = [
  { label: "Police", number: "100", emoji: "🚔", color: "bg-blue-900/40 border-blue-500/40 text-blue-300" },
  { label: "Ambulance", number: "102", emoji: "🚑", color: "bg-red-900/40 border-red-500/40 text-red-300" },
  { label: "Women Helpline", number: "1091", emoji: "👩", color: "bg-purple-900/40 border-purple-500/40 text-purple-300" },
  { label: "Child Helpline", number: "1098", emoji: "🧒", color: "bg-yellow-900/40 border-yellow-500/40 text-yellow-300" },
];

const EXCUSES: Record<string, string[]> = {
  followed: ["I just got a call from my doctor.", "My mom is waiting outside.", "I work at the police station nearby."],
  uncomfortable: ["My husband is picking me up in 2 minutes.", "I have a video call with my boss now.", "My friend is a security guard here."],
  "late night": ["I am a nurse, just finished my night shift.", "My brother is a cop nearby.", "I have a self-defense class that just ended."],
  default: ["I need to take this call urgently.", "I have a medical condition.", "My GPS is being tracked live by my family."],
};

const SELF_DEFENSE_VIDEOS = [
  { title: "Basic Self-Defense Moves Every Woman Should Know", id: "KVpxP3ZZtAc", channel: "Howcast" },
  { title: "5 Self-Defense Techniques for Women", id: "Iu8pFBSBaFk", channel: "SELF" },
  { title: "How to Escape a Wrist Grab", id: "1YkOOoNEAqk", channel: "Nick Drossos" },
];

const SAFETY_PRODUCTS = [
  { name: "Pepper Spray", query: "pepper+spray+women+safety", emoji: "🌶️" },
  { name: "Personal Alarm", query: "personal+safety+alarm+keychain", emoji: "🔔" },
  { name: "Safety Whistle", query: "safety+whistle+women", emoji: "📯" },
  { name: "Stun Gun", query: "stun+gun+women+safety", emoji: "⚡" },
];

function DashboardContent() {
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>("safe");
  const [situation, setSituation] = useState("");
  const [excuse, setExcuse] = useState("");
  const [offlineCount, setOfflineCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"home" | "emergency" | "videos" | "shop" | "excuse">("home");
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    const offline = JSON.parse(localStorage.getItem("offlineAlerts") || "[]");
    setOfflineCount(offline.length);
  }, []);

  const syncOffline = async () => {
    const offline: unknown[] = JSON.parse(localStorage.getItem("offlineAlerts") || "[]");
    if (!offline.length) return;
    try {
      const { saveAlert } = await import("@/lib/firestore");
      for (const a of offline) await saveAlert(a as Parameters<typeof saveAlert>[0]);
      localStorage.removeItem("offlineAlerts");
      setOfflineCount(0);
      alert("Synced!");
    } catch { alert("Sync failed."); }
  };

  const generateExcuse = () => {
    const key = Object.keys(EXCUSES).find((k) => situation.toLowerCase().includes(k)) || "default";
    const list = EXCUSES[key];
    setExcuse(list[Math.floor(Math.random() * list.length)]);
  };

  const sc = { safe: { color: "bg-green-500", text: "text-green-400", border: "border-green-500/30", label: "SAFE", bg: "bg-green-900/20" }, caution: { color: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500/30", label: "CAUTION", bg: "bg-yellow-900/20" }, danger: { color: "bg-red-500", text: "text-red-400", border: "border-red-500/30", label: "DANGER", bg: "bg-red-900/20" } }[safetyLevel];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-md mx-auto">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-black/90 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <ShieldLogo size={36} />
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Raksha</h1>
            <p className="text-gray-500 text-xs">Women&apos;s Safety</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {offlineCount > 0 && <button onClick={syncOffline} className="text-xs bg-blue-600 px-2 py-1 rounded-full">Sync {offlineCount}</button>}
          <button onClick={() => router.push("/fake-call")} className="text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full">📞 Fake Call</button>
          <button onClick={async () => { await signOut(auth); router.replace("/auth"); }} className="text-xs bg-gray-800 border border-gray-700 px-2 py-1.5 rounded-full" title={profile?.email ?? ""}>↩</button>
        </div>
      </header>

      <div className={`${sc.bg} border-b ${sc.border} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${sc.color} animate-pulse`} />
          <span className={`text-sm font-semibold ${sc.text}`}>Status: {sc.label}</span>
        </div>
        <div className="flex gap-1">
          {(["safe", "caution", "danger"] as SafetyLevel[]).map((l) => (
            <button key={l} onClick={() => setSafetyLevel(l)} className={`px-2 py-0.5 rounded text-xs font-medium ${safetyLevel === l ? (l === "safe" ? "bg-green-500 text-white" : l === "caution" ? "bg-yellow-500 text-black" : "bg-red-500 text-white") : "bg-gray-800 text-gray-400"}`}>
              {l === "safe" ? "🟢" : l === "caution" ? "🟡" : "🔴"}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex border-b border-gray-800 bg-gray-950 overflow-x-auto">
        {([{ id: "home", label: "🏠 Home" }, { id: "emergency", label: "🆘 Call" }, { id: "videos", label: "🎥 Defense" }, { id: "shop", label: "🛒 Shop" }, { id: "excuse", label: "🤖 Excuse" }] as { id: typeof activeTab; label: string }[]).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 flex-1 py-2.5 text-xs font-medium whitespace-nowrap px-2 ${activeTab === tab.id ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-500"}`}>{tab.label}</button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto pb-6">
        {activeTab === "home" && (
          <div className="flex flex-col items-center gap-6 px-4 pt-8">
            <div className="flex flex-col items-center gap-2"><ShieldLogo size={80} /><p className="text-gray-400 text-sm">Your silent guardian</p></div>
            <SOSButton />
            <div className="w-full"><LocationCard /></div>
            <div className="w-full grid grid-cols-2 gap-3">
              <button onClick={() => setActiveTab("emergency")} className="bg-red-900/30 border border-red-500/40 rounded-2xl p-4 flex flex-col items-center gap-2"><span className="text-3xl">🆘</span><span className="text-sm text-red-300">Emergency Call</span></button>
              <button onClick={() => router.push("/fake-call")} className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col items-center gap-2"><span className="text-3xl">📞</span><span className="text-sm text-gray-300">Fake Call</span></button>
              <button onClick={() => setActiveTab("excuse")} className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col items-center gap-2"><span className="text-3xl">🤖</span><span className="text-sm text-gray-300">Get Excuse</span></button>
              <button onClick={() => setActiveTab("videos")} className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col items-center gap-2"><span className="text-3xl">🥋</span><span className="text-sm text-gray-300">Self Defense</span></button>
            </div>
          </div>
        )}

        {activeTab === "emergency" && (
          <div className="px-4 pt-6 flex flex-col gap-4">
            <h2 className="text-white font-semibold text-lg">Emergency Numbers</h2>
            <p className="text-gray-400 text-sm -mt-2">Tap to call instantly</p>
            <div className="grid grid-cols-2 gap-3">
              {EMERGENCY_CALLS.map(({ label, number, emoji, color }) => (
                <a key={number} href={`tel:${number}`} className={`border rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-transform ${color}`}>
                  <span className="text-4xl">{emoji}</span>
                  <span className="text-2xl font-black">{number}</span>
                  <span className="text-xs opacity-80 text-center">{label}</span>
                </a>
              ))}
            </div>
            <p className="text-gray-600 text-xs text-center mt-2">Available 24/7 across India</p>
          </div>
        )}

        {activeTab === "videos" && (
          <div className="px-4 pt-4 flex flex-col gap-4">
            <h2 className="text-white font-semibold text-lg">Self Defense Videos</h2>
            {SELF_DEFENSE_VIDEOS.map((video, i) => (
              <a key={i} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex gap-3 items-center p-3 hover:border-purple-500/50 group">
                <div className="relative flex-shrink-0">
                  <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} alt={video.title} className="w-24 h-16 object-cover rounded-xl" />
                  <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center"><span className="text-white text-xs ml-0.5">▶</span></div></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-2">{video.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{video.channel} • YouTube</p>
                </div>
              </a>
            ))}
          </div>
        )}

        {activeTab === "shop" && (
          <div className="px-4 pt-4 flex flex-col gap-4">
            <h2 className="text-white font-semibold text-lg">Safety Equipment</h2>
            <div className="grid grid-cols-2 gap-3">
              {SAFETY_PRODUCTS.map((product, i) => (
                <a key={i} href={`https://www.amazon.in/s?k=${product.query}`} target="_blank" rel="noopener noreferrer" className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-orange-500/50 group">
                  <span className="text-4xl group-hover:scale-110 transition-transform">{product.emoji}</span>
                  <span className="text-white text-sm font-medium text-center">{product.name}</span>
                  <span className="text-orange-400 text-xs bg-orange-900/30 px-2 py-0.5 rounded-full">Buy on Amazon ↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeTab === "excuse" && (
          <div className="px-4 pt-4 flex flex-col gap-4">
            <h2 className="text-white font-semibold text-lg">Smart Excuse Generator</h2>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col gap-3">
              <textarea value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="e.g. I am being followed, late night..." className="bg-gray-800 text-white rounded-xl p-3 text-sm resize-none h-24 border border-gray-700 focus:border-purple-500 focus:outline-none placeholder-gray-600" />
              <button onClick={generateExcuse} disabled={!situation.trim()} className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl">Generate Excuse 🤖</button>
            </div>
            {excuse && (
              <div className="bg-purple-900/30 border border-purple-500/40 rounded-2xl p-4">
                <p className="text-purple-300 text-xs font-semibold mb-2 uppercase">Your Safe Excuse:</p>
                <p className="text-white text-sm leading-relaxed">&ldquo;{excuse}&rdquo;</p>
                <button onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(excuse); }} className="mt-3 text-xs text-purple-400">📋 Copy</button>
              </div>
            )}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-gray-400 text-xs font-semibold mb-3 uppercase">Quick Excuses</p>
              <div className="flex flex-wrap gap-2">
                {["followed", "uncomfortable", "late night"].map((tag) => (
                  <button key={tag} onClick={() => setSituation(tag)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full">{tag}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="px-4 py-2 border-t border-gray-900 text-center">
        <button onClick={() => router.push("/")} className="text-gray-700 text-xs hover:text-gray-500">← Back to Calculator</button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}