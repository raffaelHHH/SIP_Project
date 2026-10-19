import type { StringKey } from '../i18n';
import { distanceM, type LatLng } from './geo';

export interface Tip {
  key: StringKey;
  icon: string;
  /** Filter the "Show" button turns on, if any. */
  suggest?: 'sheltered';
}

/** Offline fallback: a simple rule based on the time of day (Singapore is hot from late morning). */
export function timeTip(d = new Date()): Tip {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 18.5 || h < 6.5) return { key: 'tipEvening', icon: '🌙' };
  if (h >= 11 && h < 16) return { key: 'tipHot', icon: '☀️', suggest: 'sheltered' };
  if (h < 10) return { key: 'tipMorning', icon: '🌤️' };
  return { key: 'tipNice', icon: '🌳' };
}

interface ForecastResponse {
  area_metadata: { name: string; label_location: { latitude: number; longitude: number } }[];
  items: { forecasts: { area: string; forecast: string }[] }[];
}

const URL = 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast';
let cache: { at: number; data: ForecastResponse } | null = null;

/**
 * Uses the free, no-key NEA 2-hour forecast from data.gov.sg.
 * Returns a rain tip if rain is expected near `origin`, otherwise null.
 * Fails quietly (returns null) when offline or slow.
 */
export async function fetchRainTip(origin: LatLng | null): Promise<Tip | null> {
  try {
    if (!cache || Date.now() - cache.at > 20 * 60 * 1000) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(URL, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) return null;
      const json = await res.json();
      cache = { at: Date.now(), data: (json.data ?? json) as ForecastResponse };
    }
    const { area_metadata, items } = cache.data;
    const forecasts = items[0]?.forecasts ?? [];
    let areaName = area_metadata[0]?.name;
    if (origin && area_metadata.length) {
      areaName = area_metadata.reduce((best, a) => {
        const d = (x: typeof a) => distanceM(origin, { lat: x.label_location.latitude, lng: x.label_location.longitude });
        return d(a) < d(best) ? a : best;
      }).name;
    }
    const forecast = forecasts.find((f) => f.area === areaName)?.forecast ?? '';
    if (/rain|shower|thunder/i.test(forecast)) return { key: 'tipRain', icon: '🌧️', suggest: 'sheltered' };
    return null;
  } catch {
    return null;
  }
}
