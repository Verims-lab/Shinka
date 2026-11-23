import { House, CalendarDays, Moon } from 'lucide-react';
import { BOTTOM_NAV } from '@/foundation/uiContract';
import { t } from '@/foundation/i18n/strings';
import { dailyCopy } from '@/foundation/i18n/dailyCopy';
import { Link, useInRouterContext } from 'react-router-dom';
import { useLayoutEffect, useRef } from 'react';
const ICONS = { House, CalendarDays, Moon };
// Re-pressing the active tab returns to its root: tabs have no sub-routes, so
// that means scrolling to top without a duplicate history entry. In-page
// drafts and unresolved operations are never discarded by this gesture.
export const reselectTab = event => { event.preventDefault(); window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); };
export default function ProductNavigation({ current, language }) {
  const inRouter = useInRouterContext();
  const space = useRef(null), dock = useRef(null);
  useLayoutEffect(() => {
    const element = dock.current, placeholder = space.current, viewport = window.visualViewport;
    let covered = 0;
    const reserve = () => {
      // Retained hidden tabs keep their last measured space for scroll restore.
      if (!element.getClientRects().length) return;
      const height = `${element.getBoundingClientRect().height + covered}px`;
      placeholder.style.height = height;
      placeholder.closest('.shinka-safe-shell')?.style.setProperty('--shinka-nav-height', height);
    };
    const align = () => {
      covered = viewport?.scale === 1 ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop) : 0;
      element.style.setProperty('--shinka-viewport-bottom', `${covered}px`);
      reserve();
    };
    align();
    const observer = new ResizeObserver(reserve);
    observer.observe(element, { box: 'border-box' });
    window.addEventListener('resize', align);
    viewport?.addEventListener('resize', align);
    viewport?.addEventListener('scroll', align);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', align);
      viewport?.removeEventListener('resize', align);
      viewport?.removeEventListener('scroll', align);
    };
  }, []);
  return <div ref={space} className="shinka-nav-safe-area">
    <div ref={dock} className="shinka-nav-dock">
    <nav aria-label={dailyCopy('navigation', language)} className="shinka-product-nav grid grid-cols-3 border-t border-shinka-line bg-shinka-white">
    {BOTTOM_NAV.map(item => {
      const Icon = ICONS[item.component], active = item.key === current;
      const content = <><Icon className="h-5 w-5" aria-hidden="true"/><span className="min-w-0 max-w-full break-words text-center">{t(item.labelKey, language)}</span></>;
      const classes = 'min-h-11 min-w-0 px-1 py-3 flex flex-col items-center justify-center gap-1 text-shinka-caption text-shinka-ink focus-visible:outline-2 focus-visible:outline-shinka-plum';
      const destination = `${item.key === 'home' ? '/' : `/${item.key}`}?lang=${language}`;
      const onClick = active ? reselectTab : undefined;
      return inRouter ? <Link key={item.key} to={destination} state={{ productTab: true }} onClick={onClick} aria-current={active ? 'page' : undefined} className={classes}>{content}</Link> :
          <a key={item.key} href={destination} onClick={onClick} aria-current={active ? 'page' : undefined} className={classes}>{content}</a>;
    })}
    </nav>
    </div>
  </div>;
}
