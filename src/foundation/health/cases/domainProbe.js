import { ev, verdict } from '../evidence';
import { CLASS } from '../constants';
import { executeTest, cancelledTest, assertUniqueTestIds } from '../../testExecution';
// Only completed successes are reusable. Pending/failed/cancelled work is never
// inserted into the run cache, and a late completion cannot mutate that cache.
export function syntheticProbe(tests) {
  return async (context = {}) => {
    assertUniqueTestIds(tests);
    const failed = [], diagnostics = [], reused = [], executed = [];
    for (const test of tests) {
      if (context.signal?.aborted) throw cancelledTest();
      const started = performance.now();
      const progress = (stage, durationMs = performance.now()-started) => context.onTestProgress?.({id:test[0],stage,durationMs});
      const cached = context.testResults?.get(test[2]);
      if (cached?.completed === true) { reused.push(test[0]); executed.push(test[0]); progress('REUSED',cached.durationMs); continue; }
      progress('START');
      try {
        await executeTest(test, {signal:context.signal, timeoutMs:Math.max(0,Math.min(5000,context.remainingMs?.() ?? 5000)), onStage:context.onTestProgress});
        if (context.signal?.aborted) throw cancelledTest();
        const durationMs = Math.round(performance.now()-started);
        context.testResults?.set(test[2], {completed:true,durationMs});
        executed.push(test[0]); progress('COMPLETE',durationMs);
      } catch (error) {
        if (context.signal?.aborted || error.code==='TEST_CANCELLED' || error.code==='TEST_TIMEOUT') throw error;
        failed.push(test[0]); executed.push(test[0]);
        diagnostics.push({id:test[0],stage:error.testStage || 'HELPER',code:'TEST_FAILED'});progress('FAILED');
      }
    }
    return verdict(tests.length > 0 && failed.length === 0, ev(CLASS.SYNTHETIC_RUNTIME,'canonical domain/security helpers', {executed,failed,diagnostics,reused}, {failed:[]}, 'Isolated helper fixtures; not live enforcement or browser acceptance'));
  };
}
