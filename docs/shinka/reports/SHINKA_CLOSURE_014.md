# Buildmarker-014 / HC-014.0 — production closure continuation

**Status: independent correction/security/rollout work delivered; production Home/Calendar/Admin mutation closure awaits architecture approval.** No external service, live migration/import, user reset/delete, main merge or Base44 publish was performed.

User authority: `d60d6fd9-8b2f-4b64-877c-310b979237e2/Pasted text.txt`, SHA-256 `c53b94ba87cfa4041151583286e90d678cb0ad4984f58ef69627aa65e518f08f`. Existing Calendar/Admin implementations are preserved.

## Findings and result by feature

| Feature | What is implemented and wired | Production write result | Setup / missing proof / expected app behavior |
|---|---|---|---|
| Home / ON-06 | Existing UI, real SDK reader/content inspector and shared OD-012 calculation in `dailyMessage` | No production conditional-create adapter; stays blocked | Needs approved authority implementation and content/Moon import. Existing valid day is returned unchanged; new first day remains not ready. No hosted create/retry/restart proof |
| Calendar | Existing UI/real reader; OD-012 accepted long-interval planner, updated shared engine, no stale derived result, TR/EN information | No production transaction publication; stays blocked | Read-time calculation now follows approved rule. Save/edit/delete/reconsent remain unavailable. Needs authoritative commit and hosted concurrent/lost-response acceptance |
| Admin reset/delete | Existing preview/SDK repository/executor and real entry retained; schema live-readable; fail-closed rollout tested | No production coordinator/journal; stays blocked | Actual app policy/HMAC configuration and verified all-writer authority still required. Lookup/preview can work; execute remains unavailable. No real target changed |

The [decision document](SHINKA_PERSISTENCE_DECISION_014.md) supplies the required guarantee/capability/mechanism/evidence/boundary table, simpler model evaluation, recommended managed PostgreSQL authority, implementable alternative, Base44 identity integration, operation coordination, migration/rollback, security/operations/cost and exact user decision/resources. No new placeholder persistence interface was added. Approval is requested because the user's section 4 expressly requires it before external provisioning or live migration.

## OD-012 implementation

Real dates retain ≥15-day spacing with no upper rejection. The last-three **completed** window is fixed before filtering to 15–60; older records never fill missing samples. Existing mean/outlier/half-up behavior applies to the remainder. All unsupported gives nullable estimate, no current/future prediction/phase; no completed history retains initial/28. Historical supported phases remain valid; no phase row is produced inside an unsupported closed interval. Optional settings remain null.

`dailyCycle` is the shared authority; `calendarCalculation` projects the full history and `calendarState` replaces derived sets. Calendar transports an information notice independently from technical errors and capability state. Home uses UNKNOWN for unavailable phase only; invalid data/access/storage failures still throw. Existing daily snapshots are returned unchanged. CA02's old rejection expectation is updated with its intent preserved; CR01…CR07/CU05 add behavioral coverage.

## Verified live evidence, limited scope

2026-10-20: management Data UI shows AdminTestOperation (0), category (0), mapping (0), Pair (0), Moon (0). Official CLI with current owner/editor authorization successfully reads the lifecycle schema and invokes only `contentLibrary.verify` / `moonDryRun`. Result: PRE_IMPORT, exact source hash, missing 6/240/260, no conflicts; 103 missing Moon intervals, no conflicts, planned coverage 2026-10-03T13:25:33.710Z–2028-11-02T09:17:57.674Z. No rows inserted. This is actual hosted read-only evidence, distinct from fixtures and from published-version/concurrency/RLS proof.

Preview shows main `29a64d3c3d400090c1cd3081dcf54141de24e57b`, preview functions and prod data. Public deployed function commit was not independently established. No actor transaction, native UNIQUE, rollback, worker restart durability or live mutation success is inferred.

## Schema and content release

[Rollout instructions](SHINKA_RELEASE_ROLLOUT_014.md) include actual generated full-schema snapshots and additive Git patches, read-only CLI invocation, old/new compatibility, missing-schema recovery and single-operator import steps. Current main has no schema delta and the live schema is already readable. Pre-013 `e8afd7b` yields an AdminTestOperation-only patch. All 23 copied schemas are hashed and read back. No partial-directory entity push or whole-app CLI deploy is used.

