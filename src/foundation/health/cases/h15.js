import { ONBOARDING_AUDIT_TESTS } from '../../tests/onboardingAuditTests';
import { PATTERN_TESTS } from '../../tests/patternTests';
import { makeCase, localCase } from '../caseFactory';
import { CLASS, RUNNER } from '../constants';
import { syntheticProbe } from './domainProbe';
import { CLOSURE018_TESTS } from '../../tests/closure018Tests';
import { BIRTHPLACE_SELECTION_TESTS } from '../../tests/birthplaceSelectionTests';
import { PATTERN_REFRESH_TESTS } from '../../tests/patternRefreshTests';
import { HEALTH_RETENTION_TESTS } from '../../tests/healthRetentionTests';
import { DAILY_REFERENCE_TESTS } from '../../tests/dailyReferenceTests';
const c = makeCase('H15',{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME});
export const H15_CASES = [
  c('H15-005','Projected payload growth and complete paged reads','Health recent list preserves each stored catalog version and at 10/1000 rows stays one projected bounded read; 205 pair IDs paginate without text leakage or silent truncation. Actual modules on isolated SDK fixtures, not hosted latency.',syntheticProbe([...HEALTH_RETENTION_TESTS.filter(([id])=>id==='HR07'),...DAILY_REFERENCE_TESTS.filter(([id])=>id==='ID03')])),
  c('H15-006','Repeated recovery releases runtime resources','PF03 executes 100 error/recovery cycles across 10 mounted lifecycles; exact coalesced request count, retained values, zero timers/listeners after each disposal.',syntheticProbe(PATTERN_REFRESH_TESTS.filter(([id])=>id==='PF03'))),
  c('H15-001','Bounded transport and body timeouts','Actual client deadline and provider stream cancellation; no fabricated response or live write.',
    syntheticProbe([...CLOSURE018_TESTS.filter(([id])=>id==='E04'),...BIRTHPLACE_SELECTION_TESTS.filter(([id])=>id==='BS12')])),
  localCase('H15','H15-002','Production bundle and route lab budgets','measureMaintenance checks unchanged JS/CSS budgets; measureTransitions uses matched source/asset/latency/CPU profiles and separates cold content, retained paint, fresh-response settlement, LCP/CLS and small-lab EventTiming (not field INP). measureCoreData compares identical isolated SDK read/write/auth/byte traces on baseline and final source. Product navigation checks reload/back/late owner isolation and attempts actual cross-document BFCache restoration; persisted=true is required, otherwise NOT_RUN separately from synthetic pageshow. The separate 051 hosted DevTools trace uses event/network/filmstrip timestamps, excludes tool waits and distinguishes maintenance-only comparison from unpublished code optimization. Lab results are not field INP, credits or hosted timing.'),
  c('H15-003','Cancellation and reused helper work','Abort active wait, clean resources and execute shared helpers once per run.',syntheticProbe(CLOSURE018_TESTS.filter(([id])=>id==='E02'))),
  c('H15-004','Offline retry and stale completion isolation','Pattern controlled-clock polling/event coalescing, retained sections on retry, privacy/disposal and actual search controller ignore old query/locale/disposed responses; explicit retry keeps the failed page even after zero filtered matches, short-query retry is inert.',
    syntheticProbe([...ONBOARDING_AUDIT_TESTS.filter(([id])=>id==='OA04'),...BIRTHPLACE_SELECTION_TESTS.filter(([id])=>['BS03','BS11'].includes(id)), ...PATTERN_TESTS.filter(([id])=>['PT15','PT16','PF01','PF02'].includes(id))])),
];
