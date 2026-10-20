import { House, CalendarDays, Moon } from 'lucide-react';
import { BOTTOM_NAV } from '@/foundation/uiContract';
import { t } from '@/foundation/i18n/strings';
import { dailyCopy } from '@/foundation/i18n/dailyCopy';
import { Link, useInRouterContext } from 'react-router-dom';
const ICONS = { House, CalendarDays, Moon };
export default function ProductNavigation({ current, language }) {
  const inRouter = useInRouterContext();
  return <nav aria-label={dailyCopy('navigation', language)} className="grid grid-cols-3 border-t border-shinka-line bg-shinka-white">
    {BOTTOM_NAV.map(item => {
      const Icon = ICONS[item.component], active = item.key === current;
      const content = <><Icon className="h-5 w-5" aria-hidden="true"/>{t(item.labelKey, language)}</>;
      const classes = 'min-h-14 flex flex-col items-center justify-center gap-1 text-shinka-caption text-shinka-ink focus-visible:outline-2 focus-visible:outline-shinka-plum';
      const destination = `${item.key === 'home' ? '/' : '/calendar'}?lang=${language}`;
      return item.key === 'pattern' ? <span key={item.key} aria-disabled="true" className={classes}>{content}</span> :
        inRouter ? <Link key={item.key} to={destination} aria-current={active ? 'page' : undefined} className={classes}>{content}</Link> :
          <a key={item.key} href={destination} aria-current={active ? 'page' : undefined} className={classes}>{content}</a>;
    })}
  </nav>;
}
