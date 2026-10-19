// Foundation automated tests (in-app runner). Uses real helpers + deterministic synthetic fixtures.
// FIXTURE role: marker literals below are test fixtures, not authorities.
import { BUILD_MARKER } from "@/foundation/buildMarker";
import { isValidMarker, nextMarker, validateTransition, validateLedger } from "@/foundation/buildMarkerRules";
import { BUILD_LEDGER } from "@/foundation/buildLedger";
import { SOURCE_INVENTORY } from "@/foundation/sourceInventory";
import { UI_CONTRACT_TESTS } from "@/foundation/tests/uiContractTests";
import { DESIGN_TOKENS } from "@/foundation/designTokens";
import { loadStaticEvidence } from "@/foundation/inspection/sourceScanner";
import { findLegacyImports } from "@/foundation/inspection/sourceRules";
import { SUITES } from "@/foundation/health/suites";
import { summarize, computeGate } from "@/foundation/health/aggregate";
import { checkCatalog, checkSuiteCoverage } from "@/foundation/health/integrity";
import { enforceEvidence } from "@/foundation/health/evidence";
import { buildReport, redact } from "@/foundation/health/report";
import { STATUS, APPLICABILITY as A, GATE } from "@/foundation/health/constants";
import { validatorFixtureResult } from "../../../base44/shared/contentArtifactValidator.ts";
import { HARDENING_TESTS } from "./hardeningTests";
import { HEALTH_CLOSURE_TESTS } from "./healthClosureTests";
import { CSS_CONTRACT_TESTS } from "./cssContractTests";
import { DATA_MODEL_TESTS } from "./dataModelTests";
import { ONBOARDING_DECISION_TESTS } from './onboardingDecisionTests';
import { PRODUCTION_ONBOARDING_TESTS } from './productionOnboardingTests';
import { ONBOARDING_UI_TESTS } from './onboardingUiTests';
import { AUTH_TESTS, ONBOARDING_TESTS } from './onboardingTests';
import { SECURITY_TESTS } from "./securityTests";
import { ev } from "@/foundation/health/evidence";
import { findUnlabeledControls, probeMobileOverflow } from "@/foundation/probes/domProbes";

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const r = (id, status, applicability = A.CURRENT, extra = {}) =>
  ({ id, suiteId: id.slice(0, 3), status, applicability, blocker: true, attempted: applicability === A.CURRENT, executed: applicability === A.CURRENT, evidence: ev("SYNTHETIC_RUNTIME", "fixture", true, true, "Deterministic test fixture"), ...extra });
const okSet = () => [r("H01-001", STATUS.PASS), r("H01-002", STATUS.PASS)];
const fixtureCases = (ids) => ids.map((id) => ({ id, suiteId: id.slice(0, 3), title: "t", description: "d", severity: "HIGH", applicability: A.CURRENT, runnerType: "STATIC", classification: "STATIC" }));

