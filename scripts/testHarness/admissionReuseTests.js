// AR01–AR03: entry-principal reuse (Buildmarker-042). Node-only, synthetic SDK.
import { nativeFixture } from '../../src/foundation/tests/nativeFixture';
import { withUserLifecycle } from '../../base44/shared/userLifecycle.js';
import { withNativeWriteChecks } from '../../base44/shared/nativeWriteChecks.js';
import { dailyMessageOperation } from '../../base44/shared/dailyMessageOperation.js';
import { youOperation } from '../../base44/shared/youOperation.js';

const check = (ok, message) => { if (!ok) throw new Error(message); };
// identities[i] answers the i-th auth.me(); the last entry repeats.
function counted(f, identities) {
  const raw = f.raw(); let calls = 0;
  raw.auth.me = async () => { const id = identities[Math.min(calls, identities.length - 1)]; calls++; return id ? { id, role: 'user' } : null; };
  return { client: withNativeWriteChecks(withUserLifecycle(raw)), calls: () => calls };
}
const home = (f, client) => dailyMessageOperation(client, { action: 'today', timezone: 'Europe/Istanbul' }, { native: true, now: f.now, library: f.library, random: () => 0 });
const you = (f, client) => youOperation(client, { action: 'read' }, { now: f.now });
const rejected = async run => { try { await run(); } catch (e) { return e.code || e.message; } return null; };

export const ADMISSION_REUSE_TESTS = [
  ['AR01', 'Home reopen and You read verify the session at most twice per request', async () => {
    const f = nativeFixture(); await f.today();
    const a = counted(f, ['ownerA']); await home(f, a.client);
    const b = counted(f, ['ownerA']); await you(f, b.client);
    check(a.calls() <= 2 && b.calls() <= 2, `auth budget exceeded home=${a.calls()} you=${b.calls()}`);
  }],
  ['AR02', 'Identity change after the entry principal is rejected by a later admission phase', async () => {
    const f = nativeFixture(); await f.today();
    for (const run of [home, you]) {
      const code = await rejected(() => run(f, counted(f, ['ownerA', 'ownerB']).client));
      check(code === 'AUTH_REQUIRED', `${run.name}: switched identity not rejected (${code})`);
    }
  }],
  ['AR03', 'Signed-out session after the entry principal is rejected', async () => {
    const f = nativeFixture(); await f.today();
    for (const run of [home, you]) check(await rejected(() => run(f, counted(f, ['ownerA', null]).client)) !== null, `${run.name}: lost session accepted`);
  }],
];