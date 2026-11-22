// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
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
  },
  {
    "build_marker": "Buildmarker-075",
    "package_name": "Onboarding legal readiness and recovery",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-20T15:00:00Z",
    "health_catalog_version": "HC-074.0",
    "short_summary": "Keep missing legal configuration visible; separate readiness, explicit version-bound acceptance and fresh session admission. Read-only return/retry, bounded cancellation and transport diagnostics preserve onboarding and lifecycle authority.",
    "full_health_status": "NOT_RUN",
    "notes": "Owner approved terms-v1.0 on 2026-11-20 (product approval, not independent legal review). Live public policy CONFIGURATION_REQUIRED/version null; no management access, setting not applied. Chromium/WebKit 820/820 each; 44 legal and 32 auth-first scenarios each; mandatory quality/size gates PASS. HC changes H05-009/H06-008/H06-009/H13-012, 0 added/removed. Real OAuth/APK and owner configuration/publish remain open. See reports/SHINKA_ONBOARDING_RECOVERY_075.md."
  },
  {
    "build_marker": "Buildmarker-076",
    "package_name": "Unified onboarding provider entry",
    "package_type": "TARGETED_UI",
    "created_at": "2026-11-22T18:05:00Z",
    "health_catalog_version": "HC-075.0",
    "short_summary": "One Apple/Google entry uses native identity, current server Terms and verified onboarding progress. Privacy information reuses checkbox typography.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-075.0 updates H05-009, H06-002, H06-009, H13-012 and H13-021. Mandatory real-App checks cover both providers, new/incomplete/completed users, current/absent/outdated/unavailable acceptance and TR/EN typography. Execution is recorded in reports/SHINKA_UNIFIED_AUTHENTICATION_076.md."
  }
];
