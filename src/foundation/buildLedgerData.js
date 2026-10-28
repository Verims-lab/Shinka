// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-040",
    "package_name": "Test Tools deletion stabilization",
    "package_type": "CORRECTIVE_STABILIZATION",
    "created_at": "2026-10-27T20:07:56Z",
    "health_catalog_version": "HC-040.0",
    "short_summary": "Durable admission, bounded forward cleanup and separately verified finalization; real service/HTTP/native and UI fault regression. Explicit-target hosted cleanup remains publication gated.",
    "full_health_status": "LOCAL_SYNTHETIC_ONLY / HOSTED_FULL_HEALTH_NOT_RUN",
    "notes": "Preserves audit 039. H12-029 strengthened, H12-043 added, H13-016 local full-chain UI and H12-902 external acceptance updated. No entity migration, import, notification enablement, live Full Health, main merge or publish. Owner-authorized sequential cleanup waits for matching published code and protected native admin/session verification; NOT_RUN until evidenced. Active packages 036–040. See SHINKA_TEST_DELETION_STABILIZATION_040.md."
  },
  {
    "build_marker": "Buildmarker-041",
    "package_name": "Home header language control removal",
    "package_type": "UI_CHANGE",
    "created_at": "2026-10-27T21:15:00Z",
    "health_catalog_version": "HC-040.0",
    "short_summary": "Home header keeps only Shinka and Profile/You; TR/EN buttons removed from render. Home uses the saved Profile/You language; daily ID/snapshots unaffected. Calendar/Pattern unchanged.",
    "full_health_status": "LOCAL_STATIC_ONLY / BROWSER_NOT_RUN / HOSTED_FULL_HEALTH_NOT_RUN",
    "notes": "Catalog unchanged (0/0/0). DU01 and checkDailyFlow assert no Home TR/EN buttons. Lint, typecheck, build PASS; browser suites NOT_RUN. No backend, schema, dependency, live user operation, Full Health, Security scan or publish. Active packages 037–041.",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": false
  },
  {
    "build_marker": "Buildmarker-042",
    "package_name": "Base44 audit closure and disabled notification contract",
    "package_type": "CORRECTIVE_VERIFICATION",
    "created_at": "2026-10-27T21:58:12Z",
    "health_catalog_version": "HC-041.0",
    "short_summary": "Preserve Base44 Home and request-admission improvements; strengthen auth/startup regression; apply user-relayed Support native-admin and push acceptance contract with sending disabled.",
    "full_health_status": "LOCAL_SYNTHETIC_ONLY / HOSTED_USER_ACCEPTANCE_PRESERVED",
    "notes": "HC-040.0 → HC-041.0 once for seven changed Health descriptions/semantics; no IDs added/removed. 041 retained HC-040.0. Active 038–042. Main Base44 changes and Test 040 evidence merged losslessly. No live Health/scan/mutation/workflow/push/main publish. 12 backend findings remain USER-DEFERRED. Final results in SHINKA_CORE_AUDIT_042.md.",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true
  },
  {
    "build_marker": "Buildmarker-043",
    "package_name": "Calendar and Pattern header language removal",
    "package_type": "UI",
    "created_at": "2026-10-28T10:40:00.000000+00:00",
    "health_catalog_version": "HC-042.0",
    "short_summary": "Calendar/Pattern headers keep only Shinka and Profile/You; TR/EN buttons and unused ProductLanguageControls removed. Language changes only in Profile/You; saved preference renders everywhere; daily ID/snapshots unaffected.",
    "full_health_status": "NOT_RUN",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "Health add 0/update 3/delete 0 (H13-015, H13-017, H05-009). Browser tests CU01/PU01/PU07/DU01 NOT_RUN (no Playwright browser). No live Full Health/Security scan/publish."
  },
  {
    "build_marker": "Buildmarker-044",
    "package_name": "Profile notification preference and phone permission guidance",
    "package_type": "FEATURE_VERIFICATION",
    "created_at": "2026-10-28T11:08:53Z",
    "health_catalog_version": "HC-043.0",
    "short_summary": "Separate saved, draft and unconfirmed notification choices in You; simple TR/EN phone-permission and pending-setup guidance; verify retry, account boundaries and fresh opt-out admission.",
    "full_health_status": "LOCAL_SYNTHETIC_ONLY / NATIVE_AND_HOSTED_ACCEPTANCE_OPEN",
    "notes": "Preserves main Base44 043 auth/header/dependency changes. Adds six regressions; HC-042.0 → HC-043.0 once, five existing Health cases updated, no IDs added/removed. Cancel pending auth retry on account/logout; controlled tests preserve two 700/1400ms retries. Sending remains disabled. No workflow, native setup, live mutation/Health/scan or main publish. Active 040–044. Final evidence: SHINKA_NOTIFICATION_PREFERENCES_044.md.",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true
  }
];
