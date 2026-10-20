import { lazy, Suspense, useState } from 'react';
import { useOrigin } from '../hooks/useOrigin';
import { useT, type StringKey } from '../i18n';
import { backendEnabled, getClient } from '../lib/backend';
import { categories, categoryIcon, featureIcon, features } from '../lib/data';
import type { LatLng } from '../lib/geo';
import { useStore } from '../lib/store';
import { goBack, navigate } from '../router';
import type { Category, Feature } from '../types';
import '../components/reviews.css';

const PinPicker = lazy(() => import('../components/PinPicker'));

const SINGAPORE: LatLng = { lat: 1.3521, lng: 103.8198 };
const inSingapore = (p: LatLng) => p.lat >= 1.15 && p.lat <= 1.48 && p.lng >= 103.6 && p.lng <= 104.1;

export default function SuggestPlace() {
  const { t } = useT();
  const account = useStore((s) => s.account);
  const { origin } = useOrigin();
  const [pos, setPos] = useState<LatLng>(origin ?? SINGAPORE);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('playground');
  const [feats, setFeats] = useState<Feature[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<StringKey | null>(null);
  const [sent, setSent] = useState(false);

  const header = (
    <div className="topbar">
      <button className="icon-btn" onClick={() => goBack()} aria-label={t('back')}>
        ←
      </button>
      <h1>➕ {t('suggestPlace')}</h1>
    </div>
  );

  if (!backendEnabled) {
    return (
      <div className="screen">
        {header}
        <p className="empty">{t('accountsOff')}</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="screen">
        {header}
        <p className="muted">{t('suggestHint')}</p>
        <button className="btn btn-big btn-primary" onClick={() => navigate('/account')}>
          👤 {t('suggestSignIn')}
        </button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="screen">
        {header}
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: '3rem' }} aria-hidden="true">
            🙏
          </div>
          <p style={{ fontWeight: 700, fontSize: '1.15rem' }}>{t('suggestThanks')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/account')}>
            📍 {t('mySuggestions')}
          </button>
        </div>
      </div>
    );
  }

  const toggleFeat = (f: Feature) => setFeats(feats.includes(f) ? feats.filter((x) => x !== f) : [...feats, f]);

  const submit = async () => {
    setMsg(null);
    if (name.trim().length < 2) return setMsg('nameTooShort');
    if (!inSingapore(pos)) return setMsg('tapMap');
    setBusy(true);
    try {
      const sb = await getClient();
      const { error } = await sb.from('place_suggestions').insert({
        name: name.trim(),
        category,
        lat: pos.lat,
        lng: pos.lng,
        features: feats,
        note: note.trim(),
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setMsg(navigator.onLine ? 'errGeneric' : 'errOffline');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      {header}
      <div className="stack">
        <p className="form-msg">👆 {t('tapMap')}</p>
        <Suspense fallback={<div className="empty">{t('loadingMap')}</div>}>
          <PinPicker value={pos} onChange={setPos} />
        </Suspense>

        <label className="field">
          {t('placeName')}
          <input className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <div className="field">
          {t('placeType')}
          <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible', margin: 0, padding: 0 }}>
            {categories.map((c) => (
              <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
                <span aria-hidden="true">{categoryIcon[c]}</span> {t(`cat_${c}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          {t('placeFeatures')}
          <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible', margin: 0, padding: 0 }}>
            {features.map((f) => (
              <button key={f} className="chip" aria-pressed={feats.includes(f)} onClick={() => toggleFeat(f)}>
                <span aria-hidden="true">{featureIcon[f]}</span> {t(`feat_${f}`)}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          {t('placeNote')}
          <textarea className="textarea" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        {msg && <p className="form-msg error">{t(msg)}</p>}

        <button className="btn btn-big btn-primary" onClick={submit} disabled={busy}>
          {busy ? t('working') : t('submit')}
        </button>
      </div>
    </div>
  );
}
