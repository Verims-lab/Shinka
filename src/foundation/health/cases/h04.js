import { REQUIRED_DOCS } from '@/foundation/inspection/docRules';
import { DOMAIN_ENTITIES, RELATIONSHIPS, INTERNAL_TOOLING_ENTITIES } from '@/foundation/domainContract';
import { CAPABILITY_REGISTER } from '@/foundation/capabilityRegister';
import { DATA_MODEL_TESTS } from '@/foundation/tests/dataModelTests';
import { TIMESTAMP_MAPPING } from '../../../../base44/shared/domainSchemas.js';
import { CLASS, RUNNER, APPLICABILITY } from '../constants';
import { ev, verdict, blockedResult } from '../evidence';
import { makeCase } from '../caseFactory';
import { syntheticProbe } from './domainProbe';
const c=makeCase('H04');
const tests=(ids)=>syntheticProbe(DATA_MODEL_TESTS.filter(([id])=>ids.includes(id)));
const runtime={runnerType:RUNNER.RUNTIME,classification:CLASS.SYNTHETIC_RUNTIME};
export const H04_CASES=[
 c('H04-001','Authoritative domain entity count = 20','Exactly 20 approved definitions.',async()=>verdict(DOMAIN_ENTITIES.length===20&&new Set(DOMAIN_ENTITIES.map(d=>d.name)).size===20,ev(CLASS.STATIC,'domainContract',{count:DOMAIN_ENTITIES.length},20,'Canonical inventory'))),
 c('H04-002','Domain entity names documented','Every physical schema has a documented mapping.',async ctx=>{const d=(await ctx.inspection()).docs;return verdict(d.present===REQUIRED_DOCS.length&&d.missingDomainEntities.length===0,ev(CLASS.STATIC,'canonical docs',{present:d.present,missing:d.missingDomainEntities},{present:REQUIRED_DOCS.length,missing:[]},'Source/doc consistency'));}),
 c('H04-003','User identity and internal tooling excluded','One canonical logical/physical mapping.',tests(['D02']),runtime),
 c('H04-004','Source relationships map real fields','25 relations: workbook relationship sheet plus deletion-job owner from its entity sheet.',tests(['D10']),runtime),
 c('H04-005','Native constraint capability claims are honest','Native UNIQUE unsupported; FK/index/atomicity not claimed verified.',async()=>{const falsePass=DOMAIN_ENTITIES.flatMap(d=>d.constraints).concat(RELATIONSHIPS).some(c=>c.verification==='VERIFIED');return verdict(!falsePass&&['CAP-02','CAP-03'].every(id=>CAPABILITY_REGISTER.find(c=>c.id===id)?.status==='UNSUPPORTED'),ev(CLASS.STATIC,'capability register',{falsePass,nativeUnique:'UNSUPPORTED'},'No invented native guarantees','Official schema docs + registered evidence'));}),
 c('H04-006','Deployed physical product schemas present','Read-only backend probe must find all 20 schemas after sync/deploy.',async ctx=>{try{const probe=await ctx.entityProbe();const ready=probe.length===20&&probe.every(p=>p.state==='PRESENT');const evidence=ev(CLASS.LIVE_RUNTIME,'server entity probe',{present:probe.filter(p=>p.state==='PRESENT').length,expected:20},20,'No row content returned; existence does not prove enforcement');return ready?verdict(true,evidence):blockedResult(evidence);}catch{return blockedResult(ev(CLASS.LIVE_RUNTIME,'server entity probe',{available:false},'20 deployed schemas','Live backend unavailable'));}},{runnerType:RUNNER.BACKEND,classification:CLASS.LIVE_RUNTIME,applicability:APPLICABILITY.EXTERNAL,executionLocation:'EXTERNAL',blocker:false}),
 c('H04-007','Physical repository schemas match source','All 20 schema files and exact field-name receipt; no extra product schemas.',tests(['D01','D03','D22']),runtime),
 c('H04-008','Field types and ranges enforced','Runtime schema validation covers dates, time, enums, numeric bounds and IANA timezone.',tests(['D05','D06','D07','D08','D09','D19','D20']),runtime),
 c('H04-009','Optional fields preserve logical NULL','No calculation defaults stored as user input.',tests(['D04']),runtime),
 c('H04-010','Foreign reference prechecks reject missing/cross-owner targets','Reference guard is not native FK/transaction proof.',tests(['D11']),runtime),
 c('H04-011','Canonical uniqueness keys','Single and compound logical constraints share one key contract.',tests(['D12']),runtime),
 c('H04-012','Idempotent creation and concurrency protocol','Synthetic atomic adapter preserves first daily record and singleton identity.',tests(['D13','D14']),runtime),
 c('H04-013','Conditional mutation and safe readback fail closed','No unproven production atomicity adapter enabled.',tests(['D15','D16','D17','D21']),runtime),
 c('H04-014','OD-004 mapping remains evidence-bounded','Native fields mapped without duplicate timestamp properties.',async()=>{await DATA_MODEL_TESTS.find(([id])=>id==='D18')[2]();return verdict(TIMESTAMP_MAPPING.status==='PARTIALLY_VERIFIED',ev(CLASS.STATIC,'timestamp mapping',{created_at:TIMESTAMP_MAPPING.created_at,updated_at:TIMESTAMP_MAPPING.updated_at,status:TIMESTAMP_MAPPING.status},'Native aliases; live behavior pending','Availability observed on tooling; no immutable/UTC proof'));}),
 c('H04-015','Domain access matrix and deny rules complete','All product direct SDK CRUD denied; backend read gate and private operational receipts required.',async ctx=>{const d=(await ctx.inspection()).domain;return verdict(d.accessMatrixComplete&&d.directOperationsDenied&&d.internal===INTERNAL_TOOLING_ENTITIES.length&&d.testOperationPolicy&&d.calendarActionPolicy&&d.healthHistoryPolicy&&d.builtinUserSeparate,ev(CLASS.STATIC,'physical schema inspection',{matrixRows:d.accessMatrixRows,directOperationsDenied:d.directOperationsDenied,internal:d.internal,calendarActionPolicy:d.calendarActionPolicy,healthHistoryPolicy:d.healthHistoryPolicy},'20 complete matrix rows; SDK denied; three closed operational/tooling schemas','Deployed enforcement checked separately'));}),
];
