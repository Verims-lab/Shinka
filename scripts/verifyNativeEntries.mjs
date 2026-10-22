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
import * as boundedJson from '../base44/shared/boundedJson.js';
import * as geonamesGuard from '../base44/shared/geonamesGuard.js';
export async function verifyNativeEntries(root) {
  let role = 'admin', exists = true, token = true, secretReads = 0;
  const client = { auth: { me: async () => token ? { id: 'synthetic-admin', role: 'cached-admin' } : null }, asServiceRole: { entities: {
    User: { filter: async () => exists ? [{ id: 'synthetic-admin', role }] : [] },
    AdminTestOperation: { filter: async () => [] },
    UserPrivacyRequest: { filter: async () => [] },
  } } };
  const load = async (path, imports) => {
    const output = ts.transpileModule(await readFile(`${root}/${path}`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const exports = {};
    runInNewContext(output, { exports, Request, Response, require: name => { assert.ok(Object.hasOwn(imports,name), `Unexpected import: ${name}`); return imports[name]; } }, { timeout: 1000 });
    return exports;
  };
  const native = await load('base44/shared/nativeClient.ts', {
    'npm:@base44/sdk@0.8.54': { createClientFromRequest: () => client },
    'base44:runtime': { secrets: { get: () => { secretReads++; return undefined; } } },
    './userLifecycle.js': { withUserLifecycle }, './nativeWriteChecks.js': { withNativeWriteChecks },
  });
  const session = await load('base44/functions/applicationSession/entry.ts', {
    '../../shared/nativeClient.ts': native, '../../shared/internalAuthorization.js': authorization,
    '../../shared/privacyPolicy.js': privacyPolicy, '../../shared/boundedJson.js': boundedJson,
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
  assert.equal(secretReads,0, 'Session/login must not require a SQL or maintenance secret');
  const handler = (_req, createClient, deps) => { assert.equal(createClient,native.createNativeClient); assert.equal(deps.native,true); return 'native-route'; };
  const daily = await load('base44/functions/dailyMessage/entry.ts', {
    '../../shared/nativeClient.ts': native,
    '../../shared/dailyMessageOperation.js': { handleDailyMessageRequest: handler },
    '../../shared/base44ContentLibrary.js': { inspectContentLibrary() {} },
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
    '../../shared/geonamesAdapter.js': { createGeoNamesAdapter: config => ({ countries: async () => ({ fixture: config.username }) }) },
    '../../shared/youOperation.js': { handleYouRequest: (_req, createClient, deps) => { assert.equal(createClient, native.createNativeClient); assert.equal(typeof deps.geoNamesFor, 'function'); assert.equal(deps.geoNames, undefined); youDeps = deps; return 'you-route'; } },
  });
  let youSecretReads = 0, youDeps = null;
  assert.equal(await you.default({}), 'you-route');
  assert.equal(youSecretReads, 0, 'You read/hydrate must not read the GeoNames secret');
  assert.equal((await youDeps.geoNamesFor('synthetic-owner').countries('en')).fixture, 'synthetic-public-provider-name');
  assert.equal(youSecretReads, 1);
  const rawClient = () => client;
  const privacy = await load('base44/functions/accountPrivacy/entry.ts', {
    'npm:@base44/sdk@0.8.54': { createClientFromRequest: rawClient },
    '../../shared/privacyOperation.js': { handlePrivacyRequest: (_req, createClient) => { assert.equal(createClient, rawClient); return 'owner-privacy-route'; } },
  });
  assert.equal(await privacy.default({}), 'owner-privacy-route');
  return { scope: 'LOCAL_PLATFORM_IMPORT_SUBSTITUTION', sessionChecks: 7, nativeRoutes: 5, artifactEntryChecks: 2, loginSecretReads: secretReads, hostedVerified: false, passed: true };
}