/** @type {import("./testTypes").FoundationTest[]} */
export const FOUNDATION_TESTS = [
  ["T01", "BuildMarker format", () => assert(isValidMarker(BUILD_MARKER) && !isValidMarker("buildmarker-001") && !isValidMarker("Buildmarker-01"), "format")],
  ["T02", "BuildMarker single source", async () => assert((await loadStaticEvidence()).marker.ok, "single source violated")],
  ["T03", "Next-marker logic", () => assert(nextMarker("Buildmarker-001") === "Buildmarker-002" && nextMarker("Buildmarker-009") === "Buildmarker-010" && nextMarker("Buildmarker-099") === "Buildmarker-100", "next")],
  ["T04", "Marker cannot decrement", () => assert(validateTransition("Buildmarker-005", "Buildmarker-004").code === "BUILD_MARKER_DECREMENT", "decrement allowed")],
  ["T05", "Marker increments by exactly one", () => {
    assert(validateTransition("Buildmarker-001", "Buildmarker-002").ok, "+1 rejected");
    assert(validateTransition("Buildmarker-001", "Buildmarker-003").code === "BUILD_MARKER_SKIPPED", "skip allowed");
    assert(validateTransition("Buildmarker-001", "Buildmarker-001").code === "BUILD_MARKER_NOT_INCREMENTED", "same allowed");
  }],
  ["T06", "Build Ledger uniqueness", () => {
    const e = { build_marker: "Buildmarker-001" };
    assert(!validateLedger([e, e], "Buildmarker-001").ok, "duplicate accepted");
    assert(validateLedger(BUILD_LEDGER, BUILD_MARKER).ok, "real ledger invalid");
  }],
  ["T07", "Health suite IDs unique", () => assert(new Set(SUITES.map((s) => s.id)).size === SUITES.length && checkCatalog([...SUITES, SUITES[0]], []).issues.duplicateSuiteIds.length === 1, "suite ids")],
  ["T08", "Health case IDs unique", async () => {
    const { HEALTH_CASES } = await import("@/foundation/health/catalog");
    assert(checkCatalog(SUITES, HEALTH_CASES).ok, "real catalog invalid");
    assert(checkCatalog(SUITES, fixtureCases(["H01-001", "H01-001"])).issues.duplicateCaseIds.length === 1, "dup not detected");
  }],
  ["T09", "Health summary aggregation", () => {
    const s = summarize([r("H01-001", STATUS.PASS), r("H01-002", STATUS.FAIL), r("H07-001", STATUS.NOT_APPLICABLE, A.FUTURE)]);
    assert(s.passed === 1 && s.failed === 1 && s.notApplicable === 1 && s.planned === 2 && s.attempted === 2, "counts");
  }],
  ["T10", "FAIL prevents READY", () => assert(computeGate([...okSet(), r("H01-003", STATUS.FAIL)]).status === GATE.NOT_READY, "fail ready")],
  ["T11", "WARNING prevents READY", () => assert(computeGate([...okSet(), r("H01-003", STATUS.WARNING)]).status === GATE.NOT_READY, "warning ready")],
  ["T12", "Applicable BLOCKED prevents READY", () => assert(computeGate([...okSet(), r("H01-003", STATUS.BLOCKED)]).status === GATE.BLOCKED, "blocked ready")],
  ["T13", "Future NOT_APPLICABLE does not block", () => assert(computeGate([...okSet(), r("H07-001", STATUS.NOT_APPLICABLE, A.FUTURE)]).status === GATE.READY, "future blocks")],
  ["T14", "PASS requires evidence", () => assert(enforceEvidence({ status: STATUS.PASS, evidence: null }).status === STATUS.FAIL, "pass without evidence")],
  ["T15", "Report BuildMarker = canonical", () => {
    const now = new Date();
    const rep = buildReport({ scope: "FULL", started: now, completed: now, results: okSet(), summary: summarize(okSet()), gate: computeGate(okSet()) });
    assert(rep.buildMarker === BUILD_MARKER && rep.schemaVersion, "report marker");
  }],
  ["T16", "No empty applicable suite silently passes", () => assert(!checkSuiteCoverage([{ id: "H01", active: true }], []).ok, "empty suite passed")],
  ["T17", "Health report redaction", () => {
    const out = JSON.stringify(redact({ token: "abc", nested: { email: "x" }, note: "mail a.b@example.test Bearer abc.def" }));
    assert(!out.includes("abc") && !out.includes("example.test") && out.includes("[REDACTED]"), "not redacted");
  }],
  ["T18", "Source inventory has 10 unique logical sources", () => assert(SOURCE_INVENTORY.length === 10 && new Set(SOURCE_INVENTORY.map((s) => s.file)).size === 10, "inventory")],
  ["T19", "Canonical docs exist", async () => assert((await loadStaticEvidence()).docs.missing.length === 0, "docs missing")],
  ["T20", "Docs reference current BuildMarker", async () => assert((await loadStaticEvidence()).docs.misaligned.length === 0, "docs misaligned")],
  ["T21", "Legacy-source firewall", async () => {
    // Isolated synthetic module: a real statement-level legacy import must be caught.
    const realImport = ["// synthetic module", "import a from '@/legacy/engine';", "export default a;"].join("\n");
    assert(findLegacyImports({ "/fixture/real.js": realImport }).length === 1, "real legacy import not caught");
    // Import-like text inside a string literal is not an import (this test file's own fixture must not pollute the scan).
    const quoted = "const s = \"import a from '@/legacy/engine';\";";
    assert(findLegacyImports({ "/fixture/quoted.js": quoted }).length === 0, "string fixture misread as import");
    // Clean source mixed with an injected legacy module → detector fails the set.
    const manifest = await loadStaticEvidence();
    assert(manifest.legacy.length === 0, "real source legacy finding");
    assert(findLegacyImports({ "/src/injected.js": realImport }).length === 1, "injected legacy import not caught");
  }],
  ["T22", "Content validator detects duplicates/missing fields", async () => {
    const result = validatorFixtureResult();
    assert(result.contentDuplicateIds.length === 1 && result.contentMissingCellCount === 1 && result.mappingDuplicates.length === 1, "fixture defects not detected");
  }],
  ["T23", "Design tokens load", () => assert(DESIGN_TOKENS.touchTargetMin === 44 && /Cormorant/.test(DESIGN_TOKENS.typography.heading) && /Inter/.test(DESIGN_TOKENS.typography.body), "tokens")],
  ["T24", "Health page has no horizontal overflow at 360px", async () => {
    const p = await probeMobileOverflow("/internal/health?probe=1", 360, 15000);
    assert(p.state === "MEASURED" && !p.overflow, `probe ${p.state} sw=${p.scrollWidth}`);
  }],
  ["T25", "Interactive Health controls have accessible labels", () => {
    const u = findUnlabeledControls(document.querySelector("[data-health-root]"));
    assert(u !== null && u.length === 0, u === null ? "health root not rendered" : `unlabeled: ${u.join(",")}`);
  }],
];

export async function runFoundationTests() {
  const out = [];
  for (const [id, name, fn] of [...FOUNDATION_TESTS, ...UI_CONTRACT_TESTS, ...HARDENING_TESTS, ...CSS_CONTRACT_TESTS, ...DATA_MODEL_TESTS, ...SECURITY_TESTS, ...AUTH_TESTS, ...ONBOARDING_TESTS, ...ONBOARDING_UI_TESTS, ...PRODUCTION_ONBOARDING_TESTS, ...ONBOARDING_DECISION_TESTS, ...HEALTH_CLOSURE_TESTS]) {
    try { const result=await fn(); out.push({ id, name, passed: true, detail: "ok", ...(result&&typeof result==="object"&&"evidence" in result?{evidence:result.evidence}:{}) }); }
    catch (e) { out.push({ id, name, passed: false, detail: String(e?.message || e).slice(0, 160) }); }
  }
  return out;
}
