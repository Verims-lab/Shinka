import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { createCalendarController } from './calendarController';
import { calendarRequest } from '@/services/calendarService';
export function useCalendar(request = calendarRequest) {
  const controller = useMemo(() => createCalendarController(request), [request]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    controller.load();
    const refresh = () => { controller.invalidate(); if (document.visibilityState === 'visible') controller.load(); };
    const offline = () => { controller.invalidate(); };
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', offline);
    window.addEventListener('shinka-health-access-changed', refresh);
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
