import { localCase } from '../caseFactory';
import { futureCase } from '../caseFactory';
import { APPLICABILITY } from '../constants';
// H13 static UI/UX v1.1 contract cases.
import { appThemeExpectation } from "@/lib/appTheme";
import { checkLocalization } from "@/foundation/inspection/uiRules";
import { CLASS, RUNNER } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H13");
export const H13_STATIC_CASES = [
  localCase('H13','H13-012','Mobile forms and localized list regression','067 measures ON-01 proportional spacing, short-height fit and counter visibility across all steps with U18 and checkOnboardingLayers. 066: checkOnboardingLayers measures the original-color safe-area logo, compact TR/EN rows and first-viewport copy and Begin on ON-01. 065: checkAppBackdrop verifies the bundled original PNG across real user routes, with fixed geometry, stable navigation layer, translucent safe area, responsive fit and manual theme. checkOnboardingLayers preserves focus and reduced-viewport coverage. 062: Calendar direct-grid editing replaces the date form; CU11/checkCalendarCorrections cover single add/edit/delete intent, no-write toggle/cancel, min15/future feedback, TR/EN narrow/200% text, manual light/dark, keyboard and 44px cells. 061: checkAuthFirstOnboarding exercises real App login-before-name, held callback without name flash, new/complete/NULL-name/partial and reload, TR/EN 360/390px at 200% text. OU09–OU11 cover malformed/transient hydration Retry and privacy routing; OU07/OU08 retain cancel/coalescing/account/late guards. 059 strengthens 057 checkReopenNavigation: actual App Home/Calendar/Pattern, TR/EN 320x568/360x740/390x844/740x320 and 100/200 percent text, equal thirds, centered icon+label, >=44px targets, one env/0/24/34px inset, zero shell/nav/document duplicate bottom space, unoccluded last content, negative spacer fixtures and keyboard resize/focus restoration, no horizontal overflow; matched before/after visual receipts remain local web evidence. 055 checkOnboardingCorrections verifies actual App TR/EN single outer focus, time actions, quota setup/Retry/select/clear, completed-date age feedback with zero invalid save/picker refocus and transparent daily surfaces at 320/390px, 200% text and reduced viewport; checkYouFlow covers shared birthplace focus. 050 checkPreferenceSheets and checkCalendarContinuity verify selected option/roving keyboard, cancellation/focus, central dirty status, mobile text/simulated inset and retained scroll/month/drafts. Local Chromium/WebKit: FX01/FX02 (filled/blank/stale name skip after admission; native future recording boundaries), OV01–OV06 + checkOnboardingClosure (actual locale, DOB-only, authenticated Back, retry/isolation, keyboard/picker/200% actions); U01–U21 and OU01–OU11 actual onboarding order/back/drafts, readback, unmount/account isolation, OAuth lock and combobox keyboard/paging; 047: U16/U17 preserve heading focus announcements without ON-01/04 frames; U19 verifies the persistent inner name label, focus frame, Back and native profile readback; 054 checkOnboardingPresentation/checkOnboardingLayers execute the real App on ON-01–05 with backdrop and content together: TR/EN 320/360/390/430px plus landscape, short/long heights, 100/200% text, top/middle/bottom scroll, forward/back, empty/filled/focused fields, reduced viewport and rotation; one bitmap composition, square spacing on ON-02–ON-05 and intro icons. Loaded-asset matched screenshots are separate local visual evidence. T81/T82/U15 retained shell checks, Home, Calendar, Profile menu and Admin; 320/360/390/430/landscape, 200% text, 44px targets and dialog/menu focus. 048 checkAppTheme covers OS light/dark × verified app light/dark, dark-overlay worst-pixel contrast, 360/390px TR/EN 200% text, preserved section backgrounds, save/reopen/failed/unknown and account isolation; unresolved/onboarding remains light. OS changes preserve the app choice; drawer/history, reduced motion and refresh included; separate from physical keyboard/safe-area/native back acceptance.'),
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
  c("H13-020", "Shared application backdrop", "One bundled PNG, contained and non-repeating on a fixed, non-interactive layer. Health Center keeps its internal surface. T81/T82, checkAppBackdrop and checkOnboardingLayers verify real user routes, safe areas and the original-color top-left logo on ON-01 locally.", async () => {
    const probe = document.createElement('div');
    probe.className = 'shinka-app-backdrop';
    probe.hidden = true;
    document.body.append(probe);
    try {
      const css = getComputedStyle(probe), art = getComputedStyle(probe, '::before');
      const actual = {
        bundledPng: /^url\("([^"]*\/)?shinka-background(?:-[\w-]+)?\.png"\)$/.test(art.backgroundImage),
        position: css.position,
        pointerEvents: css.pointerEvents,
        size: art.backgroundSize,
        repeat: art.backgroundRepeat,
        internalLayers: document.querySelectorAll('[data-app-backdrop]').length,
        onboardingImages: document.querySelectorAll('.shinka-onboarding img').length,
      };
      const expected = { bundledPng: true, position: 'fixed', pointerEvents: 'none', size: 'contain', repeat: 'no-repeat', internalLayers: 0, onboardingImages: 0 };
      const ok = Object.keys(expected).every(key => actual[key] === expected[key]);
      return verdict(ok, ev(CLASS.SYNTHETIC_RUNTIME, "Computed backdrop CSS and current Health document", actual, expected, "The hidden CSS fixture checks paint rules. Real user routes and decoded asset are covered by the local browser matrix."));
    } finally {
      probe.remove();
    }
  }, { runnerType: RUNNER.DOM, classification: CLASS.SYNTHETIC_RUNTIME }),
];
