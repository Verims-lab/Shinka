# Test Tools deletion stabilization — 040

**Status: LOCAL_VERIFIED / HOSTED_CLEANUP_PENDING**

Buildmarker-040 / HC-040.0, 2026-10-27. Audit 039 is preserved. Test delivery only; main merge/publish belong to the owner. No hosted user mutation, inventory, import, Full Health, security scan, scheduler or notification action occurred. Physical Android/iOS acceptance is NOT_RUN.

## Proven cause and fix

The old eight-second work budget excluded admission, guarded stage-checkpoint writes, audit and response verification. Each stage wrote metadata individually; retries rescanned completed stages. Those costs could exceed the unchanged 30-second browser service deadline while backend work continued. The failure is reproducible through the actual service → HTTP handler → native operation/repository/journal/readback, with only platform SDK IO substituted.

A real wall-timer experiment added **400ms to each SDK call**, including genuinely overlapping calls. Old source `8951c6d871e2adc493ab182fea182b6437fa0431` returned **TEST_TOOLS_TIMEOUT at 30,002.7ms**, while its first backend pass eventually returned PARTIAL at **38,599.9ms** (114 entity reads, 4 writes, 13 auth calls). The revised source acknowledged persisted START/PARTIAL at **27,356.0ms** (80 reads, 2 writes, 9 auth calls). This experiment covers first admission, one sample per revision; it is not a hosted latency percentile or proof of a particular production incident. [Before](deletion-040/wall-before.json), [after](deletion-040/wall-after.json).

The correction stays within existing responsibilities:

- `testDeletionPass` owns invocation-local work accounting and safe progress. The eight-second between-work and 100 data-write-attempt limits remain; journal/audit writes are separately observable overhead. An SDK request already in flight is not forcibly cancelled.
- Execution durably acknowledges receipt/start audit before deletion, then uses forward checkpoints and one merged, readback-verified checkpoint per cleanup pass. Shrinking pages always start at offset zero. VERIFY checkpoint and final audit/COMPLETED write are separate acknowledged passes.
- Finalization and every completed-result response reread active User and the full deletion manifest. Residuals reopen the **same** receipt at the earliest affected stage. Contradictory journals fail closed. No direct DB bypass, bulk journal cleanup, CAS, rollback or distributed lock was introduced.
- Every native mutation retains fresh pre/post actor/target guards. Missing target User now still checks open privacy/health deletion jobs. Another admin can inspect a receipt but no longer receives misleading resume permission.
- UI auto-continuation requires acknowledged progress, same ID and server permission. The existing 12-pass/60-second UI limit and 1.5-second pacing remain. Unknown responses trigger only bounded status reads. No-progress stops with stage/reason and one explicit recovery action. Account/session/unmount invalidation suppresses future UI work; it does not claim to cancel dispatched backend work.
- Service responses must match requested target/operation. TR success is exactly **“Kullanıcı silindi.”**; retention is a separate explanation. Old target identity is cleared, including after reload/status. Transient failures do not log out the admin.

The new latency regression fails old source, and the foreign-actor recovery regression also fails old source. Stale COMPLETED/read-error protection already existed and remains a regression, not a newly invented defect. No live trace was retrieved: the specific current hosted root cause remains unconfirmed.

## Why older tests missed it

Most native fixtures completed SDK calls immediately. Older UI tests returned fixed outcomes or called the operation directly. They checked final safety but did not combine real service deadline, full HTTP admission, guarded metadata cost and a delayed native store. The prior slow-checkpoint fixture also expected repeated completed-stage scans. It now requires each completed stage to be visited once before final full verification.

Historical tests that assumed one-call completion were adapted to explicit START/cleanup/verification/finalization passes. Their absence, residual, retention, failure-stage, same-ID and authorization assertions remain. The 160-read partial-resume check remains; completion is now a separate call. No Health case or failure evidence was removed.

## Regression and Health evidence

