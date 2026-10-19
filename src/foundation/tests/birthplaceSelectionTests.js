import { check, rejects, NOW } from './dataModelTests';
import { createGeoNamesAdapter } from '../../../base44/shared/geonamesAdapter.js';
import { geoNamesDiagnostic } from '../../../base44/shared/geonamesDiagnostics.js';
import { onboardingOperation, handleOnboardingRequest } from '../../../base44/shared/onboardingOperations.js';
import { BIRTHPLACE_FIELDS } from '../../../base44/shared/onboardingValidation.js';
import { createBirthplacePicker } from '@/features/onboarding/birthplaceSelection';
import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { hierarchyFetch, fixtureCountries, fixtureRegions, fixtureProviderPlace } from './geonamesHierarchyFixture';
const input={country:'TR',parent_id:null,offset:0,language_code:'tr'};
const adapter=(fetcher=hierarchyFetch)=>createGeoNamesAdapter({username:'fixture',fetcher});
const requestFor=geo=>async(action,payload)=>action==='listPlaceCountries'?geo.countries(payload.language_code):action==='listPlaceRegions'?geo.regions(payload):geo.places(payload);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
/** @type {import('./testTypes').FoundationTest[]} */
export const BIRTHPLACE_SELECTION_TESTS=[
 ['B01','Country → ADM1 → ADM2 → populated place uses typed provider records and no user query',async()=>{
  const calls=[],geo=adapter(async(url,options)=>{calls.push({url,options});return hierarchyFetch(url);});
  const countries=await geo.countries('tr');check(countries.options.length===3);
  const provinces=await geo.regions(input);check(provinces.level===1&&provinces.options[0].kind==='REGION');
  const districts=await geo.regions({...input,parent_id:1001});check(districts.level===2&&districts.options[0].id===1002);
  const places=await geo.places({...input,parent_id:1002});check(places.options[0].id===123&&places.options[0].kind==='PLACE');
  const resolved=await geo.resolve(123);check(BIRTHPLACE_FIELDS.every(k=>resolved[k]===places.options[0].place[k]));
  check(calls.every(c=>c.url.origin==='https://secure.geonames.org'&&c.options.redirect==='manual'&&Object.keys(c.options).sort().join()==='redirect,signal'));
  check(calls.some(c=>c.url.pathname==='/hierarchyJSON')&&!calls.some(c=>c.url.pathname==='/childrenJSON'));
 }],
 ['B02','Countries with a missing ADM2 and countries without administrative subdivisions remain selectable',async()=>{
  const geo=adapter();
  const subdivisions=await geo.regions({...input,country:'US',parent_id:2001});check(subdivisions.level===3&&subdivisions.options[0].id===2003);
  check((await geo.places({...input,country:'US',parent_id:2003})).options[0].id===223);
  const none=await geo.regions({...input,country:'SG'});check(none.total===0&&none.hierarchy_status==='NO_SUBDIVISIONS');
  check((await geo.places({...input,country:'SG'})).options[0].id===323);
 }],
 ['B03','Country/parent/language/page validation prevents arbitrary provider options and cross-country scopes',async()=>{
  let calls=0;const geo=adapter(async url=>{calls++;return hierarchyFetch(url);});
  for(const patch of [{country:'tr'},{country:'TUR'},{country:'https://fixture.invalid'},{parent_id:-1},{parent_id:'1001'},{offset:-1},{offset:1},{offset:5100},{language_code:'fr'}]){
    const before=calls;await rejects(()=>geo.regions({...input,...patch}),patch.language_code?'LANGUAGE_INVALID':'INVALID_REQUEST');check(calls===before);
  }
  await rejects(()=>geo.regions({...input,country:'US',parent_id:1001}),'GEONAMES_UNAVAILABLE');
  await rejects(()=>geo.regions({...input,parent_id:123}),'GEONAMES_UNAVAILABLE');
 }],
 ['B04','Parent codes and returned children must agree; admin records cannot pass selected-ID resolution',async()=>{
  for(const mutate of [r=>({...r,countryCode:'US'}),r=>({...r,adminCode1:'99'}),r=>({...r,fcl:'A',fcode:'ADM2'})]){
    const geo=adapter(async url=>url.pathname==='/searchJSON'?Response.json({totalResultsCount:1,geonames:[mutate(fixtureProviderPlace)]}):hierarchyFetch(url));
    await rejects(()=>geo.places({...input,parent_id:1001}),'GEONAMES_UNAVAILABLE');
  }
  await rejects(()=>adapter().resolve(1001),'GEONAMES_UNAVAILABLE');
  const badId=adapter(async()=>Response.json({...fixtureProviderPlace,geonameId:999}));await rejects(()=>badId.resolve(123),'GEONAMES_UNAVAILABLE');
 }],
 ['B05','Missing parent codes/hierarchy are explicit incomplete data, not empty options or invented coordinates',async()=>{
  const missingCode=adapter(async url=>url.pathname==='/getJSON'?Response.json({...fixtureRegions[0],adminCode1:''}):hierarchyFetch(url));
  await rejects(()=>missingCode.regions({...input,parent_id:1001}),'PLACE_HIERARCHY_INCOMPLETE');
  const missingHierarchy=adapter(async url=>url.pathname==='/hierarchyJSON'?Response.json({geonames:[]}):hierarchyFetch(url));
  await rejects(()=>missingHierarchy.places({...input,parent_id:1001}),'PLACE_HIERARCHY_INCOMPLETE');
  const missingAncestorCode=adapter(async url=>{
    const response=await hierarchyFetch(url),data=await response.json();
    if(url.pathname==='/getJSON')delete data.adminCode1;
    if(url.pathname==='/hierarchyJSON')for(const row of data.geonames)delete row.adminCode1;
    return Response.json(data);
  });
  await rejects(()=>missingAncestorCode.places({...input,parent_id:1002}),'PLACE_HIERARCHY_INCOMPLETE');
  const foreignAncestor=adapter(async url=>url.pathname==='/hierarchyJSON'?Response.json({geonames:[{fcl:'A',fcode:'PCLI',countryCode:'TR'},{fcl:'A',fcode:'ADM1',countryCode:'US'}]}):hierarchyFetch(url));
  await rejects(()=>foreignAncestor.places({...input,parent_id:1001}),'GEONAMES_UNAVAILABLE');
 }],
 ['B06','Large lists expose counts and real pages beyond eight; provider window is explicitly limited',async()=>{
  const rows=Array.from({length:235},(_,i)=>({...fixtureProviderPlace,geonameId:10000+i,name:`Place ${i}`}));
  const seen=[];
  const geo=adapter(async url=>{
    if(url.pathname!=='/searchJSON')return hierarchyFetch(url);
    const offset=Number(url.searchParams.get('startRow'));seen.push(offset);check(url.searchParams.get('maxRows')==='100');
    return Response.json({totalResultsCount:rows.length,geonames:rows.slice(offset,offset+100)});
  });
  const ids=[];
  for(const offset of [0,100,200]){const result=await geo.places({...input,offset});ids.push(...result.options.map(o=>o.id));check(result.total===235&&result.next_offset===(offset===200?null:offset+100)&&!result.limited);}
  check(new Set(ids).size===235&&seen.join()==='0,100,200');
  const limited=adapter(async url=>url.pathname==='/searchJSON'?Response.json({totalResultsCount:6000,geonames:rows.slice(0,100)}):hierarchyFetch(url));
  const last=await limited.places({...input,offset:5000});check(last.limited&&last.total===6000&&last.next_offset===null&&last.previous_offset===4900);
 }],
 ['B07','Missing totals, partial pages, duplicates and oversized streams fail instead of silently truncating',async()=>{
  for(const data of [{geonames:[fixtureProviderPlace]},{totalResultsCount:5,geonames:[fixtureProviderPlace]},{totalResultsCount:2,geonames:[fixtureProviderPlace,fixtureProviderPlace]},{totalResultsCount:-1,geonames:[]}]){
    await rejects(()=>adapter(async url=>url.pathname==='/searchJSON'?Response.json(data):hierarchyFetch(url)).places(input),'GEONAMES_UNAVAILABLE');
  }
  let cancelled=0;
  const huge=adapter(async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(524289));},cancel(){cancelled++;}})));
  await rejects(()=>huge.countries('en'),'GEONAMES_UNAVAILABLE');check(cancelled===1);
 }],
 ['B08','All new list actions remain owner-authenticated and read-only on success, empty and provider error',async()=>{
  for(const outcome of ['ok','empty','error']){
    const f=sdkOnboardingFixture(),before=JSON.stringify(f.rows),geo=adapter(async url=>outcome==='error'?Response.json({status:{value:10,message:'private'}}):outcome==='empty'&&url.pathname==='/searchJSON'?Response.json({geonames:[],totalResultsCount:0}):hierarchyFetch(url));
    for(const action of ['listPlaceCountries','listPlaceRegions','listPlaceSettlements']){
      const payload=action==='listPlaceCountries'?{language_code:'tr'}:input;
      try{await onboardingOperation(f.client,{action,...payload},{geoNames:geo});}catch(e){check(outcome==='error'&&e.code==='GEONAMES_UNAVAILABLE');}
      check(JSON.stringify(f.rows)===before&&f.calls.every(c=>c.method==='filter'));
    }
  }
  let outbound=0;const geo=adapter(async url=>{outbound++;return hierarchyFetch(url);});
  for(const action of ['listPlaceCountries','listPlaceRegions','listPlaceSettlements']){
    const f=sdkOnboardingFixture();
    for(const extra of [{url:'https://fixture.invalid'},{featureClass:'A'},{username:'fixture'},{maxRows:10000},{user_id:'other'}])await rejects(()=>onboardingOperation(f.client,{action,...input,...extra},{geoNames:geo}),extra.user_id?'FORGED_OWNER':'INVALID_REQUEST');
    await rejects(()=>onboardingOperation(sdkOnboardingFixture({owner:null}).client,{action,...input},{geoNames:geo}),'AUTH_REQUIRED');
  }
  check(outbound===0);
 }],
 ['B09','Final save resolves a populated ID and rejects supplied labels/coordinates; no transient path persists',async()=>{
  const f=sdkOnboardingFixture(),geo=adapter();
  await onboardingOperation(f.client,{action:'initialize',language_code:'tr',timezone:'Europe/Istanbul'});
  const body={action:'saveProfile',birth_date:'1990-01-01',birthplace_geonames_id:1001};
  await rejects(()=>onboardingOperation(f.client,body,{geoNames:geo,now:()=>new Date(NOW)}),'GEONAMES_UNAVAILABLE');check(f.rows.user_profile.length===0);
  await rejects(()=>onboardingOperation(f.client,{...body,birthplace_geonames_id:123,birthplace_name:'forged',birthplace_latitude:0},{geoNames:geo}),'INVALID_REQUEST');
  const result=await onboardingOperation(f.client,{...body,birthplace_geonames_id:123},{geoNames:geo,now:()=>new Date(NOW)});
  check(result.persisted&&result.profile.birthplace_name==='Fixture City'&&!('country' in result.profile)&&!('parent_id' in result.profile));
 }],
 ['B10','New envelopes keep manual redirect/error redaction and distinct missing-secret/provider diagnostics',async()=>{
  for(const [username,status,expected] of [['',200,'GEONAMES_SECRET_MISSING'],['fixture',302,'GEONAMES_HTTP_ERROR'],['fixture',200,'GEONAMES_PROVIDER_REJECTED']]){
    const f=sdkOnboardingFixture(),geo=createGeoNamesAdapter({username,fetcher:async()=>Response.json({status:{value:10,message:'private-provider'}},{status:Number(status),headers:{Location:'https://fixture.invalid/private'}})});
    const response=await handleOnboardingRequest(new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify({action:'listPlaceCountries',language_code:'en'})}),()=>f.client,{geoNames:geo});
    const result=await response.json();check(result.error_code==='GEONAMES_UNAVAILABLE'&&result.diagnostic.code===expected&&!JSON.stringify(result).includes('private'));
  }
  try{await adapter(async()=>{throw new TypeError('private');}).countries('en');}catch(e){check(geoNamesDiagnostic(e).transport_class==='UNKNOWN');}
 }],
 ['B11','Picker reaches a settlement through selections only; country and region changes clear all descendants',async()=>{
  const changes=[],picker=createBirthplacePicker({request:requestFor(adapter()),onChange:v=>changes.push(v)});
  await picker.start('tr');check(!picker.getSnapshot().country&&!picker.getSnapshot().selection);
  await picker.country(100);await picker.region(0,1001);await picker.region(1,1002);picker.place(123);
  check(picker.getSnapshot().selection.birthplace_geonames_id===123&&!picker.getSnapshot().incomplete);
  await picker.region(0,1001);check(!picker.getSnapshot().selection&&picker.getSnapshot().path.length===1&&picker.getSnapshot().incomplete);
  await picker.country(200);check(picker.getSnapshot().path.length===0&&!picker.getSnapshot().selection&&picker.getSnapshot().regions[0].options[0].id===2001);
  picker.dispose();
 }],
 ['B12','Late country responses and cleared requests cannot restore stale lists or a selected place',async()=>{
  const pending=[];
  const picker=createBirthplacePicker({request:async(action,payload)=>{
    if(action==='listPlaceCountries')return {options:fixtureCountries.map(c=>({id:c.geonameId,country:c.countryCode,name:c.countryName}))};
    return new Promise(resolve=>pending.push({payload,resolve}));
  }});
  await picker.start('en');const first=picker.country(100),second=picker.country(200);
  pending.slice(2).forEach(p=>p.resolve({options:[{id:2001,kind:'REGION',name:'US region'}]}));await second;
  pending.slice(0,2).forEach(p=>p.resolve({options:[{id:1001,name:'stale'}]}));await first;
  check(picker.getSnapshot().country.country==='US'&&picker.getSnapshot().regions[0].options[0].id===2001);
  const third=picker.country(100);await picker.clear();pending.slice(4).forEach(p=>p.resolve({options:[{id:123,kind:'PLACE',place:{birthplace_geonames_id:123}}]}));await third;
  check(!picker.getSnapshot().country&&!picker.getSnapshot().selection&&!picker.getSnapshot().incomplete&&picker.getSnapshot().regions.length===0);
  picker.dispose();
 }],
 ['B13','Language changes reload scoped lists; disposal ignores completions and cannot call the parent',async()=>{
  const pending=[];let changed=0;
  const picker=createBirthplacePicker({onChange:()=>{changed++;},request:async(_action,payload)=>new Promise(resolve=>pending.push({payload,resolve}))});
  const en=picker.start('en'),tr=picker.language('tr');
  pending[1].resolve({options:[{id:100,country:'TR',name:'Türkçe'}]});await tr;pending[0].resolve({options:[{id:100,country:'TR',name:'Old English'}]});await en;
  check(picker.getSnapshot().countries.options[0].name==='Türkçe');
  const loading=picker.country(100);check(changed===1);picker.dispose();const before=picker.getSnapshot();
  pending.slice(2).forEach(p=>p.resolve({options:[]}));await loading;check(picker.getSnapshot()===before&&changed===1);
 }],
 ['B14','Saved selection survives hierarchy failure; retry is explicit and clearing permits null',async()=>{
  const selected={birthplace_geonames_id:123,birthplace_name:'Saved',birthplace_country_code:'TR'};let calls=0,fail=true;
  const picker=createBirthplacePicker({selection:selected,request:async()=>{calls++;if(fail)throw Object.assign(new Error('private'),{code:'GEONAMES_UNAVAILABLE'});return {options:[]};}});
  await picker.start('en');check(calls===0&&picker.getSnapshot().selection===selected);
  await picker.edit();await tick();check(calls===1&&picker.getSnapshot().countries.status==='ERROR'&&picker.getSnapshot().selection===selected);
  fail=false;await picker.retry('countries');check(calls===2&&picker.getSnapshot().countries.status==='READY');
  await picker.clear();check(!picker.getSnapshot().selection&&!picker.getSnapshot().incomplete);picker.dispose();
 }],
 ['B15','A changed region invalidates both old child and settlement responses without leaving ancestor pages loading',async()=>{
  const pending=[];
  const picker=createBirthplacePicker({request:async(action,payload)=>{
    if(action==='listPlaceCountries')return {options:[{id:100,country:'TR',name:'Türkiye'}]};
    if(payload.parent_id===null)return {options:action==='listPlaceRegions'?[{id:1001,kind:'REGION',level:1,name:'First'},{id:1004,kind:'REGION',level:1,name:'Second'}]:[]};
    return new Promise(resolve=>pending.push({payload,resolve}));
  }});
  await picker.start('en');await picker.country(100);
  const first=picker.region(0,1001),second=picker.region(0,1004);
  pending.slice(2).forEach(p=>p.resolve({options:[{id:4001,kind:'REGION',name:'Current'}]}));await second;
  pending.slice(0,2).forEach(p=>p.resolve({options:[{id:1002,kind:'REGION',name:'Old'}]}));await first;
  check(picker.getSnapshot().path[0].id===1004&&picker.getSnapshot().regions[1].options[0].id===4001&&picker.getSnapshot().places.options[0].id===4001&&!picker.getSnapshot().selection);
  picker.dispose();
 }],
 ['B16','Identically named administrative and populated records remain different kinds and only P resolves',async()=>{
  const geo=adapter(async url=>{
    const response=await hierarchyFetch(url),data=await response.json();
    if(url.pathname==='/searchJSON')data.geonames=data.geonames.map(r=>({...r,name:'Same Name'}));
    if(url.pathname==='/getJSON')data.name='Same Name';
    return Response.json(data);
  });
  const region=(await geo.regions(input)).options[0],place=(await geo.places(input)).options[0];
  check(region.name===place.name&&region.kind==='REGION'&&place.kind==='PLACE'&&!region.place&&region.id!==place.id);
  await rejects(()=>geo.resolve(region.id),'GEONAMES_UNAVAILABLE');check((await geo.resolve(place.id)).birthplace_geonames_id===place.id);
 }],
 ['B17','Administrative pagination revalidates the inferred level and never treats the first page as complete',async()=>{
  const rows=Array.from({length:180},(_,i)=>({...fixtureRegions[0],geonameId:10000+i,adminCode1:String(i),name:`Region ${i}`}));
  const geo=adapter(async url=>url.pathname==='/searchJSON'?Response.json({totalResultsCount:rows.length,geonames:rows.slice(Number(url.searchParams.get('startRow')),Number(url.searchParams.get('startRow'))+100)}):hierarchyFetch(url));
  const first=await geo.regions(input),second=await geo.regions({...input,offset:100});
  check(first.options.length===100&&first.next_offset===100&&second.options.length===80&&second.previous_offset===0&&second.next_offset===null&&second.level===1);
  check(new Set([...first.options,...second.options].map(o=>o.id)).size===180);
 }],
 ['B18','Expanded country envelopes are bounded; streamed body timeout aborts without an unhandled rejection',async()=>{
  const geo=adapter(async()=>Response.json({geonames:fixtureCountries,unused:'x'.repeat(120000)}));check((await geo.countries('en')).options.length===3);
  let aborted=0,unhandled=0;const listener=()=>{unhandled++;};window.addEventListener('unhandledrejection',listener);
  try{
    const stalled=createGeoNamesAdapter({username:'fixture',timeoutMs:5,fetcher:async(_url,{signal})=>new Response(new ReadableStream({start(controller){signal.addEventListener('abort',()=>{aborted++;controller.error(new Error('private body fixture'));},{once:true});}}))});
    let caught;try{await stalled.countries('en');}catch(error){caught=error;}
    check(geoNamesDiagnostic(caught).code==='GEONAMES_REQUEST_TIMEOUT'&&aborted===1);await tick();check(unhandled===0);
  }finally{window.removeEventListener('unhandledrejection',listener);}
 }],
];
