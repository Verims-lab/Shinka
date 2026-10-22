import { NOTIFICATION_PERFORMANCE_TESTS } from '../../tests/notificationPerformanceTests';
import { NOTIFICATION_CONTRACT_TESTS } from '../../tests/notificationContractTests';
import { NOTIFICATION_TESTS } from '../../tests/notificationTests';
import { makeCase, localCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
import { syntheticProbe } from './domainProbe';
const probe = ids => syntheticProbe(NOTIFICATION_TESTS.filter(([id]) => ids.includes(id)));
const c = makeCase('H14',{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME});
export const NOTIFICATION_HEALTH_CASES = [
 c('H14-001','Local 06:00 and common daily reconciliation','NT01–03/09/12/18/20: controlled clock, DST/fractional zones, late/zone changes, shared scheduler/Home generation and withdrawal; no native unique/transaction claim.',probe(['NT01','NT02','NT03','NT09','NT12','NT18','NT20'])),
 c('H14-002','Delivery reconciliation and bounded retry on ordinary SDK','NT04–08/13: same row, backoff/max attempts, permanent/ineligible/unknown and lost receipt; worker coalescing/visible candidates only. SENT means provider acceptance, not display.',probe(['NT04','NT05','NT06','NT07','NT08','NT13'])),
 c('H14-003','Notification admission, deletion and bounded traversal','NT10/11/14–17/19/21–23: shared fresh-native-admin guard and NC01–09 negative/manual/adapter checks, strict body, fresh owner/preferences, cleanup, paging/deadline/corruption, old-day rejection and NP01–07 query budgets/same-phase record reuse, same-request revocation, cross-owner/request isolation, direct lower-level guards and post-body/BUSY admission. Does not certify workflow identity or provider response meaning.',syntheticProbe([...NOTIFICATION_TESTS.filter(([id])=>['NT10','NT11','NT14','NT15','NT16','NT17','NT19','NT21','NT22','NT23'].includes(id)),...NOTIFICATION_CONTRACT_TESTS,...NOTIFICATION_PERFORMANCE_TESTS])),
 localCase('H14','H14-004','Notification preference and permission UI','NS01–09 actual entry: anonymous/non-admin/removed identity denial and verified admin disabled response plus NU01–NU03: TR/EN error retains draft, persisted preference separate from device permission/support, old Home URL/session teardown, no unsupported settings API.'),
 futureCase('H14','H14-901','Base44 scheduler authentication and push binding acceptance','032: secure automatic caller identity plus native User recipient mapping, response/error/no-device meaning, eligibility and idempotency need hosted evidence. Distinguishing an equally authorized manual admin is not required. Native credentials or a local fixture cannot close this case; live dispatch stays disabled. See SHINKA_NATIVE_NOTIFICATION_READINESS_032.md.',APPLICABILITY.EXTERNAL,CLASS.BLOCKED_EXTERNAL),
];
