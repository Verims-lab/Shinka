// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-019",
    "package_name": "Audit and corrective reliability",
    "package_type": "CORRECTIVE",
    "created_at": "2026-10-21T00:00:00+03:00",
    "health_catalog_version": "HC-019.0",
    "short_summary": "Audit/fix: safe deletion diagnostics and bounded continuation; password regeneration policy; executable Health integrity; responsive text and keyboard fixes.",
    "full_health_status": "MANUAL_USER_VALIDATION_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "Chromium/WebKit 476/476 each; 87/87 mobile checks each. Local in-app Health 124 PASS/13 remote-prerequisite BLOCKED/0 FAIL, no hosted run. Same live deletion remains unverified; concurrent server resumes fail closed on ambiguous audit, no distributed exactly-once promise. Typed source tests and official-source audit; latest five packages 015–019. Final quality/dependency/performance evidence and user acceptance: reports/SHINKA_AUDIT_FIX_019.md."
  },
  {
    "build_marker": "Buildmarker-020",
    "package_name": "Exact readiness predicates and truthful removal results",
    "package_type": "CORRECTIVE",
    "created_at": "2026-10-20T22:12:55.321974+00:00",
    "health_catalog_version": "HC-020.0",
    "short_summary": "Correct the four native readiness predicates; unify fresh removal verification and clear stale identity; distinguish active removal from unverified permanent erasure.",
    "full_health_status": "MANUAL_USER_VALIDATION_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "Targeted 020 correction; RG01/RM01/AU10 fail with original 019 code and pass after fixes. All four actual readiness cases exercised with successful backend shape, strict strategy/schema/authority negatives and unavailable backend. Read-only selected target: COMPLETED/VERIFY, no active User or operational rows; stale dashboard UserProfile row disappeared on reload. Recently deleted exact-ID mapping and physical erasure not proven. No hosted Full Health or live mutation/main publish. Final local results: reports/SHINKA_TARGETED_CLOSURE_020.md. Active packages 016–020. Chromium/WebKit each 483/483 canonical and 87/87 mobile checks, no page errors; local in-app Health 124 PASS/13 BLOCKED (unavailable hosted prerequisites), separate successful native-readiness case path verified. Typecheck/lint/build/Repo Health and dependency checks pass; existing 2 Moderate router findings, no High/Critical. Local evidence only; physical devices and post-publish Health remain user acceptance."
  },
  {
    "build_marker": "Buildmarker-021",
    "package_name": "Pattern",
    "package_type": "FEATURE",
    "created_at": "2026-10-21T01:42:56.953000+03:00",
    "health_catalog_version": "HC-021.0",
    "short_summary": "Read-only recurring themes and proportional Lunar Timeline; shared Home selection and native owner/lifecycle guards.",
    "full_health_status": "MANUAL_USER_VALIDATION_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "Chromium/WebKit 507/507 each; 22 Pattern and 87 mobile checks each; local Health 126 PASS/13 BLOCKED (hosted dependencies absent). Mandatory gates and JS/CSS budgets pass; zero Critical/High, two existing Moderate router findings. H10-001 activated; H12-037/H13-017 added; H15 extended. No live Health/import/mutation or main publish. Original ON-05, hosted acceptance and physical devices remain open."
  },
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
  }
];
