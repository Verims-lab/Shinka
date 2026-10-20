import { localCase } from '../caseFactory';
import { futureCase } from '../caseFactory';
import { APPLICABILITY } from '../constants';
// H13 static UI/UX v1.1 contract cases.
import { DESIGN_TOKENS } from "@/foundation/designTokens";
import { checkLocalization } from "@/foundation/inspection/uiRules";
import { CLASS, RUNNER } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H13");
export const H13_STATIC_CASES = [
  localCase('H13','H13-012','Mobile forms and localized list regression','Local Chromium/WebKit: TR/EN onboarding, Home, Calendar, Profile menu and Admin; 320/360/390/430/landscape, 200% text, 44px targets and dialog/menu focus. Separate from physical keyboard/safe-area acceptance.'),
  futureCase('H13','H13-013','Physical Android Chrome and iOS Safari acceptance','Real keyboard, safe-area/browser bars, native date/time/select, zoom, background return and provider callbacks need paired devices. Playwright is not physical Safari.',APPLICABILITY.EXTERNAL,CLASS.DEVICE),
  c("H13-010", "Light-only target", "Theme token is light-only, no dark class is active and Shinka/internal UI uses no dark variants.", async (ctx) => {
    const darkFiles = (await ctx.inspection()).ui.darkFiles;
    const darkActive = document.documentElement.className.split(" ").includes("dark");
    return verdict(DESIGN_TOKENS.theme === "light-only" && !darkActive && !darkFiles.length, ev(CLASS.LIVE_RUNTIME, "tokens + html class + source scan", { theme: DESIGN_TOKENS.theme, darkActive, darkFiles }, { theme: "light-only", darkActive: false, darkFiles: [] }, "Light-only check"));
  }, { runnerType: RUNNER.DOM, classification: CLASS.LIVE_RUNTIME }),
  c("H13-011", "Centralized localization for Foundation UI", "EN/TR catalogs have identical non-empty keys; Foundation shell/state components hardcode no nav or retry strings.", async (ctx) => {
    const l = checkLocalization();
    const hard = (await ctx.inspection()).ui.hardcoded;
    return verdict(l.ok && !hard.length, ev(CLASS.STATIC, "i18n/strings.js + Foundation UI sources", { ...l, hardcoded: hard }, { ok: true, hardcoded: [] }, "Localization inspection"));
  }),
];
