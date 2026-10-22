// 028 security closure: real shared modules and handlers with synthetic clients.
// No network, secrets, live data or user mutation. Run: node scripts/verifySecurity028.mjs
import assert from 'node:assert/strict';
import { readBoundedJson } from '../base44/shared/boundedJson.js';
import { createGeoNamesGuard } from '../base44/shared/geonamesGuard.js';
import { handleYouRequest } from '../base44/shared/youOperation.js';
import { handleOnboardingRequest } from '../base44/shared/onboardingOperations.js';
import { createGeoNamesAdapter } from '../base44/shared/geonamesAdapter.js';
import { OnboardingError } from '../base44/shared/onboardingValidation.js';

const fail = (code, status) => { throw Object.assign(new Error(code), { code, status }); };
const req = (text, headers = {}) => new Request('https://fixture.invalid', { method: 'POST', body: text, headers });
const rejects = async (fn, code) => { let e; try { await fn(); } catch (x) { e = x; } assert.equal(e?.code, code); return e; };
const limits = { windowMs: 60000, appRequests: 3, upstreamCalls: 4, workerUpstreamCalls: 6, cacheTtlMs: 600000, cacheEntries: 50, trackedUsers: 10 };
// Each app call issues `n` counted fetches, as hierarchy resolution can.
const adapterFor = (n = 1) => fetcher => {
  const hit = async () => { for (let i = 0; i < n; i++) await fetcher('https://fixture.invalid/geo'); return { ok: true }; };
  return { search: hit, countries: hit, regions: hit, places: hit, resolve: hit };
};
// Server-auth contract: auth.me() is the only identity source; every entity call is recorded.
const recordingClient = me => {
  const calls = [];
  const entities = new Proxy({}, { get: (_t, name) => new Proxy({}, { get: (_e, m) => async (...a) => { calls.push(`${String(name)}.${String(m)}`); return ['filter', 'list'].includes(m) ? [] : { id: 'x', ...a[0] }; } }) });
  return { calls, client: { auth: { me: async () => me }, entities, asServiceRole: { entities } } };
};
const writes = calls => calls.filter(c => /\.(create|update|delete|bulk\w+|updateMany|deleteMany)$/.test(c));

