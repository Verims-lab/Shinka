import { HEALTH_RETENTION_TESTS } from '../../tests/healthRetentionTests';
import { makeCase } from '../caseFactory';
import { CLASS, RUNNER } from '../constants';
import { syntheticProbe } from './domainProbe';
const c=makeCase('H17',{runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME});
const run=(...ids)=>syntheticProbe(HEALTH_RETENTION_TESTS.filter(([id])=>ids.includes(id)));
export const H17_CASES=[
 c('H17-001','Latest five and active save recovery protection','Real planner orders canonical UTC/offset report finish times; protects failures in the latest five, INCOMPLETE even with completed_at, unknown report time/ID and explicit active recovery. Native metadata is never timezone-repaired; apply requires operator drain.',run('HR01')),
 c('H17-002','Bounded cleanup resume and complete inventory','Real module with 106 isolated rows: keyset pages, sequential <=25 IDs, same reviewed targets, lost ACK, interruption, independently verified absence.',run('HR02')),
 c('H17-003','Retained artifact references and concurrent conflicts','Shared files and all product rows remain; unsupported file deletion is explicitly NOT_RUN. Fingerprint change, duplicate identity, latest-five and mid-pass role loss fail closed.',run('HR03','HR05')),
 c('H17-004','Unauthorized maintenance has zero mutations','Real dispatch/module denies wrong app, non-admin, anonymous, inactive and arbitrary payloads. No live cleanup in Health.',run('HR04')),
];