| New ID | Actual coverage | Health |
|---|---|---|
| DX01 | Controlled serial SDK-cost clock; existing 30s service window, same receipt, protected actor, complete progression | New H12-043 |
| DX02/03 | Foreign actor denied resume; stale COMPLETED/restored User; readonly 404/429/5xx never count as absence | H12-029 |
| DX04 | 205 periods, shrinking pages, 100 data-write bound, all protected actor business rows/shared content/retained target history unchanged | H12-043 |
| DX05 | Before-write failure and lost acknowledgement at notification, every operational entity, calendar receipt and User stage | H12-029 |
| DX06 | Before/after receipt create, start audit, checkpoint, final audit and terminal update; same ID and exact-audit deduplication | H12-029 |
| DX07/10 | Concurrent resumes/status and competing admissions; ambiguous native receipts block without destructive cleanup | H12-029 |
| DX08/09 | Missing User with open jobs; target writer fence; wrong target/role loss; VERIFY read failure and earlier-stage residual rewind | H12-029 |
| DXU01–04 | Actual component → service → HTTP/native chain; delayed passes, doubleclick, reload, unmount/account invalidation, actual service timeout/late acknowledgement, mismatched response and zero-progress stop | H13-016, LOCAL_BROWSER only |

`verifyTestDeletionEntry.mjs` additionally executes the real `adminTestTools/entry.ts`, replacing platform imports only: real handler, signer, lifecycle, native repository/journal, service response and safe diagnostics. Existing NA/AT/AD/CL/E/RM/AU/TP/CQ checks remain in both complete runs. Ordinary Health uses isolated fixtures and never deletes real users.

HC-040.0: **+1 / update 3 / delete 0**. H12-043 adds independent pass-budget/progress coverage; H12-029 is strengthened, H13-016 maps the new heavy UI tests, H12-902 remains external controlled-target acceptance. The closed backend plan and execution-scope registry match: **177 total / 151 in-app / 12 local / 14 external**.

| Final gate | Result |
|---|---|
| Chromium 156.0.8078.4 | **707 unique / 707 PASS**, 0 failures/page errors |
| WebKit 27.2 | **707 unique / 707 PASS**, 0 failures/page errors |
| Local in-app Health, each engine | **138 PASS / 0 FAIL / 13 BLOCKED**; saved, listed and private report reopened |
| Node/real entries/server | Existing 9 session checks, native routes, 8 security checks, disabled notification entry/secret tests and new actual deletion entry pass |
| Locked install/tree/dependency audit | `npm ci`, `npm ls --all`, audit/security gate pass; **0 advisories**, lock unchanged |
| Typecheck/lint/build/Repo Health/history | All exit 0; 20 product + 6 internal schemas unchanged; five active packages 036–040 |
| Production performance/import graph | JS **484,085 raw / 161,027 gzip** below 500,000/165,000; CSS **77,728 / 14,239** below 90,000/16,000; no import cycles; nine-route local lab passes |

The 13 local BLOCKED IDs are H04-019, H05-001–009, H08-005, H09-004 and H12-031: unavailable hosted/reference-data prerequisites, not live failures or fabricated PASS. The 14 external acceptances remain separate. Full outputs and per-case mappings: [verification](deletion-040/verification.json), [Chromium](deletion-040/chromium-results.json), [WebKit](deletion-040/webkit-results.json), [Chromium case audit](deletion-040/chromium-case-audit.md), [WebKit case audit](deletion-040/webkit-case-audit.md).

Final executable/config/harness snapshot: **534 files**, SHA-256 **3518aca371e050864589ded36b824e87b50f00d62bf1e2f46d7c69ca466b4455**, [tested-source.json](deletion-040/tested-source.json). Rechecked after final runs without source changes. Document-only completion receipts are excluded. No result from 039 is reused as 040 execution.

Initial evidence remains in [initial-failures](deletion-040/initial-failures/before-regressions.txt): old DX01/02 failures; first fix still overran combined finalization; final-status progress initially omitted terminal advancement; UI fixtures initially observed pre-commit DOM/non-DOM promise changes incorrectly; eight older tests assumed one-call completion; scoped callback inference failed typecheck. These were corrected, not hidden or relabeled as passing evidence. Existing npm unknown `min-release-age-exclude` and Vite static/dynamic-import warnings remain non-failing; no enforcement is attributed to that npm key.

## Pass measurements and limits

The deterministic comparison below uses the same instrument on both revisions. “300ms” is a **serial SDK-cost virtual clock**, including all nested guard calls; it is not wall time or an assumption about Base44 parallel scheduling. The separate real wall-timer experiment above validates an actual timeout with overlapping promises. Zero-latency durations are intentionally zero and are not performance claims.

