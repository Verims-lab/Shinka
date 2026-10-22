import { beginPrivateReport } from '../health/privateReportOpening';
import { check, rejects } from './dataModelTests';
import { nativeFixture } from './nativeFixture';
import { onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
import { dailyRecordFixture } from './dailyRecordFixture';
import { safeReturnTo } from '@/lib/authReturnTo';
const popupFixture = () => {
  const events = [];
  const popup = { closed: false, opener: 'old-opener', document: { createElement: () => ({}), head: { append: meta => events.push(meta) } },
    close() { this.closed = true; }, location: { replace: url => events.push(url) } };
  return { popup, events };
};
/** @type {import('./testTypes').FoundationTest[]} */
export const QUALITY_MILESTONE_TESTS = [
  ['QM05', 'OAuth return path refuses external/backslash normalization and strips bootstrap tokens', () => {
    const origin='https://app.example.invalid';
    const resolve=value=>safeReturnTo(`?returnTo=${encodeURIComponent(value)}`,origin);
    for(const value of ['https://other.example.invalid','//other.example.invalid','/\\other.example.invalid','/.//other.example.invalid','javascript:alert(1)']) check(resolve(value)==='/', 'unsafe return target');
    check(resolve('/calendar?lang=tr&access_token=synthetic&clear_access_token=1&app_id=other&app_base_url=other&functions_version=x&from_url=x#ignored')==='/calendar?lang=tr');
    check(resolve('/you?lang=en')==='/you?lang=en');
  }],
  ['QM04', 'Generic rejection assertion fails successful work and checks explicit error codes', async () => {
    let caught=false;
    try { await rejects(async()=>{}); } catch { caught=true; }
    check(caught,'successful work accepted as rejection');
    await rejects(async()=>{throw new Error('synthetic');});
    caught=false;
    try { await rejects(async()=>{throw Object.assign(new Error(),{code:'WRONG'});},'EXPECTED'); } catch { caught=true; }
    check(caught,'wrong error accepted');
  }],
  ['QM01', 'Fresh server principal once per onboarding request; next request rechecks identity, no writes', async () => {
    const f = nativeFixture(); f.tables.UserDailyMessage.push(dailyRecordFixture());
    const client = f.client(); let calls = 0; const me = client.auth.me;
    client.auth.me = () => { calls++; return me(); };
    const before = JSON.stringify(f.tables);
    check((await onboardingOperation(client, { action: 'hydrate' }, { now: f.now })).state === 'ACTIVE_EXISTING_USER');
    check(calls === 1 && before === JSON.stringify(f.tables), 'duplicate authentication or read mutation');
    f.tables.User = f.tables.User.filter(row => row.id !== 'ownerA');
    await rejects(() => onboardingOperation(client, { action: 'hydrate' }), 'AUTH_REQUIRED');
    check(calls === 2, 'identity cached across requests');
  }],
  ['QM02', 'Private report reserves popup in gesture, severs opener/referrer and validates HTTPS target', async () => {
    const f = popupFixture(); let opened = false;
    const work = beginPrivateReport(async () => { check(opened, 'popup opened after async load'); return 'https://fixture.invalid/report'; }, () => { opened = true; return f.popup; });
    check(await work.result && f.popup.opener === null && f.events[0].content === 'no-referrer' && f.events[1] === 'https://fixture.invalid/report');
    work.cancel(); check(!f.popup.closed, 'completed report closed on unmount');
    for (const target of ['javascript:alert(1)', 'http://fixture.invalid', 'https://user:secret@example.invalid', 'bad url']) {
      const invalid = popupFixture();
      await rejects(() => beginPrivateReport(async () => target, () => invalid.popup).result);
      check(invalid.popup.closed && invalid.events.length === 1, 'unsafe URL navigated');
    }
  }],
  ['QM03', 'Report cancellation or blocked popup never navigates late; errors close pending window and retry works', async () => {
    const f = popupFixture();
    /** @type {(value:string)=>void} */
    let resolve = () => { throw new Error('resolver not installed'); };
    const work = beginPrivateReport(() => new Promise(done => { resolve = done; }), () => f.popup);
    work.cancel(); resolve('https://fixture.invalid/report');
    check(await work.result === false && f.popup.closed && f.events.length === 1, 'late private navigation');
    let invoked = false;
    await rejects(() => beginPrivateReport(async () => { invoked = true; return ''; }, () => null).result);
    await rejects(() => beginPrivateReport(async () => { invoked = true; return ''; }, () => { throw new Error('synthetic window denial'); }).result);
    check(!invoked, 'blocked window still fetched private URL');
    const failed = popupFixture();
    await rejects(() => beginPrivateReport(async () => { throw new Error('private provider detail'); }, () => failed.popup).result);
    check(failed.popup.closed);
    const retry = popupFixture(); check(await beginPrivateReport(async () => 'https://fixture.invalid/report', () => retry.popup).result);
  }],
];
