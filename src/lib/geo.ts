export interface LatLng {
  lat: number;
  lng: number;
}

/** Straight-line distance in metres. */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Real paths are longer than a straight line, and walking with kids is slow.
const DETOUR = 1.3;
const METRES_PER_MIN = 70;

/** Estimated walking minutes (rounded, at least 1). */
export function walkMinutes(a: LatLng, b: LatLng): number {
  return Math.max(1, Math.round((distanceM(a, b) * DETOUR) / METRES_PER_MIN));
}

/** Google Maps walking directions. Opens the app on Android if installed. No API key needed. */
export function directionsUrl(to: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=walking`;
}
