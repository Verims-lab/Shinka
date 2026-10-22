import { HEALTH_TIMING_TESTS } from '../../tests/healthTimingTests';
import { QUALITY_MILESTONE_TESTS } from '../../tests/qualityMilestoneTests';
import { HEALTH_READ_TESTS } from '../../tests/healthReadTests';
import { CLOSURE020_READINESS_TESTS } from '../../tests/closure020Tests';
import { checkCatalog, checkResults, checkSuiteCoverage, checkSummaryReconciles } from "../integrity";
import { computeGate } from "../aggregate";
import { SUITES } from "../suites";
import { CLASS, RUNNER, STATUS, APPLICABILITY } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase, futureCase } from "../caseFactory";
import { expectedHealthIds } from '../../../../base44/shared/healthPlan.js';
import { HEALTH_CATALOG_VERSION } from '../constants';
import { checkExecutionResults } from '../../../../base44/shared/healthExecutionEvidence.js';
import { AUDIT019_INTEGRITY_TESTS } from '../../tests/audit019Tests';
import { syntheticProbe } from './domainProbe';

const c = makeCase("H16", { runnerType: RUNNER.META, classification: CLASS.SYNTHETIC_RUNTIME });
const catalog = async () => (await import("../catalog")).HEALTH_CASES;

export const H16_CASES = [
  c("H16-001", "Catalog integrity", "Unique suite/case IDs, non-empty text, valid severity/applicability/runner/classification.", async () => {
    const r = checkCatalog(SUITES, await catalog());
    return verdict(r.ok, ev(CLASS.STATIC, "Health catalog", r.issues, "all issue lists empty", "Catalog self-test"));
  }, { classification: CLASS.STATIC }),
  c("H16-002", "Summary counts reconcile", "Status sums, attempted/executed and blocker counts reconcile with case results.", async (ctx) => {
    const r = checkSummaryReconciles(ctx.results);
    return verdict(r.ok, ev(CLASS.SYNTHETIC_RUNTIME, "current run results", r.checks, "all true", `${ctx.results.length} results reconciled`));
  }),
  c("H16-003", "No PASS without execution/evidence; valid statuses", "Every current PASS was attempted and executed with complete evidence; statuses and classifications are valid.", async (ctx) => {
    const r = checkResults(ctx.results);
    const execution = checkExecutionResults(ctx.results,ctx.expectedCaseIds,ctx.executionIdentity);
    return verdict(r.ok && execution.ok, ev(CLASS.SYNTHETIC_RUNTIME, "current run results", {issues:r.issues,execution}, "all issue lists empty", "Predicate, result and build binding self-test"));
  }),
  c("H16-004", "No empty applicable suite silently passes", "Every active suite has applicable cases; inactive suites hold none.", async () => {
    const r = checkSuiteCoverage(SUITES, await catalog());
    return verdict(r.ok, ev(CLASS.STATIC, "suites × cases", r, { emptyActive: [], currentInInactive: [] }, "Coverage self-test"));
  }, { classification: CLASS.STATIC }),
  c("H16-005", "Acceptance requirements stay outside active execution", "Future, local and external IDs remain tracked without fake execution statuses.", async (ctx) => {
    const {ACCEPTANCE_REQUIREMENTS,IN_APP_HEALTH_CASES}=await import('../catalog');
    const fake = ctx.results.filter(r=>r.applicability!==APPLICABILITY.CURRENT).map(r=>r.id);
    const overlap=ACCEPTANCE_REQUIREMENTS.filter(r=>IN_APP_HEALTH_CASES.some(c=>c.id===r.id)).map(r=>r.id);
    const plan=expectedHealthIds('FULL',HEALTH_CATALOG_VERSION);
    const planAligned=plan.length===IN_APP_HEALTH_CASES.length && plan.every(id=>IN_APP_HEALTH_CASES.some(c=>c.id===id));
    return verdict(planAligned && fake.length===0 && overlap.length===0 && ACCEPTANCE_REQUIREMENTS.length>0,ev(CLASS.SYNTHETIC_RUNTIME,'execution/acceptance inventories',{fake,overlap,planAligned,tracked:ACCEPTANCE_REQUIREMENTS.map(r=>r.id)},'disjoint and retained','No N/A placeholders dispatched'));
  }),
  c('H16-007','Negative evidence integrity regressions','Missing runners/assertions/results/measurements, wrong builds and incorrect supplied totals cannot pass. Helper timeout, cleanup, progress and completed-only cache integrity; private report cancellation/target validation are verified without opening real windows.',syntheticProbe([...AUDIT019_INTEGRITY_TESTS, ...CLOSURE020_READINESS_TESTS, ...HEALTH_READ_TESTS, ...HEALTH_TIMING_TESTS, ...QUALITY_MILESTONE_TESTS.filter(([id])=>['QM02','QM03','QM04'].includes(id))])),
  c("H16-006", "Gate reflects only applicable cases", "Gate is unchanged when future cases are removed or a synthetic future FAIL is injected.", async (ctx) => {
    const base = computeGate(ctx.results).status;
    const onlyCurrent = computeGate(ctx.results.filter((r) => r.applicability === APPLICABILITY.CURRENT)).status;
    const injected = computeGate([...ctx.results, { id: "SYN-FUTURE", applicability: APPLICABILITY.FUTURE, blocker: true, status: STATUS.FAIL }]).status;
    return verdict(base === onlyCurrent && base === injected, ev(CLASS.SYNTHETIC_RUNTIME, "computeGate", { base, onlyCurrent, injected }, "all equal", "Gate isolation check"));
  }),
  futureCase("H16", "H16-901", "Device proof: push delivery and open-to-Home", "Physical iOS/Android evidence required before release.", APPLICABILITY.EXTERNAL, CLASS.DEVICE),
  futureCase("H16", "H16-902", "Device proof: Apple/Google sign-in", "Physical device sign-in evidence required before release.", APPLICABILITY.EXTERNAL, CLASS.DEVICE),
  futureCase("H16", "H16-903", "Restore proof: deleted health data stays deleted", "Base44 backup/restore evidence required before release.", APPLICABILITY.EXTERNAL, CLASS.BLOCKED_EXTERNAL),
];
