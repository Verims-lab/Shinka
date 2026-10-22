// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
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
  },
  {
    "build_marker": "Buildmarker-027",
    "package_name": "Bildirim Öncesi Kalite Milestone’u",
    "package_type": "AUDIT_FIX",
    "created_at": "2026-10-22T12:00:00+03:00",
    "health_catalog_version": "HC-027.0",
    "short_summary": "Guarded route continuity removes redundant Home-crossing hydrate; fresh per-request onboarding identity, lazy onboarding, Router 7.18.4 and safe Health history retry/open. Chromium/WebKit each 579/579; 150+87 mobile checks each; zero audit findings; byte/quality gates pass. Production lab gain and manual boundaries in the milestone report.",
    "full_health_status": "MANUAL_USER_VALIDATION_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "No schema delta, live mutation/import/Full Health, notification work, main merge/publish or new service. Same-request principal only; server owner/current-admin/consent/lifecycle guards preserved. Health 132 PASS/13 expected local prerequisite BLOCKED; deployed acceptance remains owner-run. Initial failures and 025/026 evidence preserved. Active history 023–027. Physical/OAuth/hosted enforcement and same-account ON05 remain separate."
  },
  {
    "build_marker": "Buildmarker-028",
    "package_name": "Güvenlik Kapanışı 028",
    "package_type": "AUDIT_FIX",
    "created_at": "2026-10-22T14:30:00+03:00",
    "health_catalog_version": "HC-028.0",
    "short_summary": "028 local verification complete: Chromium/WebKit 582/582 each, plus 8/8 server fixtures per command; required O32/NA07/NA22/SC06/SC10/SC11 present. Fixed type errors, omitted 028 content-policy registration and missing H12-040 server plan. No assertions weakened; original failures retained.",
    "full_health_status": "MANUAL_USER_VALIDATION_PENDING",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "Synced Base44 source 0f243df plus the recorded local correction patch. Local Health 133 PASS/13 hosted-prerequisite BLOCKED per engine. Clean install/tree/audit, repository/type/lint/build, history and production budgets PASS; zero dependency advisories. Active 024–028. Worker-local quotas; SC08 You error injection is not full saveProfile proof. Owner main merge, complete Base44 sync/publish, Full Health/private readback, Security scan and physical/live enforcement acceptance pending. No live import/user operation. Evidence: reports/SHINKA_SECURITY_CLOSURE_028.md."
  }
];
