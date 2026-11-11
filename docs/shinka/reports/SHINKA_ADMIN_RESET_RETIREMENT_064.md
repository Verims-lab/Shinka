# Shinka — selected-user removal and admin reset retirement (064)

Date: 2026-11-11. Buildmarker-064 / HC-063.0. Test-only delivery; no main merge or publication.

## Live outcome — removal remains BLOCKED

Existing open Base44/Shinka admin sessions were used. Published frontend displayed Buildmarker-063; Base44 Main showed its last publication 14 hours earlier. A fresh native backend `adminTestTools` preview verified the actual configured app `6ad5190f4845d4e3af03b420` / TEST label. This label does **not** establish an isolated database. The editor/marker observations are not a complete deployed graph/hash attestation.

The full visible AdminTestOperation inventory contained nine rows: two RESET_ACTIVE/PROFILE, one completed reset, six completed deletions. Exactly the two active reset targets match the user's two IDs. Neither target had a deletion operation. Lookup and sequential DELETE_USER previews read current identity and paginated impact metadata. Both previews returned HTTP200 with `enabled:false`, `preview_token:null`, `TEST_TARGET_BUSY`; HTTP200 is not deletion success.

| User ID | Native User | In-scope active application records | Operation/readback | Permanent platform erasure | Next step |
|---|---|---|---|---|---|
| `6ae21e3dc1f2cace93d02f81` | Present, ACTIVE, admin | 3: profile 1, preferences 1, Calendar action 1 | Existing reset `41b04918-268c-49a2-bd03-9e1d0503d7b1`, RESET_ACTIVE/PROFILE; no deletion started | Not performed/verified | Existing owner finishes saved onboarding steps; verify same reset DONE/COMPLETED, then a fresh removal preview |
| `6aeae548a7d69cf5b3b032d1` | Present, ACTIVE, admin | 3: profile 1, preferences 1, period 1 | Existing reset `8375d249-3d66-4879-915a-927605b88b9e`, RESET_ACTIVE/PROFILE; no deletion started | Not performed/verified | Same guarded transition in this owner's session; then fresh removal preview |

Counts exclude native User and retained history. Retention is unchanged: consent/event, daily assignments, stopped notification history, audit/protection/deletion evidence and shared reference content are not indiscriminately removed. Current preview counts and limitations: [live-readonly.json](admin-reset-retirement-064/live-readonly.json).

Protected `6ad519134845d4e3af03b423` mapped freshly to sariverim and was ACTIVE/admin. The Base44 acting owner UI showed Verim Sarı; both target previews had no self-delete/last-admin blocker. No live execute, resume, reset, entity edit/delete, purge, Full Health or Security scan was sent. This task made **zero live writes**. No claim is made about unrelated concurrent activity.

Base44 App Users → More actions → Recently deleted exposes separate Restore / Permanently delete controls. It contained older same-email rows, without native-ID evidence sufficient to identify these current targets. No restore/purge was attempted. Active records and platform permanent erasure are separate outcomes; neither selected removal is complete. The concrete blocker was reported before independent implementation began.

## Removed feature and deliberately retained compatibility

- Only DELETE_USER remains in the new-command allowlist and Test Tools catalog. Reset card/help/confirmation branch, reset submit state and action copy are removed.
- Shared request validation rejects RESET_ONBOARDING preview/execute with `TEST_RESET_RETIRED` / 410. Both admin adapters reject resume of an old reset before any write; the shared executor also refuses before journal.begin. Existing auth/actor denials remain earlier where applicable.
- Legacy operation parsing, statuses/stages, schema enums, fingerprints and lifecycle fences remain. Lookup/status explicitly return `resume_enabled:false` for reset. The UI shows a localized legacy notice and status read only; even RUNNING/RETRY_REQUIRED cannot expose reset Resume.
- A fresh lookup without an active job clears the browser's obsolete pending ID. A later deletion receives a new ID instead of accidentally reusing a completed reset's ID. Existing active deletion recovery keeps its original ID; AU04 verifies both the new deletion and unchanged old receipt.
- Two observed live RESET_ACTIVE receipts justify keeping the existing owner-only `nativeResetStep` and route mapping. Ordinary owner save/readback advances the **same** receipt; it does not create/restart/reset. Normal validation, intent fingerprints, consent/history, same-day reuse and lifecycle checks remain. Other unfinished legacy statuses remain fenced for explicit review. No automatic completion, journal deletion, actor takeover or replacement operation was introduced.
- Normal auth-first new/partial/completed/NULL-name onboarding, Account & Privacy, deletion, current manual theme and 063/062 UI work remain intact. No new schema, dependency or architecture layer.

