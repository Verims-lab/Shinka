import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { createCalendarController } from './calendarController';
import { calendarInvoke } from '@/services/calendarService';
import { useTabVisibility } from '@/hooks/useTabVisibility';
export function useCalendar(request = calendarInvoke, active = true) {
  const controller = useMemo(() => createCalendarController(request), [request]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  // Tab return shares the same bounded background read and preserves drafts.
  const { visible } = useTabVisibility(active, () => { controller.refresh({ background: true }); });
  useEffect(() => {
    controller.load();
    const refresh = () => { if (visible()) controller.refresh({ background: true }); };
    const online = () => { controller.connectionRestored(); refresh(); };
    const privacy = () => { controller.invalidate(); if (visible()) controller.load(); };
    const offline = () => { controller.connectionLost(); };
    const ended = () => controller.endSession();
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener('shinka-session-ended', ended);
    window.addEventListener('shinka-health-access-changed', privacy);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer); controller.dispose();
      window.removeEventListener('focus', refresh); window.removeEventListener('online', online);
      window.removeEventListener('offline', offline); window.removeEventListener('shinka-session-ended', ended); window.removeEventListener('shinka-health-access-changed', privacy);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [controller, visible]);
  return { ...state, controller };
}