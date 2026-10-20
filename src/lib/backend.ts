import type { SupabaseClient } from '@supabase/supabase-js';

// Set these in .env.local (and in Vercel / GitHub settings). See README → "Database & accounts".
// Without them the app still works fully, keeping everything on the phone.
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const backendEnabled = Boolean(URL && KEY);

let client: Promise<SupabaseClient> | null = null;

/** The Supabase client, loaded only when first needed so it doesn't slow the first screen. */
export function getClient(): Promise<SupabaseClient> {
  if (!backendEnabled) return Promise.reject(new Error('Database not configured'));
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL!, KEY!, {
      auth: {
        // PKCE puts email-link codes in "?code=", which doesn't clash with our "#/" routes.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }),
  );
  return client;
}

/** Where email links (confirm sign-up, reset password) should bring people back to. */
export function appUrl(): string {
  return window.location.origin + window.location.pathname;
}

/** True for errors from the database itself (bad data), false for network problems worth retrying. */
export function isPermanentError(error: { code?: string; status?: number } | null): boolean {
  if (!error) return false;
  if (error.code && /^[0-9A-Z]{5}$/.test(error.code)) return true; // PostgreSQL error code, e.g. 23514
  return error.status !== undefined && error.status >= 400 && error.status < 500 && error.status !== 401 && error.status !== 408 && error.status !== 429;
}
