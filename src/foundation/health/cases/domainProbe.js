import { ev, verdict } from '../evidence';
import { CLASS } from '../constants';
import { executeTest, cancelledTest } from '../../testExecution';
// Per-run memoization avoids repeating the same helper through multiple suites.
export function syntheticProbe(tests) {
  return async (context = {}) => {
    const failed = [], diagnostics = [], reused = [];
    for (const test of tests) {
      if (context.signal?.aborted) throw cancelledTest();
      let work = context.testResults?.get(test[2]);
      if (work) reused.push(test[0]);
      else {
        work = executeTest(test, {signal:context.signal});
        context.testResults?.set(test[2], work);
      }
      try { await work; }
      catch (error) {
        if (context.signal?.aborted) throw cancelledTest();
        failed.push(test[0]); diagnostics.push({id:test[0],stage:error.testStage || 'HELPER',code:error.code === 'TEST_TIMEOUT' ? 'TEST_TIMEOUT' : 'TEST_FAILED'});
      }
    }
    return verdict(failed.length === 0, ev(CLASS.SYNTHETIC_RUNTIME,'canonical domain/security helpers', {executed:tests.map(t=>t[0]),failed,diagnostics,reused}, {failed:[]}, 'Isolated helper fixtures; not live enforcement or browser acceptance'));
  };
}
