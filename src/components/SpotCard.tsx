import { useT } from '../i18n';
import { categoryIcon, featureIcon, neighbourhoodById } from '../lib/data';
import { useStore } from '../lib/store';
import { navigate } from '../router';
import type { Spot } from '../types';

export default function SpotCard({ spot, walk }: { spot: Spot; walk: number | null }) {
  const { t, p } = useT();
  const isSaved = useStore((s) => s.saved.spots.includes(spot.id));
  const area = neighbourhoodById.get(spot.neighbourhood);

  return (
    <button className="card card-btn" onClick={() => navigate(`/spot/${spot.id}`)}>
      <span className="card-icon" aria-hidden="true">
        {categoryIcon[spot.category]}
      </span>
      <span className="card-body">
        <span className="card-title" style={{ display: 'block' }}>
          {p(spot.name)} {isSaved && <span aria-label={t('saved')}>❤️</span>}
        </span>
        <span className="card-meta" style={{ display: 'block' }}>
          {walk !== null ? <span className="walk">🚶 {t('minWalk', { n: walk })}</span> : area && p(area.name)}
          {' · '}
          {t(`cat_${spot.category}`)}
        </span>
        {spot.features.length > 0 && (
          <span className="mini-badges">
            {spot.features.map((f) => (
              <span key={f} title={t(`feat_${f}`)} aria-label={t(`feat_${f}`)} role="img">
                {featureIcon[f]}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}
