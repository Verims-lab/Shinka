import { useCallback, useEffect, useRef, useState } from 'react';
import { dailyMessageInvoke, isDailyPrivacyError } from '@/services/dailyMessageService';
import { productFailureEvidence, PRODUCT_READ_MS } from '@/services/productReadTransport';
import { useTabVisibility } from '@/hooks/useTabVisibility';
const localContext = () => {
  let zone = ''; try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Backend resolves persisted fallback. */ }
  return `${new Date().toDateString()}/${zone}`;
};
export function useDailyMessage(request = dailyMessageInvoke, initial = null, readContext = localContext, active = true, now = Date.now) {
  const [value, setValue] = useState(initial), [error, setError] = useState(null), [loading, setLoading] = useState(!initial);
  const [diagnostic, setDiagnostic] = useState(null);
  const retryAt=useRef(-Infinity), passiveAt=useRef(-Infinity), offline=useRef(false);
  const generation = useRef(0), pending = useRef(null), context = useRef(readContext());
  const ended = useRef(false), failed = useRef(false);
  failed.current = !!error;
  const reload = useCallback(async ({ background = false } = {}) => {
    if (ended.current || offline.current || now() < retryAt.current) return;
    if (pending.current && now()-pending.current.started < PRODUCT_READ_MS) return;
    if (background && now()-passiveAt.current < 1000) return;
    if (background) passiveAt.current=now();
    pending.current?.abort.abort();
    const task={abort:new AbortController(),started:now()};pending.current=task;
    const ticket = ++generation.current;
    setLoading(true); setError(null); setDiagnostic(null);
    if (context.current !== readContext()) setValue(null);
    try {
      // The browser context only invalidates a response; the backend still owns the day key.
      for (let attempt = 0; attempt < 2; attempt++) {
        const requestedContext = readContext();
        const result = await request({signal:task.abort.signal,timeoutMs:Math.max(1,PRODUCT_READ_MS-(now()-task.started))});
        if (ticket !== generation.current) return;
        if(now()-task.started>=PRODUCT_READ_MS)throw Object.assign(new Error(),{code:'TIMEOUT'});
        if (requestedContext !== readContext()) continue;
        if (!result?.persisted || !result?.daily?.id || result.state !== 'ACTIVE_EXISTING_USER') throw Object.assign(new Error(), { code: 'DAILY_READBACK_CONFLICT' });
        context.current = requestedContext; setValue(result); return;
      }
      throw Object.assign(new Error(), { code: 'DAILY_CONTEXT_CHANGED' });
    } catch (e) { if (ticket === generation.current) {
      if (isDailyPrivacyError(e.code)) setValue(null);
      retryAt.current=now()+(e.retryAfterMs||0);setDiagnostic(productFailureEvidence(e));
      setError(e.code || 'DAILY_OPERATION_FAILED');
    } }
    finally { if (ticket === generation.current) { pending.current = null; setLoading(false); } }
  }, [request, readContext, now]);
  const { visible } = useTabVisibility(active, () => { if (!ended.current) void reload({background:true}); });
  useEffect(() => {
    ended.current = false;
    if (!initial && visible()) reload();
    const checkDay = () => { if (visible() && (failed.current || context.current !== readContext() || (pending.current && now()-pending.current.started>=PRODUCT_READ_MS))) reload({background:true}); };
    const invalidate = () => { generation.current++; pending.current?.abort.abort(); pending.current = null; retryAt.current=passiveAt.current=-Infinity;setValue(null); setError(null); setDiagnostic(null);setLoading(false); };
    const endSession = () => { ended.current = true; invalidate(); setError('AUTH_REQUIRED'); };
    const privacy = () => { invalidate(); if (visible()) void reload(); };
    const online = () => {offline.current=false;checkDay();};
    const lost = () => {offline.current=true;};
    const timer = setInterval(checkDay, 30000);
    window.addEventListener('online',online);window.addEventListener('offline',lost);
    window.addEventListener('focus', checkDay); document.addEventListener('visibilitychange', checkDay);
    window.addEventListener('shinka-health-access-changed', privacy); window.addEventListener('shinka-session-ended', endSession);
    return () => { generation.current++; pending.current?.abort.abort(); pending.current = null; window.removeEventListener('online',online);window.removeEventListener('offline',lost); ended.current = true; clearInterval(timer); window.removeEventListener('focus', checkDay); document.removeEventListener('visibilitychange', checkDay); window.removeEventListener('shinka-health-access-changed', privacy); window.removeEventListener('shinka-session-ended', endSession); };
  }, [reload, initial, readContext, visible, now]);
  return { value, error, loading, reload, diagnostic };
}