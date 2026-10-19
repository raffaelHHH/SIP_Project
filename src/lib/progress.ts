import type { StringKey } from '../i18n';
import { activityById } from './data';
import type { LogEntry, Stats } from './store';
import { todayStr } from './store';
import type { Skill } from '../types';

export interface Badge {
  id: string;
  icon: string;
  label: StringKey;
  earned: boolean;
}

const DAY = 24 * 60 * 60 * 1000;

/** Week number counting from a Monday, so streaks are weekly (kinder for busy parents than daily). */
function weekIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d);
  // 1970-01-05 was a Monday.
  return Math.floor((utc - Date.UTC(1970, 0, 5)) / (7 * DAY));
}

export function monthCount(log: LogEntry[], today = todayStr()): number {
  const month = today.slice(0, 7);
  return log.filter((e) => e.date.startsWith(month)).length;
}

/** Consecutive weeks with at least one activity, ending this week (or last week, so it doesn't reset on Monday). */
export function weekStreak(log: LogEntry[], today = todayStr()): number {
  const weeks = new Set(log.map((e) => weekIndex(e.date)));
  let w = weekIndex(today);
  if (!weeks.has(w)) w -= 1;
  let streak = 0;
  while (weeks.has(w)) {
    streak++;
    w--;
  }
  return streak;
}

export function badges(log: LogEntry[], stats: Stats): Badge[] {
  const skillsDone = new Set<Skill>();
  let nature = 0;
  for (const e of log) {
    const a = activityById.get(e.activityId);
    if (!a) continue;
    a.skills.forEach((s) => skillsDone.add(s));
    if (a.skills.includes('nature')) nature++;
  }
  return [
    { id: 'first', icon: '🌱', label: 'badge_first', earned: log.length >= 1 },
    { id: 'five', icon: '🌻', label: 'badge_five', earned: log.length >= 5 },
    { id: 'nature', icon: '🐞', label: 'badge_nature', earned: nature >= 3 },
    { id: 'explorer', icon: '🧭', label: 'badge_explorer', earned: stats.goThereTaps >= 3 },
    { id: 'rainbow', icon: '🌈', label: 'badge_rainbow', earned: skillsDone.size >= 5 },
    { id: 'ten', icon: '🌳', label: 'badge_ten', earned: log.length >= 10 },
  ];
}
