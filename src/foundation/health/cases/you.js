import { YOU_TESTS } from '../../tests/youTests';
import { makeCase, localCase } from '../caseFactory';
import { CLASS, RUNNER } from '../constants';
import { syntheticProbe } from './domainProbe';
const probe = ids => syntheticProbe(YOU_TESTS.filter(([id]) => ids.includes(id)));
const runtime = { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME };
export const YOU_HEALTH_CASES = [
  makeCase('H11', runtime)('H11-007', 'You profile and preferences verified persistence', 'Actual HTTP success, common validation/Sun, existing/cleared GeoNames, stored language/notification-only preferences, unchanged consent/cycle/daily history. No withdrawal/deactivation/delivery claim.', probe(['YT01','YT03','YT04','YT05','YT09'])),
  makeCase('H12', runtime)('H12-038', 'You owner, conflict, response-loss and session boundary', 'Closed fields/session owner/ACTIVE/reset/deletion guards; observed conflict and same-input retry, unknown versus verified result, section isolation and obsolete response disposal. Ordinary synthetic SDK only, no native CAS claim.', probe(['YT02','YT06','YT07','YT08','YT09','YT10','YT11','YT12','YT13'])),
  localCase('H13', 'H13-018', 'You forms, saved locale and profile access', 'YU01–YU06 and checkYouFlow: actual forms/routes, focus, errors/unknown, saved place outage/clear, TR/EN and 200% text, current role and logout. Physical acceptance separate.'),
];
