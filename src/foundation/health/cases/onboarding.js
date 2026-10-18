import { AUTH_TESTS, ONBOARDING_TESTS } from '@/foundation/tests/onboardingTests';
import { SECURITY_TESTS } from '@/foundation/tests/securityTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
import { ev, blockedResult } from '../evidence';
import { ONBOARDING_DEPENDENCIES } from '../../../../base44/shared/onboardingDependencies.js';
const tests=[...AUTH_TESTS,...ONBOARDING_TESTS,...SECURITY_TESTS];
const probe=(ids)=>syntheticProbe(tests.filter(([id])=>ids.includes(id)));
const c=suite=>makeCase(suite,{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME});
const blocked=(suite,id,title,code)=>makeCase(suite)(id,title,'Open capability; no successful runtime claim.',async()=>blockedResult(ev(CLASS.RECORDED_DECISION,'onboarding dependency register',{code},'Approved source / verified implementation available',code)),{classification:CLASS.RECORDED_DECISION});
export const ONBOARDING_HEALTH_CASES=[
 c('H06')('H06-001','Apple/Google-only auth boundary','Only the two approved providers can be invoked.',probe(['A02'])),
 c('H06')('H06-002','18+ declaration before provider call','Unchecked and missing values cannot initiate OAuth.',probe(['A01'])),
 c('H06')('H06-003','OAuth cancellation and safe failure','Cancellation is distinct; raw provider errors never returned.',probe(['A03'])),
 c('H06')('H06-004','Authenticated owner and sanitized response','Forged owner/role rejected; unexpected payloads removed.',probe(['A06','A09','O26'])),
 c('H06')('H06-005','Repeated hydration does not duplicate identity rows','Synthetic durable adapter contract; no new Base44 identity created.',probe(['A04','A05'])),
 c('H06')('H06-006','Existing/INACTIVE user routing','Inactive profile cannot be recreated; existing daily data preserved.',probe(['A07','A08'])),
 futureCase('H06','H06-007','Live Apple/Google sign-in and callback','Real provider/device verification required after deployment.',APPLICABILITY.EXTERNAL,CLASS.LIVE_RUNTIME),
 c('H07')('H07-001','Backend DOB and 18+ date-only validation','Missing/future/underage and leap boundaries.',probe(['O03','O04','O05'])),
 c('H07')('H07-002','Optional name and transient restoration','Trim, NULL, 50 characters and bounded session state.',probe(['O01','O02'])),
 c('H07')('H07-003','Birth time NULL semantics','00:00 calculation fixture is never persisted as absent input.',probe(['O06'])),
 c('H07')('H07-004','Canonical eight-state route resolver','No Home success without actual daily existence.',probe(['O24','A07','A08'])),
 c('H07')('H07-005','Optional cycle input and no fake 5/28','Start dependency, ranges, separate consent and skip.',probe(['O14','O15','O16','O17','O18'])),
 c('H07')('H07-006','Preferences initialization','TR/EN, device IANA / persisted fallback, false and 06:00.',probe(['A05','O23','O30'])),
 c('H07')('H07-007','Retry and partial failure contract','Synthetic atomic action protocol; failure never advances UI.',probe(['A04','O19','O20','O21','O29','O31'])),
 c('H07')('H07-008','Source copy contract','Exact approved EN values; absent TR explicitly declared.',probe(['O25','O27'])),
 blocked('H07','H07-009','Approved Sun calculation unavailable',ONBOARDING_DEPENDENCIES.sunSign),
 blocked('H07','H07-010','Approved TR onboarding copy unavailable',ONBOARDING_DEPENDENCIES.copyTR),
 blocked('H07','H07-011','Durable production write adapter unavailable',ONBOARDING_DEPENDENCIES.persistence),
 blocked('H07','H07-012','Exact skipped-step cross-session resume undefined',ONBOARDING_DEPENDENCIES.durableCompletion),
 c('H10')('H10-003','Optional structured GeoNames boundary','Bounded proxy, sanitization, selection, coherent NULL and outage.',probe(['O08','O09','O10','O11','O12','O13','O28'])),
 futureCase('H10','H10-004','Live GeoNames credentials and provider','Real deployed proxy/provider availability unmeasured.',APPLICABILITY.EXTERNAL,CLASS.LIVE_RUNTIME),
 c('H11')('H11-004','Onboarding consent grant and immutable history','Explicit grant, owner, atomic action retry, protected event and deletion guard.',probe(['O17','O18','O19','O20','O22','S12','S14'])),
 blocked('H11','H11-005','Approved consent text/version unavailable',ONBOARDING_DEPENDENCIES.consentVersion),
];
