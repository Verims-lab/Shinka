import { check, NOW } from './dataModelTests';
import { fixturePlace } from './onboardingFixture';
import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { createGeoNamesAdapter } from '../../../base44/shared/geonamesAdapter.js';
import { GeoNamesError, geoNamesDiagnostic } from '../../../base44/shared/geonamesDiagnostics.js';
import { handleOnboardingRequest, onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
import { normalizeGeoNamesPlace } from '../../../base44/shared/onboardingValidation.js';

const lookup={action:'searchPlaces',query:'  İstanbul   City ',language_code:'tr'};
const post=(f,geoNames,body=lookup)=>handleOnboardingRequest(new Request('https://fixture.invalid/onboarding',{method:'POST',body:JSON.stringify(body)}),()=>f.client,{geoNames,now:()=>new Date(NOW)});
async function failure(run,code,httpStatus=null,providerStatus=null,providerClass=null){
  let caught;try{await run();}catch(error){caught=error;}
  check(caught instanceof GeoNamesError,`expected ${code}`);
  check(caught.code==='GEONAMES_UNAVAILABLE');
  check(JSON.stringify(geoNamesDiagnostic(caught))===JSON.stringify({code,http_status:httpStatus,provider_status:providerStatus,provider_class:providerClass}),`diagnostic ${code}`);
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
    check(url.searchParams.get('lang')==='tr'&&url.searchParams.get('maxRows')==='8'&&options.redirect==='error'&&!('headers' in options));
    return Response.json({geonames:[{...fixturePlace,username:'discard-provider-field'}]});
  }});
  const response=await post(sdkOnboardingFixture(),adapter);
  check(response.status===200&&JSON.stringify(await response.json())===JSON.stringify({places:[normalizeGeoNamesPlace(fixturePlace)]}));
 }],
 ['G02','Network failure and request/body timeout have distinct safe classes and bounded abort',async()=>{
  const network=createGeoNamesAdapter({username:'fixture',fetcher:async()=>{throw new Error('private URL and username');}});
  await failure(()=>network.search('City','en'),'GEONAMES_NETWORK_ERROR');
  for(const bodyPending of [false,true]){
    let signal=new AbortController().signal;
    const timeout=createGeoNamesAdapter({username:'fixture',timeoutMs:5,fetcher:async(_url,options)=>{
      signal=options.signal;
      return bodyPending?{ok:true,status:200,text:()=>new Promise(()=>{})}:new Promise(()=>{});
    }});
    await failure(()=>timeout.search('City','en'),'GEONAMES_REQUEST_TIMEOUT',bodyPending?200:null);check(signal?.aborted);
    const response=await post(sdkOnboardingFixture(),timeout);check(response.status===504);
  }
 }],
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
    const response=await post(sdkOnboardingFixture(),adapter);check(response.status===200&&JSON.stringify(await response.json())==='{"places":[]}');
  }
  const detail=createGeoNamesAdapter({username:'fixture',fetcher:async()=>Response.json({status:{value:15}})});
  await failure(()=>detail.resolve(123),'GEONAMES_PROVIDER_REJECTED',200,15,'NOT_FOUND');
  const bounded=createGeoNamesAdapter({username:'fixture',fetcher:async()=>Response.json({geonames:Array.from({length:20},()=>fixturePlace)})});
  check((await bounded.search('City','en')).length===8);
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
  check(JSON.stringify(body.diagnostic)==='{"code":"GEONAMES_PROVIDER_REJECTED","http_status":200,"provider_status":10,"provider_class":"AUTHORIZATION"}');
  check(!JSON.stringify(body).includes(marker)&&Object.keys(body).sort().join()==='diagnostic,error_code,field');
  const before=calls;
  for(const extra of [{url:'https://fixture.invalid/override'},{username:marker},{user_id:'other-owner'}])check(!(await post(f,adapter,{...lookup,...extra})).ok);
  check((await post(sdkOnboardingFixture({owner:null}),adapter)).status===401&&calls===before);
  check(geoNamesDiagnostic({diagnosticCode:marker,httpStatus:marker})===null);
  const unsafe=new GeoNamesError(marker,marker,marker);check(!JSON.stringify(geoNamesDiagnostic(unsafe)).includes(marker));
 }],
];