## Health and verification

Health: **0 added / 8 updated / 1 retired**. H12-030 is retired with its removed reset-feature purpose; retained existing-receipt continuation is covered by H12-033 (NA18/NA19). Updated H12-028 (AT18), H12-033, H13-016 (AU04), H04-019/H08-005/H09-004/H12-031 (strict readiness v3), H05-009 (064 metadata only). Catalog 185 = 159 in-app + 12 local-only + 14 external. Backend plan and serialized localRegressionRequirements match. Old reports are not rewritten.

AT12/AT14/NA17 reset-creation regressions are retired; AT18 checks both admin adapters across RUNNING/RETRY_REQUIRED/AUDIT_PENDING/RESET_ACTIVE/COMPLETED, no writes, readable history and lifecycle refusal. Shared old-receipt fixtures replace calls to the retired writer; assertions remain. Real TS entry separately checks preview/execute/resume → 410, unchanged tables, zero mutations, and readable status. Existing deletion double-submit, cancel, paging, interruption, same-ID resume, auth/revocation and account/session tests remain.

Execution and actual final outcomes are recorded in [execution.json](admin-reset-retirement-064/execution.json). Chromium and WebKit each passed **803/803** with zero page errors; each real-App Test Tools matrix passed four TR/EN × 360/1280px scenarios. The actual TS entry's 14 checks include retired reset preview/execute/resume → 410 with zero writes. Local synthetic Health is **146 PASS / 13 hosted-prerequisite BLOCKED / 0 FAIL**; save/retry/list/open passed. These local BLOCKED results do not replace or invalidate historical hosted reports.

`npm ci`, `npm ls --all`, typecheck, lint, build, all 19 repository Health checks, generated last-five history and dependency security passed (0 advisories). Performance gate passed: production initial JS 491,758 raw / 163,966 gzip bytes; CSS 82,981 / 15,873 bytes. Nine local routes × three cold-context samples used stubbed SDK and blocked external requests; these are not real-user latency or field Core Web Vitals acceptance. No new runtime dependency or business schema was introduced.

Initial attempts remain recorded: intermediate JSX typo caught/fixed by typecheck; initial browser attempt NOT_RUN due to sandbox loopback `EPERM`, followed by permitted local execution. Initial repo Health/full Chromium caught T21 because the new fixture filename matched the legacy-source firewall (802 PASS / 1 FAIL). Renaming the fixture fixed the source violation without relaxing the rule; final full runs passed. A focused Chromium run also passed 37/37. Existing npm config/dynamic-import warnings were non-fatal. No hosted Full Health, real provider login or physical-device success is claimed.

## Publication and outstanding removal

1. Owner merges Test into main and syncs the matching backend/shared/frontend through the existing Base44 workflow. Include adminTestTools, all shared native entry consumers and internalHealth; then publish frontend. No entity schema push, import or cleanup. Readiness is now `BASE44_NATIVE_V1`, `native-continuation/3`, reset `LEGACY_PROGRESS_ONLY`; `hostedMutationVerified:false` is preserved.
2. Until publication, the old reset button may remain visible. After publication, old reset preview/execute/resume requests must be rejected; this is a publication acceptance item, not yet live-tested.
3. For the two pending removals, each owner completes their **existing** onboarding progress in their own session. Re-read the same reset ID to confirm DONE/COMPLETED before a fresh guarded deletion preview. Do not alter/delete the receipt to unlock it. No new reset is required or available. If a legacy state cannot complete, preserve it and review that concrete failure rather than bypassing the fence.
4. Only after actual guarded deletion and fresh full-scope residual/native absence verification can removal be called complete. Platform Recently deleted/permanent erasure remains separately scoped and verified.

Active Internal Build contains 060–064. User-owned `app-store-screenshots/` and zip are outside this commit. Start-of-task main/Test integration was a lossless fast-forward to `c10fcdd`; main was not modified.
