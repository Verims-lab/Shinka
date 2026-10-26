// Node-only stabilization 034 checks (synthetic users only). Run: node scripts/verifySessionStability.mjs
// Pure logic only; does NOT prove AuthProvider/route behaviour in a browser.
import { nativeReadiness } from '../base44/shared/nativeReadiness.js';
import { requireAuthenticatedUser, requireInternalAdmin } from '../base44/shared/internalAuthorization.js';
import { classifySessionFailure } from '../src/foundation/authErrors.js';
import { createSessionCoalescer } from '../src/lib/sessionCheck.js';
const http = status => Object.assign(new Error('x'), { status });
const results = [];
const test = async (id, fn) => { try { await fn(); results.push([id, 'PASS']); } catch (e) { results.push([id, 'FAIL', e.message]); } };
const check = (ok, msg = 'assertion failed') => { if (!ok) throw new Error(msg); };
const fail = async (me) => { try { await requireAuthenticatedUser({ auth: { me } }); } catch (e) { return `${e.code}:${e.status}`; } return 'OK'; };
await test('SS03a server transient -> 503', async () => {
  for (const e of [http(429), http(503), http(504), Object.assign(new Error('t'), { code: 'ETIMEDOUT' }), Object.assign(new Error('n'), { code: 'ERR_NETWORK' }), new TypeError('fetch failed')])
    check(await fail(async () => { throw e; }) === 'SESSION_UNAVAILABLE:503', `${e.status ?? e.code ?? e.message}`);
});
await test('SS03b server real invalidity -> 401', async () => {
  check(await fail(async () => { throw http(401); }) === 'AUTH_REQUIRED:401', '401');
  check(await fail(async () => null) === 'AUTH_REQUIRED:401', 'no user');
  check(await fail(async () => ({ role: 'admin' })) === 'AUTH_REQUIRED:401', 'no id');
});
await test('SS03c role loss closes admin; transient never grants admin', async () => {
  let code; try { await requireInternalAdmin({ auth: { me: async () => ({ id: 'adminA', role: 'user' }) } }); } catch (e) { code = e.code; }
  check(code === 'FORBIDDEN_INTERNAL_TOOLING', code);
  try { await requireInternalAdmin({ auth: { me: async () => { throw http(429); } } }); code = 'GRANTED'; } catch (e) { code = e.code; }
  check(code === 'SESSION_UNAVAILABLE', code);
});
await test('SS01 client classification', async () => {
  for (const e of [http(429), http(503), { code: 'ERR_NETWORK' }, new Error('TIMEOUT'), new TypeError('fetch failed')]) check(classifySessionFailure(e) === 'UNVERIFIED', JSON.stringify(e));
  for (const e of [http(401), { response: { status: 403, data: { error_code: 'ACCOUNT_DELETION_IN_PROGRESS' } } }, { response: { status: 401, data: { error_code: 'AUTH_REQUIRED' } } }]) check(classifySessionFailure(e) === 'INVALID', JSON.stringify(e));
});
await test('SS02 coalescing/throttle/reset', async () => {
  let runs = 0, release, time = 0; const gate = new Promise(r => { release = r; });
  const c = createSessionCoalescer(async () => { runs++; await gate; return true; }, { now: () => time });
  const all = Promise.all([c.check(), c.passive(), c.passive(), c.check()]); release(); await all; check(runs === 1, `runs ${runs}`);
  time = 5000; await c.passive(); check(runs === 1, 'throttled'); c.reset(); await c.passive(); check(runs === 2, 'reset (logout/account change) forces fresh check');
});
await test('SS05 nativeReadiness sequential, one retry per schema', async () => {
  let inFlight = 0, peak = 0, waits = 0; const fails = { UserPrivacyRequest: 1, PrivacyRecoveryReceipt: 9 };
  const entities = new Proxy({}, { get: (_, name) => ({ filter: async () => { inFlight++; peak = Math.max(peak, inFlight); await Promise.resolve(); inFlight--; if ((fails[name] ?? 0) > 0) { fails[name]--; throw http(429); } return [{ id: 'r' }]; } }) });
  const result = await nativeReadiness({ auth: { me: async () => ({ id: 'adminA', role: 'admin' }) }, asServiceRole: { entities } }, { wait: async () => { waits++; } });
  const by = Object.fromEntries(result.schemas.map(r => [r.name, r]));
  check(peak === 1 && waits === 2, `peak ${peak} waits ${waits}`); check(by.UserPrivacyRequest.readable && by.PrivacyRecoveryReceipt.diagnostic.code === 'RATE_LIMITED');
});
await test('SS05b budget only gates retries (not a hard timeout)', async () => {
  let t = 0, waits = 0; const entities = new Proxy({}, { get: () => ({ filter: async () => { t += 4000; throw http(429); } }) });
  await nativeReadiness({ auth: { me: async () => ({ id: 'adminA', role: 'admin' }) }, asServiceRole: { entities } }, { wait: async () => { waits++; }, clock: () => t });
  check(waits === 1, `waits ${waits}`);
});
console.log(JSON.stringify(results, null, 1));
if (results.some(r => r[1] !== 'PASS')) process.exitCode = 1;