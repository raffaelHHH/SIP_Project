import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';

const PAGE = 10;

/**
 * Shows a long list a few cards at a time so older phones don't have to draw everything at once.
 * More cards load automatically when the user scrolls near the end, or when they tap "Show more".
 * `resetKey` should change when filters change, to start again from the top.
 */
export function useLoadMore<T>(items: T[], resetKey: string) {
  const [count, setCount] = useState(PAGE);
  const [key, setKey] = useState(resetKey);
  if (key !== resetKey) {
    setKey(resetKey);
    setCount(PAGE);
  }
  return {
    visible: items.slice(0, count),
    remaining: Math.max(0, items.length - count),
    more: () => setCount((c) => c + PAGE),
  };
}

export default function LoadMore({ remaining, onMore }: { remaining: number; onMore: () => void }) {
  const { t } = useT();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || remaining === 0 || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onMore();
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [remaining, onMore]);

  if (remaining === 0) return null;
  return (
    <button ref={ref} className="btn btn-big" onClick={onMore}>
      ⬇️ {t('showMore', { n: remaining })}
    </button>
  );
}