AT17 confirms missing schema denies onboarding/daily/admin before product writes, and additive restoration resumes reads. A failed code publish must retain the schema/history and fail closed. Old unguarded writers must be retired before any real lifecycle job is enabled.

## Security

Current unchanged-lock scan completes: **0 Critical / 0 High / 2 Moderate / 0 Low** affected packages. Native High-threshold security command passes; JSON audit exits 1 for Moderate findings. Both advisories are in root → react-router-dom@6.30.6 → react-router@6.30.6: GHSA-wrjc-x8rr-h8h6 (untrusted backslash navigation) and GHSA-337j-9hxr-rhxg (SSR error hydration). Fixed internal destinations/auth-return validation and declarative client-only rendering retain the documented limited exposure; they are not patches. npm proposes breaking 7.18.4. No dependency changes.

Lock SHA-256: `98542fb2ec2004ccd54f48ac07eef9ccd40fb50baf69735479e93606f8b52436`. Current registry connection validates with Google Trust Services, TLSv1.2; strict-ssl remains true and no TLS override/extra CA is configured. Earlier TLS failure cannot be reproduced and its exact original chain cause is unproven. No trust settings changed; old failure remains historical, current audit is complete.

## Local verification

Chromium 156.0.8078.4 and WebKit 27.2 each pass **405/405 canonical tests** and **94/94 local Health cases** (54 general, 21 onboarding, 9 daily, 6 Calendar, 4 Admin), with zero page exceptions. Per engine: 19 admin navigation, 8 routing/Preview, 5 mobile, 5 daily, 8 Calendar and 4 Test Tools actual-App scenarios. New TR/EN 360px information states pass layout checks and visual review. In-memory transaction/receipt/fence cases remain **SYNTHETIC_RUNTIME**; there is no external persistence implementation or hosted destructive test in this package.

`npm ci --offline --no-audit`, direct/full dependency trees, typecheck, lint, build, Repo Health **16/16**, generated latest-five history check and `git diff --check` pass. The standard measurement script passes existing initial-JS/CSS budgets, detects no static cycles or initial test/content-import modules, and passes synthetic lazy-chunk failure/reload recovery. Exact measurements and per-case receipts: [verification](closure-014/verification.json), [measurement](closure-014/measurements.json), [live read-only receipt](closure-014/live-readiness.json). Build's missing local VITE app configuration and lazy Health chunk-size/dynamic-import warnings are retained; this build is compilation/budget evidence, not a runnable configured production deployment.

## Health and documentation

HC-014.0 retains 149 cases / 130 current / 7 future / 12 external / 16 suites. H08-006 now executes CR01…CR07, not an approval-label check. H13-015 adds unavailable-estimate UI coverage; H12-028 adds missing-schema admission/recovery; H05-009/HC12 stage 014 and refuse unapproved 015. No cases removed. H09-004, H08-005 and H12-031 stay BLOCKED.

Source of Truth, Business Flow, Data Model, Content Model, Architecture, Security, UI/UX, Release Health, Code/Development Rules, Development Notes, generated Build History and both 012/013 reports are reconciled. Active Internal Build retains 010…014. Old numbered checkpoint results are historical. ON-05 same-account live save/readback, current Full Health/history, deployed multi-identity enforcement and physical-device evidence remain open.

## User decision and next acceptance

Approve the [single-authority PostgreSQL design](SHINKA_PERSISTENCE_DECISION_014.md#exact-approvalresources-needed), or choose the existing managed PostgreSQL/gateway alternative. Supply the organization/destinations, approved region, monthly ceiling and backup/recovery owner through normal account/secret workflows. No credentials in chat.

After implementation and the user's sync/publish: verify schema/config/import independently; enable Home first and prove one immutable day across two clients, loss and restart. Then verify Calendar actual/derived revision consistency and OD-012 save/reopen/edit. Only then authorize a named disposable reset/delete target and test recovery/fencing/protected history. Finally run current Full Health → save → list → reopen report. Approval of architecture alone does not authorize production migration or user operations.
