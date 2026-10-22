# Shinka notification backend performance — 031

**Build:** Buildmarker-031 / HC-031.0
**Date:** 2026-10-22
**Status:** LOCAL_VALIDATION_PASS / LIVE_BINDING_BLOCKED
**Scope:** Focused read reduction over 030; no new product, schema, dependency, provider or workflow contract.

## Source and reproducibility

Preflight found clean local/origin Test `0abfa8ff9d25d783d02dfee9d2cfc3d58cfaf767`. The owner had already merged PR #32 into main as `b61228e91db30b05f62b63fecaec1c49b115fcdf`; their Git trees were identical. Test was safely fast-forwarded to that merge record before editing. No Base44 or user work was overwritten. 031 was the next unused package. The SDK/lockfile and existing runner remain unchanged; Base44 skills were refreshed before implementation.

The baseline was measured before production edits with the new transport instrumentation. The exact same instrumentation bytes were used after the change. [Before](notification-performance-031/before.json), [after](notification-performance-031/after.json), [comparison](notification-performance-031/comparison.json) and [execution receipts](notification-performance-031/measurement-receipts.json) record source hashes, fixed clock, initial-state hash, results and each method event. Initial-state SHA-256: `fe0aa8dc9ed6385d5e9ae06383d08fe6fa17b45b688145e2cf258428a726de7d`.

Reproduce using the locked install and `node scripts/measureNotifications.mjs /absolute/path/outside-checkout`. For the baseline, use the stated merge tree with only the identical `notificationCostFixture.js` and `measureNotifications.mjs` instrumentation added. The tool bundles existing modules, runs the fixture through the actual shared handlers and counts at the substituted SDK method boundary, not at helper entry. It does not connect to Base44. No record values, owner IDs, personal data, message content or credentials enter the trace: only method/entity/control names, query shape, returned row counts and aggregate product status.

The [full-browser source manifest](notification-performance-031/browser-source-manifest.json) records 498 runtime/test/configuration file hashes; aggregate `42403c4f3181b77ac5befe3d5e7637dea4e30007576d7cbcafade0e2e2ca32c4`. The [final source manifest](notification-performance-031/source-manifest.json) aggregate is `c17a5d8a65e3555a92d7916558d0552298bef9e79b23c2f9cbe52a38e12da2ef`. After full runs, only NP07 deferred-variable JSDoc types/declaration grouping changed for typecheck. [Source comparison](notification-performance-031/post-browser-source-check.json) reconstructs and verifies the original hash and equal executable Acorn ASTs after declaration normalization; all other manifest files match. NP07 then passed again in both engines. Production hashes still match the final cost measurement. Generated ledger/prose/evidence were finalized afterward and are explicitly excluded from these runtime manifests; Git records their delivered bytes.

## Measured reduction and unchanged results

One synthetic owner, an existing daily snapshot and the same in-memory tables are used on both versions. The first request is at `2026-10-20T03:00:00.000Z`; only then does the clock advance five minutes. The second dispatches through the synthetic accepting provider; the third checks the settled row at the same time. Response summaries, immutable daily content, record counts, delivery state and attempts match before/after.

| Scenario | Entity reads | Change | Entity writes | auth.me | Provider eligibility | Provider send |
|---|---:|---:|---:|---:|---:|---:|
| Existing daily → intent | 84 → 69 | −17.86% | 4 → 4 | 14 → 12 | 1 → 1 | 0 → 0 |
| Accepted synthetic dispatch | 119 → 104 | −12.61% | 4 → 4 | 17 → 15 | 3 → 3 | 1 → 1 |
| Settled next pass | 61 → 46 | −24.59% | 2 → 2 | 11 → 9 | 1 → 0 | 0 → 0 |

All three measured scenarios save 15 entity reads and two auth.me calls. Writes and send calls do **not** decrease. Device eligibility decreases only on the settled path. No quantitative reduction is asserted for new daily generation, multiple owners, failures or production latency/credits. New daily and multi-owner behavior are covered functionally. Promise.all is not counted as request reduction, and field projection is not claimed as a measured byte saving.

## Changed control stages

