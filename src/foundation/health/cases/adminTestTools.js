import { NATIVE_TESTS } from '@/foundation/tests/nativeTests';
import { nativePrerequisite } from './native';
import { ADMIN_TEST_TOOLS_TESTS } from '@/foundation/tests/adminTestToolsTests';
import { ADMIN_TEST_UI_TESTS } from '@/foundation/tests/adminTestToolsUiTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
const c = suite => makeCase(suite, { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME });
const probe = ids => syntheticProbe(ADMIN_TEST_TOOLS_TESTS.filter(([id]) => ids.includes(id)));
const nativeProbe = ids => syntheticProbe(NATIVE_TESTS.filter(([id]) => ids.includes(id)));
export const ADMIN_TEST_HEALTH_CASES = [
  c('H12')('H12-028', 'Test Tools admin, preview and scope isolation', 'Authenticated current admin; closed payload; readonly limited metadata, signed confirmation, self/last admin, ownership edges and missing-schema fail-closed rollout.', probe(['AT01','AT02','AT03','AT04','AT05','AT07','AT16','AT17'])),
  c('H12')('H12-029', 'Native deletion journal under operator maintenance', 'Current handler stages and guards with synthetic faults; maintenance attestation is not a distributed fence.', nativeProbe(['NA20','NA21','NA22','NA23'])),
  c('H12')('H12-030', 'Native onboarding progress after verified writes', 'Identity/role/consent/history retained; interruption and same-day reuse.', nativeProbe(['NA17','NA18','NA19'])),
  makeCase('H12', { runnerType: RUNNER.BACKEND, classification: CLASS.LIVE_RUNTIME })('H12-031', 'Connected native reset/deletion strategy', 'Verified-step reset and operator maintenance deletion strategy; preview still evaluates current Test configuration, signer and window. No destructive Health calls.', ctx => nativePrerequisite(ctx, 'deletion')),
  c('H13')('H13-016', 'Test Tools confirmation and accessible localized UI', 'TR/EN, 320px controls, focus, cancellation, stale target/preview and single submit using isolated endpoints.', syntheticProbe(ADMIN_TEST_UI_TESTS)),
  futureCase('H12', 'H12-902', 'Explicit-target hosted Test Tools acceptance', 'Only after capability closure and explicit target selection: deployed guards, preview, partial retry, User deletion/old token denial or same-account reset/reload/day reuse. Never part of automatic Health.', APPLICABILITY.EXTERNAL, CLASS.LIVE_ENFORCEMENT),
];
