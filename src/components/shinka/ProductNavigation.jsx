import { House, CalendarDays, Moon } from 'lucide-react';
import { BOTTOM_NAV } from '@/foundation/uiContract';
import { t } from '@/foundation/i18n/strings';
import { dailyCopy } from '@/foundation/i18n/dailyCopy';
import { Link, useInRouterContext } from 'react-router-dom';
const ICONS = { House, CalendarDays, Moon };
// Re-pressing the active tab returns to its root: tabs have no sub-routes, so
// that means scrolling to top without a duplicate history entry. In-page
// drafts and unresolved operations are never discarded by this gesture.
export const reselectTab = event => { event.preventDefault(); window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); };
export default function ProductNavigation({ current, language }) {
  const inRouter = useInRouterContext();
  return <nav aria-label={dailyCopy('navigation', language)} className="shinka-product-nav grid grid-cols-3 border-t border-shinka-line bg-shinka-white">
    {BOTTOM_NAV.map(item => {
      const Icon = ICONS[item.component], active = item.key === current;
      const content = <><Icon className="h-5 w-5" aria-hidden="true"/><span className="min-w-0 max-w-full break-words text-center">{t(item.labelKey, language)}</span></>;
      const classes = 'min-h-11 min-w-0 px-1 py-px flex flex-col items-center justify-center gap-1 text-shinka-caption text-shinka-ink focus-visible:outline-2 focus-visible:outline-shinka-plum';
      const destination = `${item.key === 'home' ? '/' : `/${item.key}`}?lang=${language}`;
      const onClick = active ? reselectTab : undefined;
      return inRouter ? <Link key={item.key} to={destination} state={{ productTab: true }} onClick={onClick} aria-current={active ? 'page' : undefined} className={classes}>{content}</Link> :
          <a key={item.key} href={destination} onClick={onClick} aria-current={active ? 'page' : undefined} className={classes}>{content}</a>;
    })}
  </nav>;
}