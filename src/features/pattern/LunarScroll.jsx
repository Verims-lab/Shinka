// Safari does not consistently scroll a focused non-control with arrow keys.
// Explicit keyboard navigation matches the same native touch/trackpad region.
export default function LunarScroll({ label, children }) {
  const onKeyDown = event => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    const region = event.currentTarget, step = region.clientWidth * .6;
    const positions = { ArrowLeft: region.scrollLeft - step, ArrowRight: region.scrollLeft + step, Home: 0, End: region.scrollWidth };
    if (!(event.key in positions)) return;
    event.preventDefault();
    region.scrollLeft = positions[event.key];
  };
  return <div className="lunar-scroll" role="region" aria-label={label} tabIndex={0} onKeyDown={onKeyDown}>{children}</div>;
}
