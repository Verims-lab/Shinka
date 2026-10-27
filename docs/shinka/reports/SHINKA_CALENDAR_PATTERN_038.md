# Shinka — Calendar and Pattern corrections, Buildmarker-038 / HC-038.0

Date: 2026-10-27. Scope: local implementation and synthetic verification; Test delivery only. Final verification receipts are recorded below; executable-source hashes match the tested source. Owner main merge/publish, hosted Full Health and physical acceptance remain separate.

## Authority, baseline and limits

User request: `95da1b20-7fd7-4762-9684-53257241899e/Pasted text.txt`. Started on clean Test `051e98779fca00b9c3cb139d75b7cde84317337d`, equal to origin/Test. Fetched main `ac0a1b419b6efccdfdea0db198d62b17695b808c` was four commits behind; no local-ahead blocker. Completed 036 and 037 are preserved. This is one new package, with Internal Build retaining 034–038.

The supplied screenshots show a dark UI while 037 source is light-only. Their deployed commit and actual native write result were not read. No live call, Full Health, scan, import, user mutation/reset/delete, Base44 push, notification send or scheduler operation occurred. No database/service/dependency was added. Prior CLI 401 and the user's deferred live diagnosis remain unchanged. Original First Shinka and ON-05 incidents are not closed. Twelve backend findings remain OPEN / USER-DEFERRED.

## Four-item finding → cause → fix → execution → remaining acceptance

| Item | Proven source finding and correction | Execution | Remaining owner acceptance |
|---|---|---|---|
| Calendar past-date / unknown result | A unique pending normal add/edit/delete was not projected as a resumable intent after reopen; only initial-grant recovery existed. A passive read could disable explicit retry. Recovery now projects the original action ID/base revision/operation, suppresses new writes until resolved, and resumes the actual native path. Confirmed past-date results select their actual month, including recovery from a different month. Retry supersedes passive read and task ownership prevents late reads/finally from altering the next account/request. Bulk acknowledge/CANCELLED writer and UI removed. Multiple/stale competitors stay conflicts; no rollback/atomicity claim. | RC01–05, NA08–16/28/30, CF01–05, CU06/CU07 and existing Calendar/UI/permission tests. Actual handler/native code over isolated ordinary SDK CRUD; count and readback assertions, no live mutation. | Same account: eligible past date → verified success/visible record → reopen; unknown receipt → same-change retry. Photograph alone cannot establish whether that original write was absent, applied or partial. Conflicting durable intents may still need narrowly authorized review; no bulk clear. |
| Pattern spontaneous loading | Old `refresh()` always invalidated both values; old hook called it each 60s and for every return event. Exact committed source reproduces blank transitions under controlled clock. Refresh now retains values, coalesces per-section tasks and event bursts, with five-minute visible refresh. Transient errors retain old information; privacy/account/logout clears immediately, session-ended stops later refreshes. AuthProvider passive refresh/ProtectedRoute already retain verified children; no unrelated session redesign. | PF01/02 controllers/lifecycle; PU06 real hook/component with 120s/300s clock; PU02/04/05 section failure/offline/unmount/privacy; SS/AN session/route regressions. Source-comparison measurement below. | Published screen idle/return/reconnect on Android/iOS. Live trigger could also include route/session remount; not proven from screenshots. |
| Theme day counters | `theme.count` was rendered below each name. Count span and its spacing removed; names/order, 30-day summary, ties and Home comparator unchanged. Underlying count schema/response validation retained. | PT01–06/13/17–19 plus PU01 positive two-theme order, exact TR/EN names and absent count labels. | Published TR/EN shows names only, same order. |
| Moon card | Old UI and response required an enclosing five-node timeline; its FULL node may be in the past. Replaced with current half-open interval and first FULL start strictly after trusted backend now, projected IANA-local date. At exact FULL start select the following lunation. No approximation or API. Partial future coverage preserves current phase and null next; no current coverage cannot prove either. Old component/calculation/time-format/labels removed. | PT07–10 boundary/partial/gap/overlap/bad timestamp/strict response/HTTP/no-write; PU01/03/07 TR/EN date-only/partial/320px/200%; actual route geometry. | Published current/next values against installed Moon coverage; physical text sizing. No clock time, zone line, graph or phase list should appear. |

## Calendar outcome and persistence contract

- Invalid future/duplicate/<15-day input: rejection before new receipt/health writes. Valid past/today saves and readbacks are tested. OD-012 >60-day recorded dates remain accepted with unsupported estimate notice; no clamping/backfill.
- Failure before journal write: zero rows; same transient action ID retry completes. Reload has no persisted intent to reconstruct and does not claim it was saved.
- Whole reply lost after completion: receipt/period may already exist; retry of the original ID verifies APPLIED and desired state without creating another period.
- Partial consent/event/period/receipt: unique durable intent survives process/controller reconstruction; resume retains original grant time, uses original ID and verifies all required records before success. Optional duration/settings remain absent/null; no 5/28 defaults are stored.
- Competing/stale intent: no silent overwrite, arbitrary cancellation or deletion. Predictions withheld, conflict remains explicit. Native ordinary read/write/readback detects observed races but offers no distributed uniqueness, CAS, transaction, rollback or transmitted-call cancellation guarantee.
- Withdrawal suppresses recovery health fields; owner, ACTIVE, current consent, deletion/reset guards remain. Known session/account change clears UI immediately; obsolete read/mutation cannot revive it. Deadline remains 20s, clears its timer and ignores late SDK results.

## Pattern before/after measurement

`node scripts/measurePatternRefresh.mjs` executes baseline commit controller/hook and current source using the same synthetic requests and per-run clock. It stubs React lifecycle wiring for measurement; PU06 independently executes real React hook/component. No network or live credit/timing inference.