| Stage | Change | Fresh controls retained |
|---|---|---|
| HTTP body → tick | Remove the adjacent handler/tick duplicate caller admission; tick owns the post-body check before BUSY, provider construction or job reads. Saves one auth.me and three entity reads. | Initial authenticated/current-native-admin gate, stable principal, post-body check including BUSY, checkpoint/page/write boundaries. |
| Owner → common daily engine | Engine invokes initial owner admission once. Its fresh profile/preferences also determine the window and initial daily state; remove scheduler's immediately repeated admission. Saves one auth.me and nine entity reads including nested caller checks. | Native owner existence, privacy/deletion/lifecycle, ACTIVE/completeness, existing first daily, current admin. |
| Daily record reads | Normalize/check the just-admitted profile/preferences instead of immediately rereading them; existing-daily return uses a new admission's profile. Saves three reads in these scenarios. | Fresh admission after existing-daily read and before mutation; owner/ACTIVE checks and consent revalidation. Home callbacks without records retain the original read path. |
| Intent → readback → claim/send | Keep persisted intent, bounded candidate reconciliation, write facade pre/post checks, readbacks, pre-claim and post-IN_FLIGHT fresh eligibility. | Direct lower-layer writes cannot use a prior admission as authorization. Preference, timezone/window, account and admin changes still block later actions. |
| Settled/uncertain row | Fresh owner admission and row validation precede terminal return; no device eligibility lookup when no send can start. | UNKNOWN/IN_FLIGHT remain non-retryable; malformed/foreign/conflicting candidates still fail closed. |

The per-method traces identify control stacks (`admitCaller`, `admit`, `produceDailyForOwner`, `guard`, `dispatch`, `eligible`, lifecycle/privacy helpers), exposing repeated checks at their actual stage. As a cross-check, each scenario's entity deltas are User −3, UserPrivacyRequest −3, AdminTestOperation −3, UserProfile −3, UserPreferences −2 and UserDailyMessage −1; other entity read counts are unchanged.

No global/worker/TTL authorization cache or serialized “already validated” flag was added. Records are reused only within their admission phase; a new callback invocation, owner, request or write boundary gets new checks. `userLifecycle.js`, `internalAuthorization.js` and `privacyPolicy.js` are unchanged. Narrow projections are explicit for preference pages (`id/user_id`), checkpoints, ownership lookups and schema-required profile/preferences/delivery fields. Existing row limits remain: page 25, singleton/conflict probes 2, delivery reconciliation 11 with rejection above ten, lifecycle existence 1. The 20-second between-owner admission budget, cursor progression, bounded history and no full-history delivery scan remain. A slow SDK operation may exceed that budget; it is not hard cancellation.

## Regression and Health evidence

| Execution | Browser regressions | Failed / missing required IDs | Separate server fixtures | Separate actual-entry fixtures |
|---|---:|---:|---:|---:|
| Chromium 156.0.8078.4 | 624 / 624 | 0 / 0 | 8 / 8 | 9 / 9 |
| WebKit 27.2 | 624 / 624 | 0 / 0 | 8 / 8 | 9 / 9 |

[Chromium results](notification-performance-031/chromium.json) and [WebKit results](notification-performance-031/webkit.json) include individual IDs, receipts, engine version and scopes. Both ran NT01–23, NC01–09, NU01–03, NP01–07 and retained shared daily/Home regressions. O32, NA07, NA22, SC06, SC10, SC11 are individually present and PASS. SC01–05/07–09 and NS01–09 run inside each canonical command, separately from the 624 browser total. The NS results retain the runner's historical `notifications030` JSON key. No missing engine, zero-test result or source-only check is counted as browser success.

NP01 enforces measured read ceilings 75/110/50 and auth ceilings 13/16/10, with headroom below the original 84/119/61 and 14/17/11; it also verifies unchanged writes, sends, snapshots and output state, settled zero eligibility and transport counter integrity. These are scenario budgets, not exact call-order assertions. NP02–07 cover in-request admin/owner/account/preference changes after daily read, owner/request isolation, direct writer/daily guards, role loss during body IO, consent withdrawal before persistence and current-caller rejection while another worker is BUSY. Existing NC05 specifically retains revoked admin after IN_FLIGHT and before provider send; NT tests retain retry, partial failure, coalescing and traversal.

