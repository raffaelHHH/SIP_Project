import { useSyncExternalStore } from 'react';
import type { AgeGroup, Lang } from '../types';

// Everything the app remembers lives in one localStorage key on the user's phone.
// Nothing is ever sent to a server.
const KEY = 'kaki:v1';

export interface Prefs {
  onboarded: boolean;
  lang: Lang;
  ageGroup: AgeGroup;
  /** 'gps' = use device location; otherwise a neighbourhood id; null = not set. */
  locationMode: 'gps' | string | null;
  lastPosition: { lat: number; lng: number } | null;
}

export interface LogEntry {
  activityId: string;
  date: string; // YYYY-MM-DD (local)
}

export interface FeedbackEntry {
  rating: number; // 1–5
  comment: string;
  date: string; // ISO timestamp
  lang: Lang;
}

export interface Stats {
  spotViews: number;
  goThereTaps: number;
  activitiesDone: number;
  opens: number;
  days: string[]; // distinct YYYY-MM-DD the app was opened
  firstUsed: string | null;
}

export interface State {
  prefs: Prefs;
  saved: { spots: string[]; activities: string[] };
  log: LogEntry[];
  feedback: FeedbackEntry[];
  stats: Stats;
}

function guessLang(): Lang {
  try {
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

function initialState(): State {
  return {
    prefs: { onboarded: false, lang: guessLang(), ageGroup: '5-8', locationMode: null, lastPosition: null },
    saved: { spots: [], activities: [] },
    log: [],
    feedback: [],
    stats: { spotViews: 0, goThereTaps: 0, activitiesDone: 0, opens: 0, days: [], firstUsed: null },
  };
}

function load(): State {
  const base = initialState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<State>;
    // Merge so that new fields added in later versions get defaults.
    return {
      prefs: { ...base.prefs, ...parsed.prefs },
      saved: { ...base.saved, ...parsed.saved },
      log: parsed.log ?? [],
      feedback: parsed.feedback ?? [],
      stats: { ...base.stats, ...parsed.stats },
    };
  } catch {
    return base;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

export function getState(): State {
  return state;
}

export function setState(fn: (s: State) => State): void {
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (e.g. private mode): keep working in memory.
  }
  listeners.forEach((l) => l());
}

export function resetAll(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  state = initialState();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Read part of the store. The selector must return existing objects, not new ones. */
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

export function setPrefs(p: Partial<Prefs>): void {
  setState((s) => ({ ...s, prefs: { ...s.prefs, ...p } }));
}

export function toggleSaved(kind: 'spots' | 'activities', id: string): void {
  setState((s) => {
    const list = s.saved[kind];
    const next = list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
    return { ...s, saved: { ...s.saved, [kind]: next } };
  });
}

export function todayStr(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Logs an activity once per day. Returns false if it was already logged today. */
export function logActivity(activityId: string): boolean {
  const today = todayStr();
  if (state.log.some((e) => e.activityId === activityId && e.date === today)) return false;
  setState((s) => ({
    ...s,
    log: [{ activityId, date: today }, ...s.log],
    stats: { ...s.stats, activitiesDone: s.stats.activitiesDone + 1 },
  }));
  return true;
}

export function addFeedback(rating: number, comment: string): void {
  setState((s) => ({
    ...s,
    feedback: [...s.feedback, { rating, comment, date: new Date().toISOString(), lang: s.prefs.lang }],
  }));
}

// ---- Anonymous impact counters (shown on the hidden Team stats page) ----

export function countSpotView(): void {
  setState((s) => ({ ...s, stats: { ...s.stats, spotViews: s.stats.spotViews + 1 } }));
}

export function countGoThere(): void {
  setState((s) => ({ ...s, stats: { ...s.stats, goThereTaps: s.stats.goThereTaps + 1 } }));
}

/** Call once per app load. */
export function countAppOpen(): void {
  const today = todayStr();
  setState((s) => ({
    ...s,
    stats: {
      ...s.stats,
      opens: s.stats.opens + 1,
      days: s.stats.days.includes(today) ? s.stats.days : [...s.stats.days, today],
      firstUsed: s.stats.firstUsed ?? today,
    },
  }));
}
