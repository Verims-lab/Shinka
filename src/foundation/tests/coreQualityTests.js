import { check, rejects } from './dataModelTests';
import { nativeFixture } from './nativeFixture';
import { youFixture } from './youFixture';
import { domainAccessOperation } from '../../../base44/shared/domainAccess.js';
import { createYouController } from '@/features/you/youController';
import { syntheticProbe } from '../health/cases/domainProbe';

/** @type {import('./testTypes').FoundationTest[]} */
export const CORE_QUALITY_TESTS = [
 ['CQ09','Health helper groups reject duplicate IDs; empty/failing groups never PASS or enter completed cache',async()=>{
   let invoked=0;const run=async()=>{invoked++;};
   await rejects(()=>syntheticProbe([['TEST01','one',run],['TEST01','duplicate',run]])());check(invoked===0,'duplicate group executed');
   check((await syntheticProbe([])()).status==='FAIL','empty group passed');
   const cache=new Map(),bad=async()=>{throw new Error('synthetic failure');};
   check((await syntheticProbe([['TEST02','failure',bad]])({testResults:cache})).status==='FAIL'&&!cache.has(bad),'failure cached');
 }],
 ['CQ01','Bounded domain lists signal overflow at 101, exact 100 remains complete, owner and projection stay enforced',async()=>{
   const f=nativeFixture();
   f.tables.UserPeriodRecord=Array.from({length:101},(_,i)=>({id:`period-${i}`,user_id:'ownerA',period_start_date:'2026-10-01',created_by:'private@example.invalid',undeclared:'private'}));
   const read=()=>domainAccessOperation(f.client(),{entity:'user_period_record',action:'read'});
   const value=await read();check(value.records.length===100&&value.truncated===true,'silent truncation');
   check(!JSON.stringify(value).includes('private'),'undeclared fields exposed');
   f.tables.UserPeriodRecord.pop();check((await read()).truncated===false,'exact boundary falsely incomplete');
   check((await domainAccessOperation(f.client(),{entity:'user_period_record',action:'read',recordId:'foreign'})).records.length===0);
   f.tables.UserHealthConsent[0].consent_status='WITHDRAWN';await rejects(read,'HEALTH_CONSENT_REQUIRED');
 }],
 ['CQ02','Domain read rejects malformed and duplicate readbacks; leaked sentinel owner is not hidden by slicing',async()=>{
   for(const bad of [null,{},[{id:'same',user_id:'ownerA'},{id:'same',user_id:'ownerA'}],[{user_id:'ownerA'}]]) {
     const f=nativeFixture(),client=f.client();// Install a stable entity wrapper over the ordinary SDK fixture.
     const store=client.asServiceRole.entities;
     client.asServiceRole.entities=new Proxy(store,{get:(target,key)=>key==='UserPeriodRecord'?{filter:async()=>bad}:target[key]});
     await rejects(()=>domainAccessOperation(client,{entity:'user_period_record',action:'read'}),'DOMAIN_READ_INVALID');
   }
   const f=nativeFixture(),client=f.client(),store=client.asServiceRole.entities;
   const rows=Array.from({length:101},(_,i)=>({id:`row-${i}`,user_id:i===100?'ownerB':'ownerA'}));
   client.asServiceRole.entities=new Proxy(store,{get:(target,key)=>key==='UserPeriodRecord'?{filter:async()=>rows}:target[key]});
   await rejects(()=>domainAccessOperation(client,{entity:'user_period_record',action:'read'}),'OWNER_REQUIRED');
 }],
 ['CQ03','Unknown preferences save cannot be discarded by edit, load, cancel or a second section save',async()=>{
   const f=youFixture(),controller=createYouController(f.request);await controller.load();
   controller.preference('notifications_enabled',!controller.getSnapshot().preferences.notifications_enabled);
   f.once('after',c=>c.name==='UserPreferences'&&c.method==='updateMany');await controller.savePreferences();
   const intent=controller.getSnapshot().intent;check(intent&&controller.getSnapshot().error.unknown,'fault not reached');
   const calls=f.state.calls.length;
   controller.edit();controller.cancel();await controller.load();await controller.savePreferences();await controller.saveProfile();
   check(controller.getSnapshot().intent===intent&&controller.getSnapshot().error.unknown&&!controller.getSnapshot().editing,'unknown intent overwritten');
   check(f.state.calls.length===calls,'new action during uncertain outcome');
   await controller.check();check(controller.getSnapshot().result==='preferences'&&!controller.getSnapshot().intent);controller.dispose();
 }],
 ['CQ04','Failed read-only verification preserves original unknown save; same payload check later reconciles without another write',async()=>{
   const f=youFixture();let failCheck=true;
   const controller=createYouController((action,payload)=>action==='verifyPreferences'&&failCheck?Promise.reject({code:'YOU_READ_FAILED',unknown:false}):f.request(action,payload));
   await controller.load();controller.preference('notifications_enabled',!controller.getSnapshot().preferences.notifications_enabled);
   f.once('after',c=>c.name==='UserPreferences'&&c.method==='updateMany');await controller.savePreferences();const intent=controller.getSnapshot().intent;
   await controller.check();check(controller.getSnapshot().error.unknown&&controller.getSnapshot().intent===intent,'failed check unlocked unknown write');
   failCheck=false;await controller.check();check(controller.getSnapshot().result==='preferences'&&!controller.getSnapshot().error);
   check(f.state.calls.filter(c=>c.name==='UserPreferences'&&c.method==='updateMany').length===1,'verification wrote');controller.dispose();
 }],
 ['CQ05','Admin acts on synthetic B with reset/deletion, interruption and resume; fresh A session and role remain intact',async()=>{
   for(const operation of ['RESET_ONBOARDING','DELETE_USER']) {
     const f=nativeFixture();const before=structuredClone(f.tables.User.find(u=>u.id==='adminA'));
     const view=await f.preview(operation);
     if(operation==='DELETE_USER')f.once('after',c=>c.name==='UserProfile'&&c.method==='delete');
     try {await f.execute(view);}catch(error){check(operation==='DELETE_USER'&&f.tables.AdminTestOperation[0].status==='RETRY_REQUIRED','unexpected operation failure');}
     if(operation==='DELETE_USER')await f.tools({action:'resume',target_id:'ownerA',operation_id:f.tables.AdminTestOperation[0].operation_id});
     const actor=await f.client('adminA').auth.me();check(actor.id==='adminA'&&actor.role==='admin'&&JSON.stringify(f.tables.User.find(u=>u.id==='adminA'))===JSON.stringify(before));
     check(!f.state.signedOut&&f.tables.User.some(u=>u.id==='ownerB'),'unrelated identity changed');
     await rejects(()=>f.tools({action:'preview',target_id:'ownerB',operation},'ownerB'),'FORBIDDEN_INTERNAL_TOOLING');
   }
 }],
];
