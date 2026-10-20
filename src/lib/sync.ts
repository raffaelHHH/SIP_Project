// Keeps the phone and the database in step. The phone is always the source the UI reads from;
// this file sends queued changes when online, and merges account data in when someone signs in.
import type { Session } from '@supabase/supabase-js';
import type { Category, Feature, Spot } from '../types';
import { backendEnabled, getClient, isPermanentError } from './backend';
import { neighbourhoods } from './data';
import { distanceM } from './geo';
import { getState, markFeedbackSynced, queue, removeOps, setState, subscribe, type LogEntry } from './store';
import { navigate } from '../router';

let flushing = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function hasPending(): boolean {
  const s = getState();
  return s.outbox.length > 0 || s.feedback.some((f) => !f.synced);
}

function scheduleFlush(delay = 1500) {
  clearTimeout(timer);
  timer = setTimeout(() => void flush(), delay);
}

/** Send everything waiting in the outbox, plus unsent feedback. Safe to call often. */
export async function flush(): Promise<void> {
  if (!backendEnabled || flushing || !navigator.onLine || !hasPending()) return;
  flushing = true;
  const done: string[] = [];
  const feedbackDone: string[] = [];
  try {
    const sb = await getClient();
    const {
      data: { session },
    } = await sb.auth.getSession();
    const uid = session?.user.id ?? null;
    const s = getState();
    const ops = s.outbox.slice(0, 200);
    // Only attach an account to rows if it's the one signed in now (the database checks this too).
    const owner = (userId: string | null) => (userId && userId === uid ? userId : null);

    // 1. Usage events, in one batch.
    const events = ops.filter((o) => o.t === 'event');
    if (events.length) {
      const { error } = await sb.from('usage_events').insert(
        events.map((o) => ({
          device_id: s.stats.deviceId,
          user_id: owner(o.userId),
          event: o.event,
          item_id: o.itemId,
          occurred_at: o.at,
        })),
      );
      if (error && !isPermanentError(error)) throw error;
      done.push(...events.map((o) => o.id));
    }

    // 2. Personal changes, in the order they happened.
    for (const o of ops) {
      if (o.t === 'event') continue;
      if (o.userId !== uid) {
        // Session not ready yet for this account: keep for later. Otherwise it belongs to someone who signed out.
        if (uid === null && o.userId === getState().account?.userId) continue;
        done.push(o.id);
        continue;
      }
      let error: { code?: string; status?: number } | null = null;
      if (o.t === 'save') {
        ({ error } = o.on
          ? await sb
              .from('saved_items')
              .upsert({ user_id: uid, kind: o.kind, item_id: o.itemId }, { onConflict: 'user_id,kind,item_id', ignoreDuplicates: true })
          : await sb.from('saved_items').delete().match({ user_id: uid, kind: o.kind, item_id: o.itemId }));
      } else if (o.t === 'log') {
        ({ error } = await sb
          .from('activity_log')
          .upsert(
            { user_id: uid, activity_id: o.activityId, done_on: o.date },
            { onConflict: 'user_id,activity_id,done_on', ignoreDuplicates: true },
          ));
      } else if (o.t === 'profile') {
        const p = getState().prefs;
        ({ error } = await sb
          .from('profiles')
          .update({ child_age_group: p.ageGroup, neighbourhood: p.locationMode, lang: p.lang, updated_at: new Date().toISOString() })
          .eq('id', uid));
      }
      if (error && !isPermanentError(error)) throw error;
      done.push(o.id);
    }

    // 3. Feedback (guests too). A plain insert: nobody may read the feedback table, so we can't
    // use upsert. A resend after a dropped connection fails as a duplicate (23505), which counts as sent.
    for (const f of s.feedback.filter((x) => !x.synced)) {
      const { error } = await sb.from('feedback').insert(
        {
          id: f.id,
          user_id: owner(f.userId),
          device_id: s.stats.deviceId,
          rating: f.rating,
          comment: f.comment,
          lang: f.lang,
          age_group: s.prefs.ageGroup,
          app_version: __APP_VERSION__,
          created_at: f.date,
        },
      );
      if (error && !isPermanentError(error)) throw error;
      feedbackDone.push(f.id);
    }
  } catch {
    // Network problem: whatever wasn't sent stays queued and is retried later.
  } finally {
    flushing = false;
    removeOps(done);
    if (feedbackDone.length) markFeedbackSynced(feedbackDone);
    if (done.length && getState().outbox.length) scheduleFlush(500); // more than one batch waiting
  }
}

// ---- Signing in: merge this phone's data with the account's data ----

let merging: Promise<void> | null = null;

function mergeAccount(userId: string, email: string): Promise<void> {
  const current = getState().account;
  if (current?.userId === userId && current.merged) return Promise.resolve();
  merging ??= doMerge(userId, email).finally(() => {
    merging = null;
  });
  return merging;
}

