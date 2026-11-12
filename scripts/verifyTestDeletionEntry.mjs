import {build} from 'vite';
import {staticEvidencePlugin} from './staticEvidence.mjs';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as authorization from '../base44/shared/internalAuthorization.js';
import * as operation from '../base44/shared/nativeAdminTestOperation.js';
import * as preview from '../base44/shared/adminTestPreview.js';
import * as lifecycle from '../base44/shared/userLifecycle.js';
import * as diagnostics from '../base44/shared/adminTestDiagnostics.js';
import * as termsAcceptance from '../base44/shared/termsAcceptance.js';
export async function verifyTestDeletionEntry(root) {
 const temp=await mkdtemp(tmpdir()+'/shinka-delete-entry-');
 try {
  await writeFile(temp+'/fixture.js',`export {deletionFixture,finishDeletion} from ${JSON.stringify(root+'/src/foundation/tests/deletionFixture.js')};export {seedLegacyReset} from ${JSON.stringify(root+'/src/foundation/tests/historicalResetFixture.js')};`);
  await writeFile(temp+'/platform.js',"export const base44={functions:{invoke(){throw new Error('UNEXPECTED_PLATFORM_IO');}}};");
 await build({configFile:false,plugins:[staticEvidencePlugin(root)],logLevel:'silent',resolve:{alias:[{find:'@/api/base44Client',replacement:temp+'/platform.js'},{find:'@',replacement:root+'/src'}]},ssr:{noExternal:true},build:{ssr:temp+'/fixture.js',outDir:temp+'/out',rollupOptions:{output:{entryFileNames:'fixture.mjs'}}}});
  const {deletionFixture,finishDeletion,seedLegacyReset}=await import(pathToFileURL(temp+'/out/fixture.mjs'));
  let raw;const logs=[];
  const imports={
   'npm:@base44/sdk@0.8.54':{createClientFromRequest:()=>raw},
   'base44:runtime':{secrets:{get:key=>({SHINKA_TERMS_VERSION:'test-terms-v1',ADMIN_TEST_TOOLS_APP_ID:'native-fixture',ADMIN_TEST_TOOLS_ENVIRONMENT:'TEST',ADMIN_TEST_TOOLS_PREVIEW_KEY:'isolated-entry-key-at-least-32-characters'}[key])}},
   '../../shared/termsAcceptance.js':termsAcceptance,
   '../../shared/internalAuthorization.js':authorization,'../../shared/nativeAdminTestOperation.js':operation,
   '../../shared/adminTestPreview.js':preview,'../../shared/userLifecycle.js':lifecycle,'../../shared/adminTestDiagnostics.js':diagnostics,
  };
  const output=ts.transpileModule(await readFile(root+'/base44/functions/adminTestTools/entry.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,exports={};
  runInNewContext(output,{exports,console:{info:line=>logs.push(JSON.parse(line))},require:name=>{assert.ok(Object.hasOwn(imports,name));return imports[name];}});
  const f=deletionFixture({handle:(req,client)=>{raw=client;return exports.default(req);}});
  const seedTerms=fixture=>{for(const owner of ['adminA','ownerB'])fixture.tables.UserTermsAcceptance.push({id:`terms-${owner}`,user_id:owner,terms_version:'test-terms-v1',accepted_at:'2026-11-01T12:00:00.000Z',status:'ACCEPTED',document_url:termsAcceptance.TERMS_URL,intent_id:crypto.randomUUID()});};
  seedTerms(f);
  const start=await f.execute(await f.preview());assert.equal(start.job.stage,'START');assert.equal(start.result_state,'PARTIAL');
  const result=await finishDeletion(f,start);assert.equal(result.result_state,'COMPLETED');assert.equal((await f.status(result.job.operation_id)).result_state,'COMPLETED');
  assert.equal(f.tables.User.find(r=>r.id==='adminA').role,'admin');assert.ok(logs.some(r=>r.event==='PASS_END'));
  assert.ok(!JSON.stringify(logs).match(/email|birth_date|token|preview_key/i));
  f.measure.actor='ownerB';await assert.rejects(f.status(result.job.operation_id),{code:'FORBIDDEN_INTERNAL_TOOLING'});
  const legacy=deletionFixture({handle:(req,client)=>{raw=client;return exports.default(req);}}),job=seedLegacyReset(legacy);
  seedTerms(legacy);
  const before=JSON.stringify(legacy.tables);
  for(const [action,body] of [
    ['preview',{operation:'RESET_ONBOARDING'}],
    ['execute',{operation:'RESET_ONBOARDING',confirmation:true,preview_token:'retired',request_id:crypto.randomUUID()}],
    ['resume',{operation_id:job.operation_id}],
  ])await assert.rejects(legacy.request(action,{target_id:'ownerA',...body}),{code:'TEST_RESET_RETIRED'});
  const receipt=await legacy.status(job.operation_id);
  assert.equal(receipt.job.operation_id,job.operation_id);assert.equal(receipt.resume_enabled,false);
  assert.equal(JSON.stringify(legacy.tables),before);assert.ok(legacy.state.calls.every(c=>c.method==='filter'));
  assert.ok(legacy.measure.calls.filter(c=>c.action!=='status').every(c=>c.httpStatus===410&&c.writes===0));
  return {passed:true,retiredReset:{actions:['preview','execute','resume'],httpStatus:410,writes:0,legacyReadOnly:true},scope:'LOCAL_REAL_TS_ENTRY_SERVICE_NATIVE_FIXTURE',hostedVerified:false,checks:14};
 } finally {await rm(temp,{recursive:true,force:true});}
}
