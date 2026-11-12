import { useEffect, useRef, useState } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { mobileCopy } from '@/foundation/i18n/mobileCopy';

// Passive gesture observation; document overscroll-y containment prevents the
// browser refresh. Never capture multi-touch, input, layers or nested scrollers.
export default function RefreshControl({ language, refresh, loading, error, disabled = false, showButton = true }) {
  const anchor = useRef(null), pending = useRef(false), latest = useRef(null);
  const [distance, setDistance] = useState(0);
  const invoke = async () => {
    if (pending.current || disabled || loading) return;
    pending.current = true;
    try { await refresh(); } finally { pending.current = false; }
  };
  latest.current = { invoke, disabled, loading };
  useEffect(() => {
    const viewport = anchor.current?.closest('.shinka-viewport');
    // The artwork header is part of the route's touch surface.
    const surface = viewport?.closest('.shinka-route-clip') || viewport;
    if (!surface || !CSS.supports('overscroll-behavior-y', 'contain')) return;
    let start = null, pulled = 0;
    const blocked = target => latest.current.disabled || latest.current.loading || pending.current ||
      document.querySelector('dialog[open], [data-shinka-layer], [role="menu"]') ||
      target.closest('input,select,textarea,button,a,[role="grid"],[contenteditable="true"]');
    const reset = () => { start = null; pulled = 0; setDistance(0); };
    const begin = e => {
      if (e.touches.length !== 1 || window.scrollY > 0 || blocked(e.target)) return reset();
      for (let el = e.target; el && el !== surface; el = el.parentElement) {
        if (el.scrollHeight > el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY)) return reset();
      }
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const move = e => {
      if (!start) return;
      if (e.touches.length !== 1 || blocked(e.target) || window.scrollY > 0) return reset();
      const dx = e.touches[0].clientX - start.x, dy = e.touches[0].clientY - start.y;
      if (Math.abs(dx) > 24 || dy < 0) return reset();
      pulled = Math.min(96, dy); setDistance(pulled);
    };
    const end = () => { const ready = pulled >= 72; reset(); if (ready) void latest.current.invoke(); };
    surface.addEventListener('touchstart', begin, { passive: true });
    surface.addEventListener('touchmove', move, { passive: true });
    surface.addEventListener('touchend', end, { passive: true });
    surface.addEventListener('touchcancel', reset, { passive: true });
    return () => { surface.removeEventListener('touchstart', begin); surface.removeEventListener('touchmove', move); surface.removeEventListener('touchend', end); surface.removeEventListener('touchcancel', reset); };
  }, []);
  const t = key => mobileCopy(key, language);
  return <div ref={anchor} className={showButton || distance || error ? "shinka-refresh" : "hidden"} data-refresh-control aria-busy={loading}>
    {showButton && <ShinkaButton variant="ghost" onClick={invoke} disabled={disabled || loading}>{t(loading ? 'refreshing' : 'refresh')}</ShinkaButton>}
    <span role="status" aria-live="polite">{distance ? t(distance >= 72 ? 'release' : 'pull') : error ? t('refreshError') : ''}</span>
  </div>;
}
