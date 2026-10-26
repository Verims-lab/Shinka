import { notificationFixture } from './notificationFixture';
import { check, rejects } from './dataModelTests';
import { handleNotificationSchedule } from '../../../base44/shared/notificationScheduler.js';
import { base44PushProvider, validateReportedPushInput } from '../../../base44/shared/base44PushProvider.js';
const call = (f, {owner='adminA',body=/** @type {Record<string,unknown>} */({action:'tick'}),headers={},enabled=true,raw=()=>f.raw(owner),createProvider=()=>f.provider}={}) => handleNotificationSchedule(new Request('https://fixture.invalid/schedule',{method:'POST',body:JSON.stringify(body),headers}),{createClient:raw,enabled,createProvider,library:f.library,now:f.now});
const mutations = f => f.state.calls.filter(c=>c.method!=='filter');
const workReads = f => f.state.calls.filter(c=>!['User','UserPrivacyRequest','AdminTestOperation'].includes(c.name));
/** @type {import('./testTypes').FoundationTest[]} */
export const NOTIFICATION_CONTRACT_TESTS = [
 ['NC01','Missing/failed identity stops before service role, job IO or provider construction',async()=>{
  for(const throws of [false,true]){
   const f=notificationFixture();let service=0,providers=0;
   const raw=()=>({auth:{me:async()=>{if(throws)throw new Error('private auth detail');return null;}},get asServiceRole(){service++;throw new Error('UNAUTHORIZED_SERVICE');}});
   const response=await call(f,{raw,createProvider:()=>{providers++;return f.provider;}});
   check(response.status===(throws?503:401)&&(await response.json()).error_code===(throws?'SESSION_UNAVAILABLE':'AUTH_REQUIRED'));check(service===0&&providers===0&&f.state.calls.length===0);
  }
 }],
 ['NC02','Normal, demoted cached-admin and removed native User cannot start work',async()=>{
  for(const mode of ['user','demoted','removed']){
   const f=notificationFixture();let providers=0;
   if(mode==='demoted')f.tables.User.find(u=>u.id==='adminA').role='user';
   if(mode==='removed')f.tables.User=f.tables.User.filter(u=>u.id!=='adminA');
   const raw=()=>({...f.raw(mode==='user'?'ownerA':'adminA'),auth:{me:async()=>({id:mode==='user'?'ownerA':'adminA',role:'admin'})}});
   const response=await call(f,{raw,createProvider:()=>{providers++;return f.provider;}});
   check(response.status===(mode==='removed'?401:403));check(mutations(f).length===0&&workReads(f).length===0&&providers===0&&f.sent.length===0);
  }
 }],
 ['NC03','Fake workflow headers, authority flags and run IDs never establish caller identity',async()=>{
  for(const body of [{action:'tick'},{action:'tick',system:true},{action:'tick',admin:true},{action:'tick',run_id:'synthetic-run'}]){
   const f=notificationFixture();const r=await call(f,{owner:null,body,headers:{'Base44-Service-Authorization':'synthetic','X-Workflow-Run-Id':'synthetic-run'}});
   check(r.status===401&&f.state.calls.length===0&&f.sent.length===0);
  }
  const f=notificationFixture();check((await call(f,{body:{action:'tick',run_id:'synthetic-run'}})).status===400&&mutations(f).length===0);
 }],
 ['NC04','Verified native admin can start the bounded job directly with a synthetic provider',async()=>{
  const f=notificationFixture();
  const queued=await call(f);check(queued.status===200&&(await queued.json()).counts.QUEUED===1);
  f.advance();const sent=await call(f);check(sent.status===200&&(await sent.json()).counts.ACCEPTED===1);
  await call(f);check(f.sent.length===1&&f.tables.NotificationDelivery.length===1&&f.tables.NotificationDelivery[0].attempt_count===1);
 }],
 ['NC05','Admin role revoked after intent write prevents send and further checkpoint mutations',async()=>{
  const f=notificationFixture();await call(f);f.advance();let boundary=0;
  f.state.after=async c=>{if(c.name==='NotificationDelivery'&&c.method==='update'&&c.args[1].dispatch_state==='IN_FLIGHT'){
   f.state.after=null;f.tables.User.find(u=>u.id==='adminA').role='user';boundary=f.state.calls.length;
  }};
  const response=await call(f);check(response.status===403&&boundary>0&&f.sent.length===0);
  check(f.state.calls.slice(boundary).every(c=>c.method==='filter')&&f.tables.NotificationDelivery[0].dispatch_state==='IN_FLIGHT');
 }],
 ['NC06','Reported input names and character limits are enforced with Home-only optional destination',async()=>{
  const valid={user_id:'ownerA',title:'😀'.repeat(100),content:'x'.repeat(500),action_label:'x'.repeat(50),action_url:'/'};
  check(validateReportedPushInput(valid).title===valid.title);
  check(validateReportedPushInput({...valid,action_label:null,action_url:null}).action_label===null);
  for(const patch of [{user_id:0},{user_id:''},{title:'x'.repeat(101)},{content:'x'.repeat(501)},{action_label:'x'.repeat(51)},{action_label:false},{message:'wrong-key'}])await rejects(()=>validateReportedPushInput({...valid,...patch}),'PUSH_INPUT_INVALID');
  for(const url of ['https://outside.invalid','//outside.invalid','/?date=2020-01-01',5])await rejects(()=>validateReportedPushInput({...valid,action_url:url}),'PUSH_DESTINATION_INVALID');
  let sent;
  const adapter=base44PushProvider({asServiceRole:{integrations:{Core:{SendPushNotification:async input=>{sent=input;return null;}}}}});
  check((await adapter.send({owner:'ownerA',language:'en'})).kind==='unknown');
  check(JSON.stringify(sent)===JSON.stringify({user_id:'ownerA',title:'Shinka',content:'Your daily Shinka is ready'}));
 }],
 ['NC07','Resolved objects and 403/502/timeout remain UNKNOWN; no blind retry or raw payload leak',async()=>{
  for(const response of [{success:true,delivered:true,message_id:'private'},null,'private',Object.assign(new Error('private'),{status:403}),Object.assign(new Error('private'),{status:502}),new Error('timeout')]){
   const f=notificationFixture();let calls=0,params;
   const adapter=base44PushProvider({asServiceRole:{integrations:{Core:{SendPushNotification:async input=>{calls++;params=input;if(response instanceof Error)throw response;return response;}}}}});
   f.options.provider={...adapter,eligibility:async()=>({support:'SUPPORTED',permission:'GRANTED'})};
   const before=JSON.stringify(f.tables.UserDailyMessage);await f.tick();f.advance();await f.tick();f.advance(15);await f.tick();
   check(calls===1&&f.tables.NotificationDelivery[0].dispatch_state==='UNKNOWN'&&f.tables.NotificationDelivery[0].delivery_status==='FAILED');
   check(JSON.stringify(params)===JSON.stringify({user_id:'ownerA',title:'Shinka',content:'Günlük Shinka içeriğin hazır'}));
   check(!JSON.stringify(f.tables.NotificationDelivery).includes('private')&&JSON.stringify(f.tables.UserDailyMessage)===before);
  }
 }],
 ['NC08','Unknown actual adapter eligibility keeps sends off while common daily generation works',async()=>{
  const f=notificationFixture({current:false});let providerCalls=0;
  const adapter=base44PushProvider({asServiceRole:{integrations:{Core:{SendPushNotification:async()=>{providerCalls++;return {};}}}}});
  const response=await call(f,{createProvider:()=>adapter});check(response.status===200&&(await response.json()).counts.INELIGIBLE===1);
  check(providerCalls===0&&f.tables.NotificationDelivery.length===0&&f.tables.UserDailyMessage.length===2);
  const d=f.tables.UserDailyMessage[1];await f.today();check(f.tables.UserDailyMessage[1].id===d.id);
 }],
 ['NC09','Changed authenticated principal cannot inherit an earlier admin admission',async()=>{
  const f=notificationFixture();let n=0;
  const raw=()=>({...f.raw('adminA'),auth:{me:async()=>({id:++n===1?'adminA':'adminB',role:'admin'})}});
  check((await call(f,{raw})).status===401&&mutations(f).length===0&&workReads(f).length===0&&f.sent.length===0);
 }],
];
