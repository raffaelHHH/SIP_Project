import { useT } from '../i18n';
import { neighbourhoods } from '../lib/data';

export default function AreaList({ selected, onPick }: { selected?: string | null; onPick: (id: string) => void }) {
  const { p } = useT();
  return (
    <div className="stack">
      {neighbourhoods.map((n) => (
        <button
          key={n.id}
          className={'btn btn-big' + (selected === n.id ? ' btn-primary' : '')}
          aria-pressed={selected === n.id}
          onClick={() => onPick(n.id)}
        >
          {p(n.name)}
        </button>
      ))}
    </div>
  );
}
