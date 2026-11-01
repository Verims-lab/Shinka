import { DAILY_REFERENCE_TESTS } from '../../tests/dailyReferenceTests';
import { ONBOARDING_CLOSURE_TESTS } from '../../tests/onboardingClosureTests';
import { localCase } from '../caseFactory';
import { NATIVE_TESTS } from '@/foundation/tests/nativeTests';
import { firstShinkaPrerequisite } from '../firstShinkaPrerequisite';
import { DAILY_TESTS } from '@/foundation/tests/dailyTests';
import { CALENDAR_TESTS } from '@/foundation/tests/calendarTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
const probe = ids => syntheticProbe(DAILY_TESTS.filter(([id]) => ids.includes(id)));
const c = suite => makeCase(suite, { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME });
export const DAILY_HEALTH_CASES = [
  c('H05')('H05-010', 'Controlled import, partial recovery and exact crosswalk', 'Dry-run, no silent replacement, sequential retry and strict readiness; no native cross-worker guarantee.', probe(['DM01','DM02','DM03','DM04','DM05','DM23','DM26','DM27','DM28'])),
  localCase('H07','H07-013','ON-06/Home component regression','checkMobileInteractions Home no visible refresh / pull coalescing / retained daily / error Retry; DU01–DU06 (DU06 same-day failed foreground retry coalesces; DU05 re-reads current Pair on kept-tab reopening), CQ06/CQ07/CQ10 and OV02/OV03/OV06: 055 checkOnboardingCorrections and DU04 verify transparent preparation/message/suggestion surfaces with unchanged text, Retry and ID; actual preparation Retry, safe Back, verified native readback and late account-response isolation, access-denial clearing and stopped-session reload suppression; local browsers only.'),
  c('H08')('H08-001', 'Phase lookup 28/5 and supported range', 'Shared Home/Calendar calculation, historical/forward basis and computation-only defaults.', syntheticProbe([...DAILY_TESTS.filter(([id])=>['DM06','DM07','DM08'].includes(id)),...CALENDAR_TESTS.filter(([id])=>id==='CA01')])),
  c('H08')('H08-003', 'Outlier rule 26/27/45 → 27', 'Last three observations, traceable exclusion, rounding and calculation-only defaults.', syntheticProbe([...DAILY_TESTS.filter(([id])=>['DM07','DM08'].includes(id)),...CALENDAR_TESTS.filter(([id])=>id==='CA02')])),
  c('H09')('H09-001', 'Native day reuse and candidate conflict behavior', 'Native candidate reconciliation; deadline cleanup, late result rejection and partial-create response loss recover the same day without new health records.', syntheticProbe([...NATIVE_TESTS.filter(([id])=>['NA02','NA03','NA04','NA05'].includes(id)),...ONBOARDING_CLOSURE_TESTS.filter(([id])=>['OF03','OF04'].includes(id))])),
  c('H09')('H09-007', 'Bounded legacy field cleanup and daily notification links', 'ID05–11/ID13: terminal deleted-owner retained-field maintenance requires native User absence; active lifecycle and ordinary product tombstone denial remain. Reviewed dry-run, literal-ID unset, partial/lost response recovery, wrong role/target lifecycle, cursor bounds, admin/app-bound web dispatch, immutable assignment/link digests and cross-owner notification references. Synthetic only; no live migration.', syntheticProbe(DAILY_REFERENCE_TESTS.filter(([id])=>['ID05','ID06','ID07','ID08','ID09','ID10','ID11','ID13'].includes(id)))),
  c('H09')('H09-002', '40-day repeat window and local day', 'Day 41 eligibility and backend timezone/DST boundaries.', probe(['DM11','DM12'])),
  c('H09')('H09-003', 'Immutable assignment and current MessagePair text', 'ID01–04/ID12: old/new rows resolve current TR/EN, inactive historical content remains readable, broken links fail closed; safe stage/request/duration distinguishes injected 429/503 reference transport with same-ID retry; projected bounded batches and repeat history. DM13/14/18/19 retain selection and consent.', syntheticProbe([...DAILY_TESTS.filter(([id])=>['DM13','DM14','DM18','DM19'].includes(id)),...DAILY_REFERENCE_TESTS.filter(([id])=>['ID01','ID02','ID03','ID04','ID12'].includes(id))])),
  makeCase('H09', { runnerType: RUNNER.BACKEND, classification: CLASS.LIVE_RUNTIME })('H09-004', 'Production first-Shinka prerequisites', 'Exact native/content/hash/relations/Moon contract; shared bounded 429 retry and independent safe diagnostics (HD11–HD17), SS04/SS10. Hosted mutations remain separate.', firstShinkaPrerequisite),
  futureCase('H09', 'H09-901', 'Hosted first creation, reopen, locale and readback', 'After schema sync and controlled import, verify same-account daily ID/assignment, current MessagePair text and legacy-field cleanup readback; not completed by fixtures.', APPLICABILITY.EXTERNAL, CLASS.LIVE_RUNTIME),
  c('H10')('H10-002', 'Astronomy UTC interval continuity and reference sample', 'Real Astronomy Engine against USNO sample, boundaries/gaps/overlaps and rolling identities.', probe(['DM09','DM10','DM24'])),
  c('H12')('H12-026', 'Daily owner and consent boundary', 'Anonymous/inactive/forged authority, no health read without consent, strict closed safe error/diagnostic envelope (DM22) and no-write Skip.', probe(['DM05','DM17','DM18','DM19','DM22'])),
];
