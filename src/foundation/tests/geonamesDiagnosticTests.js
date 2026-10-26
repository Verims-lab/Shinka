import { captureFixtureConsole } from './fixtureConsole';
import { withTestClock, testEventTurn } from './testClock';
import { check, NOW } from './dataModelTests';
import { fixturePlace } from './onboardingFixture';
import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { createGeoNamesAdapter } from '../../../base44/shared/geonamesAdapter.js';
import { GeoNamesError, geoNamesDiagnostic } from '../../../base44/shared/geonamesDiagnostics.js';
import { handleOnboardingRequest, onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
import { normalizeGeoNamesPlace } from '../../../base44/shared/onboardingValidation.js';

const lookup={action:'searchPlaces',query:'  İstanbul   City ',language_code:'tr'};
const post=(f,geoNames,body=lookup)=>handleOnboardingRequest(new Request('https://fixture.invalid/onboarding',{method:'POST',body:JSON.stringify(body)}),()=>f.client,{geoNames,now:()=>new Date(NOW)});
async function failure(run,code,httpStatus=null,providerStatus=null,providerClass=null,
  stage=code==='GEONAMES_SECRET_MISSING'?'CONFIGURATION':code==='GEONAMES_NETWORK_ERROR'||code==='GEONAMES_REQUEST_TIMEOUT'?(httpStatus===null?'FETCH':'RESPONSE_BODY'):'RESPONSE_VALIDATION',
  transportClass=code==='GEONAMES_REQUEST_TIMEOUT'?'TIMEOUT':code==='GEONAMES_NETWORK_ERROR'?'UNKNOWN':null){
  let caught;try{await run();}catch(error){caught=error;}
  check(caught instanceof GeoNamesError,`expected ${code}`);
  check(caught.code==='GEONAMES_UNAVAILABLE');
  check(JSON.stringify(geoNamesDiagnostic(caught))===JSON.stringify({code,http_status:httpStatus,provider_status:providerStatus,provider_class:providerClass,failure_stage:stage,transport_class:transportClass}),`diagnostic ${code}`);
}
/** @type {import('./testTypes').FoundationTest[]} */
export const GEONAMES_DIAGNOSTIC_TESTS=[
 ['G01','Missing/blank secret fails safely before provider call; configured value is trimmed',async()=>{
  let calls=0;
  for(const username of [undefined,null,'',' \n\t ',42]){
    const adapter=createGeoNamesAdapter({username,fetcher:async()=>{calls++;return Response.json({geonames:[]});}});
    await failure(()=>adapter.search('City','en'),'GEONAMES_SECRET_MISSING');
    const response=await post(sdkOnboardingFixture(),adapter);check(response.status===503&&(await response.json()).diagnostic.code==='GEONAMES_SECRET_MISSING');
  }
  check(calls===0);
  const adapter=createGeoNamesAdapter({username:'  fixture-configured \n',fetcher:async(url,options)=>{
    check(url.origin==='https://secure.geonames.org'&&url.pathname==='/searchJSON');
    check(url.searchParams.get('username')==='fixture-configured'&&url.searchParams.get('q')==='İstanbul City');
    check(url.searchParams.get('lang')==='tr'&&url.searchParams.get('maxRows')==='8'&&options.redirect==='manual'&&!('headers' in options));
    return Response.json({geonames:[{...fixturePlace,username:'discard-provider-field'}]});
  }});
  const response=await post(sdkOnboardingFixture(),adapter);
  check(response.status===200&&JSON.stringify(await response.json())===JSON.stringify({places:[normalizeGeoNamesPlace(fixturePlace)]}));
 }],
 ['G02','Network failure and request/body timeout have distinct safe classes and bounded abort',withTestClock(async(clock,context)=>{
  const network=createGeoNamesAdapter({username:'fixture',fetcher:async()=>{throw new Error('private URL and username');}});
  await failure(()=>network.search('City','en'),'GEONAMES_NETWORK_ERROR');
  for(const bodyPending of [false,true]){
    let signal=new AbortController().signal;
    const timeout=createGeoNamesAdapter({username:'fixture',timeoutMs:5,timers:clock.timers,fetcher:async(_url,options)=>{
      signal=options.signal;
      return bodyPending?{ok:true,status:200,text:()=>new Promise(()=>{})}:new Promise(()=>{});
    }});
    context.stage?.(bodyPending?'BODY_WAIT':'FETCH_WAIT');
    await clock.run(()=>failure(()=>timeout.search('City','en'),'GEONAMES_REQUEST_TIMEOUT',bodyPending?200:null));check(signal?.aborted);
    context.stage?.('BACKEND_FIXTURE');const response=await clock.run(()=>post(sdkOnboardingFixture(),timeout));check(response.status===504);
  }
 })],
 ['G03','Non-provider HTTP failures retain only numeric HTTP status',async()=>{
  for(const status of [401,403,429,500,503])for(const body of ['private provider text',JSON.stringify({message:'private provider text'})]){
    const adapter=createGeoNamesAdapter({username:'fixture',fetcher:async()=>new Response(body,{status})});
    await failure(()=>adapter.search('City','en'),'GEONAMES_HTTP_ERROR',status);
    const response=await post(sdkOnboardingFixture(),adapter),text=await response.text();check(response.status===502&&!text.includes('private')&&!text.includes('message'));
  }
 }],
 ['G04','Provider JSON errors classify authorization/quota/service on success and error HTTP',async()=>{
  for(const [value,providerClass] of [[10,'AUTHORIZATION'],[18,'QUOTA'],[19,'QUOTA'],[20,'QUOTA'],[13,'SERVICE'],[22,'SERVICE']])for(const status of [200,401,429,503]){
    const adapter=createGeoNamesAdapter({username:'fixture',fetcher:async()=>Response.json({status:{value,message:'private provider username'}},{status})});
    await failure(()=>adapter.search('City','en'),'GEONAMES_PROVIDER_REJECTED',status,value,providerClass);
  }
 }],
 ['G05','Empty array and successful no-result status remain HTTP 200 empty places',async()=>{
  for(const data of [{geonames:[]},{status:{value:15,message:'no result for private query'}}]){
    const adapter=createGeoNamesAdapter({username:'fixture',fetcher:async()=>Response.json(data)});
    const response=await post(sdkOnboardingFixture(),adapter);check(response.status===200&&(await response.json()).places.length===0);
  }
  const detail=createGeoNamesAdapter({username:'fixture',fetcher:async()=>Response.json({status:{value:15}})});
  await failure(()=>detail.resolve(123),'GEONAMES_PROVIDER_REJECTED',200,15,'NOT_FOUND');
  const bounded=createGeoNamesAdapter({username:'fixture',fetcher:async()=>Response.json({geonames:Array.from({length:20},()=>fixturePlace)})});
  check((await bounded.search('City','en')).places.length===1,'duplicate provider IDs collapse');
 }],
 ['G06','Malformed JSON/envelope/records and oversized payloads are safe invalid responses',async()=>{
  for(const text of ['invalid','null','[]','{}','{"geonames":{}}','{"status":null}','{"status":{"value":"10"}}',JSON.stringify({geonames:[null]}),JSON.stringify({geonames:[{...fixturePlace,lat:''}]}),JSON.stringify({geonames:[],extra:'ı'.repeat(50001)})]){
    const adapter=createGeoNamesAdapter({username:'fixture',fetcher:async()=>new Response(text)});
    await failure(()=>adapter.search('City','en'),'GEONAMES_INVALID_RESPONSE',200);
  }
  const detail=createGeoNamesAdapter({username:'fixture',fetcher:async()=>Response.json(fixturePlace)});
  await failure(()=>detail.resolve(456),'GEONAMES_INVALID_RESPONSE',200);
 }],
 ['G07','Every search outcome is read-only across all product entities and missing preferences',async()=>{
  for(const initialized of [false,true]){
    const f=sdkOnboardingFixture();
    if(initialized){
      await onboardingOperation(f.client,{action:'initialize',language_code:'en',timezone:'UTC'});
      await onboardingOperation(f.client,{action:'saveProfile',birth_date:'1990-01-01',birthplace_geonames_id:null},{now:()=>new Date(NOW)});
      f.rows.user_health_consent.push({id:'fixture-consent',user_id:'ownerA',consent_status:'GRANTED'});
      f.rows.user_period_record.push({id:'fixture-period',user_id:'ownerA'});
    }
    const before=JSON.stringify(f.rows);f.calls.length=0;
    for(const fetcher of [async()=>Response.json({geonames:[fixturePlace]}),async()=>Response.json({geonames:[]}),async()=>Response.json({status:{value:10}}),async()=>{throw new Error('network');}]){
      await post(f,createGeoNamesAdapter({username:'fixture',fetcher}));
      check(JSON.stringify(f.rows)===before&&f.calls.every(call=>call.method==='filter'),'search must never mutate any product entity');
    }
  }
 }],
 ['G08','Diagnostics never return raw provider data; forged URLs/owners and anonymous search blocked',async()=>{
  const f=sdkOnboardingFixture();let calls=0;
  const marker='synthetic-provider-sensitive-value';
  const adapter=createGeoNamesAdapter({username:marker,fetcher:async()=>{calls++;return Response.json({status:{value:10,message:marker},username:marker,stack:marker});}});
  const response=await post(f,adapter),body=await response.json();
  check(response.status===502&&body.error_code==='GEONAMES_UNAVAILABLE'&&body.field===null);
  check(JSON.stringify(body.diagnostic)==='{"code":"GEONAMES_PROVIDER_REJECTED","http_status":200,"provider_status":10,"provider_class":"AUTHORIZATION","failure_stage":"RESPONSE_VALIDATION","transport_class":null}');
  check(!JSON.stringify(body).includes(marker)&&Object.keys(body).sort().join()==='diagnostic,error_code,field');
  const before=calls;
  for(const extra of [{url:'https://fixture.invalid/override'},{username:marker},{user_id:'other-owner'}])check(!(await post(f,adapter,{...lookup,...extra})).ok);
  check((await post(sdkOnboardingFixture({owner:null}),adapter)).status===401&&calls===before);
  check(geoNamesDiagnostic({diagnosticCode:marker,httpStatus:marker})===null);
  const unsafe=new GeoNamesError(marker,marker,marker);check(!JSON.stringify(geoNamesDiagnostic(unsafe)).includes(marker));
 }],
 ['G09','Pre-response transport causes classify only explicit runtime evidence; ambiguity stays UNKNOWN',async()=>{
  /** @type {Array<[unknown,string]>} */
  const signatures=[
    [{code:'ENOTFOUND'},'DNS'],[{code:'EAI_AGAIN'},'DNS'],
    [{code:'CERT_HAS_EXPIRED'},'TLS_CERTIFICATE'],[{code:'ERR_TLS_CERT_ALTNAME_INVALID'},'TLS_CERTIFICATE'],
    [{code:'ECONNRESET'},'CONNECTION'],[{name:'ConnectionRefused'},'CONNECTION'],
    [{code:'ERR_INVALID_ARG_TYPE'},'INVOCATION_INPUT'],[{code:'ERR_INVALID_THIS'},'INVOCATION_INPUT'],
    [{code:'ETIMEDOUT'},'TIMEOUT'],[{name:'TimeoutError'},'TIMEOUT'],
    [new TypeError("Fetch failed: Encountered redirect while redirect mode is set to 'error'"),'REDIRECT_REJECTION'],
    [new Error('unexpected redirect'),'REDIRECT_REJECTION'],
    [new Error('error sending request for url (https://fixture.invalid/): client error (Connect): dns error: fixture'),'DNS'],
    [new TypeError('Failed to fetch'),'UNKNOWN'],[new TypeError('DNS TLS connection redirect'),'UNKNOWN'],
    [{name:'NotFound'},'UNKNOWN'],[{name:'Http'},'UNKNOWN'],[{name:'AbortError'},'UNKNOWN'],
    [{code:'NEW_RUNTIME_CODE'},'UNKNOWN'],[{code:'ECONNRESET',cause:{code:'ENOTFOUND'}},'UNKNOWN'],
    [null,'UNKNOWN'],['DNS','UNKNOWN'],
  ];
  for(const [cause,expected] of signatures)for(const wrapped of [false,true]){
    const error=wrapped?new TypeError('fetch failed',{cause}):cause;
    const adapter=createGeoNamesAdapter({username:'fixture',fetcher:async()=>{throw error;}});
    await failure(()=>adapter.search('City','en'),'GEONAMES_NETWORK_ERROR',null,null,null,'FETCH',expected);
  }
  const cycle={cause:null};cycle.cause=cycle;
  for(const error of [cycle,{cause:{cause:{cause:{cause:{code:'ENOTFOUND'}}}}},{get cause(){throw new Error('inaccessible');}}]){
    const adapter=createGeoNamesAdapter({username:'fixture',fetcher:async()=>{throw error;}});
    await failure(()=>adapter.search('City','en'),'GEONAMES_NETWORK_ERROR');
  }
 }],
 ['G10','Fetch invocation versus body-read stage is precise; successful search and ID resolve preserved',async()=>{
  const invocation=createGeoNamesAdapter({username:'fixture',fetcher:()=>{throw Object.assign(new TypeError('fixture'),{code:'ERR_INVALID_THIS'});}});
  await failure(()=>invocation.search('City','en'),'GEONAMES_NETWORK_ERROR',null,null,null,'FETCH','INVOCATION_INPUT');
  const body=createGeoNamesAdapter({username:'fixture',fetcher:async()=>Object.assign(new Response('fixture'),{text:async()=>{throw Object.assign(new Error('fixture'),{code:'ECONNRESET'});}})});
  await failure(()=>body.search('City','en'),'GEONAMES_NETWORK_ERROR',200,null,null,'RESPONSE_BODY','CONNECTION');
  const paths=[];
  const success=createGeoNamesAdapter({username:'fixture',fetcher:async(url,options)=>{
    check(url instanceof URL&&options.redirect==='manual');paths.push(url.pathname);
    if(url.pathname==='/getJSON')check(url.searchParams.get('geonameId')===String(fixturePlace.geonameId));
    return Response.json(url.pathname==='/searchJSON'?{geonames:[fixturePlace]}:fixturePlace);
  }});
  const {places:[{place_kind,place_path,...place}]}=await success.search('City','en');
  check(JSON.stringify(await success.resolve(place.birthplace_geonames_id))===JSON.stringify(place));
  check(paths.join()==='/searchJSON,/getJSON');
 }],
 ['G11','Settled requests clear deadlines; abort and late fetch/body rejection never escape unhandled',withTestClock(async(clock,context)=>{
  let unhandled=0;const listener=()=>{unhandled++;};
  window.addEventListener('unhandledrejection',listener);context.cleanup?.(()=>window.removeEventListener('unhandledrejection',listener));
  try{
    for(const outcome of ['success','rejection','http']){
      let signal=new AbortController().signal;
      const adapter=createGeoNamesAdapter({username:'fixture',timeoutMs:5,timers:clock.timers,fetcher:async(_url,options)=>{
        signal=options.signal;
        if(outcome==='rejection')throw new TypeError('fixture');
        return outcome==='http'?new Response('',{status:503}):Response.json({geonames:[]});
      }});
      if(outcome==='success')await adapter.search('City','en');
      else await failure(()=>adapter.search('City','en'),outcome==='http'?'GEONAMES_HTTP_ERROR':'GEONAMES_NETWORK_ERROR',outcome==='http'?503:null);
      context.stage?.('SETTLED_CHECK');await clock.advance(15);check(!signal.aborted,'settled request deadline was not cleared');
    }
    for(const bodyPending of [false,true])for(const rejectOnAbort of [false,true]){
      let signal=new AbortController().signal,aborts=0;
      /** @type {(reason:unknown)=>void} */ let rejectLate=()=>{};
      const pending=new Promise((_,reject)=>{rejectLate=reject;});
      const adapter=createGeoNamesAdapter({username:'fixture',timeoutMs:5,timers:clock.timers,fetcher:async(_url,options)=>{
        signal=options.signal;signal.addEventListener('abort',()=>{aborts++;if(rejectOnAbort)rejectLate(new DOMException('fixture','AbortError'));});
        return bodyPending?{status:200,ok:true,text:()=>pending}:pending;
      }});
      context.stage?.(bodyPending?'BODY_WAIT':'FETCH_WAIT');
      await clock.run(()=>failure(()=>adapter.search('City','en'),'GEONAMES_REQUEST_TIMEOUT',bodyPending?200:null));
      check(signal.aborted&&aborts===1);rejectLate(new TypeError('late fixture rejection'));await clock.advance(15);await testEventTurn(context.signal);
    }
    check(unhandled===0,'unhandled transport rejection');
  }finally{window.removeEventListener('unhandledrejection',listener);}
 })],
 ['G12','Sensitive exceptions/cause/stack and unknown names/codes never reach response, console or entities',async(context={})=>{
  const fixtureUsername='synthetic-sensitive-username',fixtureQuery='Synthetic Private City';
  const fixtureUrl=`https://secure.geonames.org/searchJSON?username=${fixtureUsername}&q=${encodeURIComponent(fixtureQuery)}`;
  const methods=['log','info','warn','error','debug','trace','dir','table'];
  const captured=captureFixtureConsole(methods,context);
  try{
    for(const signature of ['unknown','code','message']){
      const message=signature==='message'?`error sending request for url (${fixtureUrl}): client error (Connect): dns error: ${fixtureQuery}`:`${fixtureUrl} ${fixtureQuery}`;
      const cause=Object.assign(new Error(message),{code:signature==='code'?'ENOTFOUND':fixtureUsername,name:fixtureQuery,stack:fixtureUrl});
      const error=Object.assign(new TypeError(`${fixtureUsername} ${fixtureQuery}`,{cause}),{stack:fixtureUrl});
      const f=sdkOnboardingFixture(),before=JSON.stringify(f.rows);
      const adapter=createGeoNamesAdapter({username:fixtureUsername,fetcher:async()=>{throw error;}});
      const response=await post(f,adapter,{action:'searchPlaces',query:fixtureQuery,language_code:'en'}),body=await response.json();
      check(response.status===503&&body.diagnostic.failure_stage==='FETCH'&&body.diagnostic.transport_class===(signature==='unknown'?'UNKNOWN':'DNS'));
      const serialized=JSON.stringify(body);
      for(const value of [fixtureUsername,fixtureQuery,fixtureUrl,'stack','cause','message'])check(!serialized.includes(value),'sensitive error projection');
      check(Object.keys(body.diagnostic).sort().join()==='code,failure_stage,http_status,provider_class,provider_status,transport_class');
      check(JSON.stringify(f.rows)===before&&f.calls.every(call=>call.method==='filter'));
    }
    const unsafe=new GeoNamesError('GEONAMES_NETWORK_ERROR',null,null,fixtureUsername,fixtureQuery);
    unsafe.failureStage=fixtureUsername;unsafe.transportClass=fixtureQuery;
    const safe=geoNamesDiagnostic(unsafe);check(safe.failure_stage==='UNKNOWN'&&safe.transport_class===null);
    check(captured.count()===0,'transport errors must not log');
  }finally{captured.dispose();}
 }],
 ['G21','Manual compatibility processes search and selected-ID resolution when error mode is unsupported',async()=>{
  const seen=[],receivers=[];
  const fetcher=async function(input,options){
    receivers.push(this);seen.push({url:input,options});
    if(options.redirect==='error')throw new TypeError('unsupported fixture');
    check(options.redirect==='manual'&&input instanceof URL&&Object.keys(options).sort().join()==='redirect,signal');
    check(input.origin==='https://secure.geonames.org'&&input.searchParams.get('username')==='fixture');
    return Response.json(input.pathname==='/searchJSON'?{geonames:[fixturePlace]}:fixturePlace);
  };
  const adapter=createGeoNamesAdapter({username:'fixture',fetcher});
  const {places:[{place_kind,place_path,...place}]}=await adapter.search('City','tr');
  check(JSON.stringify(await adapter.resolve(place.birthplace_geonames_id))===JSON.stringify(place));
  check(seen.length===2&&seen.map(s=>s.url.pathname).join()==='/searchJSON,/getJSON'&&receivers.every(r=>r===undefined));
 }],
 ['G22','Every 3xx and opaque redirect is rejected before parsing; search and resolve never send a second request',async()=>{
  for(const status of [300,301,302,303,304,305,306,307,308,399,0])for(const resolve of [false,true]){
    let calls=0,reads=0,cancels=0;
    const adapter=createGeoNamesAdapter({username:'fixture',fetcher:async(_url,options)=>{
      calls++;check(options.redirect==='manual');
      // Some statuses forbid a body in the Response constructor; vary the exposed
      // status so even an unexpected unread stream exercises our rejection path.
      const response=new Response(new ReadableStream({cancel(){cancels++;}}),{status:302});
      return Object.defineProperties(response,{
        status:{value:status},
        headers:{get(){reads++;throw new Error('headers forbidden');}},
        text:{value:async()=>{reads++;return JSON.stringify({geonames:[fixturePlace]});}},
        ...(status===0?{type:{value:'opaqueredirect'}}:{}),
      });
    }});
    await failure(()=>resolve?adapter.resolve(fixturePlace.geonameId):adapter.search('City','en'),'GEONAMES_HTTP_ERROR',status||null,null,null,'RESPONSE_VALIDATION','REDIRECT_REJECTION');
    check(calls===1&&reads===0&&cancels===1);
  }
 }],
 ['G23','Redirect cleanup is deadline-bounded; late responses are cancelled unread without unhandled rejection',withTestClock(async(clock,context)=>{
  let unhandled=0;
  const listener=()=>{unhandled++;};window.addEventListener('unhandledrejection',listener);context.cleanup?.(()=>window.removeEventListener('unhandledrejection',listener));
  try{
    let signal=new AbortController().signal,cancels=0;
    /** @type {(reason:unknown)=>void} */ let rejectCleanup=()=>{};
    const cleanup=new Promise((_,reject)=>{rejectCleanup=reject;});
    const stalled=createGeoNamesAdapter({username:'fixture',timeoutMs:5,timers:clock.timers,fetcher:async(_url,options)=>{
      signal=options.signal;
      return new Response(new ReadableStream({cancel(){cancels++;return cleanup;}}),{status:302});
    }});
    context.stage?.('CLEANUP');await clock.run(()=>failure(()=>stalled.search('City','en'),'GEONAMES_REQUEST_TIMEOUT',302,null,null,'RESPONSE_VALIDATION','TIMEOUT'));
    check(signal.aborted&&cancels===1);rejectCleanup(new Error('private cleanup fixture'));
    let resolveLate=(_response)=>{};let reads=0,lateCancels=0;
    const late=createGeoNamesAdapter({username:'fixture',timeoutMs:5,timers:clock.timers,fetcher:()=>new Promise(resolve=>{resolveLate=resolve;})});
    context.stage?.('LATE_RESPONSE');await clock.run(()=>failure(()=>late.search('City','en'),'GEONAMES_REQUEST_TIMEOUT'));
    resolveLate(Object.assign(new Response(new ReadableStream({cancel(){lateCancels++;throw new Error('private late cleanup');}})),{text:async()=>{reads++;return '{}';}}));
    await clock.advance(15);await testEventTurn(context.signal);check(reads===0&&lateCancels===1&&unhandled===0);
  }finally{window.removeEventListener('unhandledrejection',listener);}
 })],
 ['G24','Redirect projection discards Location, body and cancellation errors without logs or product writes',async(context={})=>{
  const marker='synthetic-redirect-sensitive',methods=['log','info','warn','error','debug','trace'];
  const captured=captureFixtureConsole(methods,context);
  try{
    for(const status of [301,302,303,307,308,0]){
      const f=sdkOnboardingFixture(),before=JSON.stringify(f.rows);let calls=0;
      const adapter=createGeoNamesAdapter({username:marker,fetcher:async(input)=>{
        calls++;
        const response=new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(marker));},cancel(){throw new TypeError(`${String(input)} ${marker}`,{cause:{message:marker,stack:marker}});}}),{status:status||200,headers:{Location:`https://fixture.invalid/${marker}`}});
        return status?response:Object.defineProperties(response,{status:{value:0},type:{value:'opaqueredirect'}});
      }});
      const response=await post(f,adapter),result=await response.json(),serialized=JSON.stringify(result);
      check(response.status===502&&result.error_code==='GEONAMES_UNAVAILABLE'&&result.field===null&&calls===1);
      check(result.diagnostic.code==='GEONAMES_HTTP_ERROR'&&result.diagnostic.http_status===(status||null)&&result.diagnostic.transport_class==='REDIRECT_REJECTION');
      check(Object.keys(result.diagnostic).sort().join()==='code,failure_stage,http_status,provider_class,provider_status,transport_class');
      for(const value of [marker,'https://','Location','username','stack','cause','message','İstanbul'])check(!serialized.includes(value),'redirect disclosure');
      check(JSON.stringify(f.rows)===before&&f.calls.every(c=>c.method==='filter'));
    }
    check(captured.count()===0);
  }finally{captured.dispose();}
 }],
];