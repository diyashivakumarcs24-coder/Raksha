"use client";
/**
 * ThreatRadar — tracks distance from user's saved home location.
 * Green = within safe zone, Red = moved far away.
 * Allows setting/updating home location from current position.
 */
import { useState, useEffect } from "react";
import { LocationData } from "@/utils/location";
import { updateUserHomeLocation, HomeLocation } from "@/lib/firestore";
import { useAuth } from "@/lib/authContext";
import { Lang, t } from "@/lib/i18n";

const SAFE_RADIUS_KM = 2; // warn if > 2km from home

function haversineKm(a: LocationData, b: HomeLocation): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

interface Props {
  location: LocationData | null;
  homeLocation: HomeLocation | null;
  lang: Lang;
  onHomeSet?: (home: HomeLocation) => void;
}

export default function ThreatRadar({ location, homeLocation, lang, onHomeSet }: Props) {
  const [distance, setDistance] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (location && homeLocation) {
      setDistance(haversineKm(location, homeLocation));
    } else {
      setDistance(null);
    }
  }, [location, homeLocation]);

  const setHomeHere = async () => {
    if (!location || !user) return;
    setSaving(true);
    const home: HomeLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      label: "Home",
    };
    try {
      await updateUserHomeLocation(user.uid, home);
      onHomeSet?.(home);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const isRisky = distance !== null && distance > SAFE_RADIUS_KM;
  const isSafe  = distance !== null && distance <= SAFE_RADIUS_KM;

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 transition-colors ${
      isRisky ? "bg-red-900/20 border-red-500/40" :
      isSafe  ? "bg-green-900/20 border-green-500/30" :
                "bg-gray-900 border-gray-700"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-white text-sm font-semibold">Threat Radar</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isRisky ? "bg-red-500/20 text-red-300" :
          isSafe  ? "bg-green-500/20 text-green-300" :
                    "bg-gray-700 text-gray-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isRisky ? "bg-red-400 animate-pulse" : isSafe ? "bg-green-400" : "bg-gray-500"}`} />
          {isRisky ? t(lang, "statusDanger") : isSafe ? t(lang, "statusSafe") : "No home set"}
        </div>
      </div>

      {distance !== null && (
        <div className="flex items-center gap-3">
          {/* Distance bar */}
          <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isRisky ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${Math.min((distance / (SAFE_RADIUS_KM * 3)) * 100, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-mono font-semibold flex-shrink-0 ${isRisky ? "text-red-300" : "text-green-300"}`}>
            {distance.toFixed(1)} km
          </span>
        </div>
      )}

      {isRisky && (
        <p className="text-red-300 text-xs bg-red-900/30 rounded-xl px-3 py-2">
          ⚠️ You are moving away from your safe zone
        </p>
      )}

      {!homeLocation ? (
        <button
          onClick={setHomeHere}
          disabled={!location || saving}
          className="text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-xl transition-colors font-medium"
        >
          {saving ? "Saving…" : "📍 Set Current Location as Home"}
        </button>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-xs">
            🏠 Home: {homeLocation.latitude.toFixed(4)}, {homeLocation.longitude.toFixed(4)}
          </p>
          <button
            onClick={setHomeHere}
            disabled={!location || saving}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Update
          </button>
        </div>
      )}
    </div>
  );
}
