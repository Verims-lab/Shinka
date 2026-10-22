import { SECURITY_028_UI_TESTS } from '../../tests/security028UiTests';
import { makeCase, localCase } from '../caseFactory';
import { CLASS, RUNNER } from '../constants';
import { syntheticProbe } from './domainProbe';
const runtime = { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME };
// 028 security closure. Hosted enforcement and live GeoNames quota are NOT exercised here.
export const SECURITY_HEALTH_CASES = [
  makeCase('H12', runtime)('H12-040', 'GeoNames rate limit uses approved TR/EN copy without raw backend detail', 'SC06: actual onboarding service mapping and central copy; selection/draft state is not cleared by the error path. Synthetic client; no provider call.', syntheticProbe(SECURITY_028_UI_TESTS)),
  localCase('H12', 'H12-041', 'Server request limits, GeoNames guard and unauthenticated rejection', 'SC01–SC05 via scripts/verifySecurity028.mjs: real bounded reader, guard and You/onboarding handlers with a recording client (no writes, no GeoNames setup before auth). Worker-local limits only; hosted enforcement separate.'),
];