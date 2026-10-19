import { useToast } from '../components/Toast';
import { useT } from '../i18n';
import { activityById, ageKey, skillIcon } from '../lib/data';
import { logActivity, todayStr, toggleSaved, useStore } from '../lib/store';
import { goBack } from '../router';
import './detail.css';

export default function ActivityDetail({ id }: { id: string }) {
  const { t, p } = useT();
  const activity = activityById.get(id);
  const isSaved = useStore((s) => s.saved.activities.includes(id));
  const log = useStore((s) => s.log);
  const toast = useToast();

  if (!activity) {
    return (
      <div className="screen">
        <button className="icon-btn" onClick={() => goBack('/activities')} aria-label={t('back')}>
          ←
        </button>
        <p className="empty">{t('notFound')}</p>
      </div>
    );
  }

  const doneToday = log.some((e) => e.activityId === id && e.date === todayStr());

  const markDone = () => {
    if (logActivity(id)) toast.show(t('greatJob'));
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => goBack('/activities')} aria-label={t('back')}>
          ←
        </button>
        <span style={{ flex: 1 }} />
        <button
          className="icon-btn"
          aria-pressed={isSaved}
          aria-label={isSaved ? t('saved') : t('save')}
          onClick={() => toggleSaved('activities', id)}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="hero" style={{ background: 'var(--yellow-100)' }} aria-hidden="true">
        <span>{activity.icon}</span>
      </div>

      <h1 style={{ marginTop: 14 }}>{p(activity.title)}</h1>

      <div className="tags" style={{ marginTop: 10 }}>
        <span className="tag">⏱ {t('minShort', { n: activity.minutes })}</span>
        {activity.ages.map((a) => (
          <span key={a} className="tag">
            🧒 {t(ageKey[a])}
          </span>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: '2rem' }} aria-hidden="true">
          🎒
        </span>
        <div>
          <div className="muted small">{t('needs')}</div>
          <strong>{activity.needs ? p(activity.needs) : t('needsNothing')}</strong>
        </div>
      </div>

      <h2>{t('develops')}</h2>
      <div className="tags">
        {activity.skills.map((s) => (
          <span key={s} className="tag" style={{ background: 'var(--yellow-100)' }}>
            {skillIcon[s]} {t(`skill_${s}`)}
          </span>
        ))}
      </div>

      <h2>{t('steps')}</h2>
      <ol className="steps">
        {activity.steps.map((step, i) => (
          <li key={i} className="step">
            <span className="step-num">{i + 1}</span>
            <span className="step-icon" aria-hidden="true">
              {step.icon}
            </span>
            <span>{p(step.text)}</span>
          </li>
        ))}
      </ol>

      <div className="sticky-action">
        <button className="btn btn-big btn-yellow" onClick={markDone} disabled={doneToday}>
          {doneToday ? t('doneToday') : `🎉 ${t('weDidThis')}`}
        </button>
      </div>
      {toast.el}
    </div>
  );
}
