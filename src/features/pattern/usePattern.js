import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { patternRequest } from '@/services/patternService';
import { createPatternController } from './patternController';
export function usePattern(request = patternRequest) {
  const controller = useMemo(() => createPatternController(request), [request]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    controller.refresh();
    const refresh = () => { if (document.visibilityState === 'visible') controller.refresh(); else controller.invalidate(); };
    const offline = () => controller.invalidate('NETWORK');
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh); window.addEventListener('online', refresh);
    window.addEventListener('offline', offline); window.addEventListener('shinka-health-access-changed', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer); controller.dispose();
      window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh);
      window.removeEventListener('offline', offline); window.removeEventListener('shinka-health-access-changed', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [controller]);
  return { ...state, controller };
}
