export interface LocationData {
  latitude: number;
  longitude: number;
}

export function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function watchLocation(callback: (loc: LocationData) => void): number {
  return navigator.geolocation.watchPosition(
    (pos) => callback({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    (err) => console.error("Location watch error:", err),
    { enableHighAccuracy: true }
  );
}
