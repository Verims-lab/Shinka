// Read only the committed probe subtree. No account, URL query, token or product data.
/** @param {Element|null} root */
export function inspectAuthShell(root) {
  const screen=root?.querySelector('[data-onboarding-state]')?.getAttribute('data-onboarding-state')??null;
  const shell=root?.querySelector('[data-auth-shell]'),container=root?.querySelector('[data-probe-root]')?.firstElementChild;
  let geometry=null,inView=null;
  if(shell&&container){
    const buttons=Array.from(shell.querySelectorAll('[data-provider]')),win=root.ownerDocument.defaultView,style=win.getComputedStyle(container);
    const controls=[root.querySelector('#age-declaration')?.labels?.[0],...buttons].filter(Boolean).map(el=>el.getBoundingClientRect());
    geometry={providers:buttons.map(b=>b.getAttribute('data-provider')).sort().join(),heights:buttons.map(b=>b.getBoundingClientRect().height),padding:[style.paddingLeft,style.paddingRight],passwords:root.querySelectorAll('input[type="password"]').length,ageChecked:root.querySelector('input')?.checked};
    // Real running-app evidence: the 18+ declaration and both providers are inside the
    // visible viewport, not merely present in the DOM.
    inView=controls.length===3&&controls.every(r=>r.top>=-0.5&&r.left>=-0.5&&r.bottom<=win.innerHeight+0.5&&r.right<=win.innerWidth+0.5);
  }
  const rendered=!!root?.isConnected&&screen==='UNAUTHENTICATED_SIGN_IN'&&!!geometry&&geometry.heights.length===2&&geometry.heights.every(h=>h>0)&&container.getBoundingClientRect().width>0;
  return {screen,geometry,inView,rendered};
}