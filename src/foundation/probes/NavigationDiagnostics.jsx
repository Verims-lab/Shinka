import { useEffect, useState } from 'react';
import { BUILD_MARKER } from '@/foundation/buildMarker';
import { useNavigationGeometry } from '@/features/mobile/NavigationGeometryContext';

// Explicitly opted-in, local display only: no SDK, storage, network, URL,
// identity, page text or form values. Native window bounds are not web APIs.
export function readNavigationGeometry(elements = null) {
  const root = document.documentElement, rootStyle = getComputedStyle(root);
  const { nav, dock, placeholder } = elements || {};
  const bounds = element => {
    if (!element) return null;
    const { top, right, bottom, left, width, height } = element.getBoundingClientRect();
    return { top, right, bottom, left, width, height };
  };
  const pixels = value => Number.parseFloat(value) || 0;
  const dockStyle = dock ? getComputedStyle(dock) : null;
  const viewport = window.visualViewport;
  const visual = viewport ? { width:viewport.width, height:viewport.height, offsetTop:viewport.offsetTop, offsetLeft:viewport.offsetLeft, scale:viewport.scale } : null;
  const visibleBottom = viewport?.scale === 1 ? Math.min(root.clientHeight, viewport.height + viewport.offsetTop) : root.clientHeight;
  const bar = bounds(nav), outer = bounds(dock);
  return {
    build: BUILD_MARKER,
    measurementState: nav ? 'MEASURED' : 'WAITING_FOR_NAVIGATION',
    navigationSource: nav ? 'REGISTERED_ELEMENT_REFERENCES' : null,
    physicalVerification: 'NOT_RUN', nativeWindowBounds: 'NOT_OBSERVABLE_FROM_WEB',
    viewport: { innerWidth, innerHeight, clientWidth:root.clientWidth, clientHeight:root.clientHeight, outerWidth, outerHeight, devicePixelRatio, visual, visibleBottom },
    screen: { width:screen.width, height:screen.height, availWidth:screen.availWidth, availHeight:screen.availHeight },
    standalone: matchMedia('(display-mode: standalone)').matches,
    viewportFit: document.querySelector('meta[name="viewport"]')?.getAttribute('content')?.match(/viewport-fit\s*=\s*(\w+)/)?.[1] || 'auto',
    safeBottom: pixels(rootStyle.getPropertyValue('--safe-bottom')),
    nativeConsumedBottomDeclaration: pixels(rootStyle.getPropertyValue('--shinka-native-consumed-bottom')),
    nativeConsumptionVerified: false,
    viewportConsumedBottom: dockStyle ? pixels(dockStyle.getPropertyValue('--shinka-viewport-consumed-bottom')) : null,
    insetPolicy: dock?.dataset.insetPolicy || null,
    bar, dock:outer, placeholder:bounds(placeholder),
    dockPaddingBottom: dockStyle ? pixels(dockStyle.paddingBottom) : null, dockBottomInset:dockStyle ? pixels(dockStyle.bottom) : null,
    residualViewportOffset: dockStyle ? pixels(dockStyle.getPropertyValue('--shinka-viewport-bottom')) : null,
    viewportOcclusion: dockStyle ? pixels(dockStyle.getPropertyValue('--shinka-viewport-occlusion')) : null,
    visibleBottomToBar: bar ? visibleBottom-bar.bottom : null,
    visibleBottomToDock: outer ? visibleBottom-outer.bottom : null,
    dockToBar: outer && bar ? outer.bottom-bar.bottom : null,
  };
}

export default function NavigationDiagnostics() {
  const navigation = useNavigationGeometry();
  const [open, setOpen] = useState(true), [sample, setSample] = useState(() => readNavigationGeometry(navigation?.current()));
  useEffect(() => {
    if (!open) return;
    let frame = 0, owner = null;
    const refresh = () => {
      const nextOwner = navigation?.current()?.placeholder.parentElement || null;
      if (nextOwner !== owner) {
        observer.disconnect(); owner = nextOwner;
        if (owner) observer.observe(owner, { box:'border-box' });
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readNavigationGeometry(navigation?.current());
        setSample(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      });
    };
    const observer = new ResizeObserver(refresh);
    const unsubscribe = navigation?.subscribe(refresh), viewport = window.visualViewport;
    refresh();
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, { passive:true });
    viewport?.addEventListener('resize', refresh);
    viewport?.addEventListener('scroll', refresh);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); unsubscribe?.();
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh);
      viewport?.removeEventListener('resize', refresh);
      viewport?.removeEventListener('scroll', refresh);
    };
  }, [navigation, open]);
  if (!open) return null;
  return <aside data-navigation-diagnostics aria-label="Navigation geometry diagnostic" style={{position:'fixed',zIndex:1000,top:'max(8px, env(safe-area-inset-top, 0px))',right:'max(8px, env(safe-area-inset-right, 0px))',width:'min(350px, calc(100vw - 16px))',maxHeight:'50dvh',display:'flex',flexDirection:'column',overflow:'hidden',padding:12,background:'#fff',color:'#111',border:'1px solid #777',font:'12px/1.4 monospace'}}>
    <div style={{display:'flex',gap:8,flexShrink:0}}>
      <button type="button" style={{minHeight:44,padding:8}} onClick={()=>setSample(readNavigationGeometry(navigation?.current()))}>Ölçümü yenile</button>
      <button type="button" style={{minHeight:44,padding:8}} onClick={()=>setOpen(false)}>Kapat</button>
    </div>
    <pre tabIndex={0} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',overflow:'auto',minHeight:0,marginBottom:0}}>{JSON.stringify(sample,null,2)}</pre>
  </aside>;
}
