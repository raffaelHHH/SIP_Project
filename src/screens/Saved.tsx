import ActivityCard from '../components/ActivityCard';
import SpotCard from '../components/SpotCard';
import { useOrigin } from '../hooks/useOrigin';
import { useT } from '../i18n';
import { activityById, spotById } from '../lib/data';
import { walkMinutes } from '../lib/geo';
import { badges, monthCount, weekStreak } from '../lib/progress';
import { useStore } from '../lib/store';
import './saved.css';

export default function Saved() {
  const { t, p, lang } = useT();
  const { origin } = useOrigin();
  const saved = useStore((s) => s.saved);
  const log = useStore((s) => s.log);
  const stats = useStore((s) => s.stats);

  const month = monthCount(log);
  const streak = weekStreak(log);
  const badgeList = badges(log, stats);
  const savedSpots = saved.spots.map((id) => spotById.get(id)).filter((s) => s !== undefined);
  const savedActivities = saved.activities.map((id) => activityById.get(id)).filter((a) => a !== undefined);
  const recent = log.slice(0, 8);

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-SG', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="screen">
      <div className="topbar">
        <h1>❤️ {t('navSaved')}</h1>
      </div>

      <section className="progress-card">
        <p className="progress-msg">
          {month === 0 ? t('thisMonthZero') : month === 1 ? t('thisMonthOne') : t('thisMonth', { n: month })}
        </p>
        {streak >= 2 && <p className="progress-streak">🔥 {t('weekStreak', { n: streak })}</p>}
      </section>

      <h2>🏅 {t('badges')}</h2>
      <div className="badge-shelf">
        {badgeList.map((b) => (
          <div key={b.id} className={'shelf-item' + (b.earned ? ' earned' : '')}>
            <span className="shelf-icon" aria-hidden="true">
              {b.icon}
            </span>
            <span className="small">{t(b.label)}</span>
            {!b.earned && <span className="small muted">{t('badgeSoon')}</span>}
          </div>
        ))}
      </div>

      <h2>📍 {t('savedSpots')}</h2>
      {savedSpots.length === 0 ? (
        <p className="muted">{t('nothingSaved')}</p>
      ) : (
        <div className="stack">
          {savedSpots.map((s) => (
            <SpotCard key={s.id} spot={s} walk={origin ? walkMinutes(origin, s) : null} />
          ))}
        </div>
      )}

      <h2>🧩 {t('savedActivities')}</h2>
      {savedActivities.length === 0 ? (
        <p className="muted">{t('nothingSaved')}</p>
      ) : (
        <div className="stack">
          {savedActivities.map((a) => (
            <ActivityCard key={a.id} activity={a} />
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <>
          <h2>✅ {t('recentlyDone')}</h2>
          <ul className="done-list">
            {recent.map((e, i) => {
              const a = activityById.get(e.activityId);
              return (
                <li key={i}>
                  <span aria-hidden="true">{a?.icon ?? '✅'}</span>
                  <span style={{ flex: 1 }}>{a ? p(a.title) : e.activityId}</span>
                  <span className="muted small">{fmtDate(e.date)}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
