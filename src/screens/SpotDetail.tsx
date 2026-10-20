import { useEffect, useRef } from 'react';
import ActivityCard from '../components/ActivityCard';
import SampleDataNote from '../components/SampleDataNote';
import { useOrigin } from '../hooks/useOrigin';
import { useT } from '../i18n';
import { activitiesForSpot, categoryIcon, featureIcon, useSpot } from '../lib/data';
import SpotReviews from '../components/SpotReviews';
import { directionsUrl, walkMinutes } from '../lib/geo';
import { countGoThere, countSpotView, toggleSaved, useStore } from '../lib/store';
import { goBack } from '../router';
import './detail.css';

const heroColour: Record<string, string> = {
  playground: '#ffe9a8',
  park: '#cfe8c6',
  garden: '#f8d5e0',
  library: '#d6e4f5',
  cc: '#f5e0c8',
  event: '#e6d9f5',
};

export default function SpotDetail({ id }: { id: string }) {
  const { t, p } = useT();
  const spot = useSpot(id);
  const { origin } = useOrigin();
  const ageGroup = useStore((s) => s.prefs.ageGroup);
  const isSaved = useStore((s) => s.saved.spots.includes(id));

  // Count each visit to this screen once (StrictMode runs effects twice in dev).
  const counted = useRef(false);
  useEffect(() => {
    if (spot && !counted.current) {
      counted.current = true;
      countSpotView(spot.id);
    }
  }, [spot]);

  if (!spot) {
    return (
      <div className="screen">
        <button className="icon-btn" onClick={() => goBack()} aria-label={t('back')}>
          ←
        </button>
        <p className="empty">{t('notFound')}</p>
      </div>
    );
  }

  const walk = origin ? walkMinutes(origin, spot) : null;
  const hours = spot.hours === '24h' ? t('hours24h') : spot.hours === 'check' ? t('checkOnSite') : p(spot.hours);
  const suggestions = activitiesForSpot(spot, ageGroup);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => goBack()} aria-label={t('back')}>
          ←
        </button>
        <span style={{ flex: 1 }} />
        <button
          className="icon-btn"
          aria-pressed={isSaved}
          aria-label={isSaved ? t('saved') : t('save')}
          onClick={() => toggleSaved('spots', spot.id)}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="hero" style={{ background: heroColour[spot.category] }} aria-hidden="true">
        <span>{categoryIcon[spot.category]}</span>
      </div>

      <h1 style={{ marginTop: 14 }}>{p(spot.name)}</h1>
      <div className="detail-facts">
        <span>
          {categoryIcon[spot.category]} {t(`cat_${spot.category}`)}
        </span>
        {walk !== null && <span className="walk">🚶 {t('minWalk', { n: walk })}</span>}
        <span>
          🕒 {t('hours')}: {hours}
        </span>
      </div>
      {spot.community ? <span className="sample-note">👪 {t('fromParents')}</span> : <SampleDataNote />}

      <a
        className="btn btn-big btn-primary"
        style={{ marginTop: 16 }}
        href={directionsUrl(spot)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => countGoThere(spot.id)}
      >
        🧭 {t('goThere')}
      </a>

      {spot.features.length > 0 && (
        <div className="badge-grid" style={{ marginTop: 16 }}>
          {spot.features.map((f) => (
            <div key={f} className="badge">
              <span className="badge-icon" aria-hidden="true">
                {featureIcon[f]}
              </span>
              {t(`feat_${f}`)}
            </div>
          ))}
        </div>
      )}

      <SpotReviews spotId={spot.id} />

      {suggestions.length > 0 && (
        <>
          <h2>🎯 {t('thingsToDo')}</h2>
          <div className="stack">
            {suggestions.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
