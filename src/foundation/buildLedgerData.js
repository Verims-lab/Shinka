// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-030",
    "package_name": "Notification admin admission and reported push contract",
    "package_type": "FIX",
    "created_at": "2026-10-22T14:16:35.354495+00:00",
    "health_catalog_version": "HC-030.0",
    "short_summary": "Shared fresh-native-admin manual admission and reported push input adapter; unknown results never become SENT. Chromium/WebKit 617/617 each, plus 8 server and 9 actual-entry checks per command. Real sends/schedules remain disabled.",
    "full_health_status": "PLATFORM_BINDING_BLOCKED",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "H14 existing assertions/descriptions updated; no case removed. Health 136 PASS/13 hosted-prerequisite BLOCKED, 175 total cases. Quality/dependency/history/performance gates pass; audit zero. Original failures preserved. Source/contract provenance in existing SHINKA_NOTIFICATIONS_029.md. 12 backend findings OPEN / USER-DEFERRED; H14-901/H16-901 external. Active 026–030; no live actions/main/publish."
  },
  {
    "build_marker": "Buildmarker-031",
    "package_name": "Notification admission read reduction",
    "package_type": "FIX",
    "created_at": "2026-10-22T15:56:35.323131+00:00",
    "health_catalog_version": "HC-031.0",
    "short_summary": "Comparable SDK reads 84→69,119→104,61→46; auth 14→12,17→15,11→9; writes/sends unchanged. Chromium/WebKit 624/624 each; 8 server + 9 entry fixtures, Health 136 PASS/13 prerequisite BLOCKED. Local gates/audit/history/performance PASS; live binding blocked.",
    "full_health_status": "PLATFORM_BINDING_BLOCKED",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "031 only: no product/schema/SDK contract change. Fresh write/readback/send guards retained; NP07 BUSY gap fixed with initial failure preserved. H14-003 adds NP01–07, no Health IDs added/deleted; H14-901/H16-901 external. Actual entry enabled:false; 12 findings OPEN / USER-DEFERRED. Internal Build 027–031; no live actions/main merge/publish. Focused report SHINKA_NOTIFICATION_PERFORMANCE_031.md; PR32 was owner-merged, Test continuation linked there."
  },
  {
    "build_marker": "Buildmarker-032",
    "package_name": "Native notification readiness and device acceptance",
    "package_type": "DOCS",
    "created_at": "2026-10-22T18:46:33.644742+00:00",
    "health_catalog_version": "HC-032.0",
    "short_summary": "Native setup inventory and two-stage device plan; no application behavior fix required. Chromium/WebKit each 624/624; 8 server + 9 actual-entry fixtures per engine; local Health 136 PASS/13 prerequisite BLOCKED. All device steps NOT_RUN.",
    "full_health_status": "NATIVE_AND_PLATFORM_ACCEPTANCE_NOT_RUN",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": false,
    "health_changed": true,
    "notes": "Health add 0/update 2/delete 0 (H14-901/H16-901 external descriptions); executable tests unchanged. Required local gates pass; audit zero; 031 budgets unchanged at 69/104/46 entity reads. Initial JS 479543/160180 gzip, CSS 77521/14262 bytes. Native setup may proceed independently; verified contracts still gate activation, superseding historical 029 setup ordering. Base44 remains identity/data authority; Firebase is Android push setup only. Actual entry enabled:false; no credentials/build/live calls/main merge/publish. Existing 12 findings OPEN / USER-DEFERRED. Internal Build 028–032; SHINKA_NATIVE_NOTIFICATION_READINESS_032.md."
  },
  {
    "build_marker": "Buildmarker-033",
    "package_name": "Scheduler machine authorization preparation",
    "package_type": "FIX",
    "created_at": "2026-10-22T21:05:49.321095+00:00",
    "health_catalog_version": "HC-033.0",
    "short_summary": "Prepared scheduler-only machine credential admission; current-native-admin path retained. Chromium/WebKit 632/632 each; per command 8 server, 11 entry, 7 crypto checks. Real entry unbound/disabled; local Health 136 PASS/13 prerequisite BLOCKED.",
    "full_health_status": "PLATFORM_BINDING_BLOCKED",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "H14-003/004/901 updated; add 0/delete 0. Required local gates pass; audit zero. Admin reads 69/104/46 unchanged; separate machine reads 36/62/22 with 11/14/8 credential checks and zero auth.me. Initial JS 479543/160179 gzip, CSS 77521/14262 bytes. Initial typecheck error and executable-equivalent JSDoc correction retained. No secret generated/stored, real secrets.get/transport binding, workflow/push/live Health/scan/user/native build/main merge/publish. 12 findings OPEN / USER-DEFERRED. Active 029–033; SHINKA_SCHEDULER_AUTHORIZATION_033.md."
  },
  {
    "build_marker": "Buildmarker-034",
    "package_name": "Session and Health 429 stabilization",
    "package_type": "FIX",
    "created_at": "2026-10-26T12:10:32.352494+00:00",
    "health_catalog_version": "HC-034.0",
    "short_summary": "034 local validation completed on preserved zod 4.6.7/resolvers 5.9.2 lock: Chromium/WebKit 649/649 each, all 17 required IDs unique PASS, Node 9/9; install/tree/runtime peer/audit/type/lint/build/repo/performance gates pass. Hosted/device and owner publish acceptance remain pending.",
    "full_health_status": "NOT_RUN",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "LOCAL_VERIFIED / USER_PUBLISH_AND_HOSTED_ACCEPTANCE_PENDING. Base origin/main 041b40b; resumed from clean Test 1f061ec. Original TLS/NOT_RUN and all new failures preserved. Corrected fixture types/React commit waits, CSS layer serialization, explicit anonymous 401 and transport 503 expectations, controlled passive-refresh timing. Strict guards and NC06/NC07 unchanged. Health add 0/update 9/delete 0; local in-app 136 PASS/13 prerequisite BLOCKED, no FAIL. Official docs: 100/500/50 limits, optional action/link, Home default; user-relayed support: field names/silent discard. Wire types/nullability/Unicode/native User/response/workflow/device contracts open, adapter UNKNOWN, entry disabled, H14-901/H16-901 open. Full Health/native/push/delete/resume NOT_RUN; 12 backend findings OPEN/USER-DEFERRED; prior two live targets PARTIAL not reread. See SHINKA_STABILIZATION_034.md and resumed-20261026 evidence."
  }
];
