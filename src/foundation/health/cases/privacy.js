import { PRIVACY_TESTS } from '../../tests/privacyTests';
import { makeCase, localCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
import { syntheticProbe } from './domainProbe';
const probe = ids => syntheticProbe(PRIVACY_TESTS.filter(([id]) => ids.includes(id)));
const runtime = { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME };
export const PRIVACY_HEALTH_CASES = [
  makeCase('H11', runtime)('H11-001', 'Withdrawal stops processing and verifies health cleanup', 'Actual isolated handler: cancel, current grant, all five scopes including CalendarAction, stable event/time, partial recovery and explicit regrant. No live user writes.', probe(['PR01','PR02','PR03','PR04','PR09','PR13','PR18','PR19','PR20'])),
  makeCase('H11', runtime)('H11-003', 'Owner account erasure verifies active removal, with platform erasure pending', '023 supersedes INACTIVE-only deactivation. Actual normal/incomplete owner cleanup and native removal; retained/residual data or failed read cannot mean complete; shared/other owners unchanged. No permanent erasure claim.', probe(['PR05','PR06','PR07','PR10'])),
  makeCase('H12', runtime)('H12-039', 'Self-service privacy authority and recovery boundaries', 'Closed request/owner/role, raw native identity, admin protection, operation collisions, duplicate/late/lost responses, expiry and reusable (24-hour) read-only receipt; wrong key and key-only begin/resume cannot authorize mutation. Synthetic ordinary SDK; no lock/transaction guarantee.', probe(['PR07','PR08','PR11','PR12','PR14','PR15','PR16','PR17'])),
  localCase('H13', 'H13-019', 'Privacy confirmations and accessible recovery', 'PV01–PV04 plus checkPrivacyFlow: actual modal, cancel/focus, TR/EN narrow/200% text, incomplete onboarding, external page, same-request read-only recovery and logout. Physical acceptance separate.'),
  futureCase('H11', 'H11-008', 'Hosted erasure, platform purge and provider/store acceptance', 'User-selected separate disposable accounts only. Verify schema/RLS, old-session denial, active cleanup and receipts; Base44 Recently deleted, Apple token revocation and published Google Play external URL remain separate evidence. Never dispatched by normal Health.', APPLICABILITY.EXTERNAL, CLASS.LIVE_ENFORCEMENT),
];
