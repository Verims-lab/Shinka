import { handleDailyMessageRequest } from '../../../base44/shared/dailyMessageOperation.js';
import { dailyMessageRequest } from '@/services/dailyMessageService';
import { internalHealthOperation } from '../../../base44/shared/internalHealthOperations.js';
import { handleInternalRequest } from '../../../base44/shared/internalAuthorization.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { check } from './dataModelTests';
import { nativeFixture } from './nativeFixture';
import { notificationFixture } from './notificationFixture';
import { contentFixture } from './dailyFixture';
import { dailyResponseRecord, readMessageTextMap, LEGACY_DAILY_TEXT_FIELDS, DAILY_TEXT_FIELDS } from '../../../base44/shared/dailyContent.js';
import { nativeDailyPersistence, reconcileDailyRows } from '../../../base44/shared/nativeDailyPersistence.js';
import { readDailySelectionLibrary } from '../../../base44/shared/dailySelectionLibrary.js';
import { selectDailyPair } from '../../../base44/shared/dailySelection.js';
import { dailyReferenceMigration } from '../../../base44/shared/dailyReferenceMigration.js';
const rejects=async(fn,code)=>{try{await fn();}catch(e){check(e.code===code,`expected ${code}, got ${e.code}`);return;}throw new Error(`expected ${code}`);};
const assignment=row=>Object.fromEntries(['id','user_id','shinka_date','timezone','category_id','message_pair_id','generated_at'].map(k=>[k,row[k]]));
const legacy = async f=>{await f.today();const row=f.tables.UserDailyMessage[0];Object.assign(row,Object.fromEntries(LEGACY_DAILY_TEXT_FIELDS.map(k=>[k,'old copy intentionally different'])));return row;};
const admin = f=>{f.tables.UserProfile.push({...f.tables.UserProfile[0],id:'admin-profile',user_id:'adminA'});return f.raw('adminA');};
/** @type {import('./testTypes').FoundationTest[]} */
export const DAILY_REFERENCE_TESTS=[
 ['ID10','Web maintenance dispatch remains current-admin/ACTIVE/app bound and rejects arbitrary operations',async()=>{
  const f=nativeFixture();await legacy(f);const client=admin(f);client.getConfig=()=>({appId:'6ad5190f4845d4e3af03b420'});
  const invoke=(body,c=client)=>handleInternalRequest(new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify(body)}),()=>withUserLifecycle(c),internalHealthOperation);
  const body={action:'dailyReferenceMigration',request:{action:'dryRun'}};
  const ok=await invoke(body);check(ok.status===200&&(await ok.json()).rows.length===1);
  check((await invoke(body,f.raw())).status===403);
  check((await invoke(body,f.raw(null))).status===401);
  const wrong={...client,getConfig:()=>({appId:'wrong'})};check((await invoke(body,wrong)).status===409);
  for(const patch of [{table:'User'},{request:{action:'delete'}},{request:{action:'applyBatch',ids:['x'],patch:{message_pair_id:'x'}}}])check((await invoke({...body,...patch})).status>=400);
  f.tables.UserProfile.find(p=>p.user_id==='adminA').account_status='INACTIVE';check((await invoke(body)).status===409);
  check(!f.state.calls.some(c=>c.method==='updateMany'),'unauthorized write');
 }],
 ['ID11','Migration fingerprints retain every assignment and paginated NotificationDelivery link; stale links block writes',async()=>{
  const f=nativeFixture(),row=await legacy(f),client=admin(f);
  f.tables.NotificationDelivery=Array.from({length:101},(_,i)=>({id:`link-${String(i).padStart(3,'0')}`,user_id:row.user_id,daily_message_id:row.id}));
  let plan=await dailyReferenceMigration(client,{action:'dryRun'});check(plan.rows[0].linkCount===101);
  const links=JSON.stringify(f.tables.NotificationDelivery),receipt=plan.rows[0];
  const applied=await dailyReferenceMigration(client,{action:'applyBatch',ids:plan.ids,reviewed_digest:plan.reviewed_digest});
  const after=(await dailyReferenceMigration(client,{action:'verify'})).rows[0];
  check(applied.complete&&receipt.assignmentDigest===after.assignmentDigest&&receipt.linksDigest===after.linksDigest&&links===JSON.stringify(f.tables.NotificationDelivery));
  row.message_tr_snapshot='legacy';plan=await dailyReferenceMigration(client,{action:'dryRun'});
  f.tables.NotificationDelivery[0].user_id='ownerB';
  await rejects(()=>dailyReferenceMigration(client,{action:'applyBatch',ids:plan.ids,reviewed_digest:plan.reviewed_digest}),'MIGRATION_REVIEW_EXPIRED');
  check((await dailyReferenceMigration(client,{action:'verify'})).rows[0].status==='LINK_OWNER_INVALID'&&Object.hasOwn(row,'message_tr_snapshot'));
 }],
 ['ID12','Existing daily 429/503 transport errors identify reference stage; retry reuses assignment without exposing raw errors',async()=>{
  const f=nativeFixture();await f.today();const before=JSON.stringify(f.tables.UserDailyMessage);
  const call=()=>handleDailyMessageRequest(new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify({action:'today',timezone:'Europe/Istanbul'})}),()=>f.client(),{native:true,now:f.now,library:f.library});
  for(const status of [429,503]){
    f.state.before=c=>{if(c.name==='MessagePair')throw {status,message:'PRIVATE_RAW_ERROR',response:{status,data:{private:'PRIVATE_RESPONSE'}}};};
    const response=await call(),body=await response.json();
    check(response.status===500&&body.diagnostic.stage==='DAILY_CONTENT_REFERENCE'&&body.diagnostic.code===(status===429?'RATE_LIMITED':'SERVICE_UNAVAILABLE'));
    check(!JSON.stringify(body).includes('PRIVATE')&&/^[a-f0-9-]{36}$/.test(body.diagnostic.requestId));
    let observed=null;try{await dailyMessageRequest({functions:{invoke:async()=>({data:body})}});}catch(e){observed=e;}
    check(observed?.diagnostic?.stage==='DAILY_CONTENT_REFERENCE'&&observed.code==='DAILY_OPERATION_FAILED');
    f.state.before=null;const result=await (await call()).json();
    check(!result.created&&result.daily.id===f.tables.UserDailyMessage[0].id&&JSON.stringify(f.tables.UserDailyMessage)===before);
  }
 }],
 ['ID01','New/legacy daily rows resolve all current TR/EN text without changing assignment',async()=>{
  const f=nativeFixture(), first=await f.today(), row=f.tables.UserDailyMessage[0], before=JSON.stringify(assignment(row));
  check(!LEGACY_DAILY_TEXT_FIELDS.some(k=>Object.hasOwn(row,k)));
  const pair=f.tables.MessagePair.find(p=>p.id===row.message_pair_id);
  Object.assign(row,Object.fromEntries(LEGACY_DAILY_TEXT_FIELDS.map(k=>[k,'different old text'])));
  for(const key of DAILY_TEXT_FIELDS) pair[key]=`updated ${key}`;
  pair.is_active='Inactive'; const again=await f.today();
  check(first.daily.id===again.daily.id&&before===JSON.stringify(assignment(row)));
  check(DAILY_TEXT_FIELDS.every(k=>again.daily[`${k}_snapshot`]===pair[k]));
  check(f.state.calls.filter(c=>c.method==='create'&&c.name==='UserDailyMessage').length===1);
 }],
 ['ID02','Broken references fail safely; no fallback or reassignment; wrong owner denied',async()=>{
  for(const kind of ['missing','invalid']){const f=nativeFixture(),row=await legacy(f),before=JSON.stringify(f.tables.UserDailyMessage);const pair=f.tables.MessagePair.find(p=>p.id===row.message_pair_id);if(kind==='missing')f.tables.MessagePair=f.tables.MessagePair.filter(p=>p.id!==pair.id);else pair.message_en='';await rejects(f.today,kind==='missing'?'DAILY_CONTENT_REFERENCE_MISSING':'DAILY_CONTENT_REFERENCE_INVALID');check(JSON.stringify(f.tables.UserDailyMessage)===before);}
  const f=nativeFixture(), row=await legacy(f);await rejects(()=>dailyResponseRecord(f.client(),row,'ownerB',row.shinka_date),'DAILY_READBACK_CONFLICT');
 }],
 ['ID03','ID batches are bounded/projected; duplicate/unrequested reference rows rejected',async()=>{
  const f=nativeFixture(),ids=f.tables.MessagePair.slice(0,205).map(p=>p.id);const map=await readMessageTextMap(f.raw(),[...ids,ids[0]]);check(map.size===205);
  const calls=f.state.calls.filter(c=>c.name==='MessagePair');check(calls.length===3&&calls.every(c=>c.args[0].id.$in.length<=100&&JSON.stringify(c.args[4])===JSON.stringify(['id',...DAILY_TEXT_FIELDS])));
  f.tables.MessagePair.push({...f.tables.MessagePair[0]});await rejects(()=>readMessageTextMap(f.raw(),[ids[0]]),'DAILY_CONTENT_REFERENCE_INVALID');
 }],
 ['ID04','Selection metadata excludes texts; inactive excluded only from new selection; history stays projected',async()=>{
  const f=nativeFixture(),{source,decision}=contentFixture();f.tables.MessagePair[0].is_active='Inactive';
  const lib=await readDailySelectionLibrary(f.raw(),source,decision);check(!Object.hasOwn(lib.actual.message_pair[0],'message_tr'));
  const chosen=selectDailyPair({pairs:lib.actual.message_pair,history:[],categoryId:f.tables.MessagePair[0].category_id,day:'2026-10-20',random:()=>0});check(chosen.pair.id!==f.tables.MessagePair[0].id);
  const row=await legacy(f);f.state.calls.length=0;const history=await nativeDailyPersistence(f.raw(),'ownerA').history('2026-09-11','2026-10-20');check(history.length===1&&!LEGACY_DAILY_TEXT_FIELDS.some(k=>Object.hasOwn(history[0],k)));
  check(f.state.calls.every(c=>!c.args[4].some(k=>k.endsWith('_snapshot'))));
  check(reconcileDailyRows([row,{...row,id:'other',message_tr_snapshot:'different'}],'ownerA',row.shinka_date).notice===null);
 }],
 ['ID05','Migration dry-run hashes review; batch removes only legacy fields; repeat/verify clean',async()=>{
  const f=nativeFixture(),row=await legacy(f),client=admin(f),before=JSON.stringify(assignment(row));
  const plan=await dailyReferenceMigration(client,{action:'dryRun'});check(plan.rows[0].legacyFields===4&&!plan.clean);check(!f.state.calls.some(c=>c.method==='updateMany'));
  const result=await dailyReferenceMigration(client,{action:'applyBatch',ids:plan.ids,reviewed_digest:plan.reviewed_digest});check(result.complete&&JSON.stringify(assignment(row))===before&&!LEGACY_DAILY_TEXT_FIELDS.some(k=>Object.hasOwn(row,k)));
  const verified=await dailyReferenceMigration(client,{action:'verify'});check(verified.clean);
  const writes=f.state.calls.filter(c=>c.method==='updateMany').length;check((await dailyReferenceMigration(client,{action:'applyBatch',ids:verified.ids,reviewed_digest:verified.reviewed_digest})).complete);check(f.state.calls.filter(c=>c.method==='updateMany').length===writes);
 }],
 ['ID06','Migration lost response, partial failure and restart preserve IDs and shared records',async()=>{
  const f=nativeFixture(),row=await legacy(f),client=admin(f);f.tables.UserDailyMessage.push({...row,id:'z-second',shinka_date:'2026-10-19'});const shared=JSON.stringify(f.tables.MessagePair);
  let plan=await dailyReferenceMigration(client,{action:'dryRun'});f.once('after',c=>c.name==='UserDailyMessage'&&c.method==='updateMany');check((await dailyReferenceMigration(client,{action:'applyBatch',ids:plan.ids,reviewed_digest:plan.reviewed_digest})).complete);
  Object.assign(row,{message_tr_snapshot:'old'});Object.assign(f.tables.UserDailyMessage[1],{message_tr_snapshot:'old'});plan=await dailyReferenceMigration(client,{action:'dryRun'});f.once('before',c=>c.method==='updateMany'&&c.args[0].id==='z-second');const partial=await dailyReferenceMigration(client,{action:'applyBatch',ids:plan.ids,reviewed_digest:plan.reviewed_digest});check(!partial.complete&&partial.pendingIds[0]==='z-second');
  plan=await dailyReferenceMigration(client,{action:'dryRun'});check((await dailyReferenceMigration(client,{action:'applyBatch',ids:plan.ids,reviewed_digest:plan.reviewed_digest})).complete&&shared===JSON.stringify(f.tables.MessagePair));
 }],
 ['ID07','Migration reports broken links, rejects stale review/normal role, guards target lifecycle',async()=>{
  const f=nativeFixture(),row=await legacy(f),client=admin(f),plan=await dailyReferenceMigration(client,{action:'dryRun'});row.message_pair_id='missing';await rejects(()=>dailyReferenceMigration(client,{action:'applyBatch',ids:plan.ids,reviewed_digest:plan.reviewed_digest}),'MIGRATION_REVIEW_EXPIRED');
  const bad=await dailyReferenceMigration(client,{action:'dryRun'});check(bad.rows[0].status==='REFERENCE_MISSING');check(!(await dailyReferenceMigration(client,{action:'applyBatch',ids:bad.ids,reviewed_digest:bad.reviewed_digest})).complete&&Object.hasOwn(row,'message_tr_snapshot'));
  await rejects(()=>dailyReferenceMigration(f.raw(),{action:'dryRun'}),'FORBIDDEN_INTERNAL_TOOLING');
  row.message_pair_id=f.tables.MessagePair[0].id;await f.execute(await f.preview());const busy=await dailyReferenceMigration(client,{action:'dryRun'});const result=await dailyReferenceMigration(client,{action:'applyBatch',ids:busy.ids,reviewed_digest:busy.reviewed_digest});check(result.outcomes[0].status==='MIGRATION_TARGET_BUSY');
 }],
 ['ID08','Migration keyset page bound, no hidden invalid-reference success',async()=>{
  const f=nativeFixture(),row=await legacy(f),client=admin(f);f.tables.UserDailyMessage=Array.from({length:26},(_,i)=>({...row,id:`daily-${String(i).padStart(3,'0')}`}));
  const first=await dailyReferenceMigration(client,{action:'dryRun'});const second=await dailyReferenceMigration(client,{action:'verify',cursor:first.nextCursor});check(first.ids.length===25&&first.hasMore&&second.ids.length===1&&!second.hasMore&&!second.clean);
 }],
 ['ID09','Notification daily links are retained; cross-owner or missing link blocks admission',async()=>{
  const f=notificationFixture();await f.send();const row=f.tables.NotificationDelivery[0];check(row.daily_message_id===f.daily.id);f.advance();f.tables.UserDailyMessage.push({...f.tables.UserDailyMessage[0],id:'ownerA-completion'});f.tables.UserDailyMessage[0].user_id='ownerB';await rejects(f.send,'NOTIFICATION_RECONCILIATION_BLOCKED');check(f.sent.length===0);
 }],
];
