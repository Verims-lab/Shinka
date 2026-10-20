import { NATIVE_TESTS } from '@/foundation/tests/nativeTests';
import { nativePrerequisite } from './native';
import { CALENDAR_TESTS } from '@/foundation/tests/calendarTests';
import { CALENDAR_UI_TESTS } from '@/foundation/tests/calendarUiTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
const probe = ids => syntheticProbe(CALENDAR_TESTS.filter(([id]) => ids.includes(id)));
const c = suite => makeCase(suite, { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME });
const nativeProbe = ids => syntheticProbe(NATIVE_TESTS.filter(([id]) => ids.includes(id)));
export const CALENDAR_HEALTH_CASES = [
  c('H08')('H08-002', 'Calendar starts, neighbors and local dates', 'Actual add/edit/delete validation across complete history, 14/15 boundary, same ID, leap and DST.', probe(['CA03','CA04','CA05','CA13','CA18'])),
  c('H08')('H08-004', 'Actual-date receipt recovery and independent clients', 'Ordinary native handler with partial writes, response loss and conflict review; no transaction claim.', nativeProbe(['NA08','NA09','NA10','NA11','NA12','NA13'])),
  makeCase('H08', { runnerType: RUNNER.BACKEND, classification: CLASS.LIVE_RUNTIME })('H08-005', 'Connected native Calendar prerequisites', 'Observation and receipt schemas are readable; not a transaction claim or hosted write proof.', ctx => nativePrerequisite(ctx, 'calendar')),
  c('H08')('H08-006', 'Approved >60-day observation behavior', 'Execute OD-012: last-three window before filtering, no backfill/clamping, unsupported vs absent history, stale phase removal, Home UNKNOWN and error preservation. Persistence tests use isolated fixtures.', probe(['CR01','CR02','CR03','CR04','CR05','CR06','CR07'])),
  c('H11')('H11-002', 'Explicit reconsent requires completed deletion', 'Scoped Calendar consent path, existing grant preservation and refusal while deletion/residual health exists; withdrawal worker remains future.', probe(['CA05','CA10','CA11','CA12','CA19'])),
  c('H12')('H12-027', 'Calendar owner/consent privacy and stale response boundary', 'Strict payload, paginated owner reads, active/deletion gates, no grant on selection and invalidated late UI responses.', probe(['CA09','CA10','CA11','CA13','CA16','CA17','CA19','CA20','CA21'])),
  c('H13')('H13-015', 'Calendar accessible month and explicit actions', 'TR/EN, actual/predicted/selected labels, 44px keyboard controls, delete confirmation/cancel, blocked production and consent concealment.', syntheticProbe(CALENDAR_UI_TESTS)),
  futureCase('H08', 'H08-901', 'Hosted Calendar mutation and readback acceptance', 'After native schema sync: same account add/reopen/edit/cancel/delete/last delete, Home snapshot unchanged, two clients and deployed Full Health. No local substitution.', APPLICABILITY.EXTERNAL, CLASS.LIVE_RUNTIME),
];
