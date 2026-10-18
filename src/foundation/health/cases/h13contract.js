// H13 UI/UX v1.1 contract cases.
import { DESIGN_TOKENS } from "@/foundation/designTokens";
import { CLASS, RUNNER } from "../constants";
import { ev, verdict, blockedResult } from "../evidence";
import { makeCase } from "../caseFactory";
import { primaryHeights, headingAndLabel } from "@/foundation/probes/uiProbes";

const c = makeCase("H13");
const DOM = { runnerType: RUNNER.DOM, classification: CLASS.LIVE_RUNTIME };
const root = () => document.querySelector("[data-health-root]");
const noRoot = () => blockedResult(ev(CLASS.LIVE_RUNTIME, "DOM", null, "[data-health-root]", "Health page root not rendered"));
const HEADINGS = "[[34,40],[28,34],[24,30],[20,26]]";
const BODY = "[[17,25],[15,22],[13,18]]";

export const H13_CONTRACT_CASES = [
  c("H13-007", "Typography contract (Medium headings, Inter labels)", "Token sizes match v1.1; a rendered heading uses weight 500; a rendered button label uses Inter 500.", async () => {
    const r = root();
    if (!r) return noRoot();
    const ty = DESIGN_TOKENS.typography;
    const sizesOk = JSON.stringify(ty.headingSizes) === HEADINGS && JSON.stringify(ty.bodySizes) === BODY;
    const m = headingAndLabel(r);
    return verdict(sizesOk && m.headingWeight === "500" && m.labelWeight === "500" && /Inter/.test(m.labelFamily), ev(CLASS.LIVE_RUNTIME, "tokens + getComputedStyle", { sizesOk, ...m }, { sizesOk: true, headingWeight: "500", labelWeight: "500", labelFamily: "Inter" }, "Typography check"));
  }, DOM),
  c("H13-009", "Primary control geometry at least 52px", "Primary/input token minimum is 52 and every rendered primary control on the Health page is at least 52px tall.", async () => {
    const r = root();
    if (!r) return noRoot();
    const prim = primaryHeights(r);
    const k = DESIGN_TOKENS.control;
    const ok = k.primaryMinHeight === 52 && k.inputMinHeight === 52 && prim.length > 0 && prim.every((x) => x >= 52);
    return verdict(ok, ev(CLASS.LIVE_RUNTIME, "DOM getBoundingClientRect", { primaryHeights: prim, token: k }, { primaryHeights: "all >= 52", count: ">0" }, "Rendered height check"));
  }, DOM),
];