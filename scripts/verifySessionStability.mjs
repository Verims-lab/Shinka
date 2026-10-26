// Server-side session/Health stability checks (synthetic users only). Run: node scripts/verifySessionStability.mjs
import { nativeReadiness } from '../base44/shared/nativeReadiness.js';
import { requireAuthenticatedUser } from '../base44/shared/internalAuthorization.js';
const http = status => Object.assign(new Error('x'), { status });
const results = [];
const test = async (id, name, fn) => { try { await fn(); results.push([id, 'PASS']); } catch (e) { results.push([id, 'FAIL', e.message]); } };
const check = (ok, msg = 'assertion failed') => { if (!ok) throw new Error(msg); };
await test('SS03', 'Rate-limited auth.me is 503 SESSION_UNAVAILABLE, never 401', async () => {
  const fail = async error => { try { await requireAuthenticatedUser({ auth: { me: async () => { throw error; } } }); } catch (e) { return `${e.code}:${e.status}`; } return null; };
  check(await fail(http(429)) === 'SESSION_UNAVAILABLE:503', '429');
  check(await fail(http(504)) === 'SESSION_UNAVAILABLE:503', '504');
  check(await fail(http(401)) === 'AUTH_REQUIRED:401', '401');
});
await test('SS05', 'nativeReadiness is sequential with at most one bounded retry on 429', async () => {
  let inFlight = 0, peak = 0, calls = 0, waits = 0; const fails = { UserPrivacyRequest: 1, PrivacyRecoveryReceipt: 9 };
  const entities = new Proxy({}, { get: (_, name) => ({ filter: async () => { calls++; inFlight++; peak = Math.max(peak, inFlight); await Promise.resolve(); inFlight--; if ((fails[name] ?? 0) > 0) { fails[name]--; throw http(429); } return [{ id: 'r' }]; } }) });
  const client = { auth: { me: async () => ({ id: 'adminA', role: 'admin' }) }, asServiceRole: { entities } };
  const result = await nativeReadiness(client, { wait: async () => { waits++; } });
  const by = Object.fromEntries(result.schemas.map(r => [r.name, r]));
  check(peak === 1, `peak ${peak}`);
  check(waits === 2, `waits ${waits}`);
  check(by.UserPrivacyRequest.readable === true, 'retry recovered');
  check(by.PrivacyRecoveryReceipt.readable === false && by.PrivacyRecoveryReceipt.diagnostic.code === 'RATE_LIMITED', 'persistent 429 reported');
});
console.log(JSON.stringify(results));
if (results.some(r => r[1] !== 'PASS')) process.exitCode = 1;