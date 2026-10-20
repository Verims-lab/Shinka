import { NATIVE_TESTS } from '@/foundation/tests/nativeTests';
import { syntheticProbe } from './domainProbe';
import { makeCase } from '../caseFactory';
import { CLASS, RUNNER } from '../constants';
import { ev, verdict } from '../evidence';
const local = (suite,id,title,ids) => makeCase(suite,{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME})(id,title,
  'Actual native handlers with ordinary SDK-shaped transport, independent clients, persistent-row reconstruction and fault injection. No hosted enforcement claim.',syntheticProbe(NATIVE_TESTS.filter(([key])=>ids.includes(key))));
export async function nativePrerequisite(ctx, feature) {
  let value;
  try { value = await ctx.nativeReadiness(); } catch { return {status:'BLOCKED',evidence:ev(CLASS.BLOCKED_EXTERNAL,'internalHealth nativeReadiness','UNAVAILABLE','deployed native strategy and readable schemas','Read-only prerequisite; hosted mutation acceptance remains separate.')}; }
  return verdict(value?.authority==='BASE44_NATIVE_V1'&&value.strategyVersion==='native-continuation/1'&&value.schemas?.length===3&&value.schemas.every(r=>r.readable)&&value[feature],ev(CLASS.LIVE_RUNTIME,'internalHealth nativeReadiness',value,'current native strategy; required schemas readable','Does not prove permissions, concurrent mutation, drain or deletion.'));
}
export const NATIVE_HEALTH_CASES = [
  local('H04','H04-018','Native identity, current role and write admission',['NA01','NA07','NA22','NA23']),
  local('H07','H07-015','Native grant continuation preserves consent instant and optional durations',['NA14','NA15','NA24','NA30']),
  local('H09','H09-006','Native immutable candidate reconciliation and response loss',['NA02','NA03','NA04','NA05','NA06']),
  local('H08','H08-008','Native observation writes, conflict review and resumable receipts',['NA08','NA09','NA10','NA11','NA12','NA13','NA16','NA28','NA29']),
  local('H12','H12-033','Native reset progress and operator maintenance deletion',['NA17','NA18','NA19','NA20','NA21','NA22','NA23','NA25','NA26','NA27']),
  makeCase('H04',{runnerType:RUNNER.BACKEND,classification:CLASS.LIVE_RUNTIME})('H04-019','Connected Base44 continuation prerequisites','Read-only current build and operational schemas; never SQL or mutation acceptance.',ctx=>nativePrerequisite(ctx,'daily')),
];
