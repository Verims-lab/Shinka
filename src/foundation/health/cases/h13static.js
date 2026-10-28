import { localCase } from '../caseFactory';
import { futureCase } from '../caseFactory';
import { APPLICABILITY } from '../constants';
// H13 static UI/UX v1.1 contract cases.
import { appThemeExpectation } from "@/lib/appTheme";
import { checkLocalization } from "@/foundation/inspection/uiRules";
import { CLASS, RUNNER } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase } from "../caseFactory";
import { SECTION_BACKGROUNDS, sectionBackground } from "@/foundation/sectionBackgrounds";

const c = makeCase("H13");
export const H13_STATIC_CASES = [
  localCase('H13','H13-012','Mobile forms and localized list regression','050 checkPreferenceSheets and checkCalendarContinuity verify selected option/roving keyboard, cancellation/focus, central dirty status, mobile text/simulated inset and retained scroll/month/drafts. Local Chromium/WebKit: FX01/FX02 (filled/blank/stale name skip and auth return; native future recording boundaries), OV01–OV06 + checkOnboardingClosure (actual locale, DOB-only, authenticated Back, retry/isolation, keyboard/picker/200% actions); U01–U19 and OU01–OU08 actual onboarding order/back/drafts, readback, unmount/account isolation, OAuth lock and combobox keyboard/paging; 047: U16/U17 preserve heading focus announcements without ON-01/04 frames; U19 verifies the persistent inner name label, focus frame, Back and native profile readback; checkOnboardingPresentation executes TR/EN 360/390px at 100/200% text with empty/filled/keyboard-focused name geometry. T81/T82/U15 retained shell checks, Home, Calendar, Profile menu and Admin; 320/360/390/430/landscape, 200% text, 44px targets and dialog/menu focus. 048 checkAppTheme covers OS light/dark × verified app light/dark, dark-overlay worst-pixel contrast, 360/390px TR/EN 200% text, preserved section backgrounds, save/reopen/failed/unknown and account isolation; unresolved/onboarding remains light. OS changes preserve the app choice; drawer/history, reduced motion and refresh included; separate from physical keyboard/safe-area/native back acceptance.'),
  futureCase('H13','H13-013','Physical Android Chrome and iOS Safari acceptance','Real keyboard, safe-area/browser bars, native date, app time dialog, bottom sheet, zoom, background return and provider callbacks need paired devices. Playwright is not physical Safari.',APPLICABILITY.EXTERNAL,CLASS.DEVICE),
  c("H13-010", "Rendered theme matches the verified application preference", "appTheme resolver's accepted account preference is independent of the measured DOM; unverified/onboarding defaults to light. OS changes never select the theme.", async () => {
    const expected = appThemeExpectation();
    const darkActive = document.documentElement.classList.contains('dark');
    const scheme = getComputedStyle(document.documentElement).colorScheme;
    const meta = document.querySelector('meta[name="color-scheme"]')?.getAttribute('content') ?? null;
    return verdict(darkActive === (expected.theme === 'dark') && scheme === expected.theme && (meta === null || meta === expected.theme), ev(CLASS.LIVE_RUNTIME, 'appTheme accepted input + independent DOM observation', { darkActive, scheme, meta }, expected, 'Verified view preference or unresolved light default; no OS/native permission claim'));
  }, { runnerType: RUNNER.DOM, classification: CLASS.LIVE_RUNTIME }),
  c("H13-011", "Centralized localization for Foundation UI", "EN/TR catalogs have identical non-empty keys; Foundation shell/state components hardcode no nav or retry strings.", async (ctx) => {
    const l = checkLocalization();
    const hard = (await ctx.inspection()).ui.hardcoded;
    return verdict(l.ok && !hard.length, ev(CLASS.STATIC, "i18n/strings.js + Foundation UI sources", { ...l, hardcoded: hard }, { ok: true, hardcoded: [] }, "Localization inspection"));
  }),
  c("H13-020", "046 section background mapping and single owner", "Five logical sections map to two native-size CDN assets (one shared watercolor for Home/Calendar/Pattern/You, one onboarding moon); unresolved state is neutral; at most one backdrop layer is rendered.", async () => {
    const urls = Object.keys(SECTION_BACKGROUNDS).map(s => sectionBackground(s).url);
    const layers = document.querySelectorAll(".shinka-section-backdrop").length;
    const actual = { sections: Object.keys(SECTION_BACKGROUNDS), distinctAssets: new Set(urls).size, neutral: sectionBackground("neutral"), layers };
    const ok = actual.sections.length === 5 && actual.distinctAssets === 2 && new Set(urls.slice(1)).size === 1 && actual.neutral === null && layers <= 1;
    return verdict(ok, ev(CLASS.STATIC, "sectionBackgrounds.js + rendered document", actual, { sections: 5, distinctAssets: 2, neutral: null, layers: "<=1" }, "Mapping and single-owner check; visual/WebView acceptance separate"));
  }),
];
