import { ONBOARDING_DECISION_TESTS } from '@/foundation/tests/onboardingDecisionTests';
import { PRODUCTION_ONBOARDING_TESTS } from '@/foundation/tests/productionOnboardingTests';
import { AUTH_TESTS, ONBOARDING_TESTS } from '@/foundation/tests/onboardingTests';
import { ONBOARDING_UI_TESTS } from '@/foundation/tests/onboardingUiTests';
import { SECURITY_TESTS } from '@/foundation/tests/securityTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
const tests=[...ONBOARDING_DECISION_TESTS,...PRODUCTION_ONBOARDING_TESTS,...AUTH_TESTS,...ONBOARDING_TESTS,...ONBOARDING_UI_TESTS,...SECURITY_TESTS];
const probe=(ids)=>syntheticProbe(tests.filter(([id])=>ids.includes(id)));
const c=suite=>makeCase(suite,{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME});
export const ONBOARDING_HEALTH_CASES=[
 c('H06')('H06-001','Apple/Google-only auth boundary','Only the two approved providers can be invoked.',probe(['A02'])),
 c('H06')('H06-002','18+ declaration before provider call','Unchecked and missing values cannot initiate OAuth.',probe(['A01'])),
 c('H06')('H06-003','OAuth cancellation and safe failure','Cancellation is distinct; raw provider errors never returned.',probe(['A03'])),
 c('H06')('H06-004','Authenticated owner and sanitized response','Forged owner/role rejected; unexpected payloads removed.',probe(['A06','A09','O26','P01','P02','P06','P12'])),
 c('H06')('H06-005','Repeated hydration does not duplicate identity rows','Production SDK adapter and synthetic atomic protocol; no new Base44 identity created.',probe(['A04','A05','P03','P04'])),
 c('H06')('H06-006','Existing/INACTIVE user routing','Inactive profile cannot be recreated; existing daily data preserved.',probe(['A07','A08'])),
 futureCase('H06','H06-007','Live Apple/Google sign-in and callback','Real provider/device verification required after deployment.',APPLICABILITY.EXTERNAL,CLASS.LIVE_RUNTIME),
 c('H07')('H07-001','Backend DOB and 18+ date-only validation','Missing/future/underage and leap boundaries.',probe(['O03','O04','O05'])),
 c('H07')('H07-002','Optional name and transient restoration','Trim, NULL, 50 characters and bounded session state.',probe(['O01','O02'])),
 c('H07')('H07-003','Birth time NULL semantics','Missing time stays NULL; only date reaches the Sun resolver.',probe(['O06','C14'])),
 c('H07')('H07-004','Canonical eight-state route resolver','No Home success without actual daily existence.',probe(['O24','A07','A08'])),
 c('H07')('H07-005','Optional cycle input and no fake 5/28','Start dependency, ranges, separate consent and skip.',probe(['O14','O15','O16','O17','O18'])),
 c('H07')('H07-006','Preferences initialization','TR/EN, device IANA / persisted fallback, false and 06:00.',probe(['A05','O23','O30'])),
 c('H07')('H07-007','Retry and partial failure contract','Synthetic atomic action protocol; failure never advances UI.',probe(['A04','O19','O20','O21','O29','O31'])),
 c('H07')('H07-008','Source copy contract','Exact approved EN/TR catalog and centralized copy.',probe(['O25','O27','C19'])),
 c('H07')('H07-009','Approved Sun calculation','Fixed tropical birth-date rule and all 12 boundaries.',probe(ONBOARDING_DECISION_TESTS.slice(0,16).map(([id])=>id))),
 c('H07')('H07-010','Approved TR onboarding copy','Exact decision receipt, parity and nonempty approved values.',probe(['C19'])),
 c('H07')('H07-011','Repository production persistence adapter','Real SDK adapter with key-based retry, conditional updates and verified readback; no native transaction claim.',probe(PRODUCTION_ONBOARDING_TESTS.map(([id])=>id))),
 c('H07')('H07-012','Approved durable onboarding derivation','Safe restart; actual owner daily record is final completion; no new schema.',probe(['C16','C18','C20'])),
 c('H10')('H10-003','Optional structured GeoNames boundary','Bounded proxy, sanitization, selection, coherent NULL and outage.',probe(['O08','O09','O10','O11','O12','O13','O28','O32','O33','U09','U10','U11','G01','G02','G03','G04','G05','G06','G07','G08','G09','G10','G11','G12','G13','G14','G15','G16','G17','G18','G19','G20','G21','G22','G23','G24'])),
 futureCase('H10','H10-004','Live GeoNames credentials and provider','Real deployed proxy/provider availability unmeasured.',APPLICABILITY.EXTERNAL,CLASS.LIVE_RUNTIME),
 c('H11')('H11-004','Onboarding consent grant and immutable history','Source gate, explicit grant, owner, verified retry, immutable domain payload and deletion guard.',probe(['O17','O18','O19','O20','O22','S12','S14','P09','P15','P16','P17','P18','C17','C21'])),
 c('H11')('H11-005','Approved consent text/version and persistence','health-consent-v1.0, exact EN/TR copy and real adapter path using isolated transport.',probe(['C17','C19','C21'])),
];
