import { useRef, useState } from 'react';
import LangToggle from '../components/LangToggle';
import { languageOrder, languages, useT, type StringKey } from '../i18n';
import { ageGroups, ageKey, neighbourhoodById, resources } from '../lib/data';
import { addFeedback, setPrefs, useStore } from '../lib/store';
import { navigate } from '../router';
import './help.css';

const smileys = ['😞', '🙁', '😐', '🙂', '😄'];

export default function Help() {
  const { t, p, lang } = useT();
  const prefs = useStore((s) => s.prefs);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  // Hidden Team stats: tap the version number 5 times within 3 seconds.
  const taps = useRef<number[]>([]);
  const onVersionTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((x) => now - x < 3000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      navigate('/team');
    }
  };

  const send = () => {
    if (!rating) return;
    addFeedback(rating, comment.trim());
    setSent(true);
    setRating(null);
    setComment('');
  };

  const areaName =
    prefs.locationMode === 'gps'
      ? t('myLocation')
      : prefs.locationMode
        ? p(neighbourhoodById.get(prefs.locationMode)?.name ?? { en: prefs.locationMode })
        : t('chooseArea');

  return (
    <div className="screen">
      <div className="topbar">
        <h1>❓ {t('navHelp')}</h1>
        <LangToggle />
      </div>

      <h2 style={{ marginTop: 4 }}>{t('howToUse')}</h2>
      <ol className="how">
        {(
          [
            ['📍', 'how1'],
            ['🧩', 'how2'],
            ['🎉', 'how3'],
          ] as [string, StringKey][]
        ).map(([icon, key], i) => (
          <li key={key} className="how-step">
            <span className="how-num">{i + 1}</span>
            <span className="how-icon" aria-hidden="true">
              {icon}
            </span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ol>

      <h2>🤝 {t('freeResources')}</h2>
      <div className="stack">
        {resources.map((r) => (
          <a key={r.id} className="card card-btn" href={r.url} target="_blank" rel="noopener noreferrer">
            <span className="card-icon" aria-hidden="true">
              {r.icon}
            </span>
            <span className="card-body">
              <span className="card-title" style={{ display: 'block', color: 'var(--text)' }}>
                {p(r.name)}
              </span>
              <span className="card-meta" style={{ display: 'block' }}>
                {p(r.desc)}
              </span>
            </span>
            <span aria-hidden="true" style={{ fontSize: '1.3rem' }}>
              ↗
            </span>
          </a>
        ))}
      </div>

      <h2>⚙️ {t('settings')}</h2>
      <div className="card stack">
        <div>
          <div className="setting-label">🌐 {t('language')}</div>
          <div className="segment" role="group" aria-label={t('language')}>
            {languageOrder.map((l) => (
              <button key={l} aria-pressed={lang === l} onClick={() => setPrefs({ lang: l })}>
                {languages[l].langName}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="setting-label">🧒 {t('childAge')}</div>
          <div className="segment" role="group" aria-label={t('childAge')}>
            {ageGroups.map((g) => (
              <button key={g} aria-pressed={prefs.ageGroup === g} onClick={() => setPrefs({ ageGroup: g })}>
                {t(ageKey[g])}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="setting-label">📍 {t('area')}</div>
          <button className="btn" style={{ width: '100%' }} onClick={() => navigate('/area')}>
            {areaName} ▾
          </button>
        </div>
      </div>

      <h2>💬 {t('feedback')}</h2>
      <div className="card stack">
        {sent ? (
          <p className="thanks">{t('thanks')}</p>
        ) : (
          <>
            <div className="smileys" role="radiogroup" aria-label={t('feedback')}>
              {smileys.map((s, i) => (
                <button
                  key={i}
                  role="radio"
                  aria-checked={rating === i + 1}
                  aria-label={t(`rating${i + 1}` as StringKey)}
                  className="smiley"
                  onClick={() => setRating(i + 1)}
                >
                  {s}
                </button>
              ))}
            </div>
            <label className="visually-hidden" htmlFor="fb-comment">
              {t('feedbackComment')}
            </label>
            <textarea
              id="fb-comment"
              className="textarea"
              rows={3}
              maxLength={500}
              placeholder={t('feedbackComment')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className="btn btn-big btn-primary" disabled={!rating} onClick={send}>
              {t('send')}
            </button>
          </>
        )}
      </div>

      <button className="version" onClick={onVersionTap}>
        {t('version', { v: __APP_VERSION__ })}
      </button>
    </div>
  );
}
