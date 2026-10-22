// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
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
  },
  {
    "build_marker": "Buildmarker-029",
    "package_name": "Daily notifications and inactive scheduler",
    "package_type": "FEATURE",
    "created_at": "2026-10-22T13:47:31.272828+00:00",
    "health_catalog_version": "HC-029.0",
    "short_summary": "Shared daily engine, fixed local 06:00 policy, bounded delivery reconciliation/retry and separate preference/device UI. Chromium/WebKit 608/608 each; 8 server + 3 closed-entry checks per command. Production binding remains blocked; no active scheduler or real sends.",
    "full_health_status": "PLATFORM_BINDING_BLOCKED",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "HC-029.0: H14-001/002 activated, H14-003 security/traversal and H14-004 local UI/entry added, H14-901 external binding added; no Health ID deleted. 175 total/149 in-app; local 136 PASS/13 prerequisite BLOCKED. Install/tree/audit/repo/type/lint/build/history/byte gates PASS; zero dependency advisories. Provider named payload/result/device eligibility and workflow caller authentication still need verified code bindings before APNs/Firebase setup/activation. H16-901 physical proof NOT RUN. No live push/workflow mutation/Full Health, main merge or publish. Active 025–029; previous evidence preserved. Report: SHINKA_NOTIFICATIONS_029.md. Owner clarification: exactly two open code bindings (provider incl. device eligibility; scheduler caller authorization); sourced examples must match SDK/platform contract. Independent work complete; real sending/scheduling remain closed."
  }
];
