import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import type { LatLng } from '../lib/geo';
import { fetchRainTip, timeTip, type Tip } from '../lib/weather';

export default function WeatherBanner({ origin, onSuggest }: { origin: LatLng | null; onSuggest: () => void }) {
  const { t } = useT();
  const [tip, setTip] = useState<Tip>(() => timeTip());

  useEffect(() => {
    let alive = true;
    fetchRainTip(origin).then((rain) => {
      if (alive && rain) setTip(rain);
    });
    return () => {
      alive = false;
    };
  }, [origin]);

  return (
    <div className="banner" role="status">
      <span className="banner-icon" aria-hidden="true">
        {tip.icon}
      </span>
      <span className="banner-text">{t(tip.key)}</span>
      {tip.suggest && (
        <button className="btn btn-primary" style={{ padding: '6px 14px' }} onClick={onSuggest}>
          ☂️ {t('showSheltered')}
        </button>
      )}
    </div>
  );
}
