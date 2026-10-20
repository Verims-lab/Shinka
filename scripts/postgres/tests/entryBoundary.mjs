import fs from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {createSqlRuntime} from '../../../base44/shared/postgres/runtime.js';
import {postgresOptions,createPoolScope} from '../../../base44/shared/postgres/connection.js';
import {sqlFail} from '../../../base44/shared/postgres/store.js';
import {createPreviewSigner} from '../../../base44/shared/adminTestPreview.js';
import {handleSqlRequest} from '../../../base44/shared/postgres/http.js';
import {APP,IDS,nativeClient,makePool} from './fixture.mjs';
const load=async(file,imports)=>{
  const source=await fs.readFile(new URL(file,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};vm.runInNewContext(code,{exports,require:name=>{assert.ok(Object.hasOwn(imports,name),`unmapped import ${name}`);return imports[name];}});return exports;
};
export async function verifySqlEntries(runtimeUrl,identities) {
  let reads=0,driverCalls=0,actor='synthetic-admin2',closed=0;
  const config={SHINKA_SQL_APP_ID:APP,SHINKA_SQL_ENVIRONMENT:'TEST',SHINKA_SQL_TEST_PRINCIPALS:JSON.stringify(IDS),SHINKA_DATABASE_URL:'postgresql://synthetic:fixture@db.example.invalid/postgres'};
  const module=await load('../../../base44/shared/postgres/hosted.ts',{
    'npm:postgres@3.4.9':{default:(_url,options)=>{
      driverCalls++;assert.equal(options.prepare,false);assert.equal(options.max_pipeline,1);assert.equal(options.ssl.rejectUnauthorized,true);
      // Only the platform driver transport is substituted: real restricted local DB.
      const p=makePool(runtimeUrl),end=p.end;p.end=async()=>{closed++;await end();};return p;
    }},
    'npm:@base44/sdk@0.8.54':{createClientFromRequest:()=>nativeClient(actor,identities)},
    'base44:runtime':{secrets:{get:name=>{reads++;return config[name];}}},
    './connection.js':{postgresOptions,createPoolScope},'./runtime.js':{createSqlRuntime},'./store.js':{sqlFail},'../adminTestPreview.js':{createPreviewSigner},
  });
  assert.equal(reads,0);assert.equal(driverCalls,0);
  const entries={};for(const name of ['applicationSession','calendar','dailyMessage','domainAccess','adminTestTools','applicationAdmin'])entries[name]=(await load(`../../../base44/functions/${name}/entry.ts`,{
    '../../shared/postgres/http.js':{handleSqlRequest},'../../shared/postgres/hosted.ts':{openHostedSql:module.openHostedSql},
  })).default;
  const request=body=>new Request('https://synthetic.invalid',{method:'POST',body:JSON.stringify(body)});
  config.SHINKA_SQL_ENVIRONMENT='PRODUCTION';assert.equal((await entries.applicationSession(request({}))).status,503);assert.equal(driverCalls,0);
  config.SHINKA_SQL_ENVIRONMENT='TEST';config.SHINKA_SQL_APP_ID='wrong';assert.equal((await entries.applicationSession(request({}))).status,503);assert.equal(driverCalls,0);config.SHINKA_SQL_APP_ID=APP;
  const response=await entries.applicationSession(request({}));assert.equal(response.status,200);assert.equal((await response.json()).role,'user');
  assert.equal((await entries.applicationAdmin(request({action:'grant',target_id:'synthetic-plain',action_id:crypto.randomUUID()}))).status,403);
  actor='synthetic-delete2';assert.equal((await entries.applicationSession(request({}))).status,401);
  assert.equal(driverCalls,closed);return {scope:'PLATFORM_IMPORT_SUBSTITUTION_WITH_REAL_LOCAL_POSTGRESQL',driverPoolsClosed:true,hostedVerified:false};
}
