// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-036",
    "package_name": "Onboarding locale, navigation and time closure",
    "package_type": "FIX",
    "created_at": "2026-10-27T14:00:00Z",
    "health_catalog_version": "HC-036.0",
    "short_summary": "Automatic locale, DOB-only NULLs, authenticated Back, manual/app time picker and safe Retry diagnostics. Chromium/WebKit each 667/667; actual locale/time CLI 6/6 each. Hosted preparation cause remains unconfirmed.",
    "full_health_status": "LOCAL_VERIFIED / HOSTED_INCIDENT_AND_DEVICE_ACCEPTANCE_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "Fresh install/tree/audit/security/type/lint/build/repo/history/performance gates passed. Local in-app Health 136 PASS / 13 hosted BLOCKED; save/retry/list/open verified. Native create-loss retry and You preference/reset covered. Read-only logs denied 401; user deferred live diagnosis. Android/iOS NOT_RUN; 12 deferred findings unchanged. No live mutation/import/push/Full Health/main publish."
  },
  {
    "build_marker": "Buildmarker-037",
    "package_name": "Five focused corrections: name, Calendar, light UI and Home",
    "package_type": "FIX",
    "created_at": "2026-10-27",
    "health_catalog_version": "HC-037.0",
    "short_summary": "Guard filled-name Skip; future Calendar intent/replay rejects before health writes and legacy rows stay repairable; light-only policy; Home removes only normal Refresh. Existing ON-05 privacy removal preserved.",
    "full_health_status": "LOCAL_VERIFIED_HOSTED_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "Chromium/WebKit 674/674; local Health 136 PASS / 0 FAIL / 13 hosted-prerequisite BLOCKED with save/retry/list/open. Mandatory local gates and zero dependency advisories. Source/receipt in SHINKA_ADDITIONAL_FIXES_037.md. User publishes/runs hosted Health; physical OS dialogs and original live First Shinka/ON-05 acceptance remain open. 12 backend findings USER-DEFERRED. No live mutations/import/push."
  },
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
  }
];
