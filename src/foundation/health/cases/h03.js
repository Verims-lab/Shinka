import { checkSingleSource, findLegacyImports, findSecrets, findPersonalEmails, missingBoundaries, checkInternalUiPurity } from "@/foundation/inspection/sourceRules";
import { CLASS, RUNNER } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H03");
const scan = (fn, source, expected, reason) => async (ctx) => {
  const actual = fn(await ctx.sources());
  const ok = Array.isArray(actual) ? actual.length === 0 : actual.ok;
  return verdict(ok, ev(CLASS.STATIC, source, actual, expected, reason));
};

export const H03_CASES = [
  c("H03-001", "No legacy Shinka source/module import", "No import specifier references legacy/check-in/symptom/premium/AI modules; no AI calls.",
    scan(findLegacyImports, "import specifiers in src/**", [], "Legacy firewall scan")),
  c("H03-002", "No duplicate BuildMarker authority", "Only src/foundation/buildMarker.js exports BUILD_MARKER.",
    scan((s) => { const r = checkSingleSource(s); return { ok: r.authorityExports.length === 1, authorityExports: r.authorityExports }; }, "export scan", { authorityExports: 1 }, "Authority export scan")),
  c("H03-003", "No hardcoded secret", "No API keys, private keys, JWTs or credential literals in client source.",
    scan(findSecrets, "secret pattern scan", [], "Secret pattern scan")),
  c("H03-004", "No hardcoded personal admin email", "No real email address literal in source (example.* placeholders allowed).",
    scan(findPersonalEmails, "email pattern scan", [], "Email pattern scan")),
  c("H03-005", "Foundational service boundaries exist", "Governance, Health and internal service modules exist at their documented paths.",
    scan((s) => missingBoundaries(Object.keys(s)), "module path inventory", [], "Boundary inventory")),
  c("H03-006", "No business logic in Health UI", "Internal UI imports only components/foundation/internal services; no direct data access.",
    scan((s) => { const r = checkInternalUiPurity(s); return { ok: r.files > 0 && r.violations.length === 0, ...r }; }, "src/pages|components/internal", { violations: [] }, "UI purity scan")),
  c("H03-008", "Auth configuration exposes only approved providers (OD-003)", "Recorded platform login-method configuration contains only Apple/Google; email/password disabled. CONFIGURATION POLICY only — not live Apple/Google sign-in proof.", async () => {
    const { checkAuthPolicy, OBSERVED_AUTH_METHODS } = await import("@/foundation/authPolicy");
    const r = checkAuthPolicy();
    return verdict(r.ok, ev(CLASS.RECORDED_DECISION, OBSERVED_AUTH_METHODS.source, { ...r, observedAt: OBSERVED_AUTH_METHODS.observedAt }, { ok: true, passwordEnabled: false, unapproved: [] }, "Configuration policy (not live auth)"));
  }),
  c("H03-007", "Foundation automated tests pass", "All foundation tests execute and pass against real helpers with synthetic fixtures.", async () => {
    const { runFoundationTests } = await import("@/foundation/tests/foundationTests");
    const results = await runFoundationTests();
    const failed = results.filter((t) => !t.passed).map((t) => `${t.id}:${t.detail}`);
    return verdict(failed.length === 0, ev(CLASS.SYNTHETIC_RUNTIME, "src/foundation/tests/foundationTests.js", { total: results.length, failed }, { failed: [] }, "In-app foundation test run"));
  }, { runnerType: RUNNER.RUNTIME, classification: CLASS.SYNTHETIC_RUNTIME, timeoutMs: 90000 }),
];