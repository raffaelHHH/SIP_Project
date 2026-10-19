import { useState } from 'react';
import AreaList from '../components/AreaList';
import { languageOrder, languages, useT } from '../i18n';
import { ageGroups, ageKey } from '../lib/data';
import { setPrefs, useStore } from '../lib/store';
import { requestPosition } from '../hooks/useOrigin';
import './onboarding.css';

export default function Onboarding() {
  const { t, lang } = useT();
  const ageGroup = useStore((s) => s.prefs.ageGroup);
  const [step, setStep] = useState(0);
  const [locState, setLocState] = useState<'idle' | 'asking' | 'denied'>('idle');

  const finish = () => setPrefs({ onboarded: true });

  const askLocation = async () => {
    setLocState('asking');
    try {
      const pos = await requestPosition();
      setPrefs({ locationMode: 'gps', lastPosition: pos, onboarded: true });
    } catch {
      setLocState('denied');
    }
  };

  return (
    <div className="onboarding">
      <div className="ob-top">
        <div className="ob-dots" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i === step ? 'on' : ''} />
          ))}
        </div>
        <button className="link-btn" onClick={finish}>
          {t('skip')}
        </button>
      </div>

      {step === 0 && (
        <section className="ob-step">
          <div className="ob-hero" aria-hidden="true">
            🌳👨‍👧☀️
          </div>
          <h1>{t('obWelcome')}</h1>
          <p className="ob-tagline">{t('obTagline')}</p>
          <h2>{t('obChooseLang')}</h2>
          <div className="stack">
            {languageOrder.map((l) => (
              <button
                key={l}
                className={'btn btn-big' + (lang === l ? ' btn-primary' : '')}
                aria-pressed={lang === l}
                lang={l === 'zh' ? 'zh-Hans' : l}
                onClick={() => setPrefs({ lang: l })}
              >
                {languages[l].langName}
              </button>
            ))}
          </div>
          <button className="btn btn-big btn-yellow ob-next" onClick={() => setStep(1)}>
            {t('next')} →
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="ob-step">
          <div className="ob-hero" aria-hidden="true">
            🧒
          </div>
          <h1>{t('obAgeQ')}</h1>
          <p className="muted">{t('obAgeHint')}</p>
          <div className="stack">
            {ageGroups.map((g) => (
              <button
                key={g}
                className={'btn btn-big' + (ageGroup === g ? ' btn-primary' : '')}
                aria-pressed={ageGroup === g}
                onClick={() => {
                  setPrefs({ ageGroup: g });
                  setStep(2);
                }}
              >
                {g === '2-4' ? '👶' : g === '5-8' ? '🧒' : '👦'} {t(ageKey[g])}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="ob-step">
          <div className="ob-hero" aria-hidden="true">
            📍
          </div>
          <h1>{t('obLocationQ')}</h1>
          {locState !== 'denied' && (
            <button className="btn btn-big btn-primary" onClick={askLocation} disabled={locState === 'asking'}>
              📍 {locState === 'asking' ? t('obLocating') : t('obUseLocation')}
            </button>
          )}
          <h2>{locState === 'denied' ? t('obLocationDenied') : t('obPickArea')}</h2>
          <AreaList onPick={(id) => setPrefs({ locationMode: id, onboarded: true })} />
        </section>
      )}
    </div>
  );
}
