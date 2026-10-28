import { useEffect, useMemo, useRef } from 'react';
// A kept-alive product tab that is not on screen counts as "hidden": the
// existing visibility gates then skip polling/refresh exactly like a
// backgrounded document. `onShown` runs when the tab becomes active again.
export function useTabVisibility(active = true, onShown = () => {}) {
  const ref = useRef(active); ref.current = active;
  const shown = useRef(onShown); shown.current = onShown;
  const visible = useMemo(() => () => ref.current && document.visibilityState === 'visible', []);
  const doc = useMemo(() => ({
    get visibilityState() { return visible() ? 'visible' : 'hidden'; },
    addEventListener: (type, fn) => document.addEventListener(type, fn),
    removeEventListener: (type, fn) => document.removeEventListener(type, fn),
  }), [visible]);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } if (active) shown.current(); }, [active]);
  return { visible, doc };
}