import { checkCatalog, checkResults, checkSuiteCoverage, checkSummaryReconciles } from "../integrity";
import { computeGate } from "../aggregate";
import { SUITES } from "../suites";
import { CLASS, RUNNER, STATUS, APPLICABILITY } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase, futureCase } from "../caseFactory";

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
    return verdict(r.ok, ev(CLASS.SYNTHETIC_RUNTIME, "current run results", r.issues, "all issue lists empty", "Result self-test"));
  }),
  c("H16-004", "No empty applicable suite silently passes", "Every active suite has applicable cases; inactive suites hold none.", async () => {
    const r = checkSuiteCoverage(SUITES, await catalog());
    return verdict(r.ok, ev(CLASS.STATIC, "suites × cases", r, { emptyActive: [], currentInInactive: [] }, "Coverage self-test"));
  }, { classification: CLASS.STATIC }),
  c("H16-005", "Future suites do not fake PASS", "Every non-current case in the run is NOT_APPLICABLE.", async (ctx) => {
    const fake = ctx.results.filter((r) => r.applicability !== APPLICABILITY.CURRENT && r.status !== STATUS.NOT_APPLICABLE).map((r) => r.id);
    return verdict(fake.length === 0, ev(CLASS.SYNTHETIC_RUNTIME, "current run results", { fake, futureCases: ctx.results.filter((r) => r.applicability !== APPLICABILITY.CURRENT).length }, { fake: [] }, "Future status check"));
  }),
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
