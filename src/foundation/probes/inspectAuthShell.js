// Read only the committed probe subtree. No account, URL query, token or product data.
/** @param {Element|null} root */
export function inspectAuthShell(root) {
  const screen=root?.querySelector('[data-onboarding-state]')?.getAttribute('data-onboarding-state')??null;
  const shell=root?.querySelector('[data-auth-shell]'),container=root?.querySelector('[data-probe-root]')?.firstElementChild;
  let geometry=null;
  if(shell&&container){
    const buttons=Array.from(shell.querySelectorAll('[data-provider]')),win=root.ownerDocument.defaultView,style=win.getComputedStyle(container);
    geometry={providers:buttons.map(b=>b.getAttribute('data-provider')).sort().join(),heights:buttons.map(b=>b.getBoundingClientRect().height),padding:[style.paddingLeft,style.paddingRight],passwords:root.querySelectorAll('input[type="password"]').length,ageChecked:root.querySelector('input')?.checked};
  }
  const rendered=!!root?.isConnected&&screen==='UNAUTHENTICATED_SIGN_IN'&&!!geometry&&geometry.heights.length===2&&geometry.heights.every(h=>h>0)&&container.getBoundingClientRect().width>0;
  return {screen,geometry,rendered};
}

