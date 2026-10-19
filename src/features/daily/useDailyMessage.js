import { useCallback, useEffect, useRef, useState } from 'react';
import { dailyMessageRequest } from '@/services/dailyMessageService';
const localContext = () => {
  let zone = ''; try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Backend resolves persisted fallback. */ }
  return `${new Date().toDateString()}/${zone}`;
};
export function useDailyMessage(request = dailyMessageRequest, initial = null, readContext = localContext) {
  const [value, setValue] = useState(initial), [error, setError] = useState(null), [loading, setLoading] = useState(!initial);
  const generation = useRef(0), pending = useRef(false), context = useRef(readContext());
  const reload = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    const ticket = ++generation.current;
    setLoading(true); setError(null); setValue(null);
    try {
      // The browser context only invalidates a response; the backend still owns the day key.
      for (let attempt = 0; attempt < 2; attempt++) {
        const requestedContext = readContext();
        const result = await request();
        if (ticket !== generation.current) return;
        if (requestedContext !== readContext()) continue;
        if (!result?.persisted || !result?.daily?.id || result.state !== 'ACTIVE_EXISTING_USER') throw Object.assign(new Error(), { code: 'DAILY_READBACK_CONFLICT' });
        context.current = requestedContext; setValue(result); return;
      }
      throw Object.assign(new Error(), { code: 'DAILY_CONTEXT_CHANGED' });
    } catch (e) { if (ticket === generation.current) setError(e.code || 'DAILY_OPERATION_FAILED'); }
    finally { if (ticket === generation.current) { pending.current = false; setLoading(false); } }
  }, [request, readContext]);
  useEffect(() => {
    if (!initial) reload();
    const checkDay = () => { if (document.visibilityState === 'visible' && context.current !== readContext()) reload(); };
    const timer = setInterval(checkDay, 30000);
    window.addEventListener('focus', checkDay); document.addEventListener('visibilitychange', checkDay);
    return () => { generation.current++; pending.current = false; clearInterval(timer); window.removeEventListener('focus', checkDay); document.removeEventListener('visibilitychange', checkDay); };
  }, [reload, initial, readContext]);
  return { value, error, loading, reload };
}
