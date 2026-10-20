import { useSyncExternalStore } from 'react';
import type { AgeGroup, Lang, Spot } from '../types';
import { backendEnabled } from './backend';

// The phone keeps its own copy of everything in one localStorage key, so the app
// works offline and without an account. When the database is set up, changes are
// also queued in `outbox` and sent by src/lib/sync.ts when there's a connection.
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
  id: string; // random, so the database ignores repeats
  rating: number; // 1–5
  comment: string;
  date: string; // ISO timestamp
  lang: Lang;
  /** Account that sent it (null for guests). */
  userId: string | null;
  /** True once it has reached the database. */
  synced: boolean;
}

export interface Stats {
  /** Random anonymous id so the team can tell phones apart without personal data. */
  deviceId: string;
  spotViews: number;
  goThereTaps: number;
  activitiesDone: number;
  opens: number;
  days: string[]; // distinct YYYY-MM-DD the app was opened
  firstUsed: string | null;
}

export interface Account {
  userId: string;
  email: string;
  /** True once this phone's data has been merged with the account's data. */
  merged: boolean;
}

export type UsageEvent = 'app_open' | 'spot_view' | 'go_there' | 'activity_done';

/** A change waiting to be sent to the database. */
export type Op = { id: string; userId: string | null; at: string } & (
  | { t: 'event'; event: UsageEvent; itemId: string | null }
  | { t: 'save'; kind: 'spot' | 'activity'; itemId: string; on: boolean }
  | { t: 'log'; activityId: string; date: string }
  | { t: 'profile' }
);

export interface State {
  prefs: Prefs;
  saved: { spots: string[]; activities: string[] };
  log: LogEntry[];
  feedback: FeedbackEntry[];
  stats: Stats;
  account: Account | null;
  outbox: Op[];
  /** Approved places suggested by parents (cached for offline use). */
  communitySpots: Spot[];
  /** True after opening a "reset password" email link. */
  passwordRecovery: boolean;
}

function guessLang(): Lang {
  try {
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

export function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function initialState(): State {
  return {
    prefs: { onboarded: false, lang: guessLang(), ageGroup: '5-8', locationMode: null, lastPosition: null },
    saved: { spots: [], activities: [] },
    log: [],
    feedback: [],
    stats: { deviceId: randomId(), spotViews: 0, goThereTaps: 0, activitiesDone: 0, opens: 0, days: [], firstUsed: null },
    account: null,
    outbox: [],
    communitySpots: [],
    passwordRecovery: false,
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
      // Older versions saved feedback without id/userId/synced.
      feedback: (parsed.feedback ?? []).map((f) => ({
        ...f,
        id: f.id ?? randomId(),
        userId: f.userId ?? null,
        synced: f.synced ?? false,
      })),
      stats: { ...base.stats, ...parsed.stats, deviceId: parsed.stats?.deviceId || base.stats.deviceId },
      account: parsed.account ?? null,
      outbox: parsed.outbox ?? [],
      communitySpots: parsed.communitySpots ?? [],
      passwordRecovery: false,
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

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Read part of the store. The selector must return existing objects, not new ones. */
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

// ---- Outbox helpers ----

type OpBody = Op extends infer O ? (O extends Op ? Omit<O, 'id' | 'userId' | 'at'> : never) : never;

function op(s: State, body: OpBody): Op {
  return { ...body, id: randomId(), userId: s.account?.userId ?? null, at: new Date().toISOString() } as Op;
}

/** Queue a change. Personal data (saved, log, profile) is only queued when signed in. */
function withOps(s: State, ...bodies: OpBody[]): State {
  if (!backendEnabled) return s;
  const ops = bodies.filter((b) => b.t === 'event' || s.account).map((b) => op(s, b));
  if (!ops.length) return s;
  // If a phone stays offline for a very long time, drop the oldest usage events to save space.
  let outbox = [...s.outbox, ...ops];
  if (outbox.length > MAX_OUTBOX) {
    const extra = outbox.length - MAX_OUTBOX;
    let dropped = 0;
    outbox = outbox.filter((o) => !(o.t === 'event' && dropped < extra && ++dropped));
  }
  return { ...s, outbox };
}

const MAX_OUTBOX = 1000;

/** Queue changes from outside the store (used when merging an account). */
export function queue(...bodies: OpBody[]): void {
  setState((s) => withOps(s, ...bodies));
}

export function removeOps(ids: string[]): void {
  if (ids.length === 0) return;
  setState((s) => ({ ...s, outbox: s.outbox.filter((o) => !ids.includes(o.id)) }));
}

// ---- Actions ----

const PROFILE_FIELDS: (keyof Prefs)[] = ['lang', 'ageGroup', 'locationMode'];

export function setPrefs(p: Partial<Prefs>): void {
  setState((s) => {
    const next = { ...s, prefs: { ...s.prefs, ...p } };
    const profileChanged = PROFILE_FIELDS.some((k) => k in p && p[k] !== s.prefs[k]);
    return profileChanged ? withOps(next, { t: 'profile' }) : next;
  });
}

export function toggleSaved(kind: 'spots' | 'activities', id: string): void {
  setState((s) => {
    const list = s.saved[kind];
    const on = !list.includes(id);
    const next = on ? [id, ...list] : list.filter((x) => x !== id);
    return withOps({ ...s, saved: { ...s.saved, [kind]: next } }, {
      t: 'save',
      kind: kind === 'spots' ? 'spot' : 'activity',
      itemId: id,
      on,
    });
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
  setState((s) =>
    withOps(
      {
        ...s,
        log: [{ activityId, date: today }, ...s.log],
        stats: { ...s.stats, activitiesDone: s.stats.activitiesDone + 1 },
      },
      { t: 'log', activityId, date: today },
      { t: 'event', event: 'activity_done', itemId: activityId },
    ),
  );
  return true;
}

export function addFeedback(rating: number, comment: string): void {
  setState((s) => ({
    ...s,
    feedback: [
      ...s.feedback,
      {
        id: randomId(),
        rating,
        comment,
        date: new Date().toISOString(),
        lang: s.prefs.lang,
        userId: s.account?.userId ?? null,
        synced: false,
      },
    ],
  }));
}

export function markFeedbackSynced(ids: string[]): void {
  setState((s) => ({ ...s, feedback: s.feedback.map((f) => (ids.includes(f.id) ? { ...f, synced: true } : f)) }));
}

// ---- Anonymous impact counters (Team stats page + usage_events table) ----

export function countSpotView(spotId: string): void {
  setState((s) =>
    withOps(
      { ...s, stats: { ...s.stats, spotViews: s.stats.spotViews + 1 } },
      { t: 'event', event: 'spot_view', itemId: spotId },
    ),
  );
}

export function countGoThere(spotId: string): void {
  setState((s) =>
    withOps(
      { ...s, stats: { ...s.stats, goThereTaps: s.stats.goThereTaps + 1 } },
      { t: 'event', event: 'go_there', itemId: spotId },
    ),
  );
}

/** Call once per app load. */
export function countAppOpen(): void {
  const today = todayStr();
  setState((s) =>
    withOps(
      {
        ...s,
        stats: {
          ...s.stats,
          opens: s.stats.opens + 1,
          days: s.stats.days.includes(today) ? s.stats.days : [...s.stats.days, today],
          firstUsed: s.stats.firstUsed ?? today,
        },
      },
      { t: 'event', event: 'app_open', itemId: null },
    ),
  );
}
