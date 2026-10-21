import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { createCalendarController } from './calendarController';
import { calendarRequest } from '@/services/calendarService';
export function useCalendar(request = calendarRequest) {
  const controller = useMemo(() => createCalendarController(request), [request]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    controller.load();
    const refresh = () => { if (document.visibilityState === 'visible') controller.refresh(); };
    const privacy = () => { controller.invalidate(); if (document.visibilityState === 'visible') controller.load(); };
    const offline = () => { controller.connectionLost(); };
    const ended = () => controller.invalidate();
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', offline);
    window.addEventListener('shinka-session-ended', ended);
    window.addEventListener('shinka-health-access-changed', privacy);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer); controller.dispose();
      window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh);
      window.removeEventListener('offline', offline); window.removeEventListener('shinka-session-ended', ended); window.removeEventListener('shinka-health-access-changed', privacy);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [controller]);
  return { ...state, controller };
}
