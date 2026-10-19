export const AUTH_PROBE_PATH = '/auth-shell-probe';
export const AUTH_PROBE_ROOT = '[data-auth-probe="unauthenticated-shell"]';
export const AUTH_PROBE_SCREEN = 'UNAUTHENTICATED_SIGN_IN';
export const AUTH_PROBE_TIMEOUT_MS = 15000;

// An exact, presentation-only route; query parameters cannot override normal auth routing.
export const isAuthProbePath = path => path === AUTH_PROBE_PATH;

// Bounded observer shared by the iframe runner and deterministic failure regressions.
/** @returns {Promise<any>} */
export async function waitForAuthProbe(read, {timeoutMs=AUTH_PROBE_TIMEOUT_MS, now=()=>Date.now(), pause=()=>new Promise(resolve=>setTimeout(resolve,50))}={}) {
  const started=now();
  /** @type {any} */
  let last={path:'about:blank',ready:'LOADING',screen:null,root:false}, observedPath=false;
  const result=(state,code,extra={})=>({state,code,route:AUTH_PROBE_PATH,path:last.path,screen:last.screen,elapsedMs:now()-started,...extra});
  while(now()-started<timeoutMs) {
    try { last=read(); } catch { return result('ERROR','AUTH_PROBE_DOCUMENT_INACCESSIBLE'); }
    if(last.loads>3)return result('ERROR','AUTH_PROBE_REDIRECT_LOOP');
    if(last.path===AUTH_PROBE_PATH)observedPath=true;
    else if(observedPath||last.path!=='about:blank')return result('ERROR','AUTH_PROBE_ROUTE_CHANGED');
    if(last.ready==='ERROR')return result('ERROR',last.code||'AUTH_PROBE_RENDER_FAILED');
    if(last.ready==='READY') {
      if(!last.root||last.path!==AUTH_PROBE_PATH||last.screen!==AUTH_PROBE_SCREEN||!last.geometry)return result('ERROR','AUTH_PROBE_CONTRACT_INVALID');
      return result('READY','AUTH_PROBE_MEASURED',{geometry:last.geometry});
    }
    await pause();
  }
  return result('TIMEOUT',last.root?'AUTH_PROBE_READY_TIMEOUT':'AUTH_PROBE_ROOT_TIMEOUT');
}

export async function measureAuthShell(width) {
  const frame=document.createElement('iframe');
  frame.title='Isolated unauthenticated auth shell probe';frame.setAttribute('aria-hidden','true');
  Object.assign(frame.style,{position:'fixed',left:'-10000px',width:`${width}px`,height:'720px',border:'0',visibility:'hidden'});
  let loads=0;frame.addEventListener('load',()=>{loads++;});
  frame.src=AUTH_PROBE_PATH;document.body.appendChild(frame);
  try {
    return await waitForAuthProbe(()=>{
      const win=frame.contentWindow,doc=frame.contentDocument,root=doc?.querySelector(AUTH_PROBE_ROOT);
      const path=win.location.pathname==='blank'?'about:blank':win.location.pathname;
      const screen=root?.querySelector('[data-onboarding-state]')?.getAttribute('data-onboarding-state');
      const shell=root?.querySelector('[data-auth-shell]'),container=root?.querySelector('[data-probe-root]')?.firstElementChild;
      let geometry=null;
      if(shell&&container){const buttons=Array.from(shell.querySelectorAll('[data-provider]')),style=win.getComputedStyle(container);
        geometry={providers:buttons.map(b=>b.getAttribute('data-provider')).sort().join(),heights:buttons.map(b=>b.getBoundingClientRect().height),padding:[style.paddingLeft,style.paddingRight],passwords:root.querySelectorAll('input[type="password"]').length,ageChecked:root.querySelector('input')?.checked};}
      return {path,root:!!root,screen,ready:root?.getAttribute('data-probe-status')||'LOADING',code:root?.getAttribute('data-probe-error'),loads,geometry};
    });
  } finally {frame.remove();}
}
