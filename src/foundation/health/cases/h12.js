import { localCase } from '../caseFactory';
import { SECURITY_TESTS } from '@/foundation/tests/securityTests';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
import { ev, blockedResult } from '../evidence';
import { makeCase } from '../caseFactory';
import { syntheticProbe } from './domainProbe';
const c=makeCase('H12',{classification:CLASS.SYNTHETIC_RUNTIME,runnerType:RUNNER.RUNTIME});
// First three stable IDs preserve the previous conceptual contract; others expand it.
const groups=[
 ['H12-001','User row isolation',['S01','S03','S04','S24']],
 ['H12-002','Admin cannot modify immutable records',['S12','S14']],
 ['H12-003','Internal tooling denied to non-admins',['S08']],
 ...SECURITY_TESTS.filter(([id])=>!['S01','S03','S04','S24','S12','S14','S08'].includes(id)).map(([id,title],i)=>[`H12-${String(i+4).padStart(3,'0')}`,title,[id]]),
];
export const H12_CASES=[
 ...groups.map(([id,title,ids])=>c(id,title,'Executes canonical backend/security helpers with isolated synthetic identities.',syntheticProbe(SECURITY_TESTS.filter(([testId])=>ids.includes(testId))))),
  localCase('H12','H12-025','Admin route and session regression','Local AN02–AN07, SS01–SS02 and SS06–SS12: real AuthProvider/routes/login with synthetic transport; bounded 700/1400ms transient retry with injected wait and actual logout/account timer cancellation, denied admin, lost session/role, coalescing, obsolete account responses and parallel settings/session order (membership refusal, logout, account change). Node AR01–AR08: exactly two auth phases for Home reopen/You read only; first daily, writes, account/consent and reset boundaries. checkStartupRoutes exercises the real App routes with both startup orders and old-account refusal/success. Node server classification separate; no live OAuth proof.'),
 c('H12-901','LIVE_ENFORCEMENT_REQUIRED','Separate deployed anonymous / owner A / owner B / admin evidence is mandatory.',async()=>blockedResult(ev(CLASS.LIVE_ENFORCEMENT,'Base44 deployed enforcement',{verified:false},'Independent identity denials, protected mutation rejection, timestamp/readback proof','No synthetic result can close live enforcement')),{classification:CLASS.LIVE_ENFORCEMENT,runnerType:RUNNER.NONE,applicability:APPLICABILITY.EXTERNAL,executionLocation:'EXTERNAL',blocker:false}),
];