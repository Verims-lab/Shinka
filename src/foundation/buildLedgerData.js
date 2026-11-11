// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-066",
    "package_name": "Compact first onboarding screen",
    "package_type": "TARGETED_UI",
    "created_at": "2026-11-11T13:40:50Z",
    "health_catalog_version": "HC-065.0",
    "short_summary": "Original-color top-left logo and compact introductory copy, rows and CTA on ON-01.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-065.0 updates H13-012, H13-020 and H05-009. Local onboarding matrices passed in Chromium and WebKit. Synthetic Chromium Health returned 146 PASS and 13 prerequisite BLOCKED. Full Chromium stopped in Pattern and the full WebKit browser closed. Details: reports/SHINKA_ONBOARDING_INTRO_066.md."
  },
  {
    "build_marker": "Buildmarker-067",
    "package_name": "First onboarding spacing and counter",
    "package_type": "TARGETED_UI",
    "created_at": "2026-11-11T16:07:11Z",
    "health_catalog_version": "HC-066.0",
    "short_summary": "ON-01 has no page counter and uses proportional heading spacing and larger gaps between boxes and Begin.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-066.0 updates H13-012 and H05-009. Chromium full 803/803. Both onboarding matrices passed. WebKit full stopped on two baseline fixture failures and the focused candidate rerun passed. See reports/SHINKA_ONBOARDING_SPACING_067.md."
  },
  {
    "build_marker": "Buildmarker-068",
    "package_name": "Mobile Welcome sign-in visibility",
    "package_type": "TARGETED_UI",
    "created_at": "2026-11-11T16:53:42Z",
    "health_catalog_version": "HC-067.0",
    "short_summary": "Anonymous ON-02 yields unused artwork space to the 18+ declaration and Apple and Google sign-in buttons.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-067.0 updates H13-012 and H05-009. ON-02 viewport and auth-first checks passed in both engines. Chromium base 803/803. Full browser interruptions and focused results are in reports/SHINKA_ONBOARDING_SIGN_IN_068.md."
  },
  {
    "build_marker": "Buildmarker-069",
    "package_name": "Welcome authentication and published verification",
    "package_type": "TARGETED_REGRESSION",
    "created_at": "2026-11-11T17:41:26Z",
    "health_catalog_version": "HC-068.0",
    "short_summary": "Trace anonymous and authenticated Welcome, verify both provider dispatches and check the expected published build.",
    "full_health_status": "NOT_RUN",
    "notes": "Preview shows authenticated Continue. Published 068 passed all eight anonymous visibility cases per engine. The 069 auth-first gate passed 16/16 in both engines. See reports/SHINKA_ONBOARDING_AUTH_069.md for full-suite results and the publication gate."
  },
  {
    "build_marker": "Buildmarker-070",
    "package_name": "ON-02 first-viewport sign-in priority",
    "package_type": "TARGETED_UI",
    "created_at": "2026-11-11T18:20:00Z",
    "health_catalog_version": "HC-069.0",
    "short_summary": "The unpainted ON-02 artwork slot caps at 48px and the anonymous Welcome uses a compact stack, so the 18+ declaration and both approved provider actions keep the first viewport on short mobile frames and enlarged text.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-069.0 adds H13-021 (build-time ON-02 sign-in contract) and extends checkSignInLayout with the artwork-slot cap. The committed /auth-shell-probe now publishes data-probe-viewport so the running app reports whether the declaration and both provider buttons are inside the visible viewport. Live published 069 reads (/login DOM, probe READY) confirmed the controls existed in the bundle before this change; browser matrices and physical-device acceptance for 070 are NOT_RUN in this sandbox. Details: reports/SHINKA_ONBOARDING_WELCOME_070.md."
  }
];
