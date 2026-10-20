// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-010",
    "package_name": "Admin profile access",
    "package_type": "FEATURE",
    "created_at": "2026-10-19T22:52:27Z",
    "health_catalog_version": "HC-010.0",
    "short_summary": "Verified admin Profile/You menu → Admin Panel → existing Health and Build tools; guarded before onboarding completion with localized return navigation.",
    "full_health_status": "LOCAL_PASS_PENDING_LIVE_VERIFICATION",
    "notes": "Chromium/WebKit: 318 canonical tests, 17 admin routes/keyboard/locale/responsive scenarios, 8 routing/Preview, 5 mobile, 54 general Health + 21 onboarding Health; zero page exceptions. Clean install/tree, type/lint/build, Repo Health 16/16, history and production budgets pass. Audit: 0 Critical/High, 2 existing Moderate. Main PR #15 fast-forwarded into Test with identical tree before feature delivery. No deployment/live identity proof; ON-05 remains pending same-account live saveCycle/readback. Five active packages 006–010; no content import."
  },
  {
    "build_marker": "Buildmarker-011",
    "package_name": "First Shinka and Home",
    "package_type": "FEATURE",
    "created_at": "2026-10-19T23:27:39.496462+00:00",
    "health_catalog_version": "HC-011.0",
    "short_summary": "First Shinka/Home with exact source content, controlled import and daily snapshot flow. OD-002 resolved by explicit user approval of six category codes/EN names; source TR names, 260 Pairs and 240 mappings preserved. Production daily persistence remains blocked.",
    "full_health_status": "BLOCKED",
    "notes": "OD-002 RESOLVED_BY_PRODUCT_DECISION, user reply 2026-10-20; no attribution of new codes/EN names to original documents. Same package/catalog; source manifest hash and Pair/mapping bytes unchanged. Chromium/WebKit each 349/349 canonical, 54 general + 21 onboarding + 9 daily synthetic Health, 17 admin/8 routing-Preview/5 mobile/5 daily scenarios; zero page errors. Type/lint/build, Repo Health 16/16, dependency tree/security and five-package retention pass; 0 Critical/High, 2 existing Moderate. Initial JS 459,519 raw / 149,604 gzip unchanged. No live import, hosted daily write/readback, Full Health or device proof. H09-004 and ON-05 live recovery remain open. Approval evidence: reports/first-shinka-011/od002-approval.json; handoff: reports/SHINKA_FIRST_SHINKA_011.md.",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "updated_at": "2026-10-20T06:51:53.551Z"
  },
  {
    "build_marker": "Buildmarker-012",
    "package_name": "Calendar and cycle management",
    "package_type": "FEATURE",
    "created_at": "2026-10-20T11:29:12.456370+00:00",
    "health_catalog_version": "HC-012.0",
    "short_summary": "Monthly Calendar, shared source cycle calculation and guarded mutation/consent protocol. Production writes remain blocked without a durable atomic adapter; observed intervals over 60 days await the user’s separate product rule.",
    "full_health_status": "BLOCKED",
    "notes": "Chromium/WebKit each 376/376 canonical, 89/89 local Health, 17 admin/8 routing-Preview/5 mobile/5 daily/6 Calendar UI scenarios; zero page exceptions. Clean install/tree, type/lint/build, Repo Health 16/16, five-package history and performance budgets pass. Fresh npm audit/security is BLOCKED by TLS issuer verification; previous audit is not current proof. Production Calendar writes remain disabled pending durable atomicity; OD-012 awaits the separate >60-day product rule. H09, ON-05 same-account recovery, hosted Full Health and devices remain open. No live product writes or deployment. Evidence: reports/SHINKA_CALENDAR_012.md and calendar-012/verification.json.",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true
  },
  {
    "build_marker": "Buildmarker-013",
    "package_name": "Admin Test Tools",
    "package_type": "FEATURE",
    "created_at": "2026-10-20T12:43:54.493235+00:00",
    "health_catalog_version": "HC-013.0",
    "short_summary": "Admin-only User ID lookup, impact preview and guarded delete/reset protocols. Production mutations remain disabled pending a verified durable target coordinator; no live user was changed.",
    "full_health_status": "BLOCKED",
    "notes": "Chromium/WebKit each 396/396 canonical and 93/93 local Health PASS; 19 admin, 8 routing/Preview, 5 mobile, 5 daily, 6 Calendar and 4 Test Tools App scenarios per engine; zero page errors. Clean install/tree, type/lint/build and Repo Health 16/16 pass. Production delete/reset BLOCKED: no verified durable coordinator/all-writer fencing/reset transaction. New backend-only AdminTestOperation schema must precede lifecycle function deployment. Fresh npm audit BLOCKED_TLS_CERTIFICATE_CHAIN with TLS verification retained; current vulnerability counts unknown, no dependency changes. No live mutation or deployment. H12-031 current blocker, H12-902 external; prior ON-05/OD-012/daily/Calendar blockers remain. Scope/recovery/acceptance in reports/SHINKA_ADMIN_TEST_TOOLS.md; evidence in reports/test-tools-013/verification.json.",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "updated_at": "2026-10-20T12:43:54.493235+00:00"
  },
  {
    "build_marker": "Buildmarker-014",
    "package_name": "Production closure investigation and OD-012",
    "package_type": "CORRECTIVE",
    "created_at": "2026-10-20T15:14:05.571467Z",
    "health_catalog_version": "HC-014.0",
    "short_summary": "Implements approved long-interval behavior across Home/Calendar; completes fresh TLS-verified security scan, live read-only schema/import checks and staged rollout tooling. Production persistence awaits concrete architecture approval.",
    "full_health_status": "BLOCKED_PRODUCTION_PERSISTENCE",
    "docs_aligned": true,
    "source_changed": true,
    "tests_changed": true,
    "health_changed": true,
    "notes": "AWAITING_USER_ARCHITECTURE_APPROVAL. Chromium/WebKit each 405/405 canonical, 94/94 local Health; zero page errors. Clean install/tree, lint/type/build, Repo Health 16/16, five-package history and performance budgets pass. Fresh security 0 Critical/High, 2 Moderate; TLS verification enabled, no dependency changes. OD-012 resolved with behavioral regressions. Actual read-only Base44: lifecycle schema readable; content PRE_IMPORT missing 6/240/260 and Moon 103. Home/Calendar/Admin production writes stay blocked; no hosted concurrency/restart proof. Concrete single-authority PostgreSQL decision and executable schema rollout prepared. ON-05/live Full Health remain open. No main merge/publish, import, external provisioning/migration or live user mutations. Evidence: reports/SHINKA_CLOSURE_014.md and closure-014/verification.json. Latest five packages 010–014."
  }
];
