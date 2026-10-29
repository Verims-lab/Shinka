import { artifactOperation } from '../base44/shared/contentArtifactOperation.ts';
// Execute current TS routing/session entry points with platform imports replaced.
// Native auth/lifecycle/write guards are real; no network, SQL or user mutations.
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { withUserLifecycle } from '../base44/shared/userLifecycle.js';
import { withNativeWriteChecks } from '../base44/shared/nativeWriteChecks.js';
import * as authorization from '../base44/shared/internalAuthorization.js';
import * as privacyPolicy from '../base44/shared/privacyPolicy.js';
import * as healthReadDiagnostics from '../base44/shared/healthReadDiagnostics.js';
import * as boundedJson from '../base44/shared/boundedJson.js';
import * as geonamesGuard from '../base44/shared/geonamesGuard.js';
import { internalHealthOperation } from '../base44/shared/internalHealthOperations.js';
export async function verifyNativeEntries(root) {
  let role = 'admin', exists = true, token = true, secretReads = 0;
  const client = { auth: { me: async () => token ? { id: 'synthetic-admin', role: 'cached-admin' } : null }, asServiceRole: { entities: {
    User: { filter: async () => exists ? [{ id: 'synthetic-admin', role }] : [] },
    AdminTestOperation: { filter: async () => [] },
    UserPrivacyRequest: { filter: async () => [] },
  } } };
  const safeLogs=[];
  const load = async (path, imports) => {
    const output = ts.transpileModule(await readFile(`${root}/${path}`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const exports = {};
    runInNewContext(output, { exports, Request, Response, crypto, console:{error:(...args)=>safeLogs.push(args)}, require: name => { assert.ok(Object.hasOwn(imports,name), `Unexpected import: ${name}`); return imports[name]; } }, { timeout: 1000 });
    return exports;
  };
  const native = await load('base44/shared/nativeClient.ts', {
    'npm:@base44/sdk@0.8.54': { createClientFromRequest: () => client },
    'base44:runtime': { secrets: { get: () => { secretReads++; return undefined; } } },
    './userLifecycle.js': { withUserLifecycle }, './nativeWriteChecks.js': { withNativeWriteChecks },
  });
  const session = await load('base44/functions/applicationSession/entry.ts', {
    '../../shared/nativeClient.ts': native, '../../shared/internalAuthorization.js': authorization,
    '../../shared/privacyPolicy.js': privacyPolicy, '../../shared/healthReadDiagnostics.js': healthReadDiagnostics, '../../shared/boundedJson.js': boundedJson,
  });
  const artifacts = await load('base44/functions/validateContentArtifacts/entry.ts', {
    '../../shared/nativeClient.ts': native,
    '../../shared/internalAuthorization.js': authorization,
    '../../shared/contentArtifactOperation.ts': { artifactOperation },
  });
  const artifactCall = () => artifacts.default(new Request('https://fixture.invalid/artifacts', {method:'POST',body:'{"mode":"fixture"}'}));
  assert.equal((await (await artifactCall()).json()).mode, 'fixture');
  role = 'user'; assert.equal((await artifactCall()).status, 403);
  role = 'admin';
  const call = body => session.default(new Request('https://fixture.invalid/session', { method: 'POST', body }));
  assert.equal((await (await call('{}')).json()).role, 'admin');
  role = 'user'; assert.equal((await (await call('{}')).json()).role, 'user');
  exists = false; assert.equal((await call('{}')).status,401);
  exists = true; token = false; assert.equal((await call('{}')).status,401);
  token = true; assert.equal((await call('{')).status,400); assert.equal((await call('{"role":"admin"}')).status,400);
  assert.equal((await call(' '.repeat(1001))).status,413);
  const originalPrivacyRead=client.asServiceRole.entities.UserPrivacyRequest.filter;
  for(const status of [429,503,504]) {
    client.asServiceRole.entities.UserPrivacyRequest.filter=async()=>{throw {status,message:'PRIVATE_RAW_ERROR',response:{status,data:{private:'PRIVATE_RESPONSE'}}};};
    const response=await call('{}'),data=await response.json();
    assert.equal(response.status,503);assert.equal(data.diagnostic.stage,'LIFECYCLE_READ');
    assert.equal(data.diagnostic.code,status===429?'RATE_LIMITED':status===504?'TIMEOUT':'SERVICE_UNAVAILABLE');
    assert.ok(!JSON.stringify(data).includes('PRIVATE'));
  }
  client.asServiceRole.entities.UserPrivacyRequest.filter=originalPrivacyRead;
  assert.ok(!JSON.stringify(safeLogs).includes('PRIVATE'));
  assert.equal(secretReads,0, 'Session/login must not require a SQL or maintenance secret');
  const handler = (_req, createClient, deps) => { assert.equal(createClient,native.createNativeClient); assert.equal(deps.native,true); return 'native-route'; };
  const daily = await load('base44/functions/dailyMessage/entry.ts', {
    '../../shared/nativeClient.ts': native,
    '../../shared/dailyMessageOperation.js': { handleDailyMessageRequest: handler },
    '../../shared/dailySelectionLibrary.js': { readDailySelectionLibrary() {} },
    '../../shared/firstContentSource.js': { FIRST_CONTENT_SOURCE: {} },
    '../../shared/contentCategoryDecision.js': { CONTENT_CATEGORY_DECISION: {} },
  });
  const calendar = await load('base44/functions/calendar/entry.ts', { '../../shared/nativeClient.ts': native, '../../shared/calendarOperation.js': { handleCalendarRequest: handler } });
  assert.equal(await daily.default({}), 'native-route'); assert.equal(await calendar.default({}), 'native-route');
  const pattern = await load('base44/functions/pattern/entry.ts', {
    '../../shared/nativeClient.ts': native,
    '../../shared/patternOperation.js': { handlePatternRequest: (_req, createClient) => { assert.equal(createClient, native.createNativeClient); return 'pattern-read-route'; } },
  });
  assert.equal(await pattern.default({}), 'pattern-read-route');
  const you = await load('base44/functions/you/entry.ts', {
    '../../shared/nativeClient.ts': native,
    'base44:runtime': { secrets: { get: name => { assert.equal(name, 'GEONAMES_USERNAME'); youSecretReads++; return 'synthetic-public-provider-name'; } } },
    '../../shared/geonamesGuard.js': geonamesGuard,
    '../../shared/geonamesAdapter.js': { createGeoNamesAdapter: config => ({ resolve: async id => { assert.equal(id, 123); return { fixture: config.username }; } }) },
    '../../shared/youOperation.js': { handleYouRequest: (_req, createClient, deps) => { assert.equal(createClient, native.createNativeClient); assert.equal(typeof deps.geoNamesFor, 'function'); assert.equal(deps.geoNames, undefined); youDeps = deps; return 'you-route'; } },
  });
  let youSecretReads = 0, youDeps = null;
  assert.equal(await you.default({}), 'you-route');
  assert.equal(youSecretReads, 0, 'You read/hydrate must not read the GeoNames secret');
  assert.equal((await youDeps.geoNamesFor('synthetic-owner').resolve(123)).fixture, 'synthetic-public-provider-name');
  assert.equal(youSecretReads, 1);
  const rawClient = () => client;
  const privacy = await load('base44/functions/accountPrivacy/entry.ts', {
    'npm:@base44/sdk@0.8.54': { createClientFromRequest: rawClient },
    '../../shared/privacyOperation.js': { handlePrivacyRequest: (_req, createClient) => { assert.equal(createClient, rawClient); return 'owner-privacy-route'; } },
  });
  assert.equal(await privacy.default({}), 'owner-privacy-route');
  const health = await load('base44/functions/internalHealth/entry.ts', {
    'npm:@base44/sdk@0.8.54': {createClientFromRequest:rawClient},
    'base44:runtime': {secrets:{get:()=>{throw new Error('UNEXPECTED_SECRET_READ');}}},
    '../../shared/userLifecycle.js':{withUserLifecycle},
    '../../shared/internalAuthorization.js':authorization,
    '../../shared/internalHealthOperations.js':{internalHealthOperation},
    '../../shared/healthPersistence.js':{healthUploadSigner:()=>{throw new Error('UNEXPECTED_SIGNER');}},
    '../../shared/geonamesRuntimeProbe.js':{createGeoNamesRuntimeProbe:()=>()=>{throw new Error('UNEXPECTED_PROVIDER_CALL');}},
  });
  let historyReads=0;
  client.asServiceRole.entities.InternalHealthRun={filter:async(_query,_sort,limit,_offset,fields)=>{
    historyReads++;assert.equal(limit,20);assert.ok(!fields.includes('report_json'));return [];
  }};
  const healthCall=body=>health.default(new Request('https://fixture.invalid/health',{method:'POST',body:JSON.stringify(body)}));
  role='admin';assert.equal((await healthCall({action:'list'})).status,200);
  role='user';assert.equal((await healthCall({action:'list'})).status,403);
  token=false;assert.equal((await healthCall({action:'list'})).status,401);token=true;role='admin';
  assert.equal((await healthCall({action:'dailyReferenceMigration',request:{action:'dryRun'}})).status,409);
  assert.equal((await healthCall({action:'healthRetention',request:{action:'dryRun'}})).status,409);
  assert.equal((await healthCall({action:'delete',entity:'User'})).status,400);
  assert.equal(historyReads,1);
  return { scope: 'LOCAL_PLATFORM_IMPORT_SUBSTITUTION', sessionChecks: 10, nativeRoutes: 5, artifactEntryChecks: 2, internalHealthEntryChecks:7, loginSecretReads: secretReads, hostedVerified: false, passed: true };
}
