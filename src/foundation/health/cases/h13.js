import { DESIGN_TOKENS } from "@/foundation/designTokens";
import { SOURCE_INVENTORY } from "@/foundation/sourceInventory";
import { findUnlabeledControls, findSmallTargets } from "@/foundation/probes/domProbes";
import { CLASS, RUNNER, STATUS } from "../constants";
import { ev, verdict, blockedResult } from "../evidence";
import { makeCase } from "../caseFactory";
import { H13_CONTRACT_CASES } from "./h13contract";
import { H13_NAV_CASES } from "./h13nav";
import { H13_STATIC_CASES } from "./h13static";

const c = makeCase("H13");
const DOM = { runnerType: RUNNER.DOM, classification: CLASS.LIVE_RUNTIME };
const root = () => document.querySelector("[data-health-root]");
const noRoot = () => blockedResult(ev(CLASS.LIVE_RUNTIME, "DOM", null, "[data-health-root]", "Health page root not rendered"));

export const H13_CASES = [
  c("H13-001", "Design token source exists", "Token module defines color, typography, spacing, radii, control sizes, touch target, icons, motion and card.", async () => {
    const keys = ["color", "typography", "spacing", "radii", "control", "touchTargetMin", "iconFamily", "motion", "card"];
    const missing = keys.filter((k) => DESIGN_TOKENS[k] === undefined);
    return verdict(missing.length === 0 && DESIGN_TOKENS.theme === "system", ev(CLASS.STATIC, "src/foundation/designTokens.js", { missing, theme: DESIGN_TOKENS.theme, status: DESIGN_TOKENS.status }, { missing: [], theme: "system" }, "Token inspection"));
  }),
  c("H13-002", "Minimum 44x44 touch target", "Token is 44 and every rendered Health control is at least 44x44.", async () => {
    if (!root()) return noRoot();
    const small = findSmallTargets(root(), DESIGN_TOKENS.touchTargetMin);
    return verdict(DESIGN_TOKENS.touchTargetMin === 44 && small.length === 0, ev(CLASS.LIVE_RUNTIME, "DOM getBoundingClientRect", { token: DESIGN_TOKENS.touchTargetMin, small }, { token: 44, small: [] }, "Rendered size check"));
  }, DOM),
  c("H13-003", "Typography families rendered", "Headings render in Cormorant Garamond and body in Inter.", async () => {
    const r = root();
    if (!r) return noRoot();
    const h = r.querySelector("h1");
    const head = h ? getComputedStyle(h).fontFamily : "";
    const body = getComputedStyle(r).fontFamily;
    return verdict(/Cormorant Garamond/.test(head) && /Inter/.test(body), ev(CLASS.LIVE_RUNTIME, "getComputedStyle", { heading: head, body }, { heading: "Cormorant Garamond", body: "Inter" }, "Computed font check"));
  }, DOM),
  c("H13-004", "Current Health viewport overflow", "Measures this rendered Health screen at its actual viewport; mobile/Build acceptance stays in local browser tests.", async () => {
    if (!root()) return noRoot();
    const width = document.documentElement.clientWidth, height = window.innerHeight;
    const scrollWidth = document.documentElement.scrollWidth;
    return verdict(width > 0 && scrollWidth <= width + 1, ev(CLASS.LIVE_RUNTIME,'current Health viewport', {width,height,scrollWidth,path:location.pathname}, {overflow:false}, 'Current viewport only; no inferred 320/360px or physical-device evidence'));
  }, DOM),
  c("H13-005", "Accessible labels on interactive controls", "Every visible control (including icon-only) inside the Health page has an accessible name.", async () => {
    if (!root()) return noRoot();
    const unlabeled = findUnlabeledControls(root());
    return verdict(unlabeled.length === 0, ev(CLASS.LIVE_RUNTIME, "DOM accessible-name check", { unlabeled }, { unlabeled: [] }, "Accessible name scan"));
  }, DOM),
  c("H13-006", "Canonical color tokens rendered exactly", "UI/UX v1.1 is READ, tokens APPROVED, and every rendered shinka CSS variable equals its token hex.", async () => {
    const src = SOURCE_INVENTORY.find((s) => s.id === "SRC-03");
    if (src.status !== "READ") return { status: STATUS.BLOCKED, evidence: ev(CLASS.BLOCKED_EXTERNAL, "SRC-03", src.status, "READ", "UI/UX v1.1 not received") };
    const { checkCssTokens } = await import("@/foundation/inspection/uiRules");
    const cs = getComputedStyle(document.documentElement);
    const r = checkCssTokens((v) => cs.getPropertyValue(v));
    return verdict(DESIGN_TOKENS.status === "APPROVED_UIUX_V1_1" && r.mismatches.length === 0, ev(CLASS.LIVE_RUNTIME, "getComputedStyle(:root)", { status: DESIGN_TOKENS.status, ...r }, { status: "APPROVED_UIUX_V1_1", mismatches: [] }, "Rendered token comparison"));
  }, DOM),
  ...H13_CONTRACT_CASES,
  ...H13_NAV_CASES,
  ...H13_STATIC_CASES,
].sort((a, b) => a.id.localeCompare(b.id));