H14-003 is updated in place for the seven new regressions. H14-004 was reviewed: its existing NU/NS description and local scope already match actual assertions, so no change was needed. **No Health ID was added or deleted.** NC04's obsolete embedded cost output was removed in favor of the shared transport-counter fixture; its queue/send/repeat assertions remain. H14 backend plan [001,002,003] remains aligned; H14-004 is local-only. Catalog: **175 total / 149 in-app / 12 local / 14 external / 0 future**. [Per-case Chromium audit](notification-performance-031/chromium-case-audit.md) and [WebKit audit](notification-performance-031/webkit-case-audit.md) preserve mappings.

Local in-app Health in both engines: **136 PASS / 0 FAIL / 13 BLOCKED**. Blocked prerequisites: H04-019, H05-001–009, H08-005, H09-004, H12-031. They are retained, not reclassified or suppressed. H14-901 and H16-901 remain external acceptance and were not run. These are local browser/synthetic results, not hosted security enforcement or physical devices.

## Quality gates and retained failures

The locked `npm ci`, `npm ls --depth=0`, `npm ls --all`, `npm audit --json`, `npm run security:deps`, typecheck, lint, build, Repo Health, `recordBuild.mjs --check`, both full browser runs and `measureMaintenance.mjs` passed. [Gate receipts and logs](notification-performance-031/quality-gates.json) record actual commands/times/exit codes. Audit: zero advisories at every severity. Dependencies and security policies were not loosened. npm's existing unknown `min-release-age-exclude` config warning remains visible in the logs; it is not an install/audit failure or a reason to remove release-age configuration.

[Performance evidence](notification-performance-031/performance.json): initial production JS **479543 B / 160178 B gzip**, CSS **77521 B / 14262 B gzip**. Existing byte budgets and lazy-chunk reload/retry gate pass. Lab cold-load LCP samples range **44–132 ms** with substituted SDK; they are not hosted/network/device measurements or claimed backend speedups. Final ledger/prose summary changes occur after this measurement; final build independently passes. Internal Build retains **027–031**; old Git/audit/report evidence remains.

[Original failures](notification-performance-031/initial-failures.json) are preserved: NP04 callback type mismatch; NP07 exposed a BUSY early-return freshness gap introduced during optimization; NP07 deferred-Promise type diagnostics. The tick guard was moved before BUSY and provider creation. No assertion or security rule was removed. The initial 623/623 runs predate NP07 and are historical; the final full runs are 624/624. Subsequent JSDoc-only NP07 corrections passed typecheck and [focused Chromium](notification-performance-031/busy-final-chromium.json)/[WebKit](notification-performance-031/busy-final-webkit.json), with executable source equivalence recorded above.

## Delivery and remaining external acceptance

Deliver on **Test**, Buildmarker-031 / HC-031.0. Since PR #32 was already merged by the owner, the new draft continuation PR carries this diff and PR #32 receives a link while retaining its historical 029/030 description. This report is not authorization to merge or publish. The previous [029/030 report and evidence](SHINKA_NOTIFICATIONS_029.md) are preserved.

The real `notificationSchedule/entry.ts` is unchanged and **enabled:false**: a verified admin still receives **DISABLED / processed:0**, and unauthorized calls fail before job/provider access. No real push, workflow creation/run/activation, live Full Health/Security scan, import, real user mutation, APNs/Firebase credentials, agent main merge or publish occurred.

Workflow caller identity/credential transport, exact recipient mapping, provider response/error/no-device semantics and device eligibility remain unverified. The previously user-relayed push input schema does not close those contracts. Service-role availability is not proof of an authorized workflow. Ordinary SDK lacks accepted transaction/CAS/distributed-lock guarantees: worker coalescing and deterministic visible-row reconciliation do not prove exactly-once delivery or eliminate cross-worker/final-read-to-send races. Current checks do not claim instantaneous cancellation of already-started work. Existing **12 backend Security findings stay OPEN / USER-DEFERRED**. Owner-controlled platform contract verification, main merge/publish, hosted acceptance and physical Android/iOS acceptance remain open.