| Synthetic scenario | Passes before → after | Entity reads | Writes including metadata | auth.me |
|---|---:|---:|---:|---:|
| No periods, existing profile/preferences | 1 → 3 | 328 → 284 | 17 → 8 | 39 → 31 |
| Same, 300ms serial SDK cost | 7 → 4 | 567 → 334 | 17 → 9 | 69 → 38 |
| 205 periods | 3 → 5 | 3547 → 3478 | 225 → 215 | 465 → 455 |

New 300ms-model pass durations: **24,600 / 28,200 / 23,700 / 26,400ms**. Checkpoint progression: START → 8 stages → VERIFY → COMPLETED. Each acknowledged pass has durable progress; all work limits and same-operation binding remain. Larger page fixtures and injected interruptions complete under explicit continuation. More extreme provider latency may still exceed the service deadline; the UI must remain unknown until fresh readback, not automatically start another deletion.

[Before](deletion-040/before-measurements.json) and [after](deletion-040/after-measurements.json) retain per-pass operation ID, stage, processed/known-minimum remaining, checkpoints, elapsed/work duration, reads/writes/auth and result. NULL remaining means uncounted, not zero; exact zero appears only after verified completion. Safe metadata only. Reproduce with `node scripts/measureTestDeletion.mjs [archived-source-directory]`, or add `--wall` for the actual timer experiment; the archived checkout needs the same locked dependencies.

## Hosted cleanup — NOT_RUN / PENDING

The request's cleanup authorization remains valid. No second deletion consent is required after publication. The CLI authentication check returned “You need to login first”; its device flow was stopped. No native user identity, SDK environment or deployed-source match was inferred from local config, Git Test or Preview. The task used no remote fallback or direct data deletion.

| Required evidence | Current state |
|---|---|
| Matching published backend/shared/frontend | **NOT_VERIFIED**; owner 040 merge/sync/publish required |
| Actual SDK app/data area | **NOT_VERIFIED**; authenticated readonly access required |
| Unique exact protected native User/current admin/session | **NOT_RUN** |
| Paginated initial User + old-operation inventory, frozen target list | **NOT_RUN**; initial target count unknown |
| Controlled first target, then sequential remaining targets | **NOT_RUN**; no targets attempted/completed/failed; pending count unknown |
| Protected identity/role/profile/consent/cycle/daily before/after | **NOT_RUN** |
| Final active User count and per-target residual/pending-job proof | **NOT_RUN**; final count unknown |

Publication and access steps:

1. In GitHub `Verims-lab/Shinka`, review **Test → main** and merge using the owner's existing flow. This agent did not merge or publish.
2. In the existing Shinka Base44 app, wait for **“Synced commits from GitHub”** to include this package. Review `src/foundation/buildMarker.js`, HC constants/plan and the **whole matching native entry/shared graph**, including `adminTestTools`, `applicationSession`, execution, repository, journal, progress and frontend service/hook. Then use **Publish**. No entities push, schema change, import or new secret is required. A frontend-only publication or marker check is insufficient.
3. In the repository terminal, run **`npx base44 login`** and complete the browser login without sharing credentials. Make the request-designated protected admin's application session available. The [CLI skill](../../../.agents/skills/base44-cli/SKILL.md) requires authentication before further CLI operations; it explicitly says “DO NOT proceed with any CLI operations” when unauthenticated.
4. Continue this same task. First compare exported/published sources against the tested manifest and verify the actual SDK target. Then resolve the exact protected email from the private request to one native ID/current admin, freeze the paginated initial target list excluding that ID, and inspect existing operations. Do not auto-add newly created accounts.
5. Run one target through the application's preview/execute/status/resume flow; verify fresh User absence, manifest residuals and pending jobs, then compare the protected account. Only then proceed sequentially. Conflicts/unexpected effects stop subsequent targets. Existing valid receipts keep their ID; another actor's receipt requires the initiating authorized session rather than reassignment or journal deletion.
6. Finish with a full active User enumeration and each frozen target's ID-specific absence/residual check. Report actual completed/failed/pending counts and protected before/after comparison. Until then, hosted deletion is not accepted as closed.

Canonical retention remains: consent/events, daily snapshots, stopped notification history, audit/protection/closed health jobs and the operation tombstone. Shared categories/content/Moon, schemas/configuration, Health history and protected account data remain. Native User removal is distinct from Base44 Recently deleted/permanent platform erasure; no backup/provider purge or real old-token revocation was verified. Official references checked 2026-10-27: [User entity SDK contract](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities), [Managing access](https://docs.base44.com/Setting-up-your-app/Managing-access).
