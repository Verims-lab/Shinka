import { SECURITY_028_UI_TESTS } from '../../tests/security028UiTests';
import { makeCase, localCase } from '../caseFactory';
import { CLASS, RUNNER } from '../constants';
import { syntheticProbe } from './domainProbe';
const runtime = { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME };
// 028 security closure. Hosted enforcement and live GeoNames quota are NOT exercised here.
export const SECURITY_HEALTH_CASES = [
  makeCase('H12', runtime)('H12-040', 'GeoNames rate limit: approved TR/EN copy, kept selection/draft, no automatic retry', 'SC06, SC10, SC11 in-app with synthetic request functions: onboarding and You service mapping (no raw detail); birthplace picker keeps the chosen country and retries only on user action; You keeps the profile draft and does not resend. Rendered screens, real backend and provider are not exercised.', syntheticProbe(SECURITY_028_UI_TESTS)),
  localCase('H12', 'H12-041', 'Server request limits, real GeoNames guard+adapter chain and unauthenticated rejection (local only)', 'LOCAL ONLY — in-app Full Health does not run these; it reports this case as local. SC01–SC05 and SC07–SC09 via `node scripts/verifySecurity028.mjs`: bounded reader; real guard + real adapter with synthetic fetch for app, user-upstream and worker-upstream limits (429, retry kept, no extra fetch); onboarding and You handler 429/Retry-After contract; network and forged errors stay 503. Worker-local limits only; hosted enforcement separate.'),
];