# Buildmarker-025 / HC-025.0 — targeted Health timing correction

Status: repository fix; owner post-publication Health pending. Test only. No hosted Health, GeoNames probe, import, user mutation, schema push, main merge/publish or physical-device execution.

## Preserved evidence and diagnosis

The [user-supplied published HC-024 result](health-025/published-024-evidence.json) remains PUBLISHED/FULL, run `4b518113-02f1-4db1-9693-f0a02fbeecb8`, **143 PASS / 0 FAIL / 1 BLOCKED**. H10-003 timed out after its 20,000ms budget (measured 20,950ms, attempted=true/executed=false). It had passed in 326ms in HC-023. H13-014 passed in 15,930ms. The now-successful four readiness and nine content checks are not reopened. Older reports are unchanged.

Source-proven defects:

- H10-003 sequentially executes 55 synthetic helpers. G02/G11/G23/O28/B18 and runtime-probe G18/G19 waited on real short deadlines/delays; B14 added an unnecessary timer after an already-awaited operation. A helper could consume the entire 20s outer case budget. H13-014's AN08 waited repeatedly on 20ms sleeps/polls through its two-language navigation sequence.
- `syntheticProbe` cached running promises. The outer case timeout discarded completed-helper and active-stage information. Nested helpers had incomplete ownership of timers/listeners/DOM/global capture cleanup.
- The old report cannot reveal the actual historical active helper/stage or browser visibility. No provider outage, background tab or native runtime failure is asserted.

The [before-fix laboratory result](health-025/before.json) used source `fe63dcf` with a local-only diagnostic harness. Only timer delays below 100ms were clamped to 1,000ms; every case ran in a separate page and external fetch/XHR was blocked and counted. This deliberately models delayed scheduling; it is not observation of the user's browser.

| Actual case | Normal before | Clamped before | Last active helper at timeout |
|---|---:|---:|---|
| H10-003 | PASS, 341ms | BLOCKED, 20,003ms | B14 START; prior helpers retained in diagnostic instrumentation |
| H13-014 | PASS, 351ms | PASS, 16,039ms | AN08 completed at 16,038ms |

All four runs attempted **zero external fetch/XHR requests**. Every GeoNames adapter fixture injects its fetcher; runtime-probe fixtures inject getFetch. Fake Request URLs are input data, not dispatched network requests. This reproduction proves the timer sensitivity and lost-evidence defect, not the historical incident's exact cause.

## Implementation and unchanged coverage

`testExecution` owns a child signal, monotonic budget and synchronous disposer registry. Case execution owns its signal, remaining budget, parent-cancellation race and safe progress projection. Timeout remains BLOCKED/attempted=true/executed=false; the **20s case budget is unchanged**. Synthetic helpers use min(5s, remaining case budget), while the standalone comprehensive local runner retains its existing default. Elapsed-time checks also reject work completing after budget when timer delivery itself was late.

Progress contains only safe helper ID, closed phase code and bounded elapsed milliseconds. `actual.helpers.completed` records completed/reused/failed helpers; `active` preserves the last unfinished helper and current elapsed duration on timeout. Late stages cannot change a closed case. Only successfully completed helpers enter the run-local cache; failure, timeout, cancellation and in-flight promises are excluded. A fresh run has a fresh cache.

Private controlled schedulers replace wall waits in G02/G11/G18/G19/G23/O28/B18. They execute the real adapter/probe deadline callback and keep actual AbortController, Response, stream cancellation, cooldown, sequential-request, late-response and unhandled-rejection assertions. A MessageChannel turn drains tasks without short sleeps. Unscheduled asynchronous fixture work wakes the scheduler when it settles or registers a deadline; cancellation closes its channel/jobs. B14 directly awaits the picker operation. GeoNames production code only gains optional scheduler injection with identical native defaults; provider destination, redirect policy, timeout values, validation and transport behavior do not change.

AN08 retains all three tools, both languages, panel return and application return. Its shared navigation fixture uses abortable MutationObserver waits, a bounded failure timeout and an idempotent React-root disposer. Related AN02–07 retain their authorization assertions using the same fixture. G12/G20/G24 console capture is count-only, restored synchronously on abort and idempotent, so a late finally cannot overwrite the next fixture's hooks.

Cancellation cannot physically kill arbitrary non-cooperative JavaScript promises. Owned timers/listeners/observers/roots/hooks are disposed synchronously; unfinished work has no publication/cache authority, uses only private synthetic state and cannot dispatch another helper after abort. No SDK/remote cancellation guarantee is introduced.

## Health and regression mapping

