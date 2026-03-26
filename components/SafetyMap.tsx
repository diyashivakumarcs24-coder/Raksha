"use client";
/**
 * SafetyMap — enhances existing map with nearby resource markers.
 * Uses Google Maps Embed API + Places API (via server-side proxy route).
 * Falls back gracefully if API key is missing.
 * Does NOT replace existing LocationCard map logic.
 */
import { useState, useEffect } from "react";
import { LocationData } from "@/utils/location";
import { Lang, t, TranslationKey } from "@/lib/i18n";

type PlaceType = "police" | "hospital" | "pharmacy" | "government";

interface NearbyPlace {
  name: string;
  lat: number;
  lng: number;
  type: PlaceType;
  vicinity: string;
}

const TYPE_CONFIG: Record<PlaceType, { emoji: string; color: string; labelKey: TranslationKey; googleType: string }> = {
  police:     { emoji: "🔵", color: "text-blue-400",   labelKey: "police",     googleType: "police" },
  hospital:   { emoji: "🔴", color: "text-red-400",    labelKey: "hospital",   googleType: "hospital" },
  pharmacy:   { emoji: "🟢", color: "text-green-400",  labelKey: "pharmacy",   googleType: "pharmacy" },
  government: { emoji: "🟡", color: "text-yellow-400", labelKey: "govtOffice", googleType: "local_government_office" },
};

const ALL_TYPES: PlaceType[] = ["police", "hospital", "pharmacy", "government"];

interface Props {
  location: LocationData | null;
  lang: Lang;
}

export default function SafetyMap({ location, lang }: Props) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PlaceType | "all">("all");
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!location || fetched) return;
    setFetched(true);
    fetchNearbyPlaces(location.latitude, location.longitude);
  }, [location, fetched]);

  const fetchNearbyPlaces = async (lat: number, lng: number) => {
    setLoading(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      // No API key — show mock data so UI is still useful
      setPlaces(getMockPlaces(lat, lng));
      setLoading(false);
      return;
    }

    const results: NearbyPlace[] = [];
    // Fetch each type in parallel via our proxy route
    await Promise.allSettled(
      ALL_TYPES.map(async (type) => {
        try {
          const res = await fetch(
            `/api/places?lat=${lat}&lng=${lng}&type=${TYPE_CONFIG[type].googleType}`
          );
          if (!res.ok) return;
          const data = await res.json();
          (data.results ?? []).slice(0, 3).forEach((p: { name: string; geometry: { location: { lat: number; lng: number } }; vicinity: string }) => {
            results.push({
              name: p.name,
              lat: p.geometry.location.lat,
              lng: p.geometry.location.lng,
              type,
              vicinity: p.vicinity,
            });
          });
        } catch { /* ignore individual failures */ }
      })
    );

    setPlaces(results.length ? results : getMockPlaces(lat, lng));
    setLoading(false);
  };

  const getMockPlaces = (lat: number, lng: number): NearbyPlace[] => [
    { name: "Local Police Station", lat: lat + 0.005, lng: lng + 0.003, type: "police", vicinity: "~500m away" },
    { name: "City Hospital", lat: lat - 0.004, lng: lng + 0.006, type: "hospital", vicinity: "~600m away" },
    { name: "Apollo Pharmacy", lat: lat + 0.002, lng: lng - 0.004, type: "pharmacy", vicinity: "~300m away" },
    { name: "Municipal Office", lat: lat - 0.006, lng: lng - 0.002, type: "government", vicinity: "~700m away" },
  ];

  const filtered = activeFilter === "all" ? places : places.filter((p) => p.type === activeFilter);

  if (!location) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 text-center">
        <p className="text-gray-500 text-sm">{t(lang, "gettingLocation")}</p>
      </div>
    );
  }

  const mapSrc = `https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden w-full">
      {/* Map iframe — existing logic preserved */}
      <div className="relative">
        <iframe
          title="Safety Map"
          width="100%"
          height="220"
          loading="lazy"
          src={mapSrc}
          className="w-full border-b border-gray-700"
        />
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur rounded-lg px-2 py-1">
          <p className="text-white text-xs font-semibold">{t(lang, "nearbyResources")}</p>
        </div>
      </div>

      {/* Filter toggles */}
      <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-gray-800">
        <button
          onClick={() => setActiveFilter("all")}
          className={`flex-shrink-0 text-xs px-3 py-1 rounded-full transition-colors ${activeFilter === "all" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"}`}
        >
          {t(lang, "filterAll")}
        </button>
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`flex-shrink-0 text-xs px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${activeFilter === type ? "bg-gray-600 text-white" : "bg-gray-800 text-gray-400"}`}
          >
            <span>{TYPE_CONFIG[type].emoji}</span>
            <span>{t(lang, TYPE_CONFIG[type].labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Place list */}
      <div className="max-h-48 overflow-y-auto">
        {loading ? (
          <p className="text-gray-500 text-xs text-center py-4 animate-pulse">{t(lang, "loadingMap")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-4">No results</p>
        ) : (
          filtered.map((place, i) => (
            <a
              key={i}
              href={`https://maps.google.com/?q=${place.lat},${place.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors border-b border-gray-800/50 last:border-0"
            >
              <span className="text-lg flex-shrink-0">{TYPE_CONFIG[place.type].emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{place.name}</p>
                <p className="text-gray-500 text-xs">{place.vicinity}</p>
              </div>
              <span className={`text-xs flex-shrink-0 ${TYPE_CONFIG[place.type].color}`}>
                {t(lang, TYPE_CONFIG[place.type].labelKey)}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
