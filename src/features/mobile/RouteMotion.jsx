import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const tabs = new Set(['/', '/calendar', '/pattern']);
export function routeMotion(from, to, navigation, reduced) {
  if (reduced || from === to) return { opacity: [1, 1] };
  if (tabs.has(from) && tabs.has(to)) return { opacity: [0.75, 1] };
  return { opacity: [0.75, 1], x: [navigation === 'POP' ? -12 : 12, 0] };
}
// Animate the existing node, never a keyed second page / retained exit tree.
// Lazy imperative Framer import cannot remount children or delay auth guards.
export default function RouteMotion({ children }) {
  const ref = useRef(null), previous = useRef(null);
  const { pathname } = useLocation(), navigation = useNavigationType();
  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    if (!from || from === pathname) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let cancelled = false, animation;
    const stop = () => { cancelled = true; animation?.stop(); if (ref.current) { ref.current.style.opacity = '1'; ref.current.style.transform = 'none'; } };
    const changed = () => { if (media.matches) stop(); };
    if (!media.matches) void import('framer-motion').then(({ animate }) => {
      if (!cancelled && ref.current) animation = animate(ref.current, routeMotion(from, pathname, navigation, false), { duration: 0.2 });
    }).catch(stop); // Optional motion chunk failure must leave the existing route readable.
    media.addEventListener('change', changed);
    window.addEventListener('shinka-session-ended', stop);
    window.addEventListener('shinka-health-access-changed', stop);
    return () => { stop(); media.removeEventListener('change', changed); window.removeEventListener('shinka-session-ended', stop); window.removeEventListener('shinka-health-access-changed', stop); };
  }, [pathname, navigation]);
  return <div className="shinka-route-clip"><div ref={ref} data-route-motion>{children}</div></div>;
}
