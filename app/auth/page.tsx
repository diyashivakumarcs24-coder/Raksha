"use client";
/**
 * Auth page — Email/Password login & signup.
 * On success: saves user profile to Firestore, routes by role.
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveUserProfile, getUserProfile, UserRole, HomeLocation } from "@/lib/firestore";
import { useAuth } from "@/lib/authContext";
import ShieldLogo from "@/components/ShieldLogo";

const ROLE_ROUTES: Record<UserRole, string> = {
  user: "/dashboard",
  guardian: "/guardian",
  police: "/police",
  admin: "/admin",
};

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [contacts, setContacts] = useState(""); // comma-separated phone numbers
  const [homeAddr, setHomeAddr] = useState(""); // home location label (lat/lng captured on signup)
  const [linkedGuardian, setLinkedGuardian] = useState(""); // guardian UID
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  // Redirect already-logged-in users — runs only when auth resolves
  useEffect(() => {
    if (!authLoading && user && profile) {
      router.replace(ROLE_ROUTES[profile.role] ?? "/dashboard");
    }
  }, [authLoading, user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const emergencyContacts = contacts
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);

        // Try to capture current location as home
        let homeLocation: HomeLocation | undefined;
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          homeLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            label: homeAddr || "Home",
          };
        } catch { /* location permission denied — skip */ }

        await saveUserProfile({
          uid: cred.user.uid,
          email,
          role,
          emergencyContacts,
          homeLocation,
          linkedGuardianUid: linkedGuardian.trim() || undefined,
        });
        router.replace(ROLE_ROUTES[role]);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const p = await getUserProfile(cred.user.uid);
        router.replace(ROLE_ROUTES[p?.role ?? "user"]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-gray-400 animate-pulse">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <ShieldLogo size={72} />
          <h1 className="text-white text-2xl font-bold">Raksha</h1>
          <p className="text-gray-500 text-sm">Women&apos;s Safety App</p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m ? "bg-purple-600 text-white" : "text-gray-400"
              }`}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:outline-none placeholder-gray-600"
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:outline-none placeholder-gray-600"
          />

          {mode === "signup" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs px-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="user">User (Protected Person)</option>
                  <option value="guardian">Guardian / Family</option>
                  <option value="police">Police Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs px-1">
                  Emergency Contacts (comma-separated phone numbers)
                </label>
                <input
                  type="text"
                  placeholder="+919876543210, +919123456789"
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:outline-none placeholder-gray-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs px-1">
                  Home Location Label (optional — GPS captured automatically)
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Home, Parents House"
                  value={homeAddr}
                  onChange={(e) => setHomeAddr(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:outline-none placeholder-gray-600"
                />
              </div>
              {role === "user" && (
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs px-1">
                    Guardian UID (optional — link a guardian account)
                  </label>
                  <input
                    type="text"
                    placeholder="Guardian's Firebase UID"
                    value={linkedGuardian}
                    onChange={(e) => setLinkedGuardian(e.target.value)}
                    className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:outline-none placeholder-gray-600"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <p className="text-red-400 text-xs bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors mt-1"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Protected by Firebase Authentication
        </p>
      </div>
    </div>
  );
}
