import { languageOrder, languages, useLang } from '../i18n';
import { setPrefs } from '../lib/store';

/** Compact button that cycles through languages (shows the *other* language's name). */
export default function LangToggle() {
  const lang = useLang();
  const next = languageOrder[(languageOrder.indexOf(lang) + 1) % languageOrder.length];
  return (
    <button
      className="btn"
      style={{ padding: '6px 14px' }}
      onClick={() => setPrefs({ lang: next })}
      lang={next === 'zh' ? 'zh-Hans' : next}
    >
      🌐 {languages[next].langName}
    </button>
  );
}
