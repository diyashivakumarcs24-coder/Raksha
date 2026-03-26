"use client";
import { useEffect, useState } from "react";
import { watchLocation, LocationData } from "@/utils/location";

export default function LocationCard() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    const id = watchLocation((loc) => setLocation(loc));
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 w-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-green-400 text-lg">📍</span>
        <h3 className="text-white font-semibold">Live Location</h3>
        {location && <span className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
      </div>

      {error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : location ? (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-gray-400 text-xs">Latitude</p>
              <p className="text-white font-mono">{location.latitude.toFixed(6)}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-gray-400 text-xs">Longitude</p>
              <p className="text-white font-mono">{location.longitude.toFixed(6)}</p>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-700">
            <iframe
              title="Live Map"
              width="100%"
              height="200"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
              className="w-full"
            />
          </div>
          <a
            href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-center text-xs text-blue-400 hover:text-blue-300"
          >
            Open in Google Maps ↗
          </a>
        </>
      ) : (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="animate-spin">⟳</span> Getting location...
        </div>
      )}
    </div>
  );
}
