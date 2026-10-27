import { localCase } from '../caseFactory';
import { CORE_QUALITY_TESTS } from '../../tests/coreQualityTests';
import { NATIVE_TESTS } from '@/foundation/tests/nativeTests';
import { DELETION_STABILITY_TESTS } from '../../tests/deletionStabilityTests';
import { DELETION_FAULT_TESTS } from '../../tests/deletionFaultTests';
import { nativePrerequisite } from '../nativeReadinessContract';
import { ADMIN_TEST_TOOLS_TESTS } from '@/foundation/tests/adminTestToolsTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
const c = suite => makeCase(suite, { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME });
const probe = ids => syntheticProbe(ADMIN_TEST_TOOLS_TESTS.filter(([id]) => ids.includes(id)));
const nativeProbe = ids => syntheticProbe([...NATIVE_TESTS,...CORE_QUALITY_TESTS,...DELETION_STABILITY_TESTS,...DELETION_FAULT_TESTS].filter(([id]) => ids.includes(id)));
export const ADMIN_TEST_HEALTH_CASES = [
  c('H12')('H12-028', 'Test Tools admin, preview and scope isolation', 'Authenticated current admin; closed payload; readonly limited metadata, signed confirmation, self/last admin, ownership edges and missing-schema fail-closed rollout.', probe(['AT01','AT02','AT03','AT04','AT05','AT07','AT16','AT17'])),
  c('H12')('H12-029', 'Native removal journal and current authorization', 'Actual service/HTTP/native fixture: every destructive stage and journal/audit acknowledgement loss; fresh residual reads, competing clients/receipts, missing User with open jobs, actor binding/revocation and protected A. No hosted mutation, lock or permanent erasure claim.', nativeProbe(['NA20','NA21','NA22','NA23','CQ05','DX02','DX03','DX05','DX06','DX07','DX08','DX09','DX10'])),
  c('H12')('H12-043', 'Deletion pass progress under bounded work and SDK latency', 'DX01/DX04 execute real service/HTTP/native stages with invocation-local virtual SDK latency and 205 shrinking rows. Same ID, durable advancement, separate admission/finalization, 100 data-write ceiling and preserved actor/shared/history. Not a hosted latency SLA.', nativeProbe(['DX01','DX04'])),
  c('H12')('H12-030', 'Native onboarding progress after verified writes', 'Identity/role/consent/history retained; interruption and same-day reuse.', nativeProbe(['NA17','NA18','NA19'])),
  makeCase('H12', { runnerType: RUNNER.BACKEND, classification: CLASS.LIVE_RUNTIME })('H12-031', 'Connected native reset/deletion strategy', 'Shared exact reset/deletion strategies, authority/version and five well-formed schema rows: valid transient reads BLOCKED; mismatches FAIL. SS04/SS10 local matrix. No destructive Health calls or mutation-success claim.', ctx => nativePrerequisite(ctx, 'deletion')),
  localCase('H13','H13-016','Test Tools accessible recovery regression','AU01–AU10, TP01–TP04, DXU01–DXU04: actual component/service/HTTP/native chain, delayed and unknown replies, one recovery action, reload/unmount/account switch, zero-progress stop and actor preservation. LOCAL_BROWSER only.'),
  futureCase('H12', 'H12-902', 'Explicit-target hosted Test Tools acceptance', 'Owner-authorized explicit frozen target list only after matching published code and unique protected native admin/session. Sequential target deletion, fresh active-store residual/readback and protected business-data comparison. Recently deleted/permanent purge separate. Never automatic Health.', APPLICABILITY.EXTERNAL, CLASS.LIVE_ENFORCEMENT),
];
