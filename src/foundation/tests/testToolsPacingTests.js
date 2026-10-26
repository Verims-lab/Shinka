import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import TestTools from '@/pages/internal/TestTools';
import { TEST_TOOLS_COPY } from '../i18n/testToolsCopy';
import { waitForFixture } from './domWait';
import { testEventTurn } from './testClock';

const check=(ok,message)=>{if(!ok)throw new Error(message);};
const KEY='shinka.pending-test-operation';
async function fixture(run,context={},restored=null) {
  const saved=sessionStorage.getItem(KEY);sessionStorage.removeItem(KEY);if(restored)sessionStorage.setItem(KEY,JSON.stringify(restored));
  const target={id:'synthetic-target',role:'user',account_status:'ACTIVE'};
  const f={time:0,calls:[],waits:[],id:restored?.id,execute:null,status:null,resume:null};
  const result=(state='PARTIAL')=>({target:null,result_state:state,resume_enabled:state==='PARTIAL',job:{operation:'DELETE_USER',operation_id:f.id,status:state==='COMPLETED'?'COMPLETED':'RUNNING',stage:'user_preferences'}});
  f.execute=async()=>result();f.resume=async()=>result('COMPLETED');f.status=async()=>result();
  const request=async(action,body)=>{
    f.calls.push({action,...body});
    if(action==='lookup')return restored?result():{target};
    if(action==='preview')return {target,operation:'DELETE_USER',enabled:true,expires_at:new Date(Date.now()+60000).toISOString(),scope:{deleted:['User'],retained:[]},counts:{},pending_notifications:0,blockers:[],preview_token:'synthetic-preview'};
    if(action==='execute'){f.id=body.request_id;return f.execute();}
    return f[action]();
  };
  const wait=ms=>new Promise(resolve=>{check(ms===1500,'changed pacing gap');f.waits.push(()=>{f.time+=ms;resolve();});});
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;width:360px';document.body.appendChild(host);
  const root=createRoot(host);let disposed=false;
  const dispose=()=>{if(disposed)return;disposed=true;root.unmount();host.remove();};context.cleanup?.(dispose);
  root.render(h(MemoryRouter,null,h(TestTools,{request,wait,clock:()=>f.time})));
  const q=s=>host.querySelector(s),until=p=>waitForFixture(p,host,context);
  const turn=()=>testEventTurn(context.signal);
  const begin=async()=>{
    const input=q('#test-user-id');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,target.id);input.dispatchEvent(new Event('input',{bubbles:true}));
    await turn();q('#test-lookup-button').click();await until(()=>q('[data-test-target]'));
    q('[data-destructive="true"]').click();await until(()=>q('[data-test-preview]'));
    q('[data-test-preview] [data-variant="primary"]').click();await turn();await until(()=>f.waits.length===1&&!q('[data-test-preview]')&&q('[role="status"]'));
  };
  try {await until(()=>q('#test-user-id'));await run({f,q,host,until,begin,dispose,turn,result});}
  finally {dispose();for(const release of f.waits)release();if(saved===null)sessionStorage.removeItem(KEY);else sessionStorage.setItem(KEY,saved);}
}
/** @type {import('./testTypes').FoundationTest[]} */
export const TEST_TOOLS_PACING_TESTS=[
  ['TP01','Actual Test Tools cancels paced continuation on unmount, logout and account/privacy invalidation',async(context={})=>{
    for(const unknown of [false,true])for(const boundary of ['unmount','shinka-session-ended','shinka-health-access-changed'])await fixture(async({f,begin,dispose,turn})=>{
      if(unknown)f.execute=async()=>{throw {code:'TEST_TOOLS_TIMEOUT'};};
      await begin();const count=f.calls.length;if(boundary==='unmount')dispose();else window.dispatchEvent(new Event(boundary));
      f.waits.shift()();await turn();check(f.calls.length===count,`${boundary} started later resume`);
    },context);
  }],
  ['TP02','Elapsed budget is checked after pacing; no extra resume after 60 seconds and partial result stays visible',async(context={})=>{
    await fixture(async({f,begin,host,until})=>{
      await begin();f.time=60000;f.waits.shift()();await until(()=>!host.querySelector('#test-user-id').disabled);
      check(!f.calls.some(c=>c.action==='resume'),'resume sent after budget');check(host.textContent.includes(TEST_TOOLS_COPY.en.deletePending)&&!host.textContent.includes(TEST_TOOLS_COPY.en.deletedResult),'budget exit concealed partial state');
    },context);
  }],
  ['TP03','Lost response reconciles only status, retains operation, and displays unknown then verified completion',async(context={})=>{
    let recovered;
    await fixture(async({f,begin,host,until,turn,result})=>{
      f.execute=async()=>{throw {code:'TEST_TOOLS_TIMEOUT'};};let reads=0;
      f.status=async()=>{reads++;if(reads===1)throw {code:'TEST_TOOLS_FAILED'};return result('COMPLETED');};
      await begin();check(host.textContent.includes(TEST_TOOLS_COPY.en.unknownResult)&&host.querySelector('[role="alert"]'),'unknown/error invisible');
      f.waits.shift()();await turn();await until(()=>f.waits.length===1);f.waits.shift()();await until(()=>host.textContent.includes(TEST_TOOLS_COPY.en.deletedResult));
      const commands=f.calls.filter(c=>['execute','resume','status'].includes(c.action));
      check(commands.map(c=>c.action).join()==='execute,status,status'&&commands.every(c=>(c.request_id||c.operation_id)===f.id),'unknown started new operation/write');
      recovered={target:'synthetic-target',id:f.id};
    },context);
    await fixture(async({f,host,until})=>{await until(()=>host.textContent.includes(TEST_TOOLS_COPY.en.deletePending));check(f.calls.length===1&&f.calls[0].action==='lookup'&&host.textContent.includes(recovered.id),'reopen started mutation or lost operation');},context,recovered);
  }],
  ['TP04','Acknowledged partial work resumes the same operation after one injected gap and only then shows verified success',async(context={})=>{
    await fixture(async({f,begin,host,until})=>{
      await begin();check(host.textContent.includes(TEST_TOOLS_COPY.en.deleting)&&!host.textContent.includes(TEST_TOOLS_COPY.en.deletedResult),'premature success');
      f.waits.shift()();await until(()=>host.textContent.includes(TEST_TOOLS_COPY.en.deletedResult));
      const commands=f.calls.filter(c=>['execute','resume'].includes(c.action));check(commands.map(c=>c.action).join()==='execute,resume'&&commands.every(c=>(c.request_id||c.operation_id)===f.id),'same operation pacing');
    },context);
  }],
];
