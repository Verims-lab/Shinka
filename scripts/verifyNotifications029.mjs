import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as scheduler from '../base44/shared/notificationScheduler.js';
import * as provider from '../base44/shared/base44PushProvider.js';
import * as policy from '../base44/shared/notificationPolicy.js';
export async function verifyNotifications029(root) {
  let clientCreations=0;
  const imports={
    'npm:@base44/sdk@0.8.57':{createClientFromRequest:()=>{clientCreations++;throw new Error('UNEXPECTED_PLATFORM_IO');}},
    '../../shared/notificationScheduler.js':scheduler,
    '../../shared/base44PushProvider.js':provider,
    '../../shared/notificationPolicy.js':policy,
    '../../shared/base44ContentLibrary.js':{inspectContentLibrary:()=>{throw new Error('UNEXPECTED_PRODUCT_IO');}},
    '../../shared/firstContentSource.js':{FIRST_CONTENT_SOURCE:{}},
    '../../shared/contentCategoryDecision.js':{CONTENT_CATEGORY_DECISION:{}},
  };
  const source=await readFile(`${root}/base44/functions/notificationSchedule/entry.ts`,'utf8');
  const exports={};
  runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>{assert.ok(Object.hasOwn(imports,name),name);return imports[name];}},{timeout:1000});
  const results=[];
  for(const [id,body,headers] of [
    ['NS01',{action:'tick'},{}],
    ['NS02',{action:'tick',admin:true,system:true,user_id:'forged'},{}],
    ['NS03',{action:'tick'},{Authorization:'Bearer synthetic','Base44-Service-Authorization':'Bearer synthetic'}],
  ]) {
    const response=await exports.default(new Request('https://fixture.invalid/schedule',{method:'POST',body:JSON.stringify(body),headers}));
    assert.equal(response.status,503);assert.equal((await response.json()).error_code,'SCHEDULER_AUTH_CONTRACT_UNVERIFIED');assert.equal(clientCreations,0);
    results.push({id,status:'PASS',assertion:'Actual inactive entry denies call before any SDK/client creation; not platform authentication proof'});
  }
  return {scope:'LOCAL_ENTRY_WITH_PLATFORM_IMPORT_SUBSTITUTION',passed:true,results,hostedVerified:false};
}
