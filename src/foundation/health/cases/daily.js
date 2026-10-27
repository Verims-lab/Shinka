import { ONBOARDING_CLOSURE_TESTS } from '../../tests/onboardingClosureTests';
import { localCase } from '../caseFactory';
import { NATIVE_TESTS } from '@/foundation/tests/nativeTests';
import { nativePrerequisite } from '../nativeReadinessContract';
import { DAILY_TESTS } from '@/foundation/tests/dailyTests';
import { CALENDAR_TESTS } from '@/foundation/tests/calendarTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
import { ev, verdict } from '../evidence';
const probe = ids => syntheticProbe(DAILY_TESTS.filter(([id]) => ids.includes(id)));
const c = suite => makeCase(suite, { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME });
export const DAILY_HEALTH_CASES = [
  c('H05')('H05-010', 'Controlled import, partial recovery and exact crosswalk', 'Dry-run, no silent replacement, sequential retry and strict readiness; no native cross-worker guarantee.', probe(['DM01','DM02','DM03','DM04','DM05','DM23','DM26','DM27','DM28'])),
  localCase('H07','H07-013','ON-06/Home component regression','checkMobileInteractions Home no visible refresh / pull coalescing / retained daily / error Retry; DU01–DU05 and OV02/OV03/OV06: actual preparation Retry, safe Back, verified native readback and late account-response isolation; local browsers only.'),
  c('H08')('H08-001', 'Phase lookup 28/5 and supported range', 'Shared Home/Calendar calculation, historical/forward basis and computation-only defaults.', syntheticProbe([...DAILY_TESTS.filter(([id])=>['DM06','DM07','DM08'].includes(id)),...CALENDAR_TESTS.filter(([id])=>id==='CA01')])),
  c('H08')('H08-003', 'Outlier rule 26/27/45 → 27', 'Last three observations, traceable exclusion, rounding and calculation-only defaults.', syntheticProbe([...DAILY_TESTS.filter(([id])=>['DM07','DM08'].includes(id)),...CALENDAR_TESTS.filter(([id])=>id==='CA02')])),
  c('H09')('H09-001', 'Native day reuse and candidate conflict behavior', 'Native candidate reconciliation; deadline cleanup, late result rejection and partial-create response loss recover the same day without new health records.', syntheticProbe([...NATIVE_TESTS.filter(([id])=>['NA02','NA03','NA04','NA05'].includes(id)),...ONBOARDING_CLOSURE_TESTS.filter(([id])=>['OF03','OF04'].includes(id))])),
  c('H09')('H09-002', '40-day repeat window and local day', 'Day 41 eligibility and backend timezone/DST boundaries.', probe(['DM11','DM12'])),
  c('H09')('H09-003', 'Fallback chain and immutable TR/EN snapshot', 'Mapped → other categories → least recent; actual category and both snapshots.', probe(['DM13','DM14','DM18','DM19'])),
  makeCase('H09', { runnerType: RUNNER.BACKEND, classification: CLASS.LIVE_RUNTIME })('H09-004', 'Production first-Shinka prerequisites', 'Shared exact native contract: valid transient reads BLOCKED, malformed/mismatched rows FAIL; approved content and Moon readiness remain required. SS04/SS10 local matrix; hosted writes separate.', async ctx => {
    let library = null; try { library = await ctx.contentLibrary(); } catch { /* remains blocked */ }
    const prerequisite = await nativePrerequisite(ctx, 'daily');
    if (prerequisite.status !== 'PASS') return prerequisite;
    let moon; try { moon = await ctx.moonReadiness(); } catch { /* reported below */ }
    return verdict(library?.ready === true && moon?.ready === true, ev(CLASS.LIVE_RUNTIME, 'Base44 content + Moon verification', { contentReady: library?.ready, moonReady: moon?.ready }, 'verified approved content and current Moon coverage', 'Read-only prerequisites; H09-901 still requires hosted mutations.'), 'BLOCKED');
  }),
  futureCase('H09', 'H09-901', 'Hosted first creation, reopen, locale and readback', 'After schema sync and controlled import, verify the same account and immutable daily record; not completed by fixtures.', APPLICABILITY.EXTERNAL, CLASS.LIVE_RUNTIME),
  c('H10')('H10-002', 'Astronomy UTC interval continuity and reference sample', 'Real Astronomy Engine against USNO sample, boundaries/gaps/overlaps and rolling identities.', probe(['DM09','DM10','DM24'])),
  c('H12')('H12-026', 'Daily owner and consent boundary', 'Anonymous/inactive/forged authority, no health read without consent, safe response and no-write Skip.', probe(['DM05','DM17','DM18','DM19','DM22'])),
];
