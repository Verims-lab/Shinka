import { PATTERN_TESTS } from '../../tests/patternTests';
import { makeCase, localCase } from '../caseFactory';
import { CLASS, RUNNER } from '../constants';
import { syntheticProbe } from './domainProbe';
import { CLOSURE018_TESTS } from '../../tests/closure018Tests';
import { BIRTHPLACE_SELECTION_TESTS } from '../../tests/birthplaceSelectionTests';
const c = makeCase('H15',{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME});
export const H15_CASES = [
  c('H15-001','Bounded transport and body timeouts','Actual client deadline and provider stream cancellation; no fabricated response or live write.',
    syntheticProbe([...CLOSURE018_TESTS.filter(([id])=>id==='E04'),...BIRTHPLACE_SELECTION_TESTS.filter(([id])=>id==='B18')])),
  localCase('H15','H15-002','Production bundle and route lab budgets','scripts/measureMaintenance.mjs measures emitted JS/CSS, lazy routes and cold loopback samples. Field LCP/INP/CLS p75 is separate acceptance.'),
  c('H15-003','Cancellation and reused helper work','Abort active wait, clean resources and execute shared helpers once per run.',syntheticProbe(CLOSURE018_TESTS.filter(([id])=>id==='E02'))),
  c('H15-004','Offline retry and stale completion isolation','Pattern section retry/privacy/disposal and actual picker controller ignore old parent/locale/disposed responses; unavailable data preserves selection until explicit retry/clear.',
    syntheticProbe([...BIRTHPLACE_SELECTION_TESTS.filter(([id])=>['B12','B13','B14','B15'].includes(id)), ...PATTERN_TESTS.filter(([id])=>['PT15','PT16'].includes(id))])),
];