async function doMerge(userId: string, email: string): Promise<void> {
  setState((s) => ({ ...s, account: { userId, email, merged: false } }));
  const sb = await getClient();
  const [saved, log, profile] = await Promise.all([
    sb.from('saved_items').select('kind,item_id'),
    sb.from('activity_log').select('activity_id,done_on'),
    sb.from('profiles').select('child_age_group,neighbourhood,lang').eq('id', userId).maybeSingle(),
  ]);
  if (saved.error || log.error || profile.error) return; // try again next time the app opens

  const s = getState();
  const remoteSpots = saved.data.filter((r) => r.kind === 'spot').map((r) => r.item_id as string);
  const remoteActs = saved.data.filter((r) => r.kind === 'activity').map((r) => r.item_id as string);
  const remoteLog: LogEntry[] = log.data.map((r) => ({ activityId: r.activity_id, date: r.done_on }));
  const logKey = (e: LogEntry) => `${e.activityId}|${e.date}`;
  const remoteLogKeys = new Set(remoteLog.map(logKey));

  // Anything only on this phone (e.g. done as a guest) gets uploaded.
  const upload = [
    ...s.saved.spots.filter((id) => !remoteSpots.includes(id)).map((id) => ({ t: 'save' as const, kind: 'spot' as const, itemId: id, on: true })),
    ...s.saved.activities
      .filter((id) => !remoteActs.includes(id))
      .map((id) => ({ t: 'save' as const, kind: 'activity' as const, itemId: id, on: true })),
    ...s.log.filter((e) => !remoteLogKeys.has(logKey(e))).map((e) => ({ t: 'log' as const, activityId: e.activityId, date: e.date })),
  ];

  const localLogKeys = new Set(s.log.map(logKey));
  const mergedLog = [...s.log, ...remoteLog.filter((e) => !localLogKeys.has(logKey(e)))].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const p = profile.data;
  const hasRemoteProfile = Boolean(p?.child_age_group);

  setState((st) => ({
    ...st,
    account: { userId, email, merged: true },
    saved: {
      spots: [...st.saved.spots, ...remoteSpots.filter((id) => !st.saved.spots.includes(id))],
      activities: [...st.saved.activities, ...remoteActs.filter((id) => !st.saved.activities.includes(id))],
    },
    log: mergedLog,
    // An existing account's settings win on a new phone.
    prefs: hasRemoteProfile
      ? {
          ...st.prefs,
          ageGroup: p!.child_age_group,
          lang: p!.lang ?? st.prefs.lang,
          locationMode: p!.neighbourhood ?? st.prefs.locationMode,
        }
      : st.prefs,
  }));
  queue(...upload, ...(hasRemoteProfile ? [] : [{ t: 'profile' as const }]));
}

/** Forget this account's personal data on the phone (for shared family phones). */
export function clearPersonalData(): void {
  setState((s) => ({
    ...s,
    account: null,
    saved: { spots: [], activities: [] },
    log: [],
    outbox: s.outbox.filter((o) => o.t === 'event'),
    passwordRecovery: false,
  }));
}

async function onAuthChange(event: string, session: Session | null) {
  if (event === 'PASSWORD_RECOVERY') {
    setState((s) => ({ ...s, passwordRecovery: true }));
    navigate('/account');
  }
  if (session?.user && event !== 'SIGNED_OUT') {
    await mergeAccount(session.user.id, session.user.email ?? '');
    scheduleFlush(0);
  } else if (!session && getState().account) {
    // Session ended (e.g. expired). Keep the data on the phone; it merges again at next sign-in.
    setState((s) => ({ ...s, account: null }));
  }
}

// ---- Places added by parents ----

const categories: Category[] = ['playground', 'park', 'garden', 'library', 'cc', 'event'];

export async function refreshCommunitySpots(): Promise<void> {
  if (!backendEnabled || !navigator.onLine) return;
  const sb = await getClient();
  const { data, error } = await sb
    .from('place_suggestions')
    .select('id,name,category,lat,lng,features')
    .eq('status', 'approved')
    .limit(500);
  if (error || !data) return;
  const spots: Spot[] = data
    .filter((r) => categories.includes(r.category))
    .map((r) => {
      const nearest = neighbourhoods.reduce((best, n) =>
        distanceM(n, r) < distanceM(best, r) ? n : best,
      );
      return {
        id: `u-${r.id}`,
        name: { en: r.name },
        category: r.category as Category,
        neighbourhood: nearest.id,
        lat: r.lat,
        lng: r.lng,
        hours: 'check',
        features: (r.features ?? []) as Feature[],
        verified: false,
        community: true,
      };
    });
  setState((s) => ({ ...s, communitySpots: spots }));
}

/** Call once at startup. Loads the database client in the background after the first screen shows. */
export function startSync(): void {
  if (!backendEnabled) return;
  subscribe(() => {
    if (hasPending()) scheduleFlush();
  });
  window.addEventListener('online', () => {
    void flush();
    void refreshCommunitySpots();
  });
  setTimeout(async () => {
    try {
      const sb = await getClient();
      // Supabase advises not to await its own calls inside this callback, hence the setTimeout.
      sb.auth.onAuthStateChange((event, session) => {
        setTimeout(() => void onAuthChange(event, session), 0);
      });
      await sb.auth.getSession(); // also finishes email-link sign-ins (?code=...)
      cleanAuthParams();
      void flush();
      void refreshCommunitySpots();
    } catch {
      // Offline on first load: the 'online' listener retries.
    }
  }, 300);
}

/** Remove ?code=… / ?error=… left by email links, keeping the #/ route. */
function cleanAuthParams() {
  const url = new URL(window.location.href);
  if (!['code', 'error', 'error_code', 'error_description'].some((k) => url.searchParams.has(k))) return;
  window.history.replaceState(null, '', url.pathname + url.hash);
}
