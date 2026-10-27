import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import TestTools from '@/pages/internal/TestTools';
import { TEST_TOOLS_COPY } from '../i18n/testToolsCopy';
import { deletionFixture } from './deletionFixture';
import { adminTestRequest } from '@/services/internal/adminTestTools';
import { check, rejects } from './dataModelTests';
import { waitForFixture } from './domWait';
import { testEventTurn } from './testClock';
const KEY='shinka.pending-test-operation';
async function mounted(f,request,run,context={},restore=false) {
 if(!restore)sessionStorage.removeItem(KEY);
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:360px';document.body.appendChild(host);
 const root=createRoot(host);let closed=false;
 const dispose=()=>{if(!closed){closed=true;root.unmount();host.remove();}};context.cleanup?.(dispose);
 const turn=()=>testEventTurn(context.signal),until=fn=>waitForFixture(fn,host,context),q=s=>host.querySelector(s);
 root.render(h(MemoryRouter,{initialEntries:[{pathname:'/internal/test-tools',state:{language:'tr'}}]},h(TestTools,{request,clock:f.clock,wait:async ms=>{f.measure.time+=ms;await turn();}})));
 const begin=async()=>{
   const input=q('#test-user-id');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'ownerA');input.dispatchEvent(new Event('input',{bubbles:true}));await turn();q('#test-lookup-button').click();await until(()=>q('[data-test-target]'));
   q('[data-destructive="true"]').click();await until(()=>q('[data-test-preview]'));const button=q('[data-test-preview] [data-variant="primary"]');button.click();button.click();
 };
 try {await until(()=>q('#test-user-id'));await run({q,host,until,turn,begin,dispose});}finally{dispose();}
}
/** @type {import('./testTypes').FoundationTest[]} */
export const DELETION_UI_TESTS=[
 ['DXU01','Real component/service/HTTP/native slow passes: bounded pause, explicit same-operation resume, fresh completion and reload',async(context={})=>{
  const saved=sessionStorage.getItem(KEY),f=deletionFixture({latency:300});
  try {
   await mounted(f,f.request,async({begin,until,q,host,turn})=>{
    const settled=()=>q('[data-test-busy="false"][data-test-phase="PARTIAL"]')||q('[data-test-busy="false"][data-test-phase="COMPLETED"]');
    await begin();await until(settled);
    for(let i=0;!host.textContent.includes(TEST_TOOLS_COPY.tr.deletedResult)&&i<10;i++){
     const button=q('[data-test-resume]');check(button&&!button.disabled,'no single recovery action');button.click();await turn();await until(settled);
    }
    check(host.textContent.includes('Kullanıcı silindi.')&&!q('[data-test-target]'),'unconfirmed success or stale card');
    check(f.measure.calls.filter(c=>c.action==='execute').length===1,'double-click/new operation');
   },context);
   const count=f.state.calls.length,id=f.tables.AdminTestOperation[0].operation_id;
   await mounted(f,f.request,async({until,host})=>{await until(()=>host.textContent.includes(TEST_TOOLS_COPY.tr.deletedResult));check(host.textContent.includes(id),'reload changed operation');},context,true);
   check(f.state.calls.slice(count).every(c=>c.method==='filter'),'reload mutated');
  }finally{if(saved===null)sessionStorage.removeItem(KEY);else sessionStorage.setItem(KEY,saved);}
 }],
 ['DXU02','Real admitted request with late acknowledgement: unmount and account invalidation suppress all later UI resumes',async(context={})=>{
  const saved=sessionStorage.getItem(KEY);
  try {for(const boundary of ['unmount','shinka-session-ended','shinka-health-access-changed']){
   const f=deletionFixture();let release,admitted,notify;
   const admission=new Promise(resolve=>{notify=resolve;});
   const request=async(action,body)=>{const result=await f.request(action,body);if(action==='execute'){admitted=result;await new Promise(resolve=>{release=resolve;notify();});}return result;};
   await mounted(f,request,async({begin,until,dispose,turn,host})=>{
    await begin();await admission;const count=f.measure.calls.length;
    if(boundary==='unmount')dispose();else window.dispatchEvent(new Event(boundary));
    release();await turn();await turn();check(f.measure.calls.length===count,'late response continued deletion');
    if(boundary!=='unmount')check(!host.textContent.includes(admitted.job.operation_id)&&sessionStorage.getItem(KEY)===null,'old identity restored');
   },context);
   check(f.tables.User.some(r=>r.id==='ownerA'),'unacknowledged admission deleted user');
  }}finally{if(saved===null)sessionStorage.removeItem(KEY);else sessionStorage.setItem(KEY,saved);}
 }],
 ['DXU03','Actual service deadline leaves a live admitted request unknown; later readback uses same ID and rejects foreign response',async(context={})=>{
  const f=deletionFixture(),view=await f.preview(),id=crypto.randomUUID();let finished,disposed=false;
  /** @type {undefined | (()=>void)} */ let release;
  context.cleanup?.(()=>{disposed=true;release?.();});
  const delayed={functions:{invoke:async(name,body)=>{const result=await f.serviceClient.functions.invoke(name,body);finished=result;if(!disposed)await new Promise(resolve=>{release=()=>resolve(undefined);});return result;}}};
  await rejects(()=>adminTestRequest('execute',{target_id:'ownerA',operation:'DELETE_USER',confirmation:true,preview_token:view.preview_token,request_id:id},delayed,5),'TEST_TOOLS_TIMEOUT');
  // Await actual admission even if a busy browser delivered the timer first.
  while(!finished)await testEventTurn(context.signal);if(typeof release!=='function')throw new Error('MISSING_ADMISSION');release();
  check((await f.status(id)).result_state==='PARTIAL'&&f.tables.AdminTestOperation.length===1,'deadline lost receipt');
  const invalid={functions:{invoke:async()=>({data:{result_state:'COMPLETED',job:{target_id:'ownerB',operation_id:id,status:'COMPLETED'}}})}};
  await rejects(()=>adminTestRequest('status',{target_id:'ownerA',operation_id:id},invalid),'TEST_TOOLS_RESPONSE_INVALID');
  check((await f.client('adminA').auth.me()).id==='adminA','transport failure logged out actor');
 }],
 ['DXU04','Acknowledged zero progress stops automatic passes and exposes stage and one recovery action',async(context={})=>{
  const f=deletionFixture();let count=0;
  const request=async(action,body)=>{const result=await f.request(action,body);if(action==='execute'){result.progress.madeProgress=false;count++;}if(action==='resume')count++;return result;};
  const saved=sessionStorage.getItem(KEY);
  try {await mounted(f,request,async({begin,until,host,q,turn})=>{
   await begin();await until(()=>host.textContent.includes(TEST_TOOLS_COPY.tr.noProgress));await turn();
   check(count===1&&q('[data-test-resume]')&&q('[data-test-progress]'),'zero progress spun or no blocker');
  },context);}finally{if(saved===null)sessionStorage.removeItem(KEY);else sessionStorage.setItem(KEY,saved);}
 }],
];
