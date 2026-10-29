import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { patternRequest } from '@/services/patternService';
import { createPatternController } from './patternController';
import { bindPatternLifecycle, PATTERN_RUNTIME } from './patternLifecycle';
import { useTabVisibility } from '@/hooks/useTabVisibility';
export function usePattern(request = patternRequest, runtime = PATTERN_RUNTIME, active = true) {
  const controller = useMemo(() => createPatternController(request, runtime.now), [request, runtime]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const { doc } = useTabVisibility(active, () => { void controller.refresh({ background: true }); });
  useEffect(() => bindPatternLifecycle(controller, runtime, window, doc), [controller, runtime, doc]);
  return { ...state, controller };
}
