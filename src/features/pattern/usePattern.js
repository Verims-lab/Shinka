import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { patternRequest } from '@/services/patternService';
import { createPatternController } from './patternController';
import { bindPatternLifecycle, PATTERN_RUNTIME } from './patternLifecycle';
export function usePattern(request = patternRequest, runtime = PATTERN_RUNTIME) {
  const controller = useMemo(() => createPatternController(request, runtime.now), [request, runtime]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => bindPatternLifecycle(controller, runtime), [controller, runtime]);
  return { ...state, controller };
}
