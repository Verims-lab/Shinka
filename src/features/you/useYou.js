import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { youRequest } from '@/services/youService';
import { createYouController } from './youController';
export function useYou(request = youRequest, onSaved = (_value) => {}, onLoaded = (_value) => {}) {
  const callback = useRef(onSaved); callback.current = onSaved;
  const loaded = useRef(onLoaded); loaded.current = onLoaded;
  const controller = useMemo(() => createYouController(request, value => callback.current(value), value => loaded.current(value)), [request]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    void controller.load();
    const invalidate = () => controller.invalidate();
    window.addEventListener('shinka-session-ended', invalidate);
    window.addEventListener('shinka-health-access-changed', invalidate);
    return () => { window.removeEventListener('shinka-session-ended', invalidate); window.removeEventListener('shinka-health-access-changed', invalidate); controller.dispose(); };
  }, [controller]);
  useEffect(() => {
    if (state.error?.field) document.getElementById(state.error.field)?.focus();
  }, [state.error]);
  return { ...state, controller };
}
