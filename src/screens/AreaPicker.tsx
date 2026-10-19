import { useState } from 'react';
import AreaList from '../components/AreaList';
import { useT } from '../i18n';
import { setPrefs, useStore } from '../lib/store';
import { requestPosition } from '../hooks/useOrigin';
import { goBack } from '../router';

export default function AreaPicker() {
  const { t } = useT();
  const mode = useStore((s) => s.prefs.locationMode);
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);

  const askGps = async () => {
    setAsking(true);
    try {
      const pos = await requestPosition();
      setPrefs({ locationMode: 'gps', lastPosition: pos });
      goBack();
    } catch {
      setDenied(true);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => goBack()} aria-label={t('back')}>
          ←
        </button>
        <h1>{t('chooseArea')}</h1>
      </div>
      <div className="stack">
        {!denied && (
          <button
            className={'btn btn-big' + (mode === 'gps' ? ' btn-primary' : '')}
            onClick={askGps}
            disabled={asking}
          >
            📍 {asking ? t('obLocating') : t('myLocation')}
          </button>
        )}
        {denied && <p className="muted">{t('obLocationDenied')}</p>}
        <AreaList
          selected={mode}
          onPick={(id) => {
            setPrefs({ locationMode: id });
            goBack();
          }}
        />
      </div>
    </div>
  );
}
