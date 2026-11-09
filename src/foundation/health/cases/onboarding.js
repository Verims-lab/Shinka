import { YOU_TESTS } from '../../tests/youTests';
import { QUALITY_MILESTONE_TESTS } from '../../tests/qualityMilestoneTests';
import { MAINTENANCE_TESTS } from '@/foundation/tests/maintenanceTests';
import { ONBOARDING_DECISION_TESTS } from '@/foundation/tests/onboardingDecisionTests';
import { PRODUCTION_ONBOARDING_TESTS } from '@/foundation/tests/productionOnboardingTests';
import { AUTH_TESTS, ONBOARDING_TESTS } from '@/foundation/tests/onboardingTests';
import { SECURITY_TESTS } from '@/foundation/tests/securityTests';
import { syntheticProbe } from './domainProbe';
import { makeCase, futureCase } from '../caseFactory';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
const tests=[...QUALITY_MILESTONE_TESTS,...YOU_TESTS,...MAINTENANCE_TESTS,...ONBOARDING_DECISION_TESTS,...PRODUCTION_ONBOARDING_TESTS,...AUTH_TESTS,...ONBOARDING_TESTS,...SECURITY_TESTS];
const probe=ids=>syntheticProbe(ids.map(id=>{
 const matches=tests.filter(([candidate])=>candidate===id);
 if(matches.length!==1)throw new Error(`ONBOARDING_HEALTH_TEST_ID:${id}:${matches.length}`);
 return matches[0];
}));
const c=suite=>makeCase(suite,{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME});
export const ONBOARDING_HEALTH_CASES=[
 c('H06')('H06-001','Apple/Google-only auth boundary','Only the two approved providers can be invoked.',probe(['A02'])),
 c('H06')('H06-002','18+ declaration before provider call','Unchecked and missing values cannot initiate OAuth.',probe(['A01'])),
 c('H06')('H06-003','OAuth cancellation and safe failure','Cancellation is distinct; raw provider errors never returned.',probe(['A03'])),
 c('H06')('H06-004','Authenticated owner and sanitized response','Forged owner/role rejected; unexpected payloads removed; OAuth return targets reject external normalization and bootstrap injection.',probe(['QM05','YT02','A06','A09','O26','P01','P02','P06','P12'])),
 c('H06')('H06-005','Repeated hydration does not duplicate identity rows','One fresh server principal per request; no cross-request identity cache or mutation during hydration.',probe(['QM01','A04','A05','P03','P04'])),
 c('H06')('H06-006','Existing, reset and restricted user routing','O34 verifies reset stage/preserved NULL name, health-cleanup and deletion denial; inactive cannot be recreated and daily data remains authoritative.',probe(['A07','A08','O34'])),
 futureCase('H06','H06-007','Live Apple/Google sign-in and callback','Real provider/device verification required after deployment.',APPLICABILITY.EXTERNAL,CLASS.LIVE_RUNTIME),
 c('H07')('H07-001','Backend DOB and 18+ date-only validation','O03–O05: completed versus partial client feedback, required/future/invalid/underage, exact birthday and leap boundaries; trusted server today and backend rejection stay authoritative.',probe(['O03','O04','O05'])),
 c('H07')('H07-002','Authenticated optional name and persisted NULL choice','Trim, NULL and 50 characters; absent server profile opens name only after auth; saved NULL name resumes without asking again; anonymous personal writes are rejected.',probe(['O01','O02'])),
 c('H07')('H07-003','Birth time NULL semantics','DOB alone saves through service/native adapter with NULL time and all five blank place fields, zero provider construction; invalid time remains rejected.',probe(['O06','C14','OF02'])),
 c('H07')('H07-004','Canonical eight-state route resolver','Auth precedes name; absent profile versus persisted partial/NULL-name profile and completed daily state are distinct. Client step claims cannot skip required profile; Skip is session-only until durable daily completion.',probe(['O24','A07','A08','OA05'])),
 c('H07')('H07-005','Optional cycle input and no fake 5/28','Start dependency, ranges, separate consent and skip.',probe(['O14','O15','O16','O17','O18'])),
 c('H07')('H07-006','Preferences initialization','Saved product locale wins; device TR/EN variants and unsupported EN fallback; device IANA / persisted fallback, false and 06:00.',probe(['A05','O23','O30','OF01'])),
 c('H07')('H07-007','Retry and partial failure contract','Production partial writes, safe unfinished-profile correction and synthetic atomic protocol; verified records before advancement, no backward-navigation consent mutation.',probe(['OA03','A04','O19','O20','O21','O29','O31','P23','P24','P30','P31'])),
 c('H07')('H07-008','Source copy contract','Exact approved EN/TR catalog and centralized copy.',probe(['O25','O27','C19'])),
 c('H07')('H07-009','Approved Sun calculation','Fixed tropical birth-date rule and all 12 boundaries.',probe(ONBOARDING_DECISION_TESTS.slice(0,16).map(([id])=>id))),
 c('H07')('H07-010','Approved TR onboarding copy','Exact decision receipt, parity and nonempty approved values.',probe(['C19'])),
 c('H07')('H07-011','Native Base44 persistence regression','Deployed-path SDK adapter exercised through ordinary synthetic transport; partial recovery, business timestamps and optional fields. No hosted claim.',probe(PRODUCTION_ONBOARDING_TESTS.map(([id])=>id))),
 c('H07')('H07-012','Approved durable onboarding derivation','Safe restart; actual owner daily record closes onboarding profile/cycle writes even for a damaged profile; no new schema or durable Skip flag.',probe(['C16','C18','C20','OA02','OA05'])),
 c('H10')('H10-003','Optional GeoNames birthplace search (v1.0)','≥3-char literal own-name A/P search, mid-word matches, candidate paging/deduplication and failed-page retry (including filtered-empty page); owner-only reads, five-field re-resolution/NULL, sanitized errors and real abort/cleanup. GQ10/GQ11 in H12-044 distinguish quota setup from provider failures; local U20/U21 and checkOnboardingCorrections cover inline DOB and retained query/Retry/clear. No live quota use.',probe(['YT04','M08','O08','O09','O10','O11','O12','O13','O28','O32','O33','G01','G02','G03','G04','G05','G06','G07','G08','G09','G10','G11','G12','G13','G14','G15','G16','G17','G18','G19','G20','G21','G22','G23','G24','BS01','BS02','BS03','BS04','BS05','BS06','BS07','BS08','BS09','BS10','BS11','BS12','OA01','OA03','OA04'])),
 futureCase('H10','H10-004','Live GeoNames credentials and provider','Real deployed proxy/provider availability unmeasured.',APPLICABILITY.EXTERNAL,CLASS.LIVE_RUNTIME),
 c('H11')('H11-004','Onboarding consent grant and immutable history','Backend-persisted UTC grant authority; native metadata independent; partial retry, conflicts, bounded worker coalescing and consent/deletion guards.',probe(['O17','O18','O19','O20','O22','S12','S14','P09','P15','P16','P17','P18','C17','C21','P21','P22','P23','P24','P25','P26','P27','P28','P29','P30','P31','P32'])),
 c('H11')('H11-005','Approved consent text/version and persistence','health-consent-v1.0, exact EN/TR copy and real adapter path using isolated transport.',probe(['C17','C19','C21'])),
 futureCase('H11','H11-006','Live ON-05 partial grant recovery and readback','After sync/publish, same partial account saveCycle and verified grant/event/period/optional NULL readback; fixture PASS cannot close the incident.',APPLICABILITY.EXTERNAL,CLASS.LIVE_RUNTIME),
];