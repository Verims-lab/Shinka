// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-038",
    "package_name": "Calendar recovery and Pattern refresh/lunar presentation",
    "package_type": "FIX",
    "created_at": "2026-10-27",
    "health_catalog_version": "HC-038.0",
    "short_summary": "Same-ID pending Calendar recovery without bulk clear; retain and coalesce Pattern refresh; remove visible theme counts; current phase and strictly next Full Moon date only. Preserve 036/037.",
    "full_health_status": "LOCAL_SYNTHETIC_EXECUTION / HOSTED_ACCEPTANCE_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "Final local evidence is recorded in SHINKA_CALENDAR_PATTERN_038.md. User owns publish, hosted Full Health and physical acceptance. No live mutation/import/push/Health. Twelve backend findings remain USER-DEFERRED; original First Shinka and ON-05 incidents stay open."
  },
  {
    "build_marker": "Buildmarker-039",
    "package_name": "Core product quality audit and recovery hardening",
    "package_type": "AUDIT_FIX",
    "created_at": "2026-10-27T19:10:28Z",
    "health_catalog_version": "HC-039.0",
    "short_summary": "Preserves 036–038; bounded projected domain reads disclose overflow, uncertain You saves retain their intent, Home clears denied data/name and stops ended-session work. Adds per-group Health integrity and actor/target regressions. Local evidence and hosted acceptance are separate.",
    "full_health_status": "NOT_RUN",
    "notes": "One quality milestone; active history 035–039. H12-042 added, seven case descriptions/coverage strengthened, none removed; 176 total / 150 in-app / 12 local / 14 external. Final fresh local browser/server/gate results and matched measurements are in SHINKA_CORE_QUALITY_MILESTONE_039.md. No hosted Health, scan, user mutation, import, notification/scheduler/native build or main publish. Twelve backend findings OPEN / USER-DEFERRED; original ON-05/First Shinka, published-source matching and physical devices remain pending. Initial failures preserved.",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true
  },
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
  }
];
