// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
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
  },
  {
    "build_marker": "Buildmarker-045",
    "package_name": "ID-based daily content and bounded legacy cleanup",
    "package_type": "AUDIT_FIX",
    "created_at": "2026-10-28T12:00:00Z",
    "health_catalog_version": "HC-044.0",
    "short_summary": "MessagePair sole text authority; immutable daily assignments and projected ID reads. Reviewed offline cleanup, reference ownership and matched byte measurements; main theme/kept tabs preserved.",
    "full_health_status": "NOT_RUN_HOSTED_ACCEPTANCE_PENDING",
    "notes": "Explicit owner decision supersedes historical immutable text snapshots without changing assignment IDs, retention or shared source content. H09-007 added; H09-003/H07-013/H09-901/H05-009 updated. Local gates recorded in SHINKA_ID_MODEL_045.md; hosted field cleanup/device/workflow acceptance remains open. No live migration, import, provider call, Full Health, Security scan or main publish. Active packages 041–045."
  },
  {
    "build_marker": "Buildmarker-046",
    "package_name": "Unified section backgrounds",
    "package_type": "UI_UPDATE",
    "created_at": "2026-10-28T13:40:00Z",
    "health_catalog_version": "HC-045.0",
    "short_summary": "Single fixed SectionBackdrop per section; shared watercolor for Home/Calendar/Pattern/You, onboarding moon; native-size CDN derivatives; neutral unresolved state.",
    "full_health_status": "NOT_RUN_HOSTED_ACCEPTANCE_PENDING",
    "notes": "Health add 1/update 1/delete 0 (H13-020 added, H05-009 approves 046). Browser tests NOT_RUN (no Playwright browser). No live Full Health/Security scan/publish. 045 compatibility follow-up: four physical-only optional daily text fields now committed in Test; new writes remain ID-only. No new package, hosted cleanup/Health/main publish; see SHINKA_ID_MODEL_045.md. Follow-up affected controls: Chromium/WebKit 76/76 each; 27-schema stage/quality/performance PASS. H04-007 adds D23; HC12 046 policy alignment; initial failure retained."
  },
  {
    "build_marker": "Buildmarker-047",
    "package_name": "Onboarding heading and inner name label corrections",
    "package_type": "UI_CHANGE",
    "created_at": "2026-10-28T14:14:09.851945Z",
    "health_catalog_version": "HC-046.0",
    "short_summary": "ON-01/04 headings remain unframed while retaining semantic focus; ON-02 persistent associated label moves inside the existing field frame. Name/skip/storage/navigation unchanged; 045 optional schema and 046 visuals preserved.",
    "full_health_status": "LOCAL_140_PASS_13_BLOCKED / HOSTED_NOT_RUN",
    "notes": "Health add 0/update 2/delete 0: H13-012 U16/U17/U19 plus actual-App TR/EN 360/390px 100/200% text matrix; H05-009 retains exact source policy for 047. No live user operation, Full Health, Security scan, main merge or publish. Initial outline failures retained. Chromium/WebKit each 728/728 PASS; 8/8 mobile/text combinations per engine, screenshots inspected. Local Health 140 PASS/13 hosted-prerequisite BLOCKED/0 FAIL; save/list/open verified. Quality/performance PASS. Physical devices NOT_RUN. See SHINKA_ONBOARDING_PRESENTATION_047.md.",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true
  },
  {
    "build_marker": "Buildmarker-048",
    "package_name": "Manual theme alignment and authorized 045 cleanup follow-up",
    "package_type": "FIX",
    "created_at": "2026-10-28T15:14:16Z",
    "health_catalog_version": "HC-047.0",
    "short_summary": "Align verified manual theme, rendered Health and canonical rules; retain 045 compatibility until complete hosted cleanup verification.",
    "full_health_status": "NOT_RUN",
    "notes": "Manual theme uses verified account preference, independent of OS; H13 compares independent expectation with DOM. Complete local browser/quality evidence: reports/theme-cleanup-048. 045 hosted cleanup: 0 inspected / 0 cleaned / remaining unknown, verify NOT_RUN; CLI_LOGIN_REQUIRED twice, then explicitly owner-deferred. Optional compatibility schema retained. No live Health/scan, main merge or publish; active packages 044–048."
  }
];