| Controlled scenario | Baseline requests | 038 requests |
|---|---:|---:|
| Initial load | 2 | 2 |
| Total through 120 seconds | 6 | 2 |
| Total through 300 seconds | 12 | 4 |
| Simultaneous focus/online/visible return burst | 6 | 2 |

Baseline subscribers observed both values empty on each refresh; 038 observed zero such transitions after initial success. Timer count after cleanup is zero for both. [Source hashes and counts](calendar-pattern-038/pattern-refresh.json).

## Health and documents

**0 added / 7 updated / 0 deleted.** H08-004, H08-007, H12-027, H10-001, H13-015, H13-017, H15-004. Registry/backend plan remain 175 total / 149 in-app / 12 local / 14 external. Old five-node/count-display assertions are replaced by the user's explicit presentation decision, with positive strict-next/partial/order/geometry assertions; no failed evidence is erased. Existing 036/037 light-only, future-date, onboarding, mobile, auth, permission and service regressions remain.

SOURCE_OF_TRUTH, UI_UX, BUSINESS_FLOW, ARCHITECTURE, DATA_MODEL, BASE44_CONTINUATION, RELEASE_HEALTH, DEVELOPMENT_NOTES, BUILD_HISTORY and README align. Canonical document markers advance to 038; no entity schema or policy migration. Read-only lunar response changes together with its matching frontend. Health constants/plan/execution scope and content-policy package allowlist align with HC-038.0; content/import rules unchanged.

## Final local verification

Final source: **Chromium 156.0.8078.4: 683/683 PASS; WebKit 27.2: 683/683 PASS**; **683 unique IDs** in each run, zero test failures and zero page errors. Both execute 22 Pattern route/geometry scenarios, the full 036/037 regression, mobile surface matrix and synthetic service/native handlers. Local in-app Health: **136 PASS / 0 FAIL / 13 hosted-prerequisite BLOCKED**; saving, retry-save, listing and opening the private report pass. Physical devices and live service acceptance are NOT_RUN.

Required gates all exit 0: clean `npm ci`, complete dependency tree, zero-advisory npm audit/security, typecheck, lint, production build, Repo Health, generated five-package history check, session stability verification and existing performance budget. Initial production JS **483391 raw / 160915 gzip**; CSS **77728 raw / 14239 gzip**. Budgets remain 500000/165000 JS and 90000/16000 CSS. Existing nonfatal dynamic-import/npm-config warnings remain visible in logs; no dependency change.

[Machine verification and gates](calendar-pattern-038/verification.json), [521-file executable-source manifest](calendar-pattern-038/tested-source.json), [Chromium full results](calendar-pattern-038/chromium.json), [WebKit full results](calendar-pattern-038/webkit.json), [Chromium Health execution map](calendar-pattern-038/chromium-health-audit.json), [WebKit Health execution map](calendar-pattern-038/webkit-health-audit.json), [performance receipt](calendar-pattern-038/performance.json), [dependency summary](calendar-pattern-038/dependency-summary.json). Representative final synthetic screenshots were visually inspected: [320px TR](calendar-pattern-038/chromium-pattern-320-tr-1x.png) and [320px EN at 200%](calendar-pattern-038/webkit-pattern-320-en-2x.png). These are browser renders, not physical-device evidence.

[Intermediate uniqueness rejection](calendar-pattern-038/duplicate-id-check.json) remains available. Initial check logs are retained, including obsolete export/type errors and the delivery uniqueness rejection (683 intermediate executions / 681 unique IDs). New Pattern PR01/PR02 collided with existing Privacy IDs; Pattern now uses PF01/PF02 and the canonical runner rejects duplicate IDs before execution (CL10 includes a negative fixture). Existing Privacy IDs are unchanged. These intermediate runs are not final evidence or a live success.

## Owner publish and short in-app acceptance

1. Through your existing main/Base44 workflow, sync all matching native entries/shared code (especially calendar, pattern, applicationSession, internalHealth), then matching frontend. No schema change; do not mix old frontend with the new lunar response. Git Test/Preview is not a separate database.
2. On the affected account, open Calendar and inspect recorded dates. If the same-change control appears, press it once; verify explicit success, one actual start, then reopen. Do not delete/recreate the account. If a real conflict remains, retain it for narrow review rather than clear receipts. Try a valid past date and confirm future/duplicate/too-close dates reject; actual user writes are owner-run.
3. Open Pattern in TR and EN: unchanged theme names/order, no day counters; Moon has only current phase and next FULL date. Wait and background/return/reconnect: confirmed cards should remain during refresh; a transient error offers section retry. Logout/account change must hide prior content.
4. Run published Full Health and inspect/save/reopen the report. Local hosted-prerequisite BLOCKED cases do not prove deployed enforcement. Android/iOS physical touch, OS bars, text scaling and network lifecycle are separate from browser emulation. Original First Shinka/ON-05 acceptance remains a separate same-account check.

## Delivery source receipt

Executable-source commit: `456fa42` (Test). All 521 recorded source/harness hashes match this commit; subsequent receipt changes contain documentation and logs only. Final Test delivery preserves main unchanged; remote equality is verified after push.

Retained check logs: [initial export mismatch](calendar-pattern-038/type-initial.txt), [intermediate type mismatch](calendar-pattern-038/type-focused.txt), [final typecheck](calendar-pattern-038/type-final.txt), [lint](calendar-pattern-038/lint-final.txt), [build](calendar-pattern-038/build-final.txt), [final repository check](calendar-pattern-038/repo-delivery.txt), [session stability](calendar-pattern-038/session-final.txt), [clean installation](calendar-pattern-038/npm-ci.txt), [dependency security](calendar-pattern-038/security-final.txt). Text extension intentionally keeps these receipts in Git under the existing ignored-log policy.
