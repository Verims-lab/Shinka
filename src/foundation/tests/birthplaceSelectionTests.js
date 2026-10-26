// v1.0 birthplace search (26.10.2026). Synthetic provider only: fixture success
// is never live GeoNames coverage or a real profile write.
import { check, rejects } from './dataModelTests';
import { createGeoNamesAdapter, placeNameMatches } from '../../../base44/shared/geonamesAdapter.js';
import { handleOnboardingRequest } from '../../../base44/shared/onboardingOperations.js';
import { createBirthplaceSearch } from '@/features/profile/birthplaceSearch';
import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { placeFetch, placeFetchFor, KAN_CANDIDATES, KAN_EXPECTED, KAN_REJECTED, fixtureCountry, fixtureStream } from './geonamesSearchFixture';

const adapter=(fetcher=placeFetch)=>createGeoNamesAdapter({username:'fixture',fetcher});
const manualTimers=()=>{const q=[];return {set:(fn)=>{q.push(fn);return q.length;},clear:id=>{if(id)q[id-1]=null;},flush:()=>{const fns=q.splice(0);fns.forEach(fn=>fn?.());},pending:()=>q.filter(Boolean).length};};
const settle=()=>new Promise(r=>setTimeout(r,0));
const rejectsInvalid=async(fn)=>{
 let caught=false;try{await fn();}catch(error){caught=true;check(error.code==='GEONAMES_UNAVAILABLE'&&error.diagnosticCode==='GEONAMES_INVALID_RESPONSE','public/diagnostic error contract');}
 check(caught,'invalid response unexpectedly succeeded');
};
const post=(f,body,geoNames)=>handleOnboardingRequest(new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify(body)}),()=>f.client,{geoNames});

