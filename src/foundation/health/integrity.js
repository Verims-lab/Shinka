// Health catalog self-tests (pure).
import { STATUS, CLASS, SEVERITY, APPLICABILITY, RUNNER } from "./constants";
import { summarize } from "./aggregate";
import { hasEvidence } from "./evidence";

const dups = (arr) => arr.filter((x, i) => arr.indexOf(x) !== i);
const inEnum = (obj, v) => Object.values(obj).includes(v);

export function checkCatalog(suites, cases) {
  const suiteIds = suites.map((s) => s.id);
  const issues = {
    duplicateSuiteIds: dups(suiteIds),
    duplicateCaseIds: dups(cases.map((c) => c.id)),
    orphanCases: cases.filter((c) => !suiteIds.includes(c.suiteId)).map((c) => c.id),
    idPrefixMismatch: cases.filter((c) => !c.id.startsWith(`${c.suiteId}-`)).map((c) => c.id),
    emptyText: cases.filter((c) => !c.title?.trim() || !c.description?.trim()).map((c) => c.id),
    badSeverity: cases.filter((c) => !inEnum(SEVERITY, c.severity)).map((c) => c.id),
    badApplicability: cases.filter((c) => !inEnum(APPLICABILITY, c.applicability)).map((c) => c.id),
    badRunner: cases.filter((c) => !inEnum(RUNNER, c.runnerType)).map((c) => c.id),
    badClassification: cases.filter((c) => !inEnum(CLASS, c.classification)).map((c) => c.id),
    missingRunner: cases.filter(c => c.applicability === APPLICABILITY.CURRENT && c.executionLocation !== 'LOCAL_BROWSER' && typeof c.run !== 'function').map(c => c.id),
  };
  return { ok: Object.values(issues).every((v) => v.length === 0), issues };
}

export function checkResults(results) {
  const issues = {
    badStatus: results.filter((r) => !inEnum(STATUS, r.status)).map((r) => r.id),
    badEvidenceClass: results.filter((r) => r.evidence && !inEnum(CLASS, r.evidence.classification)).map((r) => r.id),
    passWithoutEvidence: results.filter((r) => r.status === STATUS.PASS && !hasEvidence(r.evidence)).map((r) => r.id),
    passWithoutExecution: results.filter((r) => r.applicability === APPLICABILITY.CURRENT && r.status === STATUS.PASS && (r.attempted !== true || r.executed !== true)).map((r) => r.id),
    executedNotAttempted: results.filter((r) => r.executed && !r.attempted).map((r) => r.id),
  };
  return { ok: Object.values(issues).every((v) => v.length === 0), issues };
}

export function checkSuiteCoverage(suites, cases) {
  const emptyActive = suites.filter((s) => s.active && !cases.some((c) => c.suiteId === s.id && c.applicability === APPLICABILITY.CURRENT)).map((s) => s.id);
  const currentInInactive = cases.filter((c) => c.applicability === APPLICABILITY.CURRENT && !suites.find((s) => s.id === c.suiteId)?.active).map((c) => c.id);
  return { ok: emptyActive.length === 0 && currentInInactive.length === 0, emptyActive, currentInInactive };
}

export function checkSummaryReconciles(results, summary = summarize(results)) {
  const s = summary;
  const tally = (st) => results.filter((r) => r.status === st).length;
  const statusSum = s.passed + s.failed + s.warnings + s.blocked + s.notRun + s.notApplicable;
  const checks = {
    statusSumEqualsTotal: statusSum === results.length,
    passed: s.passed === tally(STATUS.PASS), failed: s.failed === tally(STATUS.FAIL), blocked: s.blocked === tally(STATUS.BLOCKED),
    attemptedGteExecuted: s.attempted >= s.executed,
    plannedEqualsApplicable: s.planned === results.filter((r) => r.applicability === APPLICABILITY.CURRENT).length,
    blockerCount: s.applicableBlockers === results.filter((r) => r.blocker && r.applicability === APPLICABILITY.CURRENT).length,
    exactTotals: Object.entries(summarize(results)).every(([key,value]) => s[key] === value),
  };
  return { ok: Object.values(checks).every(Boolean), checks, summary: s };
}
