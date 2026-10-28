import { sectionBackground } from '@/foundation/sectionBackgrounds';

// The single background owner for a rendered app section. Fixed to the large
// viewport so scrolling, page length and the mobile keyboard never resize it.
// Decorative only: hidden from assistive tech and never intercepts input.
// An unknown/unresolved section renders the neutral ivory base (no image).
export default function SectionBackdrop({ section }) {
  const background = sectionBackground(section);
  return <div aria-hidden="true" className="shinka-section-backdrop" data-section-backdrop={background ? section : 'neutral'}
    style={background ? /** @type {import('react').CSSProperties} */ ({ '--section-image': `url("${background.url}")`, '--section-focus-y': background.focusY }) : undefined}/>;
}