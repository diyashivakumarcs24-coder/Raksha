"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import SOSButton from "@/components/SOSButton";
import LocationCard from "@/components/LocationCard";
import SafetyMap from "@/components/SafetyMap";
import ShieldLogo from "@/components/ShieldLogo";
import ProtectedRoute from "@/components/ProtectedRoute";
import AIChatbot from "@/components/AIChatbot";
import MeshSOS from "@/components/MeshSOS";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/authContext";
import { watchLocation, LocationData } from "@/utils/location";
import { Lang, t, getSavedLang } from "@/lib/i18n";

type SafetyLevel = "safe" | "caution" | "danger";

const EMERGENCY_CALLS = [
  { labelKey: "police" as const, number: "100", emoji: "🚔", color: "bg-blue-900/40 border-blue-500/40 text-blue-300" },
  { labelKey: "hospital" as const, number: "102", emoji: "🚑", color: "bg-red-900/40 border-red-500/40 text-red-300" },
  { labelKey: "govtOffice" as const, number: "1091", emoji: "👩", color: "bg-purple-900/40 border-purple-500/40 text-purple-300" },
  { labelKey: "pharmacy" as const, number: "1098", emoji: "🧒", color: "bg-yellow-900/40 border-yellow-500/40 text-yellow-300" },
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
  const [activeTab, setActiveTab] = useState<"home" | "emergency" | "map" | "chat" | "excuse">("home");
  const [lang, setLang] = useState<Lang>("en");
  const [location, setLocation] = useState<LocationData | null>(null);
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    setLang(getSavedLang());
    const offline = JSON.parse(localStorage.getItem("offlineAlerts") || "[]");
    setOfflineCount(offline.length);
    // Watch location for SafetyMap
    const id = watchLocation((loc) => setLocation(loc));
    return () => navigator.geolocation.clearWatch(id);
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

  const sc = {
    safe:    { color: "bg-green-500",  text: "text-green-400",  border: "border-green-500/30",  label: t(lang, "statusSafe"),    bg: "bg-green-900/20"  },
    caution: { color: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500/30", label: t(lang, "statusCaution"), bg: "bg-yellow-900/20" },
    danger:  { color: "bg-red-500",    text: "text-red-400",    border: "border-red-500/30",    label: t(lang, "statusDanger"),  bg: "bg-red-900/20"    },
  }[safetyLevel];

  const tabs = [
    { id: "home",      label: t(lang, "home")      },
    { id: "emergency", label: t(lang, "emergency")  },
    { id: "map",       label: t(lang, "map")        },
    { id: "chat",      label: t(lang, "chat")       },
    { id: "excuse",    label: t(lang, "excuse")     },
  ] as { id: typeof activeTab; label: string }[];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-md mx-auto">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-black/95 backdrop-blur z-20">
        <div className="flex items-center gap-2">
          <ShieldLogo size={34} />
          <div>
            <h1 className="text-white font-bold text-base leading-none">{t(lang, "appName")}</h1>
            <p className="text-gray-500 text-xs">{t(lang, "tagline")}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {offlineCount > 0 && (
            <button onClick={syncOffline} className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded-full transition-colors">
              {t(lang, "syncAlerts")} {offlineCount}
            </button>
          )}
          <LanguageSwitcher current={lang} onChange={setLang} />
          <button
            onClick={() => router.push("/fake-call")}
            className="text-xs bg-gray-800 border border-gray-700 px-2.5 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
          >
            📞
          </button>
          <button
            onClick={async () => { await signOut(auth); router.replace("/auth"); }}
            className="text-xs bg-gray-800 border border-gray-700 px-2.5 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
            title={profile?.email ?? ""}
          >
            ↩
          </button>
        </div>
      </header>

      {/* ── Safety Status Bar ── */}
      <div className={`${sc.bg} border-b ${sc.border} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${sc.color} animate-pulse`} />
          <span className={`text-xs font-semibold ${sc.text}`}>{sc.label}</span>
        </div>
        <div className="flex gap-1">
          {(["safe", "caution", "danger"] as SafetyLevel[]).map((l) => (
            <button
              key={l}
              onClick={() => setSafetyLevel(l)}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                safetyLevel === l
                  ? l === "safe" ? "bg-green-500 text-white" : l === "caution" ? "bg-yellow-500 text-black" : "bg-red-500 text-white"
                  : "bg-gray-800 text-gray-500 hover:bg-gray-700"
              }`}
            >
              {l === "safe" ? "🟢" : l === "caution" ? "🟡" : "🔴"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Nav ── */}
      <nav className="flex border-b border-gray-800 bg-gray-950 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex-1 py-2.5 text-xs font-medium whitespace-nowrap px-2 transition-colors ${
              activeTab === tab.id
                ? "text-purple-400 border-b-2 border-purple-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto pb-8">

        {/* HOME */}
        {activeTab === "home" && (
          <div className="flex flex-col items-center gap-5 px-4 pt-6">
            <div className="flex flex-col items-center gap-1">
              <ShieldLogo size={72} />
              <p className="text-gray-500 text-sm">{t(lang, "tagline")}</p>
            </div>

            <SOSButton lang={lang} />

            {/* Mesh SOS (offline relay) */}
            <div className="w-full">
              <MeshSOS lang={lang} alertData={null} />
            </div>

            {/* Existing LocationCard */}
            <div className="w-full">
              <LocationCard />
            </div>

            {/* Quick action grid */}
            <div className="w-full grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab("emergency")}
                className="bg-red-900/30 border border-red-500/40 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-red-400/70 active:scale-95 transition-all"
              >
                <span className="text-3xl">🆘</span>
                <span className="text-sm text-red-300 font-medium">{t(lang, "emergency")}</span>
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-blue-400/60 active:scale-95 transition-all"
              >
                <span className="text-3xl">🗺️</span>
                <span className="text-sm text-blue-300 font-medium">{t(lang, "nearbyResources")}</span>
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-purple-400/60 active:scale-95 transition-all"
              >
                <span className="text-3xl">🤖</span>
                <span className="text-sm text-purple-300 font-medium">{t(lang, "aiChatbot")}</span>
              </button>
              <button
                onClick={() => router.push("/fake-call")}
                className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-gray-500 active:scale-95 transition-all"
              >
                <span className="text-3xl">📞</span>
                <span className="text-sm text-gray-300 font-medium">{t(lang, "fakeCall")}</span>
              </button>
            </div>
          </div>
        )}

        {/* EMERGENCY CALLS */}
        {activeTab === "emergency" && (
          <div className="px-4 pt-5 flex flex-col gap-4">
            <div>
              <h2 className="text-white font-semibold text-lg">{t(lang, "emergencyNumbers")}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{t(lang, "tapToCall")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {EMERGENCY_CALLS.map(({ labelKey, number, emoji, color }) => (
                <a
                  key={number}
                  href={`tel:${number}`}
                  className={`border rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-transform shadow-lg ${color}`}
                >
                  <span className="text-4xl">{emoji}</span>
                  <span className="text-2xl font-black tracking-tight">{number}</span>
                  <span className="text-xs opacity-80 text-center font-medium">{t(lang, labelKey)}</span>
                </a>
              ))}
            </div>
            <p className="text-gray-700 text-xs text-center">Available 24/7 across India</p>

            {/* Self defense videos */}
            <h2 className="text-white font-semibold text-base mt-2">{t(lang, "selfDefense")}</h2>
            {SELF_DEFENSE_VIDEOS.map((video, i) => (
              <a
                key={i}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex gap-3 items-center p-3 hover:border-purple-500/50 group transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} alt={video.title} className="w-24 h-16 object-cover rounded-xl" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
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

            {/* Safety products */}
            <h2 className="text-white font-semibold text-base mt-2">{t(lang, "safetyGear")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {SAFETY_PRODUCTS.map((product, i) => (
                <a
                  key={i}
                  href={`https://www.amazon.in/s?k=${product.query}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-orange-500/50 group transition-colors"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{product.emoji}</span>
                  <span className="text-white text-xs font-medium text-center">{product.name}</span>
                  <span className="text-orange-400 text-xs bg-orange-900/30 px-2 py-0.5 rounded-full">Amazon ↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* SMART SAFETY MAP */}
        {activeTab === "map" && (
          <div className="px-4 pt-5 flex flex-col gap-4">
            <div>
              <h2 className="text-white font-semibold text-lg">{t(lang, "nearbyResources")}</h2>
              <p className="text-gray-500 text-sm mt-0.5">Police · Hospitals · Pharmacies · Govt offices</p>
            </div>
            <SafetyMap location={location} lang={lang} />
          </div>
        )}

        {/* AI CHATBOT */}
        {activeTab === "chat" && (
          <div className="px-4 pt-5 flex flex-col gap-4" style={{ height: "calc(100vh - 180px)" }}>
            <div>
              <h2 className="text-white font-semibold text-lg">{t(lang, "aiChatbot")}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{t(lang, "safetyAdvice")}</p>
            </div>
            <div className="flex-1 min-h-0">
              <AIChatbot lang={lang} />
            </div>
          </div>
        )}

        {/* EXCUSE GENERATOR */}
        {activeTab === "excuse" && (
          <div className="px-4 pt-5 flex flex-col gap-4">
            <div>
              <h2 className="text-white font-semibold text-lg">{t(lang, "smartExcuse")}</h2>
              <p className="text-gray-500 text-sm mt-0.5">Describe your situation</p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col gap-3">
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. I am being followed, late night..."
                className="bg-gray-800 text-white rounded-xl p-3 text-sm resize-none h-24 border border-gray-700 focus:border-purple-500 focus:outline-none placeholder-gray-600"
              />
              <button
                onClick={generateExcuse}
                disabled={!situation.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {t(lang, "generateExcuse")}
              </button>
            </div>
            {excuse && (
              <div className="bg-purple-900/30 border border-purple-500/40 rounded-2xl p-4">
                <p className="text-purple-300 text-xs font-semibold mb-2 uppercase tracking-wide">{t(lang, "yourExcuse")}</p>
                <p className="text-white text-sm leading-relaxed">&ldquo;{excuse}&rdquo;</p>
                <button
                  onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(excuse); }}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {t(lang, "copy")}
                </button>
              </div>
            )}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wide">{t(lang, "quickExcuses")}</p>
              <div className="flex flex-wrap gap-2">
                {["followed", "uncomfortable", "late night"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSituation(tag)}
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

      <div className="px-4 py-2 border-t border-gray-900 text-center">
        <button onClick={() => router.push("/")} className="text-gray-700 text-xs hover:text-gray-500 transition-colors">
          {t(lang, "backToCalc")}
        </button>
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