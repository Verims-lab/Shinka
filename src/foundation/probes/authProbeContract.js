import { AUTH_PROBE_PATH } from './authProbeRoute';
export { AUTH_PROBE_PATH, isAuthProbePath } from './authProbeRoute';
export const AUTH_PROBE_ROOT = '[data-auth-probe="unauthenticated-shell"]';
export const AUTH_PROBE_SCREEN = 'UNAUTHENTICATED_SIGN_IN';
export const AUTH_PROBE_TIMEOUT_MS = 15000;


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
  const rendered=!!root?.isConnected&&screen===AUTH_PROBE_SCREEN&&!!geometry&&geometry.heights.length===2&&geometry.heights.every(h=>h>0)&&container.getBoundingClientRect().width>0;
  return {screen,geometry,rendered};
}

// Bounded observer shared by the iframe runner and deterministic failure regressions.
/** @returns {Promise<any>} */
export async function waitForAuthProbe(read, {timeoutMs=AUTH_PROBE_TIMEOUT_MS, now=()=>performance.now(), pause=()=>new Promise(resolve=>setTimeout(resolve,50))}={}) {
  const started=now();
  /** @type {any} */
  let last={path:'about:blank',ready:'LOADING',screen:null,root:false}, observedPath=false,observedRoot=false;
  const result=(state,code,extra={})=>({state,code,route:AUTH_PROBE_PATH,path:last.path,pathname:last.path,screen:last.screen,
    expectedSelector:AUTH_PROBE_ROOT,selectorFound:!!last.root,documentReadyState:last.documentReadyState??'unavailable',resolvedScreen:last.screen,
    elapsedMs:Math.round(now()-started),frameState:last.frameState??{connected:null,loads:last.loads??0},readinessState:last.ready,
    lastObservedProbeState:{readiness:last.ready,screen:last.screen,lifecycle:last.lifecycle??null},...extra});
  while(now()-started<timeoutMs) {
    try { last=read(); } catch { return result('ERROR','AUTH_PROBE_DOCUMENT_INACCESSIBLE'); }
    if(last.frameState?.connected===false)return result('ERROR','AUTH_PROBE_FRAME_DETACHED');
    if(last.loads>3)return result('ERROR','AUTH_PROBE_REDIRECT_LOOP');
    if(last.path===AUTH_PROBE_PATH)observedPath=true;
    else if(observedPath||last.path!=='about:blank')return result('ERROR','AUTH_PROBE_ROUTE_CHANGED');
    if(observedRoot&&!last.root)return result('ERROR','AUTH_PROBE_UNMOUNTED');
    observedRoot ||= last.root;
    if(last.ready==='ERROR')return result('ERROR',last.code||'AUTH_PROBE_RENDER_FAILED');
    if(last.ready==='READY') {
      if(!last.root||last.path!==AUTH_PROBE_PATH||last.screen!==AUTH_PROBE_SCREEN||!last.geometry||!last.rendered)return result('ERROR','AUTH_PROBE_CONTRACT_INVALID');
      return result('READY','AUTH_PROBE_MEASURED',{geometry:last.geometry});
    }
    await pause();
  }
  return result('TIMEOUT',last.root?'AUTH_PROBE_READY_TIMEOUT':'AUTH_PROBE_ROOT_TIMEOUT');
}

export function createAuthProbeFrame(width) {
  const frame=document.createElement('iframe');
  frame.title='Isolated unauthenticated auth shell probe';frame.setAttribute('aria-hidden','true');
  Object.assign(frame.style,{position:'fixed',left:'-10000px',width:`${width}px`,height:'720px',border:'0',visibility:'hidden'});
  let loads=0;
  const onLoad=()=>{loads++;};frame.addEventListener('load',onLoad);
  frame.src=AUTH_PROBE_PATH;document.body.appendChild(frame);
  return {
    read:()=>{
      const win=frame.contentWindow,doc=frame.contentDocument,root=doc?.querySelector(AUTH_PROBE_ROOT);
      const path=win?.location.pathname==='blank'?'about:blank':win?.location.pathname??'about:blank';
      return {path,root:!!root,...inspectAuthShell(root),ready:root?.getAttribute('data-probe-status')||'LOADING',code:root?.getAttribute('data-probe-error'),loads,
        documentReadyState:doc?.readyState??'unavailable',lifecycle:root?.getAttribute('data-probe-lifecycle')??null,
        frameState:{connected:frame.isConnected,loads,visibility:window.getComputedStyle(frame).visibility,documentVisibility:doc?.visibilityState??'unavailable'}};
    },
    dispose:()=>{frame.removeEventListener('load',onLoad);frame.remove();},
  };
}

export async function measureAuthShell(width) {
  const probe=createAuthProbeFrame(width);
  try { return await waitForAuthProbe(probe.read); }
  finally { probe.dispose(); }
}

export function requireAuthProbeReady(result) {
  if(result.state!=='READY')throw Object.assign(new Error(`${result.code};route=${result.route};path=${result.path}`),{probeEvidence:result});
}