/** @type {import('./testTypes').FoundationTest[]} */
export const BIRTHPLACE_SELECTION_TESTS=[
 ['BS01','0–2 trimmed characters make zero provider calls in adapter, handler and controller',async()=>{
  let fetches=0;const geo=adapter(async url=>{fetches++;return placeFetch(url);});
  for(const q of ['','k','ka','  ka  '])await rejects(()=>geo.search(q,'en'),'GEONAMES_QUERY_INVALID');
  const res=await post(sdkOnboardingFixture(),{action:'searchPlaces',query:' ka ',language_code:'en'},geo);check(res.status===400);
  let requests=0;const timers=manualTimers(),s=createBirthplaceSearch({request:async()=>{requests++;return {places:[]};},timers});
  for(const q of ['k','ka',' ka '])s.setQuery(q);timers.flush();await settle();
  check(fetches===0&&requests===0&&s.getSnapshot().status==='SHORT');
 }],
 ['BS02','Debounce sends one request for the final query only',async()=>{
  const sent=[],timers=manualTimers(),s=createBirthplaceSearch({request:async(a,p)=>{sent.push(p);return {places:[],next_page:null};},timers});
  for(const q of ['Kan','Kans','Kansa','Kansas'])s.setQuery(q);
  check(timers.pending()===1&&sent.length===0);timers.flush();await settle();
  check(sent.length===1&&sent[0].query==='Kansas'&&sent[0].page===0);
 }],
 ['BS03','Late responses after a new query, language change, cancel or dispose cannot change results',async()=>{
  const pending=[],timers=manualTimers(),s=createBirthplaceSearch({request:(a,p)=>new Promise(r=>pending.push({p,r})),timers});
  s.setQuery('Kan');timers.flush();s.setQuery('Kanp');timers.flush();
  pending[0].r({places:[{birthplace_geonames_id:1}]});await settle();check(s.getSnapshot().results.length===0);
  s.setLanguage('tr');timers.flush();pending[1].r({places:[{birthplace_geonames_id:2}]});await settle();check(s.getSnapshot().results.length===0);
  check(pending[2].p.language_code==='tr');
  s.cancel();pending[2].r({places:[{birthplace_geonames_id:3}]});await settle();check(s.getSnapshot().status==='IDLE');
  s.setQuery('Kanpur');timers.flush();s.dispose();pending[3].r({places:[{birthplace_geonames_id:4}]});await settle();check(s.getSnapshot().results.length===0);
 }],
 ['BS04','Document "Kan" examples: literal case-insensitive substring of the own name; upper-region-only match rejected',async()=>{
  for(const q of ['Kan','kan','KAN']){
   const {places}=await adapter().search(q,'en');const ids=places.map(p=>p.birthplace_geonames_id);
   check(KAN_EXPECTED.every(id=>ids.includes(id))&&KAN_REJECTED.every(id=>!ids.includes(id)),`${q} ${ids}`);
  }
  check(!placeNameMatches('Çanakkale','kan')&&!placeNameMatches('Çankaya','kan')&&!placeNameMatches('Wichita','kan'));
 }],
 ['BS05','Mid-word match without prefix rule; no diacritic folding or fuzzy match',async()=>{
  const {places}=await adapter().search('rkans','en');check(places.length===1&&places[0].birthplace_name==='Arkansas');
  check(placeNameMatches('Kansas City','sas c')&&!placeNameMatches('Çankaya','cank')&&!placeNameMatches('Kansas','knsas'));
 }],
 ['BS06','Path is Country — Region — Name with only existing, non-repeated levels; duplicate IDs removed',async()=>{
  const geo=adapter(placeFetchFor([...KAN_CANDIDATES,KAN_CANDIDATES[1],fixtureCountry]));
  const {places}=await geo.search('Kan','en'),by=id=>places.find(p=>p.birthplace_geonames_id===id);
  check(by(9002).place_path.join()==='United States,Missouri'&&by(9003).place_path.join()==='India,Uttar Pradesh');
  check(by(9001).place_path.join()==='United States'&&by(9001).place_kind==='REGION'&&by(9004).place_path.join()==='Guinea');
  check(by(9010).place_kind==='COUNTRY'&&by(9010).place_path.length===0&&places.filter(p=>p.birthplace_geonames_id===9002).length===1);
  check(places.filter(p=>p.birthplace_name==='Kansas').length===2,'same-name records stay distinct');
 }],
 ['BS07','Provider request: q + isNameRequired, repeated featureClass A/P, bounded rows, manual redirect, no name_startsWith',async()=>{
  const seen=[];await adapter(async(url,options)=>{seen.push({url,options});return placeFetch(url);}).search('Kan','tr',2);
  const p=seen[0].url.searchParams;
  check(p.get('q')==='Kan'&&p.get('isNameRequired')==='true'&&p.getAll('featureClass').join()==='A,P'&&!p.has('name_startsWith'));
  check(p.get('maxRows')==='50'&&p.get('startRow')==='100'&&p.get('lang')==='tr'&&seen[0].options.redirect==='manual');
 }],
 ['BS08','Empty first page after filtering keeps next page; bounded last page reports limit; controller appends',async()=>{
  const noise=Array.from({length:50},(_,i)=>({...KAN_CANDIDATES[4],geonameId:20000+i}));
  const rows=[...noise,...KAN_CANDIDATES,...Array.from({length:150},(_,i)=>({...KAN_CANDIDATES[5],geonameId:30000+i}))];
  const geo=adapter(placeFetchFor(rows));
  const first=await geo.search('Kan','en');check(first.places.length===0&&first.next_page===1&&!first.limited);
  const second=await geo.search('Kan','en',1);check(second.places.length===KAN_EXPECTED.length&&second.next_page===2);
  const last=await geo.search('Kan','en',3);check(last.next_page===null&&last.limited===true);
  await rejects(()=>geo.search('Kan','en',4),'INVALID_REQUEST');
  const timers=manualTimers(),s=createBirthplaceSearch({request:(a,p)=>geo.search(p.query,p.language_code,p.page),timers});
  s.setQuery('Kan');timers.flush();await settle();await settle();check(s.getSnapshot().results.length===0&&s.getSnapshot().next_page===1);
  await s.more();check(s.getSnapshot().results.length===KAN_EXPECTED.length);
  s.setQuery('Kanp');check(s.getSnapshot().results.length===0&&s.getSnapshot().next_page===null,'new query resets paging');
 }],
 ['BS09','A (country/region) and P IDs resolve to provider fields; other classes rejected',async()=>{
  const geo=adapter();
  for(const row of [KAN_CANDIDATES[0],KAN_CANDIDATES[2],fixtureCountry]){
   const out=await geo.resolve(row.geonameId);
   check(out.birthplace_name===row.name&&out.birthplace_country_code===row.countryCode&&out.birthplace_latitude===Number(row.lat)&&out.birthplace_longitude===Number(row.lng));
  }
  await rejectsInvalid(()=>geo.resolve(fixtureStream.geonameId));
 }],
 ['BS10','Free text and client-supplied place fields cannot be saved',async()=>{
  for(const extra of [{birthplace_name:'Kansas'},{birthplace_latitude:1},{query:'Kansas'}]){
   const res=await post(sdkOnboardingFixture(),{action:'saveProfile',birth_date:'1990-01-01',...extra},adapter());check(res.status===400);
  }
 }],
 ['BS11','429 and provider errors are distinct from empty results; retry is explicit and single',async()=>{
  for(const code of ['GEONAMES_RATE_LIMITED','GEONAMES_UNAVAILABLE']){
   let calls=0;const timers=manualTimers(),s=createBirthplaceSearch({request:async()=>{calls++;throw Object.assign(new Error(code),{code});},timers});
   s.setQuery('Kansas');timers.flush();await settle();
   const snap=s.getSnapshot();check(snap.status==='ERROR'&&snap.error===code&&snap.results.length===0);
   await settle();check(calls===1&&timers.pending()===0);await s.retry();check(calls===2);
  }
 }],
 ['BS12','Bounded transport kept: oversized search envelope is invalid, never empty',async()=>{
  const big=JSON.stringify({geonames:[],pad:'x'.repeat(1100000)});
  await rejectsInvalid(()=>adapter(async()=>new Response(big)).search('Kansas','en'));
 }],
];