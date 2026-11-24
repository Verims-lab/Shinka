import { House, CalendarDays, Moon } from 'lucide-react';
import { BOTTOM_NAV } from '@/foundation/uiContract';
import { t } from '@/foundation/i18n/strings';
import { dailyCopy } from '@/foundation/i18n/dailyCopy';
import { Link, useInRouterContext } from 'react-router-dom';
import { useLayoutEffect, useRef } from 'react';
import { useNavigationGeometry } from '@/features/mobile/NavigationGeometryContext';
import { createNavigationInsetResolver } from '@/features/mobile/navigationInset';
const ICONS = { House, CalendarDays, Moon };
// Re-pressing the active tab returns to its root: tabs have no sub-routes, so
// that means scrolling to top without a duplicate history entry. In-page
// drafts and unresolved operations are never discarded by this gesture.
export const reselectTab = event => { event.preventDefault(); window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); };
export default function ProductNavigation({ current, language }) {
  const inRouter = useInRouterContext();
  const navigation = useNavigationGeometry();
  const space = useRef(null), dock = useRef(null), inset = useRef(null), bar = useRef(null);
  useLayoutEffect(() => {
    const element = dock.current, placeholder = space.current, viewport = window.visualViewport;
    const resolveInset = navigation?.resolveInset || createNavigationInsetResolver();
    const android = /\bAndroid\b/i.test(navigator.userAgent), topLevel = window === window.top;
    const browserMode = matchMedia('(display-mode: browser)');
    const reserve = () => {
      // Retained hidden tabs keep their last measured space for scroll restore.
      if (!element.getClientRects().length) return;
      const bounds = element.getBoundingClientRect();
      const height = `${bounds.height + Math.max(0, document.documentElement.clientHeight - bounds.bottom)}px`;
      placeholder.style.height = height;
      placeholder.closest('.shinka-safe-shell')?.style.setProperty('--shinka-nav-height', height);
    };
    const align = () => {
      if (!element.getClientRects().length) return;
      const before = element.getBoundingClientRect(), paint = bar.current.getBoundingClientRect();
      const css = getComputedStyle(element), root = getComputedStyle(document.documentElement);
      const dockPadding = parseFloat(css.paddingBottom), cssBottom = parseFloat(css.bottom);
      // The browser may already move fixed content when its viewport shrinks.
      // Measure this dock's native CSS anchor instead of applying innerHeight's
      // difference a second time. Pinch zoom keeps the browser's own behavior.
      element.style.bottom = '0px';
      const nativeBottom = element.getBoundingClientRect().bottom;
      const visibleBottom = viewport?.scale === 1 ? Math.min(nativeBottom, viewport.height + viewport.offsetTop) : nativeBottom;
      const covered = viewport?.scale === 1 ? Math.max(0, document.documentElement.clientHeight - visibleBottom) : 0;
      const policy = resolveInset({ android, topLevel, browserMode:browserMode.matches, scale:viewport?.scale,
        width:document.documentElement.clientWidth, screenWidth:screen.availWidth, screenHeight:screen.availHeight,
        nativeBottom, layoutBottom:document.documentElement.clientHeight, visualBottom:viewport ? visibleBottom : NaN,
        safeBottom:parseFloat(root.getPropertyValue('--safe-bottom')), declaredConsumed:parseFloat(root.getPropertyValue('--shinka-native-consumed-bottom')) || 0,
        dockBottom:before.bottom, barBottom:paint.bottom, dockPadding, cssBottom, pixelRatio:devicePixelRatio });
      placeholder.style.setProperty('--shinka-viewport-consumed-bottom', `${policy.consumed}px`);
      element.dataset.insetPolicy = policy.reason;
      element.style.setProperty('--shinka-viewport-bottom', `${Math.max(0, nativeBottom - visibleBottom)}px`);
      element.style.setProperty('--shinka-viewport-occlusion', `${covered}px`);
      element.style.removeProperty('bottom');
      reserve();
      navigation?.notify();
    };
    const unregister = navigation?.register({ nav:bar.current, dock:element, placeholder });
    align();
    const observer = new ResizeObserver(align);
    observer.observe(element, { box: 'border-box' });
    // Position changes do not resize the bar. Observe CSS viewport/inset size
    // separately, including WebKit's clientHeight update after resize events.
    observer.observe(inset.current, { box: 'border-box' });
    const hostInsets = new MutationObserver(align);
    hostInsets.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    window.addEventListener('resize', align);
    browserMode.addEventListener('change', align);
    viewport?.addEventListener('resize', align);
    viewport?.addEventListener('scroll', align);
    return () => {
      observer.disconnect();
      hostInsets.disconnect();
      unregister?.();
      window.removeEventListener('resize', align);
      browserMode.removeEventListener('change', align);
      viewport?.removeEventListener('resize', align);
      viewport?.removeEventListener('scroll', align);
    };
  }, [navigation]);
  return <div ref={space} className="shinka-nav-safe-area">
    <span ref={inset} className="shinka-nav-inset-probe" aria-hidden="true" />
    <div ref={dock} className="shinka-nav-dock">
    <nav ref={bar} aria-label={dailyCopy('navigation', language)} className="shinka-product-nav grid grid-cols-3 border-t border-shinka-line bg-shinka-white">
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
