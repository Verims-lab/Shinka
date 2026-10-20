import { ADMIN_TEST_TOOLS_TESTS } from '@/foundation/tests/adminTestToolsTests';
import { ADMIN_TEST_UI_TESTS } from '@/foundation/tests/adminTestToolsUiTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
import { ev } from '../evidence';
const c = suite => makeCase(suite, { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME });
const probe = ids => syntheticProbe(ADMIN_TEST_TOOLS_TESTS.filter(([id]) => ids.includes(id)));
export const ADMIN_TEST_HEALTH_CASES = [
  c('H12')('H12-028', 'Test Tools admin, preview and scope isolation', 'Authenticated current admin; closed payload; readonly limited metadata, signed confirmation, self/last admin, ownership edges and missing-schema fail-closed rollout.', probe(['AT01','AT02','AT03','AT04','AT05','AT07','AT16','AT17'])),
  c('H12')('H12-029', 'Target lifecycle journal and partial deletion protocol', 'Isolated fixtures only: pagination, retention, start-audit failure, lost responses, two-worker race and stale tokens. No live user deletion.', probe(['AT06','AT08','AT09','AT10','AT11'])),
  c('H12')('H12-030', 'Persistent onboarding restart protocol', 'Same identity/role/product history; reset beats old daily completion, validated steps/Skip, same-day reuse, inactive/deletion/consent guards.', probe(['AT12','AT13','AT14','AT15'])),
  makeCase('H12', { runnerType: RUNNER.BACKEND, classification: CLASS.LIVE_RUNTIME })('H12-031', 'Production Test Tools durable coordinator prerequisite', 'Mutations stay disabled until shared writer fencing, durable unique journal/receipts and reset transactions are verified.', async () => ({
    status: 'BLOCKED', evidence: ev(CLASS.BLOCKED_EXTERNAL, 'adminTestTools entry / shinka.target-lifecycle/1', 'NO_PRODUCTION_COORDINATOR', 'verified all-writer target exclusion, admin-roster lock, durable journal/audit and recovery', 'Schema, HMAC and process-local serialization do not provide distributed safety. Lookup/preview are read-only; no automatic destructive live tests.'),
  })),
  c('H13')('H13-016', 'Test Tools confirmation and accessible localized UI', 'TR/EN, 320px controls, focus, cancellation, stale target/preview and single submit using isolated endpoints.', syntheticProbe(ADMIN_TEST_UI_TESTS)),
  futureCase('H12', 'H12-902', 'Explicit-target hosted Test Tools acceptance', 'Only after capability closure and explicit target selection: deployed guards, preview, partial retry, User deletion/old token denial or same-account reset/reload/day reuse. Never part of automatic Health.', APPLICABILITY.EXTERNAL, CLASS.LIVE_ENFORCEMENT),
];
