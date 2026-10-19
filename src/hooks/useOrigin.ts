import { useEffect, useMemo } from 'react';
import type { LatLng } from '../lib/geo';
import { neighbourhoodById } from '../lib/data';
import { getState, setPrefs, useStore } from '../lib/store';

export function requestPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      // Low accuracy is faster and kinder to old phones; we only need ~100m.
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

let refreshedThisSession = false;

/** Where distances are measured from: the phone's location, or the chosen neighbourhood. */
export function useOrigin(): { origin: LatLng | null; mode: string | null } {
  const mode = useStore((s) => s.prefs.locationMode);
  const lastPosition = useStore((s) => s.prefs.lastPosition);

  useEffect(() => {
    if (mode !== 'gps' || refreshedThisSession) return;
    refreshedThisSession = true;
    requestPosition()
      .then((pos) => {
        if (getState().prefs.locationMode === 'gps') setPrefs({ lastPosition: pos });
      })
      .catch(() => {
        // Keep the last known position; the user can pick an area instead.
      });
  }, [mode]);

  // Memoised so effects that depend on `origin` don't re-run on every render.
  const origin = useMemo(() => {
    if (mode === 'gps') return lastPosition;
    const n = mode ? neighbourhoodById.get(mode) : undefined;
    return n ? { lat: n.lat, lng: n.lng } : null;
  }, [mode, lastPosition]);
  return { origin, mode };
}
