import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as scheduler from '../base44/shared/notificationScheduler.js';
import * as provider from '../base44/shared/base44PushProvider.js';
import { createNotificationMachineAdmission } from '../base44/shared/notificationMachineAuth.js';
import { verifyNotificationMachine } from './verifyNotificationMachine.mjs';
export async function verifyNotifications(root) {
  let scenario, counts;
  const imports={
    'npm:@base44/sdk@0.8.57':{createClientFromRequest:()=>{
      counts.clients++;
      const entities=new Proxy({}, {get:(_,name)=>({filter:async query=>{
        counts.reads.push({entity:name,query});
        if(name==='User')return scenario.native ? [scenario.native] : [];
        if(['UserPrivacyRequest','AdminTestOperation'].includes(name))return [];
        counts.jobIO++;throw new Error('UNEXPECTED_JOB_IO');
      }})});
      return {
        auth:{me:async()=>{counts.auth++;if(scenario.authError)throw new Error('private auth detail');return scenario.me;}},
        get asServiceRole(){
          counts.serviceAccess++;
          return {entities,integrations:{Core:{SendPushNotification:async()=>{counts.provider++;throw new Error('UNEXPECTED_PROVIDER');}}}};
        },
      };
    }},
    '../../shared/notificationScheduler.js':{...scheduler,handleNotificationSchedule:(req,options)=>scheduler.handleNotificationSchedule(req,{
      ...options,...(scenario.preparedMachine ? {admitMachine:createNotificationMachineAdmission({
        readSecret:()=>{counts.secretReads++;return 'a'.repeat(64);},readCredential:()=> 'a'.repeat(64),
      })}:{}),
    })},
    '../../shared/base44PushProvider.js':provider,
    '../../shared/base44ContentLibrary.js':{inspectContentLibrary:()=>{counts.jobIO++;throw new Error('UNEXPECTED_PRODUCT_IO');}},
    '../../shared/firstContentSource.js':{FIRST_CONTENT_SOURCE:{}},
    '../../shared/contentCategoryDecision.js':{CONTENT_CATEGORY_DECISION:{}},
  };
  const source=await readFile(`${root}/base44/functions/notificationSchedule/entry.ts`,'utf8');
  const exports={};
  runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>{assert.ok(Object.hasOwn(imports,name),name);return imports[name];}},{timeout:1000});
  const admin={id:'synthetic-actor',role:'admin'},user={...admin,role:'user'};
  const fixtures=[
    {id:'NS01',me:null,status:401},
    {id:'NS02',authError:true,status:401},
    {id:'NS03',me:user,native:user,status:403},
    {id:'NS04',me:admin,native:user,status:403},
    {id:'NS05',me:admin,native:null,status:401},
    {id:'NS06',me:null,status:401,body:{action:'tick',admin:true,system:true,run_id:'synthetic'},headers:{'Base44-Service-Authorization':'synthetic','X-Workflow-Run-Id':'synthetic'}},
    {id:'NS07',me:admin,native:admin,status:400,body:{action:'tick',run_id:'synthetic'}},
    {id:'NS08',me:admin,native:admin,status:200},
    {id:'NS09',me:admin,native:admin,status:400,body:{action:'tick',user_id:'other',title:'forged',content:'forged',action_url:'https://outside.invalid'}},
    {id:'NS10',me:null,status:401,headers:{'X-Synthetic-Credential':'a'.repeat(64)}},
    {id:'NS11',me:null,status:200,preparedMachine:true},
  ];
  const results=[];
  for(const item of fixtures) {
    scenario=item;counts={clients:0,auth:0,serviceAccess:0,reads:[],jobIO:0,provider:0,secretReads:0};
    const response=await exports.default(new Request('https://fixture.invalid/schedule',{method:'POST',body:JSON.stringify(item.body||{action:'tick'}),headers:item.headers}));
    const body=await response.json();assert.equal(response.status,item.status,item.id);
    if(item.status===200)assert.deepEqual(body,{state:'DISABLED',processed:0});
    else assert.equal(body.error_code,item.status===401?'AUTH_REQUIRED':item.status===403?'ADMIN_REQUIRED':'INVALID_REQUEST');
    assert.equal(counts.jobIO,0);assert.equal(counts.provider,0);assert.equal(counts.clients,1);
    if(!item.me)assert.equal(counts.serviceAccess,0);
    if(item.preparedMachine){assert.equal(counts.auth,0);assert.equal(counts.secretReads,1);}
    assert.ok(!JSON.stringify(body).includes('private'));
    results.push({id:item.id,status:'PASS',httpStatus:response.status,response:body,counts,assertion:item.preparedMachine?'Actual disabled entry options with prepared real comparator injected only in this fixture; no workflow transport proof.':'Actual unbound entry/shared fresh native admin guard with synthetic SDK; dispatch disabled. No workflow/real delivery proof.'});
  }
  return {scope:'LOCAL_ENTRY_WITH_PLATFORM_IMPORT_SUBSTITUTION',passed:true,results,secretChecks:await verifyNotificationMachine(),hostedVerified:false};
}
