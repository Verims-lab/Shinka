// H13 static UI/UX v1.1 contract cases.
import { DESIGN_TOKENS } from "@/foundation/designTokens";
import { checkLocalization, findHardcodedStrings, findDarkVariants } from "@/foundation/inspection/uiRules";
import { CLASS, RUNNER } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H13");
const UI_FILES = ["/src/components/shinka/", "/src/components/internal/", "/src/pages/Home.jsx", "/src/pages/internal/"];
const SHELL_FILES = ["/src/pages/Home.jsx", "/src/components/shinka/StatePanel.jsx"];
const SHELL_LITERALS = ["Home", "Calendar", "Pattern", "Retry"];

export const H13_STATIC_CASES = [
  c("H13-010", "Light-only target", "Theme token is light-only, no dark class is active and Shinka/internal UI uses no dark variants.", async (ctx) => {
    const darkFiles = findDarkVariants(await ctx.sources(), UI_FILES);
    const darkActive = document.documentElement.className.split(" ").includes("dark");
    return verdict(DESIGN_TOKENS.theme === "light-only" && !darkActive && !darkFiles.length, ev(CLASS.LIVE_RUNTIME, "tokens + html class + source scan", { theme: DESIGN_TOKENS.theme, darkActive, darkFiles }, { theme: "light-only", darkActive: false, darkFiles: [] }, "Light-only check"));
  }, { runnerType: RUNNER.DOM, classification: CLASS.LIVE_RUNTIME }),
  c("H13-011", "Centralized localization for Foundation UI", "EN/TR catalogs have identical non-empty keys; Foundation shell/state components hardcode no nav or retry strings.", async (ctx) => {
    const l = checkLocalization();
    const hard = findHardcodedStrings(await ctx.sources(), SHELL_FILES, SHELL_LITERALS);
    return verdict(l.ok && !hard.length, ev(CLASS.STATIC, "i18n/strings.js + Foundation UI sources", { ...l, hardcoded: hard }, { ok: true, hardcoded: [] }, "Localization inspection"));
  }),
];