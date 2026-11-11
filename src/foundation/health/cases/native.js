import { CLOSURE020_REMOVAL_TESTS } from '../../tests/closure020Tests';
import { CLOSURE018_TESTS } from '@/foundation/tests/closure018Tests';
import { AUDIT019_DELETION_TESTS } from '@/foundation/tests/audit019Tests';
import { CLOSURE017_TESTS } from '@/foundation/tests/closure017Tests';
import { NATIVE_TESTS } from '@/foundation/tests/nativeTests';
import { syntheticProbe } from './domainProbe';
import { makeCase } from '../caseFactory';
import { CLASS, RUNNER } from '../constants';
import { nativePrerequisite } from '../nativeReadinessContract';
const local = (suite,id,title,ids) => makeCase(suite,{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME})(id,title,
  'Actual native handlers with ordinary SDK-shaped transport, independent clients, persistent-row reconstruction and fault injection. No hosted enforcement claim.',syntheticProbe(NATIVE_TESTS.filter(([key])=>ids.includes(key))));
export const NATIVE_HEALTH_CASES = [
  makeCase('H12',{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME})('H12-036','Native deletion failure, retry and request cost','Real handler with isolated SDK: access versus absence, safe diagnostics, bounded pages, final verification, same receipt, current actor and all-action completion verification; retained history is not permanent erasure.',syntheticProbe([...AUDIT019_DELETION_TESTS, ...CLOSURE020_REMOVAL_TESTS])),
  makeCase('H12',{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME})('H12-035','Deletion outcome and Health save visibility','Read-only recovery, slow recheck progress and save outcome distinction; isolated fixtures only.',syntheticProbe(CLOSURE018_TESTS.filter(([id])=>['E04','E05','E06','E07','E08'].includes(id)))),
  makeCase('H12',{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME})('H12-034','Health persistence retry and target lifecycle recovery','Private artifact reuse, immutable history, safe stages, bounded deletion and evidence contract. CL10 complete-runner cancellation stays local under H03-007.',syntheticProbe(CLOSURE017_TESTS)),
  local('H04','H04-018','Native identity, current role and write admission',['NA01','NA07','NA22','NA23']),
  local('H07','H07-015','Native grant continuation preserves consent instant and optional durations',['NA14','NA15','NA24','NA30']),
  local('H09','H09-006','Native immutable candidate reconciliation and response loss',['NA02','NA03','NA04','NA05','NA06']),
  local('H08','H08-008','Native observation writes, conflict review and resumable receipts',['NA08','NA09','NA10','NA11','NA12','NA13','NA16','NA28','NA29']),
  local('H12','H12-033','Existing legacy progress compatibility and resumable target deletion',['NA18','NA19','NA20','NA21','NA22','NA23','NA25','NA26','NA27','NA34A','NA34B','NA34C']),
  makeCase('H04',{runnerType:RUNNER.BACKEND,classification:CLASS.LIVE_RUNTIME})('H04-019','Connected Base44 continuation prerequisites','Read-only native-continuation/3 with retired reset; exact feature/authority/strategies and five distinct well-formed schema rows. Valid transient rows BLOCKED; malformed/mismatched rows FAIL, including mismatch plus 429. Shared per-run source; SS04/SS10 local matrix, not hosted mutation proof.',ctx=>nativePrerequisite(ctx,'daily')),
];
