import { DESIGN_TOKENS } from "@/foundation/designTokens";
import { SOURCE_INVENTORY } from "@/foundation/sourceInventory";
import { findUnlabeledControls, findSmallTargets, probeMobileOverflow } from "@/foundation/probes/domProbes";
import { CLASS, RUNNER, STATUS } from "../constants";
import { ev, verdict, blockedResult } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H13");
const DOM = { runnerType: RUNNER.DOM, classification: CLASS.LIVE_RUNTIME };
const root = () => document.querySelector("[data-health-root]");
const noRoot = () => blockedResult(ev(CLASS.LIVE_RUNTIME, "DOM", null, "[data-health-root]", "Health page root not rendered"));

export const H13_CASES = [
  c("H13-001", "Design token source exists", "Token module defines color, typography, spacing, radii, control sizes, touch target, icons and motion.", async () => {
    const keys = ["color", "typography", "spacing", "radii", "control", "touchTargetMin", "iconFamily", "motion"];
    const missing = keys.filter((k) => DESIGN_TOKENS[k] === undefined);
    return verdict(missing.length === 0 && DESIGN_TOKENS.theme === "light-only", ev(CLASS.STATIC, "src/foundation/designTokens.js", { missing, theme: DESIGN_TOKENS.theme, status: DESIGN_TOKENS.status }, { missing: [], theme: "light-only" }, "Token inspection"));
  }),
  c("H13-002", "Minimum 44×44 touch target", "Token is 44 and every rendered Health control is at least 44×44.", async () => {
    if (!root()) return noRoot();
    const small = findSmallTargets(root(), DESIGN_TOKENS.touchTargetMin);
    return verdict(DESIGN_TOKENS.touchTargetMin === 44 && small.length === 0, ev(CLASS.LIVE_RUNTIME, "DOM getBoundingClientRect", { token: DESIGN_TOKENS.touchTargetMin, small }, { token: 44, small: [] }, "Rendered size check"));
  }, DOM),
  c("H13-003", "Typography tokens represented", "Headings render in Cormorant Garamond and body in Inter.", async () => {
    const r = root();
    if (!r) return noRoot();
    const h = r.querySelector("h1");
    const head = h ? getComputedStyle(h).fontFamily : "";
    const body = getComputedStyle(r).fontFamily;
    return verdict(/Cormorant Garamond/.test(head) && /Inter/.test(body), ev(CLASS.LIVE_RUNTIME, "getComputedStyle", { heading: head, body }, { heading: "Cormorant Garamond", body: "Inter" }, "Computed font check"));
  }, DOM),
  c("H13-004", "No horizontal overflow at 360px", "Health page rendered in a 360px-wide frame has no horizontal overflow.", async () => {
    const r = await probeMobileOverflow("/internal/health?probe=1", 360, 15000);
    if (r.state !== "MEASURED") return blockedResult(ev(CLASS.LIVE_RUNTIME, "iframe layout probe", r, "MEASURED", `Probe ${r.state}`));
    return verdict(!r.overflow, ev(CLASS.LIVE_RUNTIME, "iframe layout probe /internal/health", r, { overflow: false }, "Measured scrollWidth"));
  }, { ...DOM, timeoutMs: 20000 }),
  c("H13-005", "Accessible labels on interactive Health controls", "Every visible control inside the Health page has an accessible name.", async () => {
    if (!root()) return noRoot();
    const unlabeled = findUnlabeledControls(root());
    return verdict(unlabeled.length === 0, ev(CLASS.LIVE_RUNTIME, "DOM accessible-name check", { unlabeled }, { unlabeled: [] }, "Accessible name scan"));
  }, DOM),
  c("H13-006", "Tokens reconciled with UI/UX v1.1", "Exact approved token values are verified against UI/UX Tasarım v1.1.", async () => {
    const src = SOURCE_INVENTORY.find((s) => s.id === "SRC-03");
    if (src.status !== "READ") return { status: STATUS.BLOCKED, evidence: ev(CLASS.BLOCKED_EXTERNAL, "SRC-03", src.status, "READ", "UI/UX v1.1 not received (OD-001); tokens PROVISIONAL") };
    return verdict(DESIGN_TOKENS.status === "APPROVED", ev(CLASS.STATIC, "designTokens.js", DESIGN_TOKENS.status, "APPROVED", "Token approval status"));
  }),
];