No case ID, assertion or applicability removed. Inventory stays 169 registered, 144 in-app, 10 local, 13 external and two future. H10-003 and H13-014 keep all original behavior coverage. H16-007 adds:

| Helpers | Assertions |
|---|---|
| HT01–03 | Outer partial evidence, inner remaining budget, no post-timeout dispatch/cache, pre/active cancellation, synchronous cleanup, next-case success |
| HT04–05 | Completed-success-only reuse, failed/pending/new-run behavior, fixture-local scheduler disposal and fresh-clock isolation |
| HT06 | Abort during actual AN08 navigation removes the React root; a new actual navigation fixture succeeds |
| HT07–09 | Safe/frozen progress, delayed timer delivery refuses over-budget PASS, cleanup failure refuses PASS, console cleanup cannot affect a following fixture |

The mandatory local harness also executes actual H10/H13 normal and clamped cases with zero external requests. Run just that check with `FOUNDATION_TIMING_ONLY=1 npm run test:foundation` (or add `FOUNDATION_BROWSER=webkit`). This switch is local tooling, not a published app control. Normal full Chromium/WebKit checks include it automatically.

Canonical RELEASE_HEALTH_CHECK, CODE_STANDARDS, TECHNICAL_ARCHITECTURE, DEVELOPMENT_RULES and DEVELOPMENT_NOTES record the contract. Other canonical document edits are generated marker headers only. Internal Build and generated BUILD_HISTORY retain 021–025; older reports/Git remain. Existing staged content policy extends through 025 with identical predicates/source bytes, without import.

## Local verification

Both Chromium and WebKit completed **569/569** Foundation tests with zero page errors and 87 mobile/browser checks each. Local in-app Health: **131 PASS / 0 FAIL / 13 expected unavailable-hosted-dependency BLOCKED** in each engine; synthetic save confirmed. These local prerequisite blocks do not reopen the published readiness/content successes. HT01–HT09 and the actual H10/H13 paths passed on the final execution code.

| Engine | Case | Scheduler | Result | Duration | External fetch/XHR |
|---|---|---|---|---:|---:|
| chromium | H10-003 | normal | PASS | 39ms | 0 |
| chromium | H13-014 | normal | PASS | 9ms | 0 |
| chromium | H10-003 | clamped | PASS | 38ms | 0 |
| chromium | H13-014 | clamped | PASS | 10ms | 0 |
| webkit | H10-003 | normal | PASS | 48ms | 0 |
| webkit | H13-014 | normal | PASS | 55ms | 0 |
| webkit | H10-003 | clamped | PASS | 50ms | 0 |
| webkit | H13-014 | clamped | PASS | 56ms | 0 |

`npm ci`, `npm ls --all`, `health:repo`, typecheck, lint, build, generated five-package history and production byte/performance budgets passed. Fresh dependency audit: 0 Critical / 0 High / 2 existing Moderate router findings; native High-threshold gate passed and full audit intentionally exited 1 for the visible Moderate findings. Existing exposure/disposition is unchanged in SECURITY_PRIVACY. Production measured initial JS 478,329 raw / 158,981 gzip bytes and CSS 87,430 / 15,054, within 500,000 / 165,000 and 90,000 / 16,000 budgets. No static graph cycles; lazy asset failure/reload retry passed. Later phase-label and pre-cancelled runner refinements only affect Health; final build also passed.

Final gate results are recorded in [verification.json](health-025/verification.json), [case audit](health-025/case-audit.md), and the before/after/performance evidence beside it. Local stubbed Health does not claim hosted readiness/content success: those unavailable dependencies remain expected local BLOCKED results, separate from the user's accepted published PASS evidence. Android/iOS physical execution was not performed.

## Owner publication and acceptance

1. Use the existing Git workflow to merge Test into main. In Base44, sync the merged GitHub code, including shared `healthConstants` and all native backend/shared functions, then matching frontend; publish through the existing dashboard flow. There is **no schema or data change** and no entity push/import step. Matching backend HC-025.0 is needed to accept the new report identity.
2. Reload the published app, sign in as admin and verify Internal Build shows Buildmarker-025 / HC-025.0 and packages 021–025.
3. Run Full Health once through Admin Panel → Health. Confirm H10-003, H13-014 and H16-007 results; save, list and reopen the same run. Keep the prior HC-024 report unchanged.
4. If any case blocks, retain that run's ID and the safe `actual.helpers` completed/active ID, stage and duration. Do not rerun solely to hide failure. The new report can identify where the wait occurred; historical records without this trace cannot be backfilled.

Hosted outcome and real-device behavior remain **OWNER_POST_PUBLICATION_RUN_PENDING**; the local fix is not a claim of published closure.
