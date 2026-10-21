import { useEffect, useRef } from 'react';

// A same-URL entry exists only while a layer is open. No root sentinel, URL data,
// key emulation or native-host claim. Back dismisses before page navigation.
export function useLayerHistory(open, onDismiss, target = undefined) {
  const latest = useRef(onDismiss), leave = useRef(null);
  latest.current = onDismiss;
  useEffect(() => {
    if (!open) return;
    const win = target?.current?.ownerDocument.defaultView || window;
    const { history, location } = win;
    // Non-navigable about:blank component fixtures have no application history.
    if (!/^https?:$/.test(location.protocol) || (win.frameElement && !win.frameElement.getAttribute('src'))) return;
    const token = crypto.randomUUID();
    const previous = history.state;
    history.pushState({ ...previous, idx: (previous?.idx || 0) + 1, shinkaLayer: token }, '', location.href);
    let consumed = false, afterBack = null;
    leave.current = next => { afterBack = next; history.back(); };
    const back = () => {
      if (history.state?.shinkaLayer === token) return;
      consumed = true;
      latest.current();
      const next = afterBack; afterBack = null; next?.();
    };
    win.addEventListener('popstate', back);
    return () => {
      leave.current = null; afterBack = null;
      win.removeEventListener('popstate', back);
      if (!consumed && history.state?.shinkaLayer === token) history.back();
    };
  }, [open, target]);
  return next => { if (leave.current) leave.current(next); else { latest.current(); next(); } };
}
