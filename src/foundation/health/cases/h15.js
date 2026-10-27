import { ONBOARDING_AUDIT_TESTS } from '../../tests/onboardingAuditTests';
import { PATTERN_TESTS } from '../../tests/patternTests';
import { makeCase, localCase } from '../caseFactory';
import { CLASS, RUNNER } from '../constants';
import { syntheticProbe } from './domainProbe';
import { CLOSURE018_TESTS } from '../../tests/closure018Tests';
import { BIRTHPLACE_SELECTION_TESTS } from '../../tests/birthplaceSelectionTests';
const c = makeCase('H15',{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME});
export const H15_CASES = [
  c('H15-001','Bounded transport and body timeouts','Actual client deadline and provider stream cancellation; no fabricated response or live write.',
    syntheticProbe([...CLOSURE018_TESTS.filter(([id])=>id==='E04'),...BIRTHPLACE_SELECTION_TESTS.filter(([id])=>id==='BS12')])),
  localCase('H15','H15-002','Production bundle and route lab budgets','measureMaintenance checks unchanged JS/CSS budgets; measureTransitions compares actual production SDK requests, first/revisit feedback/visible/usable timing under fixed synthetic latency and CPU. measureCoreData compares identical isolated SDK read/write/auth/byte traces on baseline and final source. Product navigation checks reload/back/late owner isolation. Not field INP, credits or hosted timing.'),
  c('H15-003','Cancellation and reused helper work','Abort active wait, clean resources and execute shared helpers once per run.',syntheticProbe(CLOSURE018_TESTS.filter(([id])=>id==='E02'))),
  c('H15-004','Offline retry and stale completion isolation','Pattern controlled-clock polling/event coalescing, retained sections on retry, privacy/disposal and actual search controller ignore old query/locale/disposed responses; explicit retry keeps the failed page even after zero filtered matches, short-query retry is inert.',
    syntheticProbe([...ONBOARDING_AUDIT_TESTS.filter(([id])=>id==='OA04'),...BIRTHPLACE_SELECTION_TESTS.filter(([id])=>['BS03','BS11'].includes(id)), ...PATTERN_TESTS.filter(([id])=>['PT15','PT16','PF01','PF02'].includes(id))])),
];