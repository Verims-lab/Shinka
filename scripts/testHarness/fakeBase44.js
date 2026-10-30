let privacyLab;
let onboardingVisualLab;
const loadPrivacyLab = () => privacyLab ||= import('@/foundation/tests/privacyFixture').then(({privacyFixture})=>{const f=privacyFixture();globalThis.__privacyLab=f;return f;});
let youLab;
const themeLabs = new Map();
const loadYouLab = (actor = session) => {
  const key = params.has('themeFixture') ? actor : 'default';
  if (!themeLabs.has(key)) themeLabs.set(key, import('@/foundation/tests/youFixture').then(({youFixture})=>{
    const f=youFixture();f.tables.UserPreferences[0].language_code=params.get('language')==='tr'?'tr':'en';
    f.tables.UserPreferences[0].theme_code=params.has('themeFixture') && actor==='admin' && params.get('theme')==='dark'?'dark':'light';
    return f;
  }));
  youLab=themeLabs.get(key);
  return youLab.then(f=>{globalThis.__youLab=f;return f;});
};
// CLI-only substitution; no application build imports this module or its URL controls.
const params = new URLSearchParams(location.search);
let session = params.get('sdkSession') || 'anonymous';
let delayed = null;
const calls = [];
const operationGates = new Map(), operationFailures = new Set();
globalThis.__sdkLabCalls = calls; // CLI-only action-name counters; never request payloads.
let releaseHydration;
let dailyAttempts = 0;
let calendarLab;
let patternLab;
let testToolsLab;
const healthRuns=[];
async function loadCalendarLab() {
  if (!calendarLab) calendarLab = import('@/foundation/tests/calendarFixture').then(async ({ calendarFixture }) => {
    const f = calendarFixture({ granted: params.get('calendarScenario') !== 'consent' });
    if (params.get('calendarScenario') === 'unsupported') {
      await f.change('add', { date: '2026-01-01' });
      await f.change('add', { date: '2026-04-01' });
    } else if (params.get('calendarScenario') !== 'consent') await f.change('add', { date: '2026-10-01' });
    globalThis.__calendarLab = f;
    return f;
  });
  return calendarLab;
}
const hydration = params.has('holdHydration') ? new Promise(resolve => { releaseHydration = resolve; }) : Promise.resolve();
const startupGates = { settings:[], session:[] };
const holdStartup = name => { let resolve,reject; const promise=new Promise((ok,no)=>{resolve=ok;reject=no;});startupGates[name].push({promise,resolve,reject}); };
if(params.has('startupFixture')) { holdStartup('settings');holdStartup('session'); }
export const authFixture = {
  calls,
  startupStarted:{settings:0,session:0},
  holdStartup,
  settleStartup(name,index,value,refused=false) { const gate=startupGates[name][index]; if(refused)gate.reject({status:403,data:{extra_data:{reason:'user_not_registered'}}}); else gate.resolve(value); },
  holdOperation(name) { let resolve; const promise=new Promise(done=>{resolve=done;});operationGates.set(name,{promise,resolve}); },
  releaseOperation(name) { const gate=operationGates.get(name);operationGates.delete(name);gate?.resolve(); },
  failOperation(name) { operationFailures.add(name); },
  hydrationReturned: false,
  releaseHydration() { releaseHydration?.(); },
  setSession(value) { session = value; },
  hold() { delayed = {}; delayed.promise = new Promise(resolve => { delayed.resolve = resolve; }); },
  release() { const pending = delayed; delayed = null; pending?.resolve(); },
};
export const base44 = {
  app: { getPublicSettings: async () => { const i=authFixture.startupStarted.settings++; return startupGates.settings[i]?.promise || {}; } },
  auth: {
    me: async () => {
      if (delayed) await delayed.promise;
      if (session === 'admin' || session === 'user') return { id: `synthetic-${session}`, role: session };
      throw Object.assign(new Error('SYNTHETIC_ANONYMOUS'), {status:401});
    },
    logout: () => { session = 'anonymous'; },
    loginWithProvider: async () => { throw new Error('SYNTHETIC_AUTH_NO_REDIRECT'); },
  },
  functions: { invoke: async (name, body) => {
    const actor = session;
    calls.push({ name, action: body.action }); // Action names only; no user payload.
    if(operationGates.has(name))await operationGates.get(name).promise;
    if(operationFailures.delete(`${name}.${body.action}`)||operationFailures.delete(name))throw new Error('SYNTHETIC_NETWORK_FAILURE');
    if (name === 'applicationSession') { const i=authFixture.startupStarted.session++; return {data: startupGates.session[i] ? await startupGates.session[i].promise : {...await base44.auth.me(),authority:'BASE44_NATIVE_V1'}}; }
    if (name === 'adminTestTools') {
      if (!testToolsLab) testToolsLab = import('@/foundation/tests/nativeFixture').then(({nativeFixture})=>{const fixture=nativeFixture();fixture.state.time=new Date().toISOString();Object.assign(fixture.tables.User.find(row=>row.id==='ownerA'),{full_name:'Synthetic Target',email:'target@example.invalid'});return fixture;});
      const f = await testToolsLab;
      const actor = session === 'admin' ? 'adminA' : session === 'user' ? 'ownerA' : null;
      try { return { data: await f.tools(body, actor) }; }
      catch (error) { return { data: { error_code: error.code || 'TEST_TOOLS_FAILED' } }; }
    }
    if (name === 'accountPrivacy') { const f = await loadPrivacyLab(); return {data:await(await f.http(body, session === 'admin' ? 'adminA' : session === 'user' ? 'ownerA' : null)).json()}; }
    if (name === 'you') { const f=await loadYouLab(actor);return {data:await(await f.http(body)).json()}; }
    if (name === 'pattern') {
      if (!patternLab) patternLab = import('@/foundation/tests/patternFixture').then(({patternFixture,patternRow})=>{const f=patternFixture();f.tables.UserDailyMessage.push(patternRow('2026-10-19'));globalThis.__patternLab=f;return f;});
      const f=await patternLab;
      try { return {data:await f.request(body.action)}; }
      catch(error) { return {data:{error_code:error.code||'PATTERN_READ_FAILED'}}; }
    }
    if (name === 'calendar') {
      const f = await loadCalendarLab();
      try {
        if (params.get('calendarScenario') === 'blocked') {
          if (body.action !== 'read') return { data: { error_code: 'CALENDAR_ATOMIC_CAPABILITY_REQUIRED' } };
          return { data: { ...await f.request('read', body), writable: false } };
        }
        return { data: await f.request(body.action, body) };
      } catch (error) { return { data: { error_code: error.code || 'CALENDAR_OPERATION_FAILED' } }; }
    }
    if (name === 'onboarding' && body.action === 'hydrate' && session !== 'anonymous') {
      await hydration; authFixture.hydrationReturned = true;
      return { data: {
      state: ['AUTHENTICATED_CYCLE_STEP', 'FIRST_SHINKA_DEPENDENCY', 'ACTIVE_EXISTING_USER'].includes(params.get('onboardingState')) ? params.get('onboardingState') : 'AUTHENTICATED_PROFILE_REQUIRED',
      profile: (youLab || params.has('themeFixture')) ? (await (await loadYouLab(actor)).request('read')).profile : undefined,
      preferences: (youLab || params.has('themeFixture')) ? (await (await loadYouLab(actor)).request('read')).preferences : params.has('uninitialized') ? null : { language_code: params.get('language') === 'tr' ? 'tr' : 'en', timezone: 'UTC' }, today: '2026-10-20',
    } };
    }
    if (name === 'onboarding' && params.has('onboardingVisual') && body.action === 'saveProfile') {
      onboardingVisualLab ||= import('@/foundation/tests/onboardingFixture').then(({onboardingFixture})=>onboardingFixture());
      const fixture=await onboardingVisualLab;
      const {onboardingOperation}=await import('../../base44/shared/onboardingOperations.js');
      return {data:await onboardingOperation(fixture.client,body,fixture.dependencies)};
    }
    if (name === 'dailyMessage') {
      if(youLab)return {data:await(await loadYouLab()).today()};
      dailyAttempts++;
      if (params.get('dailyScenario') === 'notReady' || params.get('dailyScenario') === 'retry' && dailyAttempts === 1) return { data: { error_code: 'DAILY_ATOMIC_CAPABILITY_REQUIRED' } };
      const fixture = globalThis.__dailyFixture;
      if (fixture) return { data: structuredClone(fixture) };
      return { data: { error_code: 'DAILY_ATOMIC_CAPABILITY_REQUIRED' } };
    }
    if(name==='internalHealth' && body.action==='save') {globalThis.__savedHealthReport=body.report;const row={id:'synthetic-health',run_id:body.report.runId,build_marker:body.report.buildMarker,health_catalog_version:body.report.healthCatalogVersion,status:body.report.gate.status,started_at:body.report.startedAt,report_file_uri:'private/synthetic-health.json'};if(!healthRuns.some(r=>r.run_id===row.run_id))healthRuns.push(row);return {data:{id:row.id,run_id:row.run_id}};}
    if(name==='internalHealth' && body.action==='report') {if(!healthRuns.some(r=>r.id===body.runId))throw new Error('SYNTHETIC_UNKNOWN_REPORT');return {data:{signed_url:'https://health-report.example.invalid/synthetic-report.json'}};}
    if (body.action === 'list') return { data: { runs: healthRuns } };
    throw new Error('LIVE_OPERATION_UNAVAILABLE_IN_CLI');
  } },
};
