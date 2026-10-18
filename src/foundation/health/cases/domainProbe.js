import { ev, verdict } from '../evidence';
import { CLASS } from '../constants';
// Runs the same behavior contracts as the canonical test runner; no platform calls.
export function syntheticProbe(tests) {
  return async()=>{
    const failed=[];
    for(const [id,,run] of tests) {try{await run();}catch{failed.push(id);}}
    return verdict(failed.length===0,ev(CLASS.SYNTHETIC_RUNTIME,'canonical domain/security helpers',{executed:tests.map(t=>t[0]),failed},{failed:[]},'Isolated fixtures; not LIVE_ENFORCEMENT evidence'));
  };
}
