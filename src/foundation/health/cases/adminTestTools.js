import { localCase } from '../caseFactory';
import { CORE_QUALITY_TESTS } from '../../tests/coreQualityTests';
import { NATIVE_TESTS } from '@/foundation/tests/nativeTests';
import { nativePrerequisite } from '../nativeReadinessContract';
import { ADMIN_TEST_TOOLS_TESTS } from '@/foundation/tests/adminTestToolsTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
const c = suite => makeCase(suite, { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME });
const probe = ids => syntheticProbe(ADMIN_TEST_TOOLS_TESTS.filter(([id]) => ids.includes(id)));
const nativeProbe = ids => syntheticProbe([...NATIVE_TESTS,...CORE_QUALITY_TESTS].filter(([id]) => ids.includes(id)));
export const ADMIN_TEST_HEALTH_CASES = [
  c('H12')('H12-028', 'Test Tools admin, preview and scope isolation', 'Authenticated current admin; closed payload; readonly limited metadata, signed confirmation, self/last admin, ownership edges and missing-schema fail-closed rollout.', probe(['AT01','AT02','AT03','AT04','AT05','AT07','AT16','AT17'])),
  c('H12')('H12-029', 'Native removal journal and current authorization', 'Current handler stages and guards with synthetic faults; CQ05 checks actor A session/role after target B reset/deletion and resume. No distributed fence or permanent erasure claim.', nativeProbe(['NA20','NA21','NA22','NA23','CQ05'])),
  c('H12')('H12-030', 'Native onboarding progress after verified writes', 'Identity/role/consent/history retained; interruption and same-day reuse.', nativeProbe(['NA17','NA18','NA19'])),
  makeCase('H12', { runnerType: RUNNER.BACKEND, classification: CLASS.LIVE_RUNTIME })('H12-031', 'Connected native reset/deletion strategy', 'Shared exact reset/deletion strategies, authority/version and five well-formed schema rows: valid transient reads BLOCKED; mismatches FAIL. SS04/SS10 local matrix. No destructive Health calls or mutation-success claim.', ctx => nativePrerequisite(ctx, 'deletion')),
  localCase('H13','H13-016','Test Tools accessible recovery regression','Local AU01–AU10 and TP01–TP04: actual Test Tools, controlled pacing/clock, session/unmount cancellation, post-wait budget, same-operation status-only recovery and visible partial/error/success. Not executed in-app or against real targets.'),
  futureCase('H12', 'H12-902', 'Explicit-target hosted Test Tools acceptance', 'Only after capability closure and explicit target selection: deployed guards, preview, partial retry, User deletion/old token denial or same-account reset/reload/day reuse. Never part of automatic Health.', APPLICABILITY.EXTERNAL, CLASS.LIVE_ENFORCEMENT),
];
