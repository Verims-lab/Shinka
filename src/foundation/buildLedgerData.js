// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-070",
    "package_name": "ON-02 first-viewport sign-in priority",
    "package_type": "TARGETED_UI",
    "created_at": "2026-11-11T18:20:00Z",
    "health_catalog_version": "HC-069.0",
    "short_summary": "The unpainted ON-02 artwork slot caps at 48px and the anonymous Welcome uses a compact stack, so the 18+ declaration and both approved provider actions keep the first viewport on short mobile frames and enlarged text.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-069.0 adds H13-021 (build-time ON-02 sign-in contract) and extends checkSignInLayout with the artwork-slot cap. The committed /auth-shell-probe now publishes data-probe-viewport so the running app reports whether the declaration and both provider buttons are inside the visible viewport. Live published 069 reads (/login DOM, probe READY) confirmed the controls existed in the bundle before this change; browser matrices and physical-device acceptance for 070 are NOT_RUN in this sandbox. Details: reports/SHINKA_ONBOARDING_WELCOME_070.md."
  },
  {
    "build_marker": "Buildmarker-071",
    "package_name": "Direct authenticated onboarding navigation",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-11T18:52:54Z",
    "health_catalog_version": "HC-070.0",
    "short_summary": "Verified owner progress opens the remaining onboarding form, preparation or Home directly. Anonymous entry and provider gating remain available, and Back stays inside the admitted form.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-070.0 extends the mandatory local auth-first gate to direct resumption, held/invalid progress, retry, reload, optional choices and Back. See reports/SHINKA_AUTHENTICATED_ONBOARDING_071.md for execution and external limits."
  },
  {
    "build_marker": "Buildmarker-072",
    "package_name": "Shared onboarding backdrop and progress row",
    "package_type": "TARGETED_UI",
    "created_at": "2026-11-12T08:24:10Z",
    "health_catalog_version": "HC-071.0",
    "short_summary": "All onboarding shell screens reuse ON-01's original-color backdrop and safe top-left artwork fit. Numbered follow-up screens place the counter and session-scoped Back beneath the logo.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-071.0 updates H05-009, H13-012, H13-020 and H13-021. Local onboarding presentation and auth-first regressions compare art fit, clearance, control visibility and safe navigation. See reports/SHINKA_ONBOARDING_BACKDROP_072.md for execution."
  },
  {
    "build_marker": "Buildmarker-073",
    "package_name": "Original centered-logo backdrop across Shinka",
    "package_type": "TARGETED_UI",
    "created_at": "2026-11-12T09:47:57Z",
    "health_catalog_version": "HC-072.0",
    "short_summary": "The supplied Backround.png anchors its original centered logo across user routes. The shared frame clears the wordmark and places ON-02–05 progress at the safe upper left.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-072.0 extends H05-009, H13-012 and H13-020. Local regressions verify exact image bytes, responsive placement, dark contrast, session-scoped Back and matching logo screenshot pixels. See reports/SHINKA_CENTERED_BACKGROUND_073.md."
  },
  {
    "build_marker": "Buildmarker-074",
    "notes": "GizemTest only. Missing dedicated ON-02 asset preserves 073 PNG. No approved legal version default; SHINKA_TERMS_VERSION is a release prerequisite. H06-008/009 and TA01–TA14 cover native history/unknown outcomes and actual App admission. Existing DOB, five-step, optional health and domain rules remain. Local execution and external limits: reports/SHINKA_ONBOARDING_TERMS_074.md. Both engines: 817 core tests and 26 ON-02 cases PASS. Chromium full PASS; full WebKit Health H08-004/RC06 still times out at the unchanged 5s helper cap. Hosted verification NOT_RUN.",
    "package_type": "FEATURE",
    "package_name": "ON-02 legal declarations and versioned native admission",
    "health_catalog_version": "HC-073.0",
    "created_at": "2026-11-12T11:40:21Z",
    "full_health_status": "NOT_RUN",
    "short_summary": "Preserve Welcome headings, add five viewport units and 70% declaration type, exact Terms/Privacy links, shared provider gates and server-owned versioned acceptance history."
  }
];
