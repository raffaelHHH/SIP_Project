import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import ActivityCard from '../components/ActivityCard';
import LangToggle from '../components/LangToggle';
import SampleDataNote from '../components/SampleDataNote';
import SpotCard from '../components/SpotCard';
import WeatherBanner from '../components/WeatherBanner';
import { useOrigin } from '../hooks/useOrigin';
import { useT } from '../i18n';
import { activities, categories, categoryIcon, featureIcon, neighbourhoodById, spots } from '../lib/data';
import { walkMinutes } from '../lib/geo';
import { useStore } from '../lib/store';
import { navigate } from '../router';
import type { Category } from '../types';

const MapView = lazy(() => import('../components/MapView'));

type Minutes = 15 | 30 | 60 | null;

interface UiState {
  view: 'list' | 'map';
  minutes: Minutes;
  cats: Category[];
  sheltered: boolean;
  toilet: boolean;
}

// Kept outside the component so filters survive going to a spot and back.
let savedUi: UiState = { view: 'list', minutes: null, cats: [], sheltered: false, toilet: false };

// Leave enough time to walk there, play, and walk back.
const maxWalkFor = (m: number) => Math.round(m / 3);

export default function Nearby() {
  const { t, p } = useT();
  const { origin, mode } = useOrigin();
  const ageGroup = useStore((s) => s.prefs.ageGroup);
  const [ui, setUi] = useState<UiState>(savedUi);
  const set = (patch: Partial<UiState>) => setUi((u) => ({ ...u, ...patch }));

  useEffect(() => {
    savedUi = ui;
  }, [ui]);

  const filtered = useMemo(() => {
    return spots
      .filter((s) => ui.cats.length === 0 || ui.cats.includes(s.category))
      .filter((s) => !ui.sheltered || s.features.includes('sheltered'))
      .filter((s) => !ui.toilet || s.features.includes('toilet'))
      .map((spot) => ({ spot, walk: origin ? walkMinutes(origin, spot) : null }))
      .sort((a, b) => (a.walk ?? 0) - (b.walk ?? 0));
  }, [ui.cats, ui.sheltered, ui.toilet, origin]);

  // "I have X minutes": only show places close enough. If none, fall back to the 3 nearest.
  const { shown, tooFar } = useMemo(() => {
    if (!ui.minutes || !origin) return { shown: filtered, tooFar: false };
    const close = filtered.filter((x) => (x.walk ?? 0) <= maxWalkFor(ui.minutes!));
    if (close.length === 0 && filtered.length > 0) return { shown: filtered.slice(0, 3), tooFar: true };
    return { shown: close, tooFar: false };
  }, [filtered, ui.minutes, origin]);

  const quickActivities = useMemo(
    () => (ui.minutes ? activities.filter((a) => a.ages.includes(ageGroup) && a.minutes <= ui.minutes!).slice(0, 6) : []),
    [ui.minutes, ageGroup],
  );

  const toggleCat = (c: Category) =>
    set({ cats: ui.cats.includes(c) ? ui.cats.filter((x) => x !== c) : [...ui.cats, c] });

  const hasFilters = ui.cats.length > 0 || ui.sheltered || ui.toilet;
  const areaLabel = mode === 'gps' ? t('nearYou') : mode ? p(neighbourhoodById.get(mode)?.name ?? { en: mode }) : null;

  return (
    <div className="screen">
      <div className="topbar">
        <h1>🌳 {t('appName')}</h1>
        <LangToggle />
      </div>

      {areaLabel ? (
        <button className="btn" style={{ marginBottom: 12 }} onClick={() => navigate('/area')}>
          📍 {areaLabel} <span aria-hidden="true">▾</span>
          <span className="visually-hidden">{t('changeArea')}</span>
        </button>
      ) : (
        <button className="btn btn-big btn-yellow" style={{ marginBottom: 12 }} onClick={() => navigate('/area')}>
          📍 {t('setAreaPrompt')}
        </button>
      )}

      <WeatherBanner origin={origin} onSuggest={() => set({ sheltered: true })} />

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>⏱ {t('iHave')}</div>
        <div className="segment" role="group" aria-label={t('iHave')}>
          {([15, 30, 60, null] as Minutes[]).map((m) => (
            <button key={m ?? 'any'} aria-pressed={ui.minutes === m} onClick={() => set({ minutes: m })}>
              {m ? t('minShort', { n: m }) : t('anyTime')}
            </button>
          ))}
        </div>
      </div>

      <div className="chips" role="group">
        {categories.map((c) => (
          <button key={c} className="chip" aria-pressed={ui.cats.includes(c)} onClick={() => toggleCat(c)}>
            <span aria-hidden="true">{categoryIcon[c]}</span> {t(`cat_${c}`)}
          </button>
        ))}
        <button className="chip" aria-pressed={ui.sheltered} onClick={() => set({ sheltered: !ui.sheltered })}>
          <span aria-hidden="true">{featureIcon.sheltered}</span> {t('feat_sheltered')}
        </button>
        <button className="chip" aria-pressed={ui.toilet} onClick={() => set({ toilet: !ui.toilet })}>
          <span aria-hidden="true">{featureIcon.toilet}</span> {t('feat_toilet')}
        </button>
      </div>

      {quickActivities.length > 0 && (
        <section>
          <h2>✨ {t('tryThese', { n: ui.minutes! })}</h2>
          <div className="chips" style={{ alignItems: 'stretch' }}>
            {quickActivities.map((a) => (
              <div key={a.id} style={{ flex: 'none', width: 260 }}>
                <ActivityCard activity={a} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="row" style={{ justifyContent: 'space-between', margin: '12px 0', flexWrap: 'wrap' }}>
        <div className="segment" role="group" style={{ minWidth: 180 }}>
          <button aria-pressed={ui.view === 'list'} onClick={() => set({ view: 'list' })}>
            ☰ {t('listView')}
          </button>
          <button aria-pressed={ui.view === 'map'} onClick={() => set({ view: 'map' })}>
            🗺️ {t('mapView')}
          </button>
        </div>
        <SampleDataNote />
      </div>

      {tooFar && <p className="muted">{t('nothingClose')}</p>}

      {shown.length === 0 ? (
        <div className="empty">
          <p>{t('noSpots')}</p>
          {hasFilters && (
            <button className="btn" onClick={() => set({ cats: [], sheltered: false, toilet: false })}>
              ✖ {t('clearFilters')}
            </button>
          )}
        </div>
      ) : ui.view === 'map' ? (
        <Suspense fallback={<div className="empty">{t('loadingMap')}</div>}>
          <MapView items={shown} origin={origin} />
        </Suspense>
      ) : (
        <div className="stack">
          {shown.map(({ spot, walk }) => (
            <SpotCard key={spot.id} spot={spot} walk={walk} />
          ))}
        </div>
      )}
    </div>
  );
}
