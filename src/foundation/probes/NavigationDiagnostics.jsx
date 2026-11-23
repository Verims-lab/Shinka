import { useState } from 'react';
import { BUILD_MARKER } from '@/foundation/buildMarker';

// Explicitly opted-in, local display only: no SDK, storage, network, URL,
// identity, page text or form values. Native window bounds are not web APIs.
export function readNavigationGeometry() {
  const root = document.documentElement, rootStyle = getComputedStyle(root);
  const nav = Array.from(document.querySelectorAll('nav.shinka-product-nav')).find(element => element.getClientRects().length);
  const bounds = element => {
    if (!element) return null;
    const { top, right, bottom, left, width, height } = element.getBoundingClientRect();
    return { top, right, bottom, left, width, height };
  };
  const pixels = value => Number.parseFloat(value) || 0;
  const dock = nav?.closest('.shinka-nav-dock'), placeholder = nav?.closest('.shinka-nav-safe-area');
  const dockStyle = dock ? getComputedStyle(dock) : null;
  const viewport = window.visualViewport;
  const visual = viewport ? { width:viewport.width, height:viewport.height, offsetTop:viewport.offsetTop, offsetLeft:viewport.offsetLeft, scale:viewport.scale } : null;
  const visibleBottom = viewport?.scale === 1 ? Math.min(root.clientHeight, viewport.height + viewport.offsetTop) : root.clientHeight;
  const bar = bounds(nav), outer = bounds(dock);
  return {
    build: BUILD_MARKER,
    physicalVerification: 'NOT_RUN', nativeWindowBounds: 'NOT_OBSERVABLE_FROM_WEB',
    viewport: { innerWidth, innerHeight, clientWidth:root.clientWidth, clientHeight:root.clientHeight, outerWidth, outerHeight, devicePixelRatio, visual, visibleBottom },
    screen: { width:screen.width, height:screen.height, availWidth:screen.availWidth, availHeight:screen.availHeight },
    standalone: matchMedia('(display-mode: standalone)').matches,
    viewportFit: document.querySelector('meta[name="viewport"]')?.getAttribute('content')?.match(/viewport-fit\s*=\s*(\w+)/)?.[1] || 'auto',
    safeBottom: pixels(rootStyle.getPropertyValue('--safe-bottom')),
    nativeConsumedBottomDeclaration: pixels(rootStyle.getPropertyValue('--shinka-native-consumed-bottom')),
    nativeConsumptionVerified: false,
    bar, dock:outer, placeholder:bounds(placeholder),
    dockPaddingBottom: pixels(dockStyle?.paddingBottom), dockBottomInset:pixels(dockStyle?.bottom),
    residualViewportOffset: pixels(dockStyle?.getPropertyValue('--shinka-viewport-bottom')),
    viewportOcclusion: pixels(dockStyle?.getPropertyValue('--shinka-viewport-occlusion')),
    visibleBottomToBar: bar ? visibleBottom-bar.bottom : null,
    visibleBottomToDock: outer ? visibleBottom-outer.bottom : null,
    dockToBar: outer && bar ? outer.bottom-bar.bottom : null,
  };
}

export default function NavigationDiagnostics() {
  const [open, setOpen] = useState(true), [sample, setSample] = useState(readNavigationGeometry);
  if (!open) return null;
  return <aside data-navigation-diagnostics aria-label="Navigation geometry diagnostic" style={{position:'fixed',zIndex:1000,top:'max(8px, env(safe-area-inset-top, 0px))',right:'max(8px, env(safe-area-inset-right, 0px))',width:'min(350px, calc(100vw - 16px))',maxHeight:'50dvh',overflow:'auto',padding:12,background:'#fff',color:'#111',border:'1px solid #777',font:'12px/1.4 monospace'}}>
    <div style={{display:'flex',gap:8}}>
      <button type="button" style={{minHeight:44,padding:8}} onClick={()=>setSample(readNavigationGeometry())}>Ölçümü yenile</button>
      <button type="button" style={{minHeight:44,padding:8}} onClick={()=>setOpen(false)}>Kapat</button>
    </div>
    <pre tabIndex={0} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(sample,null,2)}</pre>
  </aside>;
}
