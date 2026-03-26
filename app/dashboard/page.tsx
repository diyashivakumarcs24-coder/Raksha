"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SOSButton from "@/components/SOSButton";
import LocationCard from "@/components/LocationCard";
import ShieldLogo from "@/components/ShieldLogo";

type SafetyLevel = "safe" | "caution" | "danger";

const EXCUSES: Record<string, string[]> = {
  "followed": [
    "I just got a call from my doctor — heading to the clinic right now.",
    "My mom is waiting outside, she can see me from the car.",
    "I work at the police station nearby, just finishing my shift.",
  ],
  "uncomfortable": [
    "My husband is picking me up in 2 minutes, he's right around the corner.",
    "I have a video call with my boss starting now, I need to take this.",
    "My friend is a security guard here, let me call her.",
  ],
  "late night": [
    "I'm a nurse, just finished my night shift — my colleague is waiting.",
    "My brother is a cop, he's on duty nearby and tracking my location.",
    "I have a self-defense class that just ended, my instructor is outside.",
  ],
  "default": [
    "I need to take this call urgently — it's my emergency contact.",
    "I have a medical condition and need to sit down immediately.",
    "My GPS is being tracked live by my family right now.",
  ],
};

const SELF_DEFENSE_VIDEOS = [
  { title: "Basic Self-Defense Moves Every Woman Should Know", id: "KVpxP3ZZtAc", channel: "Howcast" },
  { title: "5 Self-Defense Techniques for Women", id: "Iu8pFBSBaFk", channel: "SELF" },
  { title: "How to Escape a Wrist Grab", id: "1YkOOoNEAqk", channel: "Nick Drossos" },
  { title: "Women's Self Defense — Street Situations", id: "Iu8pFBSBaFk", channel: "FightTips" },
  { title: "Pepper Spray Techniques & Safety", id: "KVpxP3ZZtAc", channel: "Safety First" },
  { title: "Escape from Bear Hug Attack", id: "1YkOOoNEAqk", channel: "Krav Maga" },
];

const SAFETY_PRODUCTS = [
  { name: "Pepper Spray", query: "pepper+spray+women+safety", emoji: "🌶️" },
  { name: "Personal Alarm", query: "personal+safety+alarm+keychain", emoji: "🔔" },
  { name: "Safety Whistle", query: "safety+whistle+women", emoji: "📯" },
  { name: "Stun Gun", query: "stun+gun+women+safety", emoji: "⚡" },
  { name: "Safety Keychain", query: "self+defense+keychain+women", emoji: "🔑" },
  { name: "Tracking Device", query: "gps+tracker+personal+safety", emoji: "📡" },
];

