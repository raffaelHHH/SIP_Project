import { useCallback, useEffect, useState } from 'react';
import { useT, type StringKey } from '../i18n';
import { backendEnabled, getClient } from '../lib/backend';
import { useStore } from '../lib/store';
import { navigate } from '../router';
import './reviews.css';

interface Review {
  id: string;
  rating: number;
  tip: string;
  created_at: string;
  user_id: string;
}

function Stars({ value, size = '1rem' }: { value: number; size?: string }) {
  return (
    <span aria-hidden="true" style={{ fontSize: size, letterSpacing: 1 }}>
      {'★'.repeat(Math.round(value))}
      <span style={{ opacity: 0.25 }}>{'★'.repeat(5 - Math.round(value))}</span>
    </span>
  );
}

/** Ratings and short tips from other parents. Needs internet; hidden when there's no database. */
export default function SpotReviews({ spotId }: { spotId: string }) {
  const { t, lang } = useT();
  const account = useStore((s) => s.account);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<StringKey | null>(null);

  const load = useCallback(async () => {
    if (!navigator.onLine) return setFailed(true);
    try {
      const sb = await getClient();
      const { data, error } = await sb
        .from('place_reviews')
        .select('id,rating,tip,created_at,user_id')
        .eq('spot_id', spotId)
        .order('updated_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      setReviews(data as Review[]);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [spotId]);

  useEffect(() => {
    if (backendEnabled) void load();
  }, [load]);

  if (!backendEnabled) return null;

  const mine = reviews?.find((r) => r.user_id === account?.userId);
  const visible = reviews ?? [];
  const avg = visible.length ? visible.reduce((n, r) => n + r.rating, 0) / visible.length : 0;

  const startEdit = () => {
    setRating(mine?.rating ?? 0);
    setTip(mine?.tip ?? '');
    setMsg(null);
    setEditing(true);
  };

  const save = async () => {
    if (!rating || !account) return;
    setBusy(true);
    setMsg(null);
    try {
      const sb = await getClient();
      const values = { rating, tip: tip.trim(), updated_at: new Date().toISOString() };
      const { error } = mine
        ? await sb.from('place_reviews').update(values).eq('id', mine.id)
        : await sb.from('place_reviews').insert({ spot_id: spotId, rating, tip: values.tip });
      if (error) throw error;
      setEditing(false);
      setMsg('tipSaved');
      await load();
    } catch {
      setMsg(navigator.onLine ? 'errGeneric' : 'errOffline');
    } finally {
      setBusy(false);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-SG', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <section>
      <h2>💬 {t('tipsTitle')}</h2>

      {failed && !reviews && <p className="muted">📶 {t('tipsOffline')}</p>}

      {reviews && (
        <>
          {visible.length > 0 ? (
            <p className="review-avg">
              <Stars value={avg} size="1.4rem" /> <strong>{avg.toFixed(1)}</strong>{' '}
              <span className="muted">({visible.length})</span>
            </p>
          ) : (
            <p className="muted">{t('noTips')}</p>
          )}
          <ul className="review-list">
            {visible
              .filter((r) => r.tip || r.user_id === account?.userId)
              .slice(0, 10)
              .map((r) => (
                <li key={r.id} className="card">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <Stars value={r.rating} />
                    <span className="muted small">
                      {r.user_id === account?.userId ? t('you') : t('aParent')} · {fmt(r.created_at)}
                    </span>
                  </div>
                  {r.tip && <p style={{ margin: '6px 0 0' }}>{r.tip}</p>}
                </li>
              ))}
          </ul>
        </>
      )}

      {msg && (
        <p className="muted" role="status">
          {t(msg)}
        </p>
      )}

      {!account ? (
        <button className="btn" style={{ width: '100%' }} onClick={() => navigate('/account')}>
          👤 {t('signInToTip')}
        </button>
      ) : editing ? (
        <div className="card stack">
          <div>
            <div className="setting-label">{t('yourRating')}</div>
            <div className="star-picker" role="radiogroup" aria-label={t('yourRating')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={t('ratingStars', { n })}
                  className={n <= rating ? 'on' : ''}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            className="textarea"
            rows={2}
            maxLength={200}
            placeholder={t('tipPlaceholder')}
            aria-label={t('tipPlaceholder')}
            value={tip}
            onChange={(e) => setTip(e.target.value)}
          />
          <button className="btn btn-big btn-primary" disabled={!rating || busy} onClick={save}>
            {busy ? t('working') : t('send')}
          </button>
        </div>
      ) : (
        reviews && (
          <button className="btn" style={{ width: '100%' }} onClick={startEdit}>
            ✏️ {mine ? t('editTip') : t('addTip')}
          </button>
        )
      )}
    </section>
  );
}
