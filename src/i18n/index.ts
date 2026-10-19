import { useCallback } from 'react';
import type { Lang, Localized } from '../types';
import { useStore } from '../lib/store';
import en, { type Strings } from './en';
import zh from './zh';

// Register new languages here (and add the code to `Lang` in src/types.ts).
export const languages: Record<Lang, Strings> = { en, zh };
export const languageOrder: Lang[] = ['en', 'zh'];

export type StringKey = keyof Strings;

export function translate(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  let s = languages[lang][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/** Pick the right language from a data field, falling back to English. */
export function pick(text: Localized, lang: Lang): string {
  return text[lang] ?? text.en;
}

export function useLang(): Lang {
  return useStore((s) => s.prefs.lang);
}

export function useT() {
  const lang = useLang();
  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );
  const p = useCallback((text: Localized) => pick(text, lang), [lang]);
  return { t, p, lang };
}