export default function Dashboard() {
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>("safe");
  const [situation, setSituation] = useState("");
  const [excuse, setExcuse] = useState("");
  const [offlineCount, setOfflineCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"home" | "videos" | "shop" | "excuse">("home");
  const router = useRouter();

  useEffect(() => {
    const offline = JSON.parse(localStorage.getItem("offlineAlerts") || "[]");
    setOfflineCount(offline.length);
  }, []);

  const syncOffline = async () => {
    const offline: unknown[] = JSON.parse(localStorage.getItem("offlineAlerts") || "[]");
    if (!offline.length) return;
    try {
      const { saveAlert } = await import("@/lib/firestore");
      for (const alert of offline) {
        await saveAlert(alert as Parameters<typeof saveAlert>[0]);
      }
      localStorage.removeItem("offlineAlerts");
      setOfflineCount(0);
      alert("Synced offline alerts!");
    } catch {
      alert("Sync failed. Check connection.");
    }
  };

  const generateExcuse = () => {
    const key = Object.keys(EXCUSES).find((k) => situation.toLowerCase().includes(k)) || "default";
    const list = EXCUSES[key];
    setExcuse(list[Math.floor(Math.random() * list.length)]);
  };

  const safetyConfig = {
    safe: { color: "bg-green-500", text: "text-green-400", border: "border-green-500/30", label: "SAFE", bg: "bg-green-900/20" },
    caution: { color: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500/30", label: "CAUTION", bg: "bg-yellow-900/20" },
    danger: { color: "bg-red-500", text: "text-red-400", border: "border-red-500/30", label: "DANGER", bg: "bg-red-900/20" },
  };
  const sc = safetyConfig[safetyLevel];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-black/90 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <ShieldLogo size={36} />
          <div>
            <h1 className="text-white font-bold text-lg leading-none">ShadowwSOS</h1>
            <p className="text-gray-500 text-xs">Women&apos;s Safety</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {offlineCount > 0 && (
            <button onClick={syncOffline} className="text-xs bg-blue-600 px-2 py-1 rounded-full">
              Sync {offlineCount}
            </button>
          )}
          <button
            onClick={() => router.push("/fake-call")}
            className="text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
          >
            📞 Fake Call
          </button>
        </div>
      </header>

      {/* Safety Status Bar */}
      <div className={`${sc.bg} border-b ${sc.border} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${sc.color} animate-pulse`} />
          <span className={`text-sm font-semibold ${sc.text}`}>Status: {sc.label}</span>
        </div>
        <div className="flex gap-1">
          {(["safe", "caution", "danger"] as SafetyLevel[]).map((l) => (
            <button
              key={l}
              onClick={() => setSafetyLevel(l)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                safetyLevel === l
                  ? l === "safe" ? "bg-green-500 text-white" : l === "caution" ? "bg-yellow-500 text-black" : "bg-red-500 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {l === "safe" ? "🟢" : l === "caution" ? "🟡" : "🔴"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Nav */}
      <nav className="flex border-b border-gray-800 bg-gray-950">
        {([
          { id: "home", label: "🏠 Home" },
          { id: "videos", label: "🎥 Defense" },
          { id: "shop", label: "🛒 Shop" },
          { id: "excuse", label: "🤖 Excuse" },
        ] as { id: typeof activeTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-6">
        {activeTab === "home" && (
          <div className="flex flex-col items-center gap-6 px-4 pt-8">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <ShieldLogo size={80} />
              <p className="text-gray-400 text-sm">Your silent guardian</p>
            </div>

            {/* SOS Button */}
            <SOSButton />

            {/* Location */}
            <div className="w-full">
              <LocationCard />
            </div>

            {/* Quick Actions */}
            <div className="w-full grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/fake-call")}
                className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-purple-500/50 transition-colors"
              >
                <span className="text-3xl">📞</span>
                <span className="text-sm text-gray-300">Fake Call</span>
              </button>
              <button
                onClick={() => setActiveTab("excuse")}
                className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-purple-500/50 transition-colors"
              >
                <span className="text-3xl">🤖</span>
                <span className="text-sm text-gray-300">Get Excuse</span>
              </button>
              <button
                onClick={() => setActiveTab("videos")}
                className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-purple-500/50 transition-colors"
              >
                <span className="text-3xl">🥋</span>
                <span className="text-sm text-gray-300">Self Defense</span>
              </button>
              <button
                onClick={() => setActiveTab("shop")}
                className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-purple-500/50 transition-colors"
              >
                <span className="text-3xl">🛡️</span>
                <span className="text-sm text-gray-300">Safety Gear</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "videos" && (
          <div className="px-4 pt-4 flex flex-col gap-4">
            <h2 className="text-white font-semibold text-lg">Self Defense Videos</h2>
            <p className="text-gray-400 text-sm -mt-2">Learn essential techniques to stay safe</p>
            {SELF_DEFENSE_VIDEOS.map((video, i) => (
              <a
                key={i}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex gap-3 items-center p-3 hover:border-purple-500/50 transition-colors group"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-24 h-16 object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-white text-xs ml-0.5">▶</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{video.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{video.channel} • YouTube</p>
                </div>
              </a>
            ))}
          </div>
        )}

        {activeTab === "shop" && (
          <div className="px-4 pt-4 flex flex-col gap-4">
            <h2 className="text-white font-semibold text-lg">Safety Equipment</h2>
            <p className="text-gray-400 text-sm -mt-2">Shop on Amazon — stay prepared</p>
            <div className="grid grid-cols-2 gap-3">
              {SAFETY_PRODUCTS.map((product, i) => (
                <a
                  key={i}
                  href={`https://www.amazon.in/s?k=${product.query}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-orange-500/50 transition-colors group"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">{product.emoji}</span>
                  <span className="text-white text-sm font-medium text-center">{product.name}</span>
                  <span className="text-orange-400 text-xs bg-orange-900/30 px-2 py-0.5 rounded-full">Buy on Amazon ↗</span>
                </a>
              ))}
            </div>
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-4 text-center">
              <p className="text-orange-300 text-sm font-medium">🛒 Browse All Safety Products</p>
              <a
                href="https://www.amazon.in/s?k=women+safety+products"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-orange-400 underline"
              >
                amazon.in/women-safety →
              </a>
            </div>
          </div>
        )}

        {activeTab === "excuse" && (
          <div className="px-4 pt-4 flex flex-col gap-4">
            <h2 className="text-white font-semibold text-lg">Smart Excuse Generator</h2>
            <p className="text-gray-400 text-sm -mt-2">Describe your situation to get a safe excuse</p>

            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col gap-3">
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. I'm being followed, I feel uncomfortable, it's late night..."
                className="bg-gray-800 text-white rounded-xl p-3 text-sm resize-none h-24 border border-gray-700 focus:border-purple-500 focus:outline-none placeholder-gray-600"
              />
              <button
                onClick={generateExcuse}
                disabled={!situation.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Generate Excuse 🤖
              </button>
            </div>

            {excuse && (
              <div className="bg-purple-900/30 border border-purple-500/40 rounded-2xl p-4">
                <p className="text-purple-300 text-xs font-semibold mb-2 uppercase tracking-wide">Your Safe Excuse:</p>
                <p className="text-white text-sm leading-relaxed">&ldquo;{excuse}&rdquo;</p>
                <button
                  onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(excuse); }}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300"
                >
                  📋 Copy to clipboard
                </button>
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wide">Quick Excuses</p>
              <div className="flex flex-wrap gap-2">
                {["followed", "uncomfortable", "late night"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setSituation(tag); }}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-gray-900 text-center">
        <button onClick={() => router.push("/")} className="text-gray-700 text-xs hover:text-gray-500">
          ← Back to Calculator
        </button>
      </div>
    </div>
  );
}
