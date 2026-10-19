import { useT, type StringKey } from '../i18n';
import { navigate } from '../router';

export type Tab = 'nearby' | 'activities' | 'saved' | 'help';

const tabs: { id: Tab; path: string; icon: string; label: StringKey }[] = [
  { id: 'nearby', path: '/', icon: '📍', label: 'navNearby' },
  { id: 'activities', path: '/activities', icon: '🧩', label: 'navActivities' },
  { id: 'saved', path: '/saved', icon: '❤️', label: 'navSaved' },
  { id: 'help', path: '/help', icon: '❓', label: 'navHelp' },
];

export default function BottomNav({ active }: { active: Tab }) {
  const { t } = useT();
  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="bottom-nav-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="nav-btn"
            aria-current={active === tab.id ? 'page' : undefined}
            onClick={() => navigate(tab.path)}
          >
            <span className="nav-icon" aria-hidden="true">
              {tab.icon}
            </span>
            {t(tab.label)}
          </button>
        ))}
      </div>
    </nav>
  );
}
