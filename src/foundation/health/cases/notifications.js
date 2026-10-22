import { NOTIFICATION_TESTS } from '../../tests/notificationTests';
import { makeCase, localCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
import { syntheticProbe } from './domainProbe';
const probe = ids => syntheticProbe(NOTIFICATION_TESTS.filter(([id]) => ids.includes(id)));
const c = makeCase('H14',{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME});
export const NOTIFICATION_HEALTH_CASES = [
 c('H14-001','Local 06:00 and common daily reconciliation','NT01–03/09/12/18/20: controlled clock, DST/fractional zones, late/zone changes, shared scheduler/Home generation and withdrawal; no native unique/transaction claim.',probe(['NT01','NT02','NT03','NT09','NT12','NT18','NT20'])),
 c('H14-002','Delivery reconciliation and bounded retry on ordinary SDK','NT04–08/13: same row, backoff/max attempts, permanent/ineligible/unknown and lost receipt; worker coalescing/visible candidates only. SENT means provider acceptance, not display.',probe(['NT04','NT05','NT06','NT07','NT08','NT13'])),
 c('H14-003','Notification admission, deletion and bounded traversal','NT10/11/14–17/19/21–23: controlled verifier injection, strict body, fresh owner/preferences, cleanup, paging/deadline/corruption, old-day rejection, request counts and unbound adapter denial. Does not certify platform scheduler authentication.',probe(['NT10','NT11','NT14','NT15','NT16','NT17','NT19','NT21','NT22','NT23'])),
 localCase('H14','H14-004','Notification preference and permission UI','NS01–03 actual inactive entry denial plus NU01–NU03: TR/EN error retains draft, persisted preference separate from device permission/support, old Home URL/session teardown, no unsupported settings API.'),
 futureCase('H14','H14-901','Base44 scheduler authentication and push binding acceptance','Official named parameters/response, native eligibility and scheduled-call authentication must be bound and verified before activation. Current entry denies all calls; no workflow created.',APPLICABILITY.EXTERNAL,CLASS.BLOCKED_EXTERNAL),
];
