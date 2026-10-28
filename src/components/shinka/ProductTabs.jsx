import { useLayoutEffect, useRef, useState } from 'react';
export const PRODUCT_TABS = Object.freeze(['home', 'calendar', 'pattern']);
// Keeps each visited bottom tab mounted (React memory only, current owner via
// the caller's key) so its scroll position, Calendar month/selection and
// drafts survive tab switches. Hidden tabs skip polling via `active`.
export default function ProductTabs({ destination, render }) {
  const [visited, setVisited] = useState(() => PRODUCT_TABS.filter(tab => tab === destination));
  if (PRODUCT_TABS.includes(destination) && !visited.includes(destination)) setVisited([...visited, destination]);
  const positions = useRef({}), current = useRef(destination);
  useLayoutEffect(() => {
    const save = () => { positions.current[current.current] = window.scrollY; };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);
  useLayoutEffect(() => {
    if (current.current === destination) return;
    current.current = destination;
    if (PRODUCT_TABS.includes(destination)) window.scrollTo(0, positions.current[destination] ?? 0);
  }, [destination]);
  return PRODUCT_TABS.filter(tab => visited.includes(tab)).map(tab =>
    <div key={tab} hidden={tab !== destination} data-product-tab={tab}>{render(tab, tab === destination)}</div>);
}