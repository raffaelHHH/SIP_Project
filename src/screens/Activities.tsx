import { useEffect, useMemo, useState } from 'react';
import ActivityCard from '../components/ActivityCard';
import LangToggle from '../components/LangToggle';
import LoadMore, { useLoadMore } from '../components/LoadMore';
import { useT } from '../i18n';
import { activities, skillIcon, skills } from '../lib/data';
import { useStore } from '../lib/store';
import type { Skill } from '../types';

let savedUi: { mine: boolean; skills: Skill[] } = { mine: true, skills: [] };

export default function Activities() {
  const { t } = useT();
  const ageGroup = useStore((s) => s.prefs.ageGroup);
  const [ui, setUi] = useState(savedUi);

  useEffect(() => {
    savedUi = ui;
  }, [ui]);

  const list = useMemo(
    () =>
      activities
        .filter((a) => !ui.mine || a.ages.includes(ageGroup))
        .filter((a) => ui.skills.length === 0 || a.skills.some((s) => ui.skills.includes(s))),
    [ui, ageGroup],
  );

  const page = useLoadMore(list, `${ui.mine}|${ui.skills.join()}`);

  const toggleSkill = (s: Skill) =>
    setUi((u) => ({ ...u, skills: u.skills.includes(s) ? u.skills.filter((x) => x !== s) : [...u.skills, s] }));

  return (
    <div className="screen">
      <div className="topbar">
        <h1>🧩 {t('navActivities')}</h1>
        <LangToggle />
      </div>

      <div className="segment" role="group" style={{ marginBottom: 8 }}>
        <button aria-pressed={ui.mine} onClick={() => setUi((u) => ({ ...u, mine: true }))}>
          🧒 {t('forMyChild', { age: ageGroup })}
        </button>
        <button aria-pressed={!ui.mine} onClick={() => setUi((u) => ({ ...u, mine: false }))}>
          👨‍👩‍👧‍👦 {t('allAges')}
        </button>
      </div>

      <div className="chips" role="group" aria-label={t('develops')}>
        {skills.map((s) => (
          <button key={s} className="chip" aria-pressed={ui.skills.includes(s)} onClick={() => toggleSkill(s)}>
            <span aria-hidden="true">{skillIcon[s]}</span> {t(`skill_${s}`)}
          </button>
        ))}
      </div>

      <div className="stack" style={{ marginTop: 8 }}>
        {page.visible.map((a) => (
          <ActivityCard key={a.id} activity={a} />
        ))}
        <LoadMore remaining={page.remaining} onMore={page.more} />
        {list.length === 0 && <p className="empty">{t('noSpots')}</p>}
      </div>
    </div>
  );
}
