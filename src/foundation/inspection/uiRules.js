// UI/UX v1.1 contract checks (pure; used by Health H13 and tests).
import { DESIGN_TOKENS, DARK_THEME_CHANNELS, hexToRgbChannels } from "@/foundation/designTokens";
import { BOTTOM_NAV, PROFILE_ENTRY } from "@/foundation/uiContract";
import { STRINGS, SUPPORTED_LANGUAGES } from "@/foundation/i18n/strings";

// Rendered CSS variables must equal token hex values.
export function checkCssTokens(readVar, theme = 'light') {
  const mismatches = [];
  for (const [v, key] of Object.entries(DESIGN_TOKENS.cssVars)) {
    const actual = (readVar(v) || "").trim();
    const expected = theme === 'dark' ? DARK_THEME_CHANNELS[v] : hexToRgbChannels(DESIGN_TOKENS.color[key]);
    if (actual !== expected) mismatches.push({ variable: v, actual, expected });
  }
  return { checked: Object.keys(DESIGN_TOKENS.cssVars).length, mismatches };
}

export function checkNavContract(lucideExports) {
  const keys = BOTTOM_NAV.map((n) => n.key);
  const icons = BOTTOM_NAV.map((n) => n.lucide);
  const missingExports = [...BOTTOM_NAV, PROFILE_ENTRY].filter((n) => !lucideExports[n.component]).map((n) => n.component);
  const ok = keys.join() === "home,calendar,pattern" && icons.join() === "house,calendar-days,moon" &&
    !keys.includes("you") && PROFILE_ENTRY.lucide === "user-round" && PROFILE_ENTRY.placement === "top-right" && !missingExports.length;
  return { ok, keys, icons, profile: PROFILE_ENTRY.lucide, missingExports };
}

export function checkLocalization() {
  const [a, b] = SUPPORTED_LANGUAGES.map((l) => Object.keys(STRINGS[l] || {}));
  const missingInTr = a.filter((k) => !b.includes(k));
  const missingInEn = b.filter((k) => !a.includes(k));
  const empty = SUPPORTED_LANGUAGES.flatMap((l) => Object.entries(STRINGS[l]).filter(([, v]) => !String(v).trim()).map(([k]) => `${l}:${k}`));
  return { ok: !missingInTr.length && !missingInEn.length && !empty.length, keys: a.length, missingInTr, missingInEn, empty };
}

// Foundation UI files must not hardcode localized nav/shell strings.
export function findHardcodedStrings(sources, files, literals) {
  const hits = [];
  for (const f of files) for (const lit of literals) if ((sources[f] || "").includes(`>${lit}<`) || (sources[f] || "").includes(`"${lit}"`)) hits.push({ file: f, literal: lit });
  return hits;
}
