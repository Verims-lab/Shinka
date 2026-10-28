import { useCallback, useEffect, useRef, useState } from 'react';
import { dailyMessageRequest, isDailyPrivacyError } from '@/services/dailyMessageService';
import { useTabVisibility } from '@/hooks/useTabVisibility';
const localContext = () => {
  let zone = ''; try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Backend resolves persisted fallback. */ }
  return `${new Date().toDateString()}/${zone}`;
};
export function useDailyMessage(request = dailyMessageRequest, initial = null, readContext = localContext, active = true) {
  const [value, setValue] = useState(initial), [error, setError] = useState(null), [loading, setLoading] = useState(!initial);
  const generation = useRef(0), pending = useRef(false), context = useRef(readContext());
  const ended = useRef(false);
  const reload = useCallback(async () => {
    if (pending.current || ended.current) return;
    pending.current = true;
    const ticket = ++generation.current;
    setLoading(true); setError(null);
    if (context.current !== readContext()) setValue(null);
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
    } catch (e) { if (ticket === generation.current) {
      if (isDailyPrivacyError(e.code)) setValue(null);
      setError(e.code || 'DAILY_OPERATION_FAILED');
    } }
    finally { if (ticket === generation.current) { pending.current = false; setLoading(false); } }
  }, [request, readContext]);
  const latest = useRef({ value, loading }); latest.current = { value, loading };
  const { visible } = useTabVisibility(active, () => { if (!ended.current && !latest.current.value && !latest.current.loading) void reload(); else if (context.current !== readContext()) void reload(); });
  useEffect(() => {
    ended.current = false;
    if (!initial) reload();
    const checkDay = () => { if (visible() && context.current !== readContext()) reload(); };
    const invalidate = () => { generation.current++; pending.current = false; setValue(null); setError(null); setLoading(false); };
    const endSession = () => { ended.current = true; invalidate(); setError('AUTH_REQUIRED'); };
    const privacy = () => { invalidate(); if (visible()) void reload(); };
    const timer = setInterval(checkDay, 30000);
    window.addEventListener('focus', checkDay); document.addEventListener('visibilitychange', checkDay);
    window.addEventListener('shinka-health-access-changed', privacy); window.addEventListener('shinka-session-ended', endSession);
    return () => { generation.current++; pending.current = false; ended.current = true; clearInterval(timer); window.removeEventListener('focus', checkDay); document.removeEventListener('visibilitychange', checkDay); window.removeEventListener('shinka-health-access-changed', privacy); window.removeEventListener('shinka-session-ended', endSession); };
  }, [reload, initial, readContext, visible]);
  return { value, error, loading, reload };
}