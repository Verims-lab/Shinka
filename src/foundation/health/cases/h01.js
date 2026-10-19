import { BUILD_MARKER } from "@/foundation/buildMarker";
import { isValidMarker, validateLedger } from "@/foundation/buildMarkerRules";
import { BUILD_LEDGER } from "@/foundation/buildLedger";
import { resolveEnvironment } from "@/foundation/environment";
import { HEALTH_CATALOG_VERSION, CLASS, SEVERITY, RUNNER } from "../constants";
import { ev, verdict, blockedResult } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H01", { severity: SEVERITY.CRITICAL });

export const H01_CASES = [
  c("H01-001", "BuildMarker format", "Canonical BuildMarker matches Buildmarker-NNN (three digits).", async () =>
    verdict(isValidMarker(BUILD_MARKER), ev(CLASS.STATIC, "src/foundation/buildMarker.js", BUILD_MARKER, "/^Buildmarker-\\d{3}$/", "Format check of canonical constant"))),
  c("H01-002", "BuildMarker single source", "Exactly one module exports BUILD_MARKER; marker literals only in AUTHORITY/HISTORY/FIXTURE roles.", async (ctx) => {
    const r = (await ctx.inspection()).marker;
    return verdict(r.ok, ev(CLASS.STATIC, "build-time syntax inspection manifest", { authorityExports: r.authorityExports, literalFiles: r.literalFiles, unexpected: r.unexpected },
      { authorityExports: ["/src/foundation/buildMarker.js"], unexpected: [] }, "Static source scan"));
  }),
  c("H01-003", "Displayed marker matches application marker", "Every rendered [data-build-marker] element shows the canonical marker.", async () => {
    const els = Array.from(document.querySelectorAll("[data-build-marker]"));
    if (!els.length) return blockedResult(ev(CLASS.LIVE_RUNTIME, "DOM", 0, "≥1 marker element", "No marker element rendered"));
    const values = [...new Set(els.map((e) => e.textContent.trim()))];
    return verdict(values.length === 1 && values[0] === BUILD_MARKER, ev(CLASS.LIVE_RUNTIME, "DOM [data-build-marker]", values, [BUILD_MARKER], `${els.length} element(s) inspected`));
  }, { runnerType: RUNNER.DOM, classification: CLASS.LIVE_RUNTIME }),
  c("H01-004", "Current environment resolved", "Runtime environment resolves to LOCAL, PREVIEW or PUBLISHED.", async () => {
    const env = resolveEnvironment();
    return verdict(["LOCAL", "PREVIEW", "PUBLISHED"].includes(env.id), ev(CLASS.LIVE_RUNTIME, "window.location", env.id, "LOCAL|PREVIEW|PUBLISHED", "Resolved from real runtime location"));
  }, { runnerType: RUNNER.RUNTIME, classification: CLASS.LIVE_RUNTIME }),
  c("H01-005", "Health catalog version present", "Health catalog version constant exists and is well-formed.", async () =>
    verdict(/^HC-\d{3}\.\d+$/.test(HEALTH_CATALOG_VERSION), ev(CLASS.STATIC, "src/foundation/health/constants.js", HEALTH_CATALOG_VERSION, "/^HC-\\d{3}\\.\\d+$/", "Constant inspection"))),
  c("H01-006", "Build Ledger consistent with canonical marker", "Active source holds at most five unique +1 sequential packages including current; generated history matches.", async (ctx) => {
    const history = (await ctx.inspection()).activeBuildHistory;
    const r = validateLedger(BUILD_LEDGER, BUILD_MARKER);
    return verdict(r.ok && history.generatedMatches, ev(CLASS.STATIC, "src/foundation/buildLedgerData.js + generated history", { entries: BUILD_LEDGER.length, generatedMatches: history.generatedMatches, errors: r.errors }, { errors: [] }, "Ledger validation"));
  }),
];