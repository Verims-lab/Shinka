import { nativeFixture, barrier } from './nativeFixture';
import { privacyFixture, privacyIntent } from './privacyFixture';
import { check, rejects } from './dataModelTests';
import { termsPolicy, termsOperation, handleTermsRequest, withTermsAdmission, TERMS_URL } from '../../../base44/shared/termsAcceptance.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { ACCOUNT_CLEANUP, HEALTH_CLEANUP } from '../../../base44/shared/privacyPolicy.js';
import { termsRequest, currentTerms, validateAuthDeclarations, prepareTermsIntent, takeTermsIntent, clearTermsIntent } from '@/services/termsService';
import { beginProviderAuth } from '@/services/authService';
import { TERMS_COPY } from '../i18n/termsCopy';
import { loadStaticEvidence } from '../inspection/sourceScanner';
const VERSION='test-terms-v1'; // Synthetic only. No legally approved identifier is invented.
const body=()=>({action:'accept',version:VERSION,confirmed:true,age_confirmed:true,intent_id:crypto.randomUUID()});
function fixture(){
  const f=nativeFixture();let version=VERSION;
  const deps={readVersion:()=>version,now:f.now};
  const client=owner=>withUserLifecycle(f.raw(owner));
  return {...f,version:value=>{version=value;},run:(input,owner='ownerA')=>termsOperation(client(owner),input,deps),
    http:(input,owner='ownerA')=>handleTermsRequest(new Request('https://fixture.invalid/terms',{method:'POST',body:JSON.stringify(input)}),()=>client(owner),deps),
    guarded:owner=>withTermsAdmission(client(owner),deps.readVersion)};
}
/** @type {import('./testTypes').FoundationTest[]} */
export const TERMS_TESTS=[
 ['TA14','Health withdrawal retains Terms history; confirmed owner erasure removes only that owner history',async()=>{
  for(const kind of ['WITHDRAW_HEALTH','DELETE_ACCOUNT']){
    const f=privacyFixture();
    for(const owner of ['ownerA','ownerB'])await termsOperation(withUserLifecycle(f.raw(owner)),body(),{readVersion:()=>VERSION,now:f.now});
    const result=await f.request('begin',privacyIntent(kind));
    check(kind==='WITHDRAW_HEALTH'?result.healthCleanupVerified:result.state==='PLATFORM_PENDING');
    check(f.tables.UserTermsAcceptance.length===(kind==='WITHDRAW_HEALTH'?2:1));
    check(f.tables.UserTermsAcceptance.some(row=>row.user_id==='ownerB'));
  }
 }],
 ['TA01','Both providers reject all missing age/Terms combinations before SDK IO',async()=>{
  let calls=0;const auth={loginWithProvider:async()=>{calls++;}};
  for(const provider of ['apple','google'])for(const age of [false,true])for(const terms of [false,true]){
    const legal={termsConfirmed:terms,version:VERSION};
    const result=await beginProviderAuth(provider,'/login',age,auth,legal);
    check(result.ok===(age&&terms),`${provider}:${age}:${terms}`);
  }
  check(calls===2);clearTermsIntent();
  check(validateAuthDeclarations(true,{returning:true})===null);
  check(validateAuthDeclarations(false,{returning:true})==='AGE_DECLARATION_REQUIRED');
  check(validateAuthDeclarations(true,{termsConfirmed:true})==='TERMS_CONFIGURATION_REQUIRED');
 }],
 ['TA02','No default legal version; anonymous policy exposes only approved URL metadata',async()=>{
  const f=fixture();f.version(undefined);
  const policy=await f.run({action:'policy'},null);check(policy.state==='CONFIGURATION_REQUIRED'&&policy.version===null&&policy.termsUrl===TERMS_URL);
  await rejects(()=>f.run(body()),'TERMS_CONFIGURATION_REQUIRED');check(f.tables.UserTermsAcceptance.length===0);
  for(const invalid of ['', ' ', 'version\n', '<script>', 'x'.repeat(81)])check(termsPolicy(invalid).state==='CONFIGURATION_REQUIRED');
  await rejects(()=>f.run({action:'status'},null),'AUTH_REQUIRED');
 }],
 ['TA03','Owner/version/server UTC time and append-only event verified after persistence',async()=>{
  const f=fixture(),result=await f.run(body()),row=f.tables.UserTermsAcceptance[0];
  check(currentTerms(result)&&row.user_id==='ownerA'&&row.terms_version===VERSION&&row.accepted_at===f.now().toISOString()&&row.status==='ACCEPTED'&&row.document_url===TERMS_URL);
  check(f.state.calls.filter(call=>call.name==='UserTermsAcceptance'&&call.method==='create').length===1);
  check((await f.run({action:'status'},'ownerB')).state==='REQUIRED');
 }],
 ['TA04','Repeat login and repeated accept retain first timestamp; version change preserves history',async()=>{
  const f=fixture(),first=await f.run(body());f.state.time='2026-11-12T12:00:00.000Z';
  check(JSON.stringify(await f.run({action:'status'}))===JSON.stringify(first));
  check(JSON.stringify(await f.run(body()))===JSON.stringify(first)&&f.tables.UserTermsAcceptance.length===1);
  f.version('test-terms-v2');check((await f.run({action:'status'})).state==='REQUIRED');
  await rejects(()=>f.run(body()),'TERMS_VERSION_CHANGED');await f.run({...body(),version:'test-terms-v2'});
  check(f.tables.UserTermsAcceptance.length===2&&f.tables.UserTermsAcceptance[0].accepted_at===first.acceptance.acceptedAt);
  check(!f.state.calls.some(call=>call.name==='UserTermsAcceptance'&&['update','delete'].includes(call.method)));
 }],
 ['TA05','Client owner/role/timestamp and unknown actions cannot cross legal HTTP boundary',async()=>{
  for(const extra of [{user_id:'ownerB'},{role:'admin'},{accepted_at:'1990-01-01T00:00:00Z'},{timestamp:'forged'}]){
    const f=fixture(),response=await f.http({...body(),...extra});check(response.status===400&&f.tables.UserTermsAcceptance.length===0);
  }
  const f=fixture();for(const patch of [{confirmed:false},{age_confirmed:false},{intent_id:'forged'}])await rejects(()=>f.run({...body(),...patch}),'TERMS_CONFIRMATION_REQUIRED');
  check((await f.http({action:'delete'})).status===400);
 }],
 ['TA06','Failed and lost writes stay unconfirmed; explicit status never replays a mutation',async()=>{
  for(const when of ['before','after']){
    const f=fixture(),intent=body();f.once(when,call=>call.name==='UserTermsAcceptance'&&call.method==='create');
    await rejects(()=>f.run(intent),'TERMS_WRITE_UNCONFIRMED');
    const count=f.state.calls.filter(call=>call.method==='create').length;
    const status=await f.run({action:'status'});check(status.state===(when==='after'?'CURRENT':'REQUIRED'));
    check(f.state.calls.filter(call=>call.method==='create').length===count);
    if(when==='before')await f.run(intent);check(f.tables.UserTermsAcceptance.length===1);
  }
 }],
 ['TA07','Malformed/foreign/read-failed acceptance cannot authorize admission',async()=>{
  for(const patch of [{user_id:'ownerB'},{status:'PENDING'},{accepted_at:'bad'},{intent_id:'bad'},{document_url:'https://foreign.invalid'}]){
    const f=fixture();await f.run(body());Object.assign(f.tables.UserTermsAcceptance[0],patch);
    // A malicious/mis-scoped store response must be rejected as well as missing rows.
    const raw=f.raw();
    const client=withUserLifecycle({...raw,asServiceRole:{entities:new Proxy(raw.asServiceRole.entities,{get:(target,name)=>name==='UserTermsAcceptance'?{filter:async()=>f.tables.UserTermsAcceptance}:target[name]})}});
    await rejects(()=>termsOperation(client,{action:'status'},{readVersion:()=>VERSION}),'TERMS_STATE_UNAVAILABLE');
  }
  const f=fixture();f.once('before',call=>call.name==='UserTermsAcceptance'&&call.method==='filter');await rejects(()=>f.run({action:'status'}),'TERMS_STATE_UNAVAILABLE');
 }],
 ['TA08','Unverified readback and a concurrent legal-version change never become success',async()=>{
  const f=fixture();let written=false;
  f.state.after=async call=>{if(call.name==='UserTermsAcceptance'&&call.method==='create')written=true;};
  f.state.before=async call=>{if(written&&call.name==='UserTermsAcceptance'&&call.method==='filter')throw new Error('PRIVATE_STORE_PAYLOAD');};
  await rejects(()=>f.run(body()),'TERMS_WRITE_UNCONFIRMED');f.state.before=null;
  check((await f.run({action:'status'})).state==='CURRENT');
  const g=fixture();g.state.after=async call=>{if(call.name==='UserTermsAcceptance'&&call.method==='create')g.version('test-terms-v2');};
  await rejects(()=>g.run(body()),'TERMS_VERSION_CHANGED');check((await g.run({action:'status'})).state==='REQUIRED');
 }],
 ['TA09','Fresh server admission blocks missing, stale, failed, or wrong-owner terms',async()=>{
  const f=fixture();await rejects(()=>f.guarded('ownerA').auth.me(),'TERMS_REQUIRED');await f.run(body());
  check((await f.guarded('ownerA').auth.me()).id==='ownerA');await rejects(()=>f.guarded('ownerB').auth.me(),'TERMS_REQUIRED');
  f.version('test-terms-v2');await rejects(()=>f.guarded('ownerA').auth.me(),'TERMS_REQUIRED');
  f.version(null);await rejects(()=>f.guarded('ownerA').auth.me(),'TERMS_CONFIGURATION_REQUIRED');
 }],
 ['TA10','Concurrent acceptance retains every event and selects earliest verified event without overwrite',async()=>{
  const f=fixture(),gate=barrier(2);let reads=0;
  f.state.after=async call=>{if(call.name==='UserTermsAcceptance'&&call.method==='filter'&&++reads<=2)await gate();};
  const results=await Promise.all([f.run(body()),f.run(body())]);
  check(results.every(currentTerms)&&f.tables.UserTermsAcceptance.length===2);
  check((await f.run({action:'status'})).acceptance.id===results[0].acceptance.id);
 }],
 ['TA11','Client timeout/malformed/write errors are unknown and never client-side success',async()=>{
  for(const invoke of [async()=>{throw new Error('secret');},async()=>({data:{state:'CURRENT',version:VERSION}}),()=>new Promise(()=>{})]){
    try{await termsRequest('accept',{}, {functions:{invoke}},5);throw new Error('EXPECTED_FAILURE');}catch(failure){check(failure.unknown===true&&!failure.message.includes('secret'));}
  }
  check(!currentTerms({state:'CURRENT',version:VERSION,acceptance:{id:'x',status:'ACCEPTED',acceptedAt:'bad'}}));
 }],
 ['TA12','Exact TR/EN legal copy and no change to health-consent/erasure ownership',async()=>{
  const en=TERMS_COPY.en,tr=TERMS_COPY.tr;
  check(Object.keys(en).join()===Object.keys(tr).join()&&[...Object.values(en),...Object.values(tr)].every(value=>typeof value==='string'&&value.trim().length>0));
  check(en.termsAgreement==='I agree to the Terms of Use');
  check(tr.termsAgreement==='Kullanım Koşullarını kabul ediyorum');
  check(en.privacyInformation==='We handle your personal information in our Privacy Policy.');
  check(tr.privacyInformation==='Kişisel verilerinizi Gizlilik Politikamız kapsamında koruyoruz.');
  check(ACCOUNT_CLEANUP.includes('UserTermsAcceptance')&&!HEALTH_CLEANUP.includes('UserTermsAcceptance'));
  check((await loadStaticEvidence()).domain.termsPolicy);
 }],
 ['TA13','OAuth declaration intent is nonce-bound, one-use and expires without becoming authority',()=>{
  const original=location.href;
  try{
    const path=prepareTermsIntent(VERSION,'/login');history.replaceState(history.state,'',path);
    check(takeTermsIntent()?.version===VERSION&&takeTermsIntent()===null);
    prepareTermsIntent(VERSION,'/login');history.replaceState(history.state,'','/login?terms_intent=wrong');check(takeTermsIntent()===null);
    const next=prepareTermsIntent(VERSION,'/login'),saved=JSON.parse(sessionStorage.getItem('shinka.terms-intent.v1'));
    sessionStorage.setItem('shinka.terms-intent.v1',JSON.stringify({...saved,createdAt:Date.now()-600001}));history.replaceState(history.state,'',next);check(takeTermsIntent()===null);
  }finally{clearTermsIntent();history.replaceState(history.state,'',original);}
 }],
];
