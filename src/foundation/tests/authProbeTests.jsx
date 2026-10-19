import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import AuthShellProbe from '../probes/AuthShellProbe';
import { AUTH_PROBE_PATH, AUTH_PROBE_ROOT, inspectAuthShell, createAuthProbeFrame, waitForAuthProbe, requireAuthProbeReady } from '../probes/authProbeContract';

const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const fixture=()=>{
  const host=document.createElement('div');
  Object.assign(host.style,{position:'fixed',left:'-10000px',width:'360px',visibility:'hidden'});document.body.appendChild(host);
  const reactRoot=createRoot(host);
  return {host,reactRoot,mount:()=>flushSync(()=>reactRoot.render(<StrictMode><AuthShellProbe/></StrictMode>)),
    read:()=>{
      const root=host.querySelector(AUTH_PROBE_ROOT);
      // Synthetic route envelope; the committed component/DOM/layout are real. The CLI also
      // exercises the actual top-level and nested Preview route at both viewport widths.
      return {path:AUTH_PROBE_PATH,root:!!root,...inspectAuthShell(root),ready:root?.getAttribute('data-probe-status')||'LOADING',
        documentReadyState:document.readyState,frameState:{connected:host.isConnected},lifecycle:root?.getAttribute('data-probe-lifecycle')};
    },dispose:()=>{flushSync(()=>reactRoot.unmount());host.remove();}};
};

/** @type {import('./testTypes').FoundationTest[]} */
export const AUTH_PROBE_TESTS=[
  ['AP01','READY is committed synchronously from the real DOM without an animation frame',()=>{
    const f=fixture();try{f.mount();const s=f.read();assert(s.ready==='READY'&&s.rendered&&s.lifecycle==='COMMIT_VERIFIED','commit waited for animation frame');assert(s.geometry.providers==='apple,google'&&!s.geometry.ageChecked,'auth boundary changed');}finally{f.dispose();}
  }],
  ['AP02','StrictMode and explicit unmount/remount leave a durable verified READY',()=>{
    const f=fixture();try{f.mount();flushSync(()=>f.reactRoot.render(null));assert(!f.read().root,'unmount retained stale root');f.mount();assert(f.read().ready==='READY'&&f.read().rendered,'remount lost READY');}finally{f.dispose();}
  }],
  ['AP03','Parent observation started before child commit sees READY',async()=>{
    const f=fixture();try{const pending=waitForAuthProbe(f.read,{timeoutMs:1000});f.mount();const r=await pending;assert(r.state==='READY'&&r.selectorFound,'early parent missed READY');}finally{f.dispose();}
  }],
  ['AP04','Parent observation started after child commit sees durable READY',async()=>{
    const f=fixture();try{f.mount();const r=await waitForAuthProbe(f.read,{timeoutMs:1000});assert(r.state==='READY'&&r.lastObservedProbeState.lifecycle==='COMMIT_VERIFIED','late parent missed READY');}finally{f.dispose();}
  }],
  ['AP05','Unmount before readiness produces ERROR and removes the fixture',async()=>{
    const f=fixture();try{
      const pendingRoot=document.createElement('div');pendingRoot.setAttribute('data-auth-probe','unauthenticated-shell');pendingRoot.setAttribute('data-probe-status','LOADING');f.host.appendChild(pendingRoot);
      const pending=waitForAuthProbe(f.read,{timeoutMs:1000});pendingRoot.remove();const r=await pending;
      assert(r.state==='ERROR'&&r.code==='AUTH_PROBE_UNMOUNTED'&&!r.selectorFound,'unmount silently passed');
    }finally{f.dispose();assert(!f.host.isConnected,'fixture leaked');}
  }],
  ['AP06','Disposal before iframe readiness terminates with ERROR and cleans up',async()=>{
    const selector='iframe[title="Isolated unauthenticated auth shell probe"]',before=document.querySelectorAll(selector).length,probe=createAuthProbeFrame(360);
    try{const pending=waitForAuthProbe(probe.read,{timeoutMs:1000});probe.dispose();const r=await pending;assert(r.state==='ERROR'&&r.code==='AUTH_PROBE_FRAME_DETACHED'&&document.querySelectorAll(selector).length===before,'detached frame passed/leaked');}finally{probe.dispose();}
  }],
  ['AP07','Timeout and propagated failures retain complete non-sensitive probe diagnostics',async()=>{
    const f=fixture();try{
      let time=0;const r=await waitForAuthProbe(f.read,{timeoutMs:100,now:()=>time,pause:async()=>{time+=50;}});
      assert(r.state==='TIMEOUT'&&r.elapsedMs===100&&r.expectedSelector===AUTH_PROBE_ROOT&&!r.selectorFound&&r.pathname===AUTH_PROBE_PATH&&r.documentReadyState&&r.frameState.connected&&r.readinessState==='LOADING'&&r.lastObservedProbeState,'diagnostics missing');
      let error;try{requireAuthProbeReady(r);}catch(e){error=e;}
      assert(error?.probeEvidence===r&&error.message.includes('AUTH_PROBE_ROOT_TIMEOUT'),'structured evidence discarded');
    }finally{f.dispose();}
  }],
  ['AP08','A present but unmeasurable shell cannot signal READY',()=>{
    const f=fixture();try{f.host.style.display='none';f.mount();assert(f.read().ready==='ERROR'&&!f.read().rendered,'unmeasurable DOM forced READY');}finally{f.dispose();}
  }],
];
