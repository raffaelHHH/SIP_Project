import { useEffect } from 'react';
import BottomNav, { type Tab } from './components/BottomNav';
import { match, usePath } from './router';
import { useStore } from './lib/store';
import Onboarding from './screens/Onboarding';
import Nearby from './screens/Nearby';
import SpotDetail from './screens/SpotDetail';
import Activities from './screens/Activities';
import ActivityDetail from './screens/ActivityDetail';
import Saved from './screens/Saved';
import Help from './screens/Help';
import TeamStats from './screens/TeamStats';
import AreaPicker from './screens/AreaPicker';

function route(path: string): { tab: Tab; el: React.ReactNode } {
  let p: Record<string, string> | null;
  if ((p = match('/spot/:id', path))) return { tab: 'nearby', el: <SpotDetail id={p.id} /> };
  if ((p = match('/activity/:id', path))) return { tab: 'activities', el: <ActivityDetail id={p.id} /> };
  if (path === '/area') return { tab: 'nearby', el: <AreaPicker /> };
  if (path === '/activities') return { tab: 'activities', el: <Activities /> };
  if (path === '/saved') return { tab: 'saved', el: <Saved /> };
  if (path === '/help') return { tab: 'help', el: <Help /> };
  if (path === '/team') return { tab: 'help', el: <TeamStats /> };
  return { tab: 'nearby', el: <Nearby /> };
}

export default function App() {
  const path = usePath();
  const onboarded = useStore((s) => s.prefs.onboarded);
  const lang = useStore((s) => s.prefs.lang);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
  }, [lang]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  if (!onboarded) {
    return (
      <div className="app">
        <Onboarding />
      </div>
    );
  }

  const { tab, el } = route(path);
  return (
    <div className="app">
      <main key={path}>{el}</main>
      <BottomNav active={tab} />
    </div>
  );
}
