// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-022",
    "package_name": "You/Profile and Preferences",
    "package_type": "FEATURE",
    "created_at": "2026-10-21T02:21:11+03:00",
    "health_catalog_version": "HC-022.0",
    "short_summary": "You profile/preferences with verified owner-only updates, shared GeoNames/Sun rules, unknown-result check/retry and current native-admin access. Pattern and protected history preserved. Chromium/WebKit 526/526 each; local Health 128 PASS/13 BLOCKED; 0 Critical/High; byte budgets pass. Hosted/device acceptance remains manual.",
    "full_health_status": "MANUAL_USER_VALIDATION_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "No schema delta, live mutation/Full Health, main merge/publish, reference import or new service. Actual profile/preference readback, lost-response recovery, conflict, null/name and locale regressions pass. Canonical docs and case audit aligned; Internal Build retains 018–022. Legal destinations/content remain unpublished. Notification delivery, withdrawal and deactivation are separate packages. Original ON-05 same-account acceptance remains open."
  },
  {
    "build_marker": "Buildmarker-023",
    "package_name": "Owner Privacy: Consent Withdrawal and Account Erasure",
    "package_type": "FEATURE",
    "created_at": "2026-10-21T10:53:26+03:00",
    "health_catalog_version": "HC-023.0",
    "short_summary": "Owner consent withdrawal and bounded account erasure with durable same-request recovery, verified active absence and platform-pending outcome. Chromium/WebKit 550/550 each; local Health 131 PASS/13 BLOCKED. Type/lint/build/Repo Health and byte budgets pass; 0 High/Critical. Hosted/device/provider acceptance remains open.",
    "full_health_status": "MANUAL_USER_VALIDATION_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "Two closed operational schemas; schema→all backend/shared functions→frontend. No live privacy mutation/Full Health, main merge/publish or new service. Current native admins remain protected. Base44 purge, Apple revocation and published Play deletion URL remain external acceptance. Active history retains 019–023; older evidence stays in Git/reports."
  },
  {
    "build_marker": "Buildmarker-024",
    "package_name": "Targeted hosted Health read diagnostics",
    "package_type": "FIX",
    "created_at": "2026-10-21T08:50:49.003927+00:00",
    "health_catalog_version": "HC-024.0",
    "short_summary": "Read diagnostics preserve safe status/stage/request ID; malformed reads cannot pass. Chromium/WebKit 560/560 each; local Health 131 PASS/13 BLOCKED. Original hosted incident retained; narrow prod reads succeeded, historical cause unproven.",
    "full_health_status": "OWNER_POST_PUBLICATION_RUN_PENDING",
    "notes": "HC-023 incident preserved. Explicit prod narrow reads succeeded for five schemas, 6/240/260 counts and three workbooks; historical failure cause remains unproven. No hosted mutation/import/schema push/Full Health/main publish. Local regressions and quality evidence: SHINKA_HEALTH_READ_024.md.",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true
  },
  {
    "build_marker": "Buildmarker-025",
    "package_name": "Health helper timing and cancellation",
    "package_type": "FIX",
    "created_at": "2026-10-21T09:36:39.880338+00:00",
    "health_catalog_version": "HC-025.0",
    "short_summary": "H10/H13 controlled fixture timing, safe partial progress, synchronous cleanup and completed-success-only caching. Chromium/WebKit 569/569 each; no external fixture requests. Prior HC-024 timeout preserved; historical active helper/visibility unknown.",
    "full_health_status": "OWNER_POST_PUBLICATION_RUN_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "HC-025.0 retains all 169 cases / 144 in-app; HT01–HT09 cover timeout/cancel/cache/DOM/console cleanup and safe progress. Local Health 131 PASS/13 expected hosted-dependency BLOCKED; no published readiness/content regression claimed. Mandatory local gates and byte budgets pass; 0 Critical/High, 2 existing Moderate router findings. No live Health/probe/import/mutation/main publish. Last five 021–025. Owner publishes and runs Full Health; physical acceptance remains separate. Evidence: SHINKA_HEALTH_TIMING_025.md."
  },
  {
    "build_marker": "Buildmarker-026",
    "package_name": "Mobile system theme and interaction compatibility",
    "package_type": "FIX",
    "created_at": "2026-10-21T14:03:49.435356+03:00",
    "health_catalog_version": "HC-026.0",
    "short_summary": "System light/dark, safe-area ownership, accessible mobile birthplace sheets, layer history and short reduced-motion transitions. Home refresh retains daily snapshots; Calendar preserves drafts and same-intent recovery.",
    "full_health_status": "MANUAL_USER_VALIDATION_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "Chromium/WebKit local regressions and mobile matrices; H08-007 added, H13 theme/mobile contracts updated, no cases removed. Existing byte budgets and 025 timeout/cleanup coverage retained. Hosted Full Health and physical Android/iOS/wrapper acceptance remain owner-run. No main/publish, provider probe/import or live user mutation."
  }
];
