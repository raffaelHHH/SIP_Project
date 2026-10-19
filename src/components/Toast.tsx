import { useCallback, useEffect, useState } from 'react';

export function useToast(ms = 2200) {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), ms);
    return () => clearTimeout(id);
  }, [message, ms]);
  const show = useCallback((m: string) => setMessage(m), []);
  const el = message ? (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  ) : null;
  return { show, el };
}
