import { CALENDAR_TESTS } from '@/foundation/tests/calendarTests';
import { CALENDAR_UI_TESTS } from '@/foundation/tests/calendarUiTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
import { ev } from '../evidence';
const probe = ids => syntheticProbe(CALENDAR_TESTS.filter(([id]) => ids.includes(id)));
const c = suite => makeCase(suite, { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME });
export const CALENDAR_HEALTH_CASES = [
  c('H08')('H08-002', 'Calendar starts, neighbors and local dates', 'Actual add/edit/delete validation across complete history, 14/15 boundary, same ID, leap and DST.', probe(['CA03','CA04','CA05','CA13','CA18'])),
  c('H08')('H08-004', 'Atomic replacement and durable retry protocol', 'Synthetic transaction model: failure preservation, response loss, receipts, two workers, last deletion and immutable Home. Not Base44 proof.', probe(['CA01','CA02','CA05','CA06','CA07','CA08','CA09','CA14','CA17','CA20','CA22','CA23'])),
  makeCase('H08', { runnerType: RUNNER.BACKEND, classification: CLASS.LIVE_RUNTIME })('H08-005', 'Production calendar atomicity prerequisite', 'No production writer until durable multi-collection commit, guards, receipt and readback are proven.', async () => ({
    status: 'BLOCKED', evidence: ev(CLASS.BLOCKED_EXTERNAL, 'calendar entry / domainAtomic contract', 'UNVERIFIED_NO_PRODUCTION_ADAPTER', 'verified cross-worker atomic replacement with crash/retry recovery', 'CALENDAR_ATOMIC_CAPABILITY_REQUIRED; sequential SDK calls and fixture transactions are not native guarantees'),
  })),
  makeCase('H08', { runnerType: RUNNER.STATIC, classification: CLASS.RECORDED_DECISION })('H08-006', 'Observed interval above lookup range', 'User will supply a separate product rule for actual intervals over 60 days; no clamping or silent exclusion.', async () => ({
    status: 'BLOCKED', evidence: ev(CLASS.RECORDED_DECISION, 'user reply 2026-10-20 / OD-012', 'AWAITING_PRODUCT_RULE', 'approved phase and prediction behavior for observed intervals >60', 'User chose to supply a rule separately. Affected calculations fail explicitly; no invented policy.'),
  })),
  c('H11')('H11-002', 'Explicit reconsent requires completed deletion', 'Scoped Calendar consent path, existing grant preservation and refusal while deletion/residual health exists; withdrawal worker remains future.', probe(['CA05','CA10','CA11','CA12','CA19'])),
  c('H12')('H12-027', 'Calendar owner/consent privacy and stale response boundary', 'Strict payload, paginated owner reads, active/deletion gates, no grant on selection and invalidated late UI responses.', probe(['CA09','CA10','CA11','CA13','CA16','CA17','CA19','CA20','CA21'])),
  c('H13')('H13-015', 'Calendar accessible month and explicit actions', 'TR/EN, actual/predicted/selected labels, 44px keyboard controls, delete confirmation/cancel, blocked production and consent concealment.', syntheticProbe(CALENDAR_UI_TESTS)),
  futureCase('H08', 'H08-901', 'Hosted Calendar mutation and readback acceptance', 'After atomic blocker closes: same account add/reopen/edit/cancel/delete/last delete, Home snapshot unchanged, two clients and deployed Full Health. No local substitution.', APPLICABILITY.EXTERNAL, CLASS.LIVE_RUNTIME),
];