const TESTS = [
  ['SC01', 'Bounded JSON: streaming byte limit, Content-Length, malformed and non-object', async () => {
    assert.equal((await readBoundedJson(req('{"a":1}'), 100, fail)).a, 1);
    await rejects(() => readBoundedJson(req('x'.repeat(101)), 100, fail), 'REQUEST_TOO_LARGE');
    await rejects(() => readBoundedJson(req('{}', { 'content-length': '5000' }), 100, fail), 'REQUEST_TOO_LARGE');
    await rejects(() => readBoundedJson(req('{'), 100, fail), 'INVALID_REQUEST');
    await rejects(() => readBoundedJson(req('[]'), 100, fail), 'INVALID_REQUEST');
    assert.deepEqual(await readBoundedJson(req(''), 100, fail, { allowEmpty: true }), {});
  }],
  ['SC02', 'GeoNames guard: no owner 401, lazy adapter/secret, per-user app limit with retry seconds, window reset', async () => {
    let t = 0, created = 0; const g = createGeoNamesGuard({ limits, now: () => t, fetcher: async () => ({}) });
    await rejects(async () => g.forOwner('', () => created++), 'AUTH_REQUIRED');
    const u = g.forOwner('ownerA', f => { created++; return adapterFor(1)(f); }); assert.equal(created, 0);
    for (const q of ['a', 'b', 'c']) await u.search(q, 'en'); assert.equal(created, 1);
    t = 15000; const e = await rejects(() => u.search('d', 'en'), 'GEONAMES_RATE_LIMITED');
    assert.equal(e.status, 429); assert.equal(e.retryAfterSeconds, 45);
    t = 60000; await u.search('d', 'en');
  }],
  ['SC03', 'GeoNames guard counts real upstream fetches and the worker-local total across owners; cache avoids refetch', async () => {
    const g = createGeoNamesGuard({ limits, now: () => 0, fetcher: async () => ({}) });
    const a = g.forOwner('ownerA', adapterFor(3)); await a.resolve(1);
    await rejects(() => a.resolve(2), 'GEONAMES_RATE_LIMITED'); // 3+3 > 4 per user
    await g.forOwner('ownerB', adapterFor(2)).countries('en');   // worker 3+3(partial)+2
    await rejects(() => g.forOwner('ownerC', adapterFor(2)).regions({ c: 'TR' }), 'GEONAMES_RATE_LIMITED'); // worker 6
    assert.equal((await a.resolve(1)).ok, true); // cached, no upstream call
  }],
  ['SC04', 'Unauthenticated You/onboarding calls: 401, zero product writes, no GeoNames setup', async () => {
    for (const [h, body] of [[handleYouRequest, { action: 'read' }], [handleOnboardingRequest, { action: 'searchPlaces', query: 'Ist', language_code: 'en' }]]) {
      const { calls, client } = recordingClient(null); let geo = 0;
      const res = await h(req(JSON.stringify(body)), () => client, { geoNamesFor: () => { geo++; return null; } });
      assert.equal(res.status, 401); assert.equal((await res.json()).error_code, 'AUTH_REQUIRED');
      assert.equal(writes(calls).length, 0); assert.equal(geo, 0);
    }
  }],
  ['SC05', 'Oversize bodies: 413 from real You/onboarding handlers with no entity call', async () => {
    for (const [h, max] of [[handleYouRequest, 4000], [handleOnboardingRequest, 8000]]) {
      const { calls, client } = recordingClient({ id: 'ownerA' });
      const res = await h(req(JSON.stringify({ action: 'read', pad: 'x'.repeat(max) })), () => client, {});
      assert.equal(res.status, 413); assert.equal(calls.length, 0);
    }
  }],
  ['SC07', 'Real guard + real adapter: app, user-upstream and worker-upstream limits keep 429/retry and stop provider fetches', async () => {
    for (const [kind, lim, owners] of [['app', { appRequests: 2, upstreamCalls: 99, workerUpstreamCalls: 99 }, ['A', 'A', 'A']], ['user', { appRequests: 99, upstreamCalls: 2, workerUpstreamCalls: 99 }, ['A', 'A', 'A']], ['worker', { appRequests: 99, upstreamCalls: 99, workerUpstreamCalls: 2 }, ['A', 'B', 'C']]]) {
      const chain = realChain({ ...limits, ...lim }); let t = 0; chain.clock(() => t);
      await chain.search(owners[0], 'aa'); await chain.search(owners[1], 'bb'); t = 20000;
      const before = chain.fetches();
      const e = await rejects(() => chain.search(owners[2], 'cc'), 'GEONAMES_RATE_LIMITED');
      assert.equal(e.status, 429, kind); assert.equal(e.retryAfterSeconds, 40, kind); assert.equal(e.field, 'birthplace', kind);
      assert.equal(chain.fetches(), before, `${kind}: no provider fetch after limit`);
    }
  }],
  ['SC08', 'Onboarding and You handlers return 429, GEONAMES_RATE_LIMITED, Retry-After and retry_after_seconds for the real chain error', async () => {
    const chain = realChain({ ...limits, appRequests: 99, upstreamCalls: 1 });
    const { client } = recordingClient({ id: 'ownerA' });
    const call = q => handleOnboardingRequest(req(JSON.stringify({ action: 'searchPlaces', query: q, language_code: 'en' })), () => client, { geoNamesFor: chain.forOwner });
    assert.equal((await call('aa')).status, 200);
    const before = chain.fetches(), res = await call('bb'), body = await res.json();
    assert.equal(res.status, 429); assert.equal(body.error_code, 'GEONAMES_RATE_LIMITED'); assert.equal(res.headers.get('Retry-After'), '60'); assert.equal(body.retry_after_seconds, 60); assert.equal(chain.fetches(), before);
    // You: the full saveProfile path needs a ready profile fixture; this checks the handler error contract with the real chain-produced error.
    const limitError = await rejects(() => chain.search('ownerA', 'cc'), 'GEONAMES_RATE_LIMITED');
    const you = recordingClient({ id: 'ownerA' }); you.client.asServiceRole = { entities: new Proxy({}, { get: () => ({ filter: async () => { throw limitError; } }) }) };
    const yres = await handleYouRequest(req(JSON.stringify({ action: 'read' })), () => you.client, { geoNamesFor: chain.forOwner }), ybody = await yres.json();
    assert.equal(yres.status, 429); assert.equal(ybody.error_code, 'GEONAMES_RATE_LIMITED'); assert.equal(yres.headers.get('Retry-After'), '60'); assert.equal(ybody.retry_after_seconds, 60);
  }],
  ['SC09', 'Negative: network failure and a forged 429-shaped error from fetch stay GEONAMES_UNAVAILABLE, never rate-limited', async () => {
    for (const thrown of [new TypeError('fetch failed'), Object.assign(new OnboardingError('GEONAMES_RATE_LIMITED', 'birthplace', 429), { retryAfterSeconds: 5 })]) {
      const chain = realChain(limits, async () => { throw thrown; });
      const { client } = recordingClient({ id: 'ownerA' });
      const res = await handleOnboardingRequest(req(JSON.stringify({ action: 'searchPlaces', query: 'aa', language_code: 'en' })), () => client, { geoNamesFor: chain.forOwner });
      const body = await res.json();
      assert.equal(res.status, 503); assert.equal(body.error_code, 'GEONAMES_UNAVAILABLE'); assert.equal(res.headers.get('Retry-After'), null); assert.equal(body.retry_after_seconds, undefined);
    }
  }],
];

// Real createGeoNamesGuard + createGeoNamesAdapter; only the provider fetch is synthetic (no network).
function realChain(lim, provider = async () => new Response(JSON.stringify({ geonames: [], totalResultsCount: 0 }), { status: 200 })) {
  let count = 0, now = () => 0;
  const guard = createGeoNamesGuard({ limits: lim, now: () => now(), fetcher: async (...a) => { count++; return provider(...a); } });
  const forOwner = owner => guard.forOwner(owner, fetcher => createGeoNamesAdapter({ username: 'fixture', fetcher }));
  return { forOwner, fetches: () => count, clock: fn => { now = fn; }, search: (owner, q) => forOwner(owner).search(q, 'en') };
}

export async function verifySecurity028() {
  const results = [];
  for (const [id, name, fn] of TESTS) {
    try { await fn(); results.push({ id, name, status: 'PASS' }); }
    catch (error) { results.push({ id, name, status: 'FAIL', reason: String(error?.message ?? error).slice(0, 200) }); }
  }
  return { scope: 'LOCAL_SERVER_FIXTURE', hostedVerified: false, results, passed: results.every(r => r.status === 'PASS') };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const out = await verifySecurity028(); console.log(JSON.stringify(out, null, 1)); if (!out.passed) process.exit(1);
}