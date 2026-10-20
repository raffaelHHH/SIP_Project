import { useT, type StringKey } from '../i18n';
import { download, toCsv } from '../lib/csv';
import { backendEnabled } from '../lib/backend';
import { flush } from '../lib/sync';
import { monthCount } from '../lib/progress';
import { resetAll, todayStr, useStore } from '../lib/store';
import { goBack, navigate } from '../router';
import './help.css';

// Hidden page for the project team (tap the version number on Help 5 times).
// All numbers are counted on this phone only and never leave it unless exported.
export default function TeamStats() {
  const { t } = useT();
  const stats = useStore((s) => s.stats);
  const log = useStore((s) => s.log);
  const feedback = useStore((s) => s.feedback);
  const outbox = useStore((s) => s.outbox.length);

  const avgRating = feedback.length
    ? (feedback.reduce((n, f) => n + f.rating, 0) / feedback.length).toFixed(1)
    : '–';

  const rows: [StringKey, string | number][] = [
    ['statSpotViews', stats.spotViews],
    ['statGoThere', stats.goThereTaps],
    ['statActivitiesDone', stats.activitiesDone],
    ['statDays', stats.days.length],
    ['statReturnVisits', Math.max(0, stats.days.length - 1)],
    ['statOpens', stats.opens],
    ['statFeedback', feedback.length],
    ['statAvgRating', avgRating],
    ['statFirstUsed', stats.firstUsed ?? '–'],
  ];

  const stamp = todayStr();

  const exportStats = () => {
    const csv = toCsv([
      {
        device_id: stats.deviceId,
        exported_at: new Date().toISOString(),
        first_used: stats.firstUsed,
        days_opened: stats.days.length,
        return_visits: Math.max(0, stats.days.length - 1),
        app_opens: stats.opens,
        spot_views: stats.spotViews,
        go_there_taps: stats.goThereTaps,
        activities_done: stats.activitiesDone,
        activities_this_month: monthCount(log),
        feedback_count: feedback.length,
        avg_rating: feedback.length ? avgRating : null,
      },
    ]);
    download(`kaki-stats-${stats.deviceId}-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const exportFeedbackCsv = () => {
    const csv = toCsv(
      feedback.map((f) => ({ device_id: stats.deviceId, date: f.date, rating: f.rating, comment: f.comment, lang: f.lang })),
    );
    download(`kaki-feedback-${stats.deviceId}-${stamp}.csv`, csv || 'device_id,date,rating,comment,lang', 'text/csv;charset=utf-8');
  };

  const exportFeedbackJson = () => {
    const json = JSON.stringify({ deviceId: stats.deviceId, exportedAt: new Date().toISOString(), feedback }, null, 2);
    download(`kaki-feedback-${stats.deviceId}-${stamp}.json`, json, 'application/json');
  };

  const reset = () => {
    if (window.confirm(t('resetConfirm'))) {
      resetAll();
      navigate('/');
    }
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => goBack('/help')} aria-label={t('back')}>
          ←
        </button>
        <h1>📊 {t('teamStats')}</h1>
      </div>
      <p className="muted small">ID: {stats.deviceId || '–'}</p>

      <table className="stat-table">
        <tbody>
          {rows.map(([key, value]) => (
            <tr key={key}>
              <th scope="row">{t(key)}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="card" style={{ marginTop: 12 }}>
        {backendEnabled ? (
          <>
            ☁️ {t('statSynced', { n: feedback.filter((f) => f.synced).length, total: feedback.length })}
            <br />⏳ {t('statOutbox', { n: outbox })}
            {(outbox > 0 || feedback.some((f) => !f.synced)) && (
              <button className="link-btn" onClick={() => void flush()}>
                {t('retrySync')}
              </button>
            )}
          </>
        ) : (
          <>📵 {t('syncOff')}</>
        )}
      </p>

      <div className="stack" style={{ marginTop: 16 }}>
        <button className="btn btn-big btn-primary" onClick={exportStats}>
          ⬇️ {t('exportStats')}
        </button>
        <button className="btn btn-big" onClick={exportFeedbackCsv}>
          ⬇️ {t('exportFeedbackCsv')}
        </button>
        <button className="btn btn-big" onClick={exportFeedbackJson}>
          ⬇️ {t('exportFeedbackJson')}
        </button>
        <button className="btn btn-big" style={{ borderColor: 'var(--red)', color: 'var(--red)', marginTop: 16 }} onClick={reset}>
          🗑️ {t('resetAll')}
        </button>
      </div>
    </div>
  );
}
