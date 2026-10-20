import { useT } from '../i18n';
import { skillIcon } from '../lib/data';
import { useStore } from '../lib/store';
import { navigate } from '../router';
import type { Activity } from '../types';

export default function ActivityCard({ activity }: { activity: Activity }) {
  const { t, p } = useT();
  const log = useStore((s) => s.log);
  const doneCount = log.filter((e) => e.activityId === activity.id).length;

  return (
    <button className="card card-btn" onClick={() => navigate(`/activity/${activity.id}`)}>
      <span className="card-icon" style={{ background: 'var(--yellow-100)' }} aria-hidden="true">
        {activity.icon}
      </span>
      <span className="card-body">
        <span className="card-title" style={{ display: 'block' }}>
          {p(activity.title)}
        </span>
        <span className="card-meta" style={{ display: 'block' }}>
          {t('minShort', { n: activity.minutes })} · {activity.needs ? p(activity.needs) : t('needsNone')}
        </span>
        <span className="mini-badges">
          {activity.skills.map((s) => (
            <span key={s} title={t(`skill_${s}`)} aria-label={t(`skill_${s}`)} role="img">
              {skillIcon[s]}
            </span>
          ))}
          {doneCount > 0 && (
            <span style={{ background: 'var(--green-100)', fontSize: '0.85rem', fontWeight: 700, padding: '0 8px' }}>
              ✓ {t('doneTimes', { n: doneCount })}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
