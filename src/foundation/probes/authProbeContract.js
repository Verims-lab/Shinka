import { AUTH_PROBE_PATH } from './authProbeRoute';
export { AUTH_PROBE_PATH, isAuthProbePath } from './authProbeRoute';
export const AUTH_PROBE_ROOT = '[data-auth-probe="unauthenticated-shell"]';
export const AUTH_PROBE_SCREEN = 'UNAUTHENTICATED_SIGN_IN';
export const AUTH_PROBE_TIMEOUT_MS = 15000;


export { inspectAuthShell } from './inspectAuthShell.js';

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

export async function measureAuthShell(width) {
  const { browserMeasurement } = await import('./browserEvidence');
  return browserMeasurement('auth', AUTH_PROBE_PATH, width);
}

export function requireAuthProbeReady(result) {
  if(result.state!=='READY')throw Object.assign(new Error(`${result.code};route=${result.route};path=${result.path}`),{probeEvidence:result, code:result.code});
}
