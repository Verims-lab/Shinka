// Real providers/routes; only platform IO and passive scheduling are substituted.
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminGate from '@/components/internal/AdminGate';
import LoginRedirect from '@/components/LoginRedirect';
import SignIn from '@/features/onboarding/SignIn';
import { safeReturnTo } from '@/lib/authReturnTo';
import { waitForFixture } from './domWait';
import { testEventTurn, createTestClock } from './testClock';
import { waitForSessionRetry } from '@/lib/sessionCheck';

const check = (ok, message) => { if (!ok) throw new Error(message); };
const deferred = () => { let resolve = value => { check(false, `Uninitialized fixture gate: ${value}`); }; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const identity = (id = 'synthetic-A', role = 'admin') => ({ id, role, authority: 'BASE44_NATIVE_V1' });
const transientErrors = () => [...[429,503].map(status => ({status})),{code:'ETIMEDOUT'},{code:'ERR_NETWORK'},new TypeError('synthetic network'),new Error('unclassified')];
/** @param {string} path @param {Function} run @param {Parameters<import('./testTypes').FoundationTest[2]>[0]} [context] @param {ReturnType<typeof identity> | (() => Promise<unknown>) | null} [initial] */
async function fixture(path, run, context = {}, initial = identity(), settings = async () => ({}), retryWait = null, sessionTimers = undefined) {
  const f = { auth: null, location: null, calls: 0, logouts: 0, logins: [], now: 0, timer: null, waits: [], result: initial, settings, me: async () => typeof f.result === 'function' ? f.result() : f.result };
  const timing = { now: () => f.now, every: fn => { f.timer = fn; return 1; }, cancel: () => { f.timer = null; } };
  const sessionWait=(ms,signal)=>{f.waits.push(ms);return retryWait ? retryWait(ms,signal) : Promise.resolve(!signal.aborted);};
  const client = { app: { getPublicSettings: () => f.settings() }, auth: { logout: async () => { f.logouts++; } }, functions: { invoke: async name => {
    check(name === 'applicationSession', 'unexpected platform call'); f.calls++; return {data: await f.me()};
  } } };
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-10000px;width:360px'; document.body.appendChild(host);
  const root = createRoot(host); let disposed = false;
  const dispose = () => { if (disposed) return; disposed = true; root.unmount(); host.remove(); };
  context.cleanup?.(dispose);
  function Observer() { f.auth = useAuth(); f.location = useLocation(); return h('output', {'data-auth-observed':true}, JSON.stringify({id:f.auth.user?.id,admin:f.auth.isAdmin,checked:f.auth.authChecked,error:f.auth.authError,refresh:f.auth.isRefreshingAuth,path:f.location.pathname})); }
  const screen = name => h('div', {[`data-${name}`]:true}, name);
  root.render(h(AuthProvider,{client,sessionTiming:timing,sessionWait,sessionTimers},h(MemoryRouter,{initialEntries:[path]},h(Observer),h(Routes,null,
    h(Route,{path:'/login',element:h(ProtectedRoute,{unauthenticatedElement:h(SignIn,{authenticate:async (...args)=>{f.logins.push(args);return {ok:true,code:null};}})},screen('callback-accepted'))}),
    h(Route,{element:h(ProtectedRoute,{unauthenticatedElement:h(LoginRedirect)})},
      h(Route,{path:'/private',element:screen('private')}),
      h(Route,{element:h(AdminGate)},h(Route,{path:'/internal/test-tools',element:screen('admin-operation')})))))));
  const wait = predicate => waitForFixture(predicate,host,context), q = selector => host.querySelector(selector);
  try { await wait(()=>f.auth?.authChecked); await run(f,q,wait,host); } finally { dispose(); }
}

/** @type {import('./testTypes').FoundationTest[]} */
export const SESSION_INTEGRATION_TESTS = [
  ['SS13','Hanging session/settings settle within the startup budget; fresh retry and late-response isolation',async(context={})=>{
    const clock=createTestClock(context);
    try {await fixture('/private',async(f,q,wait)=>{
      await wait(()=>q('[data-private]'));
      const oldSession=deferred(),oldSettings=deferred();
      f.me=()=>oldSession.promise;f.settings=()=>oldSettings.promise;
      const pending=f.auth.checkAppState();await testEventTurn(context.signal);
      try {
        await clock.advance(15000);await testEventTurn(context.signal);
        check(!f.auth.isLoadingAuth&&!f.auth.isLoadingPublicSettings,'startup remained loading after deadline');
        await pending;check(f.auth.authError?.type==='session_unverified'&&f.logouts===0,'timeout became logout/success');
        f.me=async()=>identity('synthetic-B','user');f.settings=async()=>({});
        await f.auth.checkAppState();await wait(()=>f.auth.user?.id==='synthetic-B');
        oldSession.resolve(identity('synthetic-A','admin'));oldSettings.resolve({});await testEventTurn(context.signal);
        check(f.auth.user.id==='synthetic-B'&&!f.auth.isAdmin&&clock.pending()===0,'late result/timer survived retry');
      } finally {oldSession.resolve(identity());oldSettings.resolve({});}
    },context,identity(),async()=>({}),null,clock.timers);}finally{clock.dispose();}
  }],
  ['SS12','Session retry wait cancels on logout/account replacement; no old retry or leaked timer reaches the new account',async(context={})=>{
    for(const boundary of ['logout','account']){
      const clock=createTestClock(context);
      try{await fixture('/private',async(f,q,wait)=>{
        await wait(()=>q('[data-private]'));const before=f.calls;f.me=async()=>{throw {status:503};};
        const pending=f.auth.checkUserAuth();await testEventTurn(context.signal);check(clock.pending()===1&&f.calls===before+1,'retry not waiting');
        if(boundary==='logout')await f.auth.logout(false);
        else {f.me=async()=>identity('synthetic-B','user');await f.auth.checkAppState();}
        await pending;await testEventTurn(context.signal);const completed=f.calls;
        check(clock.pending()===0,'cancelled timer retained');await clock.advance(2100);
        check(f.calls===completed&&(boundary==='logout'?!f.auth.isAuthenticated:f.auth.user?.id==='synthetic-B'),'old retry survived session boundary');
      },context,identity(),async()=>({}),(ms,signal)=>waitForSessionRetry(ms,signal,clock.timers));}finally{clock.dispose();}
    }
  }],
  ['SS06','AuthProvider + routes: transient transport preserves ordinary session, blocks admin and offers retry without login',async(context={})=>{
    for(const path of ['/private','/internal/test-tools']) await fixture(path,async(f,q,wait)=>{
      await wait(()=>q(path==='/private'?'[data-private]':'[data-admin-operation]'));
      for(const error of transientErrors()) {
        f.me=async()=>{throw error;}; const before=f.calls;await f.auth.checkUserAuth();
        check(f.calls===before+3&&f.waits.slice(-2).join(',')==='700,1400','bounded retry contract');
        await wait(()=>f.auth.authError?.type==='session_unverified');
        check(f.auth.isAuthenticated&&!f.auth.isAdmin&&f.logouts===0&&!q('[data-auth-shell]'),'transient became logout/admin/login');
        check(path==='/private'?!!q('[data-private]'):!q('[data-admin-operation]'),'route boundary');
        f.me=async()=>identity();await f.auth.checkUserAuth();await wait(()=>f.auth.isAdmin);
      }
    },context);
    await fixture('/private',async(f,q,wait)=>{await wait(()=>f.auth.authError);check(!f.auth.isAuthenticated&&!q('[data-auth-shell]')&&!q('[data-private]')&&!!q('button'),'first check needs retry, not login');},context,()=>Promise.reject({status:429}));
  }],
  ['SS07','Real role loss preserves ordinary login; proven session loss closes access and late logout response cannot restore it',async(context={})=>{
    await fixture('/internal/test-tools',async(f,q,wait)=>{
      await wait(()=>q('[data-admin-operation]'));f.me=async()=>identity('synthetic-A','user');await f.auth.checkUserAuth();
      await wait(()=>q('[data-error-code="FORBIDDEN"]'));check(f.auth.isAuthenticated&&!f.auth.isAdmin&&!q('[data-auth-shell]'),'role loss became logout');
      f.me=async()=>{throw {status:401};};await f.auth.checkUserAuth();await wait(()=>q('[data-auth-shell]'));
      check(!f.auth.user&&!f.auth.isAuthenticated,'401 retained user');
    },context);
    await fixture('/private',async(f,q,wait)=>{
      await wait(()=>q('[data-private]'));const gate=deferred();f.me=()=>gate.promise;const old=f.auth.checkUserAuth();await testEventTurn(context.signal);
      await f.auth.logout(false);gate.resolve(identity());await old;await wait(()=>q('[data-auth-shell]'));
      check(!f.auth.isAuthenticated&&!f.auth.isAdmin&&!f.auth.user&&f.logouts===1,'late logout response restored authority');
    },context);
  }],
  ['SS08','Focus/visibility/timer share one request; account refresh discards pending old identity and throttle success',async(context={})=>{
    await fixture('/private',async(f,q,wait)=>{
      await wait(()=>q('[data-private]')&&f.timer);const before=f.calls;
      window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));f.timer();await testEventTurn(context.signal);check(f.calls===before,'recent success not throttled');
      f.now=20000;const gate=deferred();f.me=()=>gate.promise;
      window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));f.timer();await testEventTurn(context.signal);
      check(f.calls===before+1,'passive requests not coalesced');
      // Explicit app/session boundary must not reuse that older pending check.
      f.me=async()=>identity('synthetic-B','user');const current=f.auth.checkAppState();await testEventTurn(context.signal);
      gate.resolve(identity('synthetic-A','admin'));await current;await wait(()=>f.auth.user?.id==='synthetic-B'&&f.auth.authChecked&&!f.auth.isLoadingAuth&&!f.auth.isLoadingPublicSettings);
      check(f.auth.user?.id==='synthetic-B'&&!f.auth.isAdmin,'old account response or success reused');
      await f.auth.logout(false);f.me=async()=>identity('synthetic-C','user');await f.auth.checkAppState();await wait(()=>f.auth.user?.id==='synthetic-C'&&f.auth.authChecked&&!f.auth.isLoadingAuth);
      check(f.auth.user?.id==='synthetic-C'&&f.auth.isAuthenticated,'new session after logout not reverified');
    },context);
  }],
  ['SS09','Actual login redirect/SignIn callback: safe returnTo, one provider start and no second application sign-in',async(context={})=>{
    const original=window.location.href;
    try {
      await fixture('/private?view=ok',async(f,q,wait)=>{
        await wait(()=>q('[data-auth-shell]'));check(f.location.pathname==='/login','missing redirect');
        const search=f.location.search;check(safeReturnTo(search)==='/private?view=ok','destination lost');
        window.history.replaceState(null,'',`/login${search}`);
        q('#age-declaration').click();await testEventTurn(context.signal);const button=q('[data-provider="google"]');button.click();button.click();
        await wait(()=>f.logins.length===1);check(f.logins[0][1]==='/private?view=ok'&&f.logins[0][2]===true,'provider return/consent');
        f.me=async()=>identity('synthetic-return','user');await f.auth.checkAppState();await wait(()=>q('[data-callback-accepted]'));
        check(!q('[data-auth-shell]')&&f.logins.length===1,'second app login');
        check(safeReturnTo('?returnTo=https%3A%2F%2Fevil.invalid')==='/'&&safeReturnTo('?returnTo=%2Fprivate%3Faccess_token%3Dfake')==='/private','unsafe returnTo');
      },context,null);
    } finally {window.history.replaceState(null,'',original);}
  }],
  ['SS11','Parallel startup: settings/session in either order keep membership, logout and account boundaries',async(context={})=>{
    const refusal={status:403,data:{extra_data:{reason:'user_not_registered'}}};
    const refusedState=f=>f.auth.authError?.type==='user_not_registered'&&!f.auth.isAuthenticated&&!f.auth.isAdmin&&!f.auth.user;
    // Session succeeds first, settings then refuses membership: no admin while settings pend; refusal wins.
    const late=deferred();
    await fixture('/private',async(f,q,wait)=>{
      await wait(()=>f.auth.user?.id==='synthetic-A');check(!f.auth.isAdmin&&f.auth.isLoadingPublicSettings,'admin before settings settled');
      late.resolve(Promise.reject(refusal));await wait(()=>refusedState(f));check(!q('[data-private]')&&!q('[data-admin-operation]'),'product mounted after refusal');
      await f.auth.checkUserAuth();await testEventTurn(context.signal);check(refusedState(f),'later session check reopened refused account');
    },context,identity(),()=>late.promise);
    // Settings refuses first, session answers later: the late identity is discarded.
    const session=deferred();let refusedFirst=null;
    await fixture('/private',async(f,q,wait)=>{
      await wait(()=>refusedState(f));refusedFirst=f;session.resolve(identity());await testEventTurn(context.signal);await testEventTurn(context.signal);
      check(refusedState(f)&&!q('[data-private]'),'late session overrode membership refusal');
    },context,()=>session.promise,async()=>{throw refusal;});
    check(refusedFirst,'refusal-first scenario did not run');
    // Transient settings failure keeps the verified session; no admin escalation is withheld wrongly.
    await fixture('/internal/test-tools',async(f,q,wait)=>{
      await wait(()=>q('[data-admin-operation]'));check(f.auth.isAdmin&&!f.auth.authError,'transient settings failure changed session');
    },context,identity(),async()=>{throw {status:503};});
    // Logout and account change while both startup reads pend: old answers never open the new state.
    await fixture('/private',async(f,q,wait)=>{
      await wait(()=>q('[data-private]'));const s1=deferred(),m1=deferred();f.settings=()=>s1.promise;f.me=()=>m1.promise;
      const pending=f.auth.checkAppState();await testEventTurn(context.signal);
      await f.auth.logout(false);s1.resolve({});m1.resolve(identity('synthetic-A','admin'));await pending;await testEventTurn(context.signal);
      check(!f.auth.isAuthenticated&&!f.auth.isAdmin&&!f.auth.user,'pending startup answer restored a logged-out session');
      const s2=deferred(),m2=deferred();f.settings=()=>s2.promise;f.me=()=>m2.promise;const next=f.auth.checkAppState();await testEventTurn(context.signal);
      f.settings=async()=>({});f.me=async()=>identity('synthetic-B','user');const current=f.auth.checkAppState();
      s2.resolve({});m2.resolve(identity('synthetic-A','admin'));await Promise.all([next,current]);
      await wait(()=>f.auth.user?.id==='synthetic-B'&&!f.auth.isLoadingPublicSettings&&!f.auth.isLoadingAuth);
      check(!f.auth.isAdmin,'older account response reused after account change');
    },context);
  }],
];