/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://abcd.supabase.co. Optional: without it, data stays on the phone. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase "anon" / publishable key. Safe to put in the app; the database security rules protect data. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
