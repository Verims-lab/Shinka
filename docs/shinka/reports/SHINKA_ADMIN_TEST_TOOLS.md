# Admin Test Tools — Buildmarker-013 / HC-013.0

**Current continuation: Buildmarker-014 / HC-014.0.** Original 013 tests below are historical. Live read-only schema/import checks, rollout tooling and architecture approval are documented in the final section; production mutations remain blocked.

Source: explicit user request of 2026-10-20, attachment `661dae77-aa35-4480-a183-4e6ccad217b8/Pasted text.txt`. These workflows are additions to the original product sources. Normal self-service **Delete Account → INACTIVE** is unchanged.

**Delivery status:** repository UI, read-only SDK lookup/preview, lifecycle guards and isolated executable delete/reset protocols. **Production delete/reset remain BLOCKED_NO_DURABLE_TARGET_COORDINATOR.** There is no production journal/transaction adapter. No real user was deleted or reset, no schema deployed, no main merge/publish performed.

## Interface and authority

Profile/You → Admin Panel → Test Tools (`/internal/test-tools`). Health and Build remain available. Enter an exact User ID, fetch the target, select one of two tools and inspect its scope. Only ID, current role/account status, operation metadata and row counts are returned. No email/name is needed to identify an exact ID, so none is fetched or displayed.

The backend authenticates every lookup, preview, execute, status and resume with the existing internal-admin guard, rereads the actual User role, keeps actor and target distinct, rejects unknown payload fields and rechecks actor/target under the required coordinator. The client cannot choose entity names, impersonate roles, supply a server environment or directly access service-role data.

The preview displays SDK `getConfig().appId` and server origin. Its separate TEST/PREVIEW label and exact-app allowlist must come from backend configuration. Neither a branch nor the Base44 Preview frame proves database isolation. A five-minute HMAC confirmation binds actor, target, operation, destination app and the scoped metadata fingerprint. Typed ID must exactly match. Data/role/state changes are checked again; new operations require fresh preview, while a started partial job resumes its original authorized receipt.

Server secret names are `ADMIN_TEST_TOOLS_APP_ID`, `ADMIN_TEST_TOOLS_ENVIRONMENT` (TEST or PREVIEW) and `ADMIN_TEST_TOOLS_PREVIEW_KEY` (at least 32 characters, strong random secret). **Configuring these does not enable mutations.** The entry supplies no coordinator; the separate capability blocker remains unconditional.

## Exact deletion and retention scope

| Entity | Admin test delete | Admin onboarding reset |
|---|---|---|
| Base44 User | Physically delete from this app after cleanup; verify absent | Keep ID, role and provider connection |
| user_profile | Remove | Keep; later normal validated profile submission may update |
| user_preferences | Remove | Keep; normal initialization only if missing |
| user_cycle_settings | Remove | Keep |
| user_period_record | Remove | Keep |
| user_cycle_prediction | Remove before referenced periods | Keep |
| user_cycle_phase_day | Remove before referenced periods | Keep |
| user_pattern_summary | Remove | Keep |
| notification_delivery | PENDING/FAILED → SKIPPED with safe reason; keep all history, attempt metadata and sent/skipped records | Keep |
| user_health_consent | Keep minimal current consent metadata; no fabricated withdrawal | Keep state/version/business times |
| user_health_consent_event | Keep immutable history | Keep |
| user_daily_message | Keep immutable snapshots, Pair and local-day identity | Keep; reuse the same day's verified record |
| admin_audit_log | Keep existing history; append operation result/failure metadata | Keep; append restart audit |
| health_data_deletion_job | Keep protection history; any open job prevents operation | Keep; open job prevents reset |
| data_protection_event | Keep | Keep |
| system_error_log | Keep; has no trustworthy target-owner field to delete by | Keep |
| cycle_phase_lookup | Untouched shared reference | Untouched |
| message_category_lookup | Untouched shared content | Untouched |
| message_category_mapping | Untouched shared content | Untouched |
| message_pair | Untouched shared content | Untouched |
| moon_phase_lookup | Untouched shared reference | Untouched |
| InternalHealthRun | Untouched tooling history | Untouched |
| AdminTestOperation | Preserve job/checkpoints/result and permanent deletion tombstone | Preserve durable progress and completed history |

The operation never says “all data deleted.” Retained historical owner/admin/target IDs remain identifiers of the former app User; they are never reassigned or cascade-deleted. A same-ID recreation remains denied by the tombstone. The behavior of a later provider sign-in allocating a different app User ID is a separate platform acceptance question; no provider account deletion or immediate token revocation is claimed.

Ownership is derived from the canonical relationships, not an arbitrary `user_id` search:

* Every owned scope is queried for the exact target and revalidated per row.
* Prediction and phase-day → period references, notification → daily-message references and health-deletion-job → protection-event references are checked in both directions. Missing parents or cross-owner children stop the operation; foreign records are never repaired/deleted.
* Audit uses target/admin ID predicates and is retained. Shared category/Pair references remain untouched because neither parent nor daily snapshot is removed.
* SDK 0.8.54 positional filter pagination requests 100 rows per page, deterministic ID sort and explicit metadata fields. Duplicate pages, unexpected owners or a scope exceeding the 20,000-row per-query safety bound fail closed. No truncation is reported as complete. Cleanup reads IDs before removing a shrinking collection and confirms zero remaining target rows.

## Durable operation and recovery contract

`AdminTestOperation` is internal tooling, outside the unchanged 20 product schemas. Direct SDK CRUD is denied. It holds actor/target/operation/request identity, preview hash, server UTC started_at/progressed_at/completed_at business times, status, stage/checkpoints and a safe error code. No normal form payload or health value is persisted there. Existing `AdminAuditLog` fields represent results with `target_entity=AdminTestOperation`, `target_record_id=operation_id`, target/actor IDs and DELETE/UPDATE, SUCCESS/FAILED. Initial RUNNING job is the mandatory durable start record.

The required `shinka.target-lifecycle/1` coordinator must supply all of:

1. Durable uniqueness of operation/request identity and atomic target exclusion across workers, including mutual exclusion of reset/delete.
2. Admin-roster exclusion for concurrent role/removal operations; current actor and last-admin predicates rechecked under it.
3. A fence honored by **every** onboarding, daily, Calendar and future background writer throughout a deletion, not merely a preflight read. Existing in-flight writes must drain or be rejected by the fence. No timeout may release an unresolved destructive job.
4. `journal.begin` persisted and independently read back before the first destructive call. Immutable actor/target/operation/request/start identity; idempotent checkpoints; terminal status cannot regress.
5. Atomic result audit + job status, with readback. A lost acknowledgement is reconciled before appending a failure or regressing status. Unknown results remain unconfirmed, not successful.
6. Reset step transactions committing the normal validated persistence changes, next stage and request receipt together. Stage receipts bind an exact request fingerprint but store no health/form payload. Replays return the saved result without repeating writes.

The production SDK repository implements the narrow read/cleanup methods; the executor implements ordering and readback. **No adapter establishing the coordinator guarantees above exists in this repository.** The shared-store fixture models them in memory for tests; its queue is not a distributed lock, native transaction, rollback guarantee or restart-persistent production storage.

Delete progression: NOTIFICATIONS → phase days → predictions → settings → periods → pattern → preferences → profile → USER → VERIFY → final audit/status. A checkpoint failure can follow an actual deletion; resume rereads remaining rows and continues without restoring or recreating data. An absent User during retry is valid only for the same already-started delete job. Protected history is not part of cleanup. Failure to record a result returns an unconfirmed/retry code; completed side effects are not described as rolled back.

After a response loss, use the displayed request/operation ID to check status. A fresh lookup of the original target also returns an unresolved job or deletion tombstone even if User has already gone. Resume is restricted to the original authenticated actor; a different admin may inspect status but cannot substitute a new approval. Never manually clear the fence, delete job rows, recreate User, delete protected history or restart with a new operation ID to “repair” a partial operation. If the original actor no longer exists/is admin, recovery needs an explicitly designed privileged recovery procedure; it is not silently bypassed.

## Reset behavior

The reset itself writes no profile/cycle/consent/daily data. RESET_ACTIVE/PROFILE overrides historical daily completion. The existing authenticated session continues at ON-04 with its existing form values; no forced OAuth or second identity. The durable stage is read on hydration, login and another device:

* PROFILE: normal backend profile validation and a transaction-bound persistence adapter; an existing ready profile is not a shortcut around reset.
* CYCLE: normal consent/date rules. Skip changes only progress. It does not erase cycle history or grant/withdraw consent. Existing grants retain their original business time; a withdrawn grant cannot be silently resurrected. A new health write still needs the normal explicit-consent workflow.
* FIRST_SHINKA: verify profile and successful daily readback; reuse an existing same-day immutable snapshot. Only verified completion closes the reset. New daily creation remains subject to the existing production atomic/content prerequisites.

INACTIVE accounts and open health-deletion jobs cannot enter/reset-step commit. The coordinator must recheck these predicates inside every transaction. Initialization also goes through this boundary when reset is active. Calendar cannot bypass the reset through a direct endpoint. Self-admin reset preserves role and the existing Admin Panel access.

## Platform evidence and limits

Installed and function-pinned SDK: **0.8.54**. Current official [entities/User documentation](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities) allows service-role User deletion and documents `delete(id)`. The implementation uses that method; it does not invent a user-delete endpoint or cascade. The [schema documentation](https://docs.base44.com/developers/backend/resources/entities/entity-schemas) does not establish the multi-entity coordination needed here.

All hosted function entry factories now apply current-User/role and deletion-state admission checks. A deleted User's old token cannot create fresh application records through those guarded paths in isolated tests. The check is deliberately described as admission only: a request that passed before a delete still needs the shared fence. Direct product RLS, deployed entry versions, physical User deletion, actual old-token behavior and worker crash/retry remain unverified live.

## Rollout and acceptance

1. User merges Test and syncs/publishes through the established workflow. Deploy the new denied-CRUD `AdminTestOperation` schema before lifecycle-aware functions; missing schema/read failure fails closed and can deny existing authenticated operations. Verify this ordering in the deployment environment.
2. Open Profile/You → Admin Panel → Test Tools. Verify actual app ID/server, fetch an explicitly chosen test User ID, inspect both previews and cancel. Existing Health/Build must still open. Normal/anonymous direct function and route requests must be denied.
3. At this delivery, execute stays disabled with the durable-capability explanation. **Do not treat a secret/configuration change as resolution.** Implement and verify the coordinator/all-writer integration before proceeding with destructive acceptance.
4. After capability closure, choose a disposable target explicitly. For delete: retain before-counts/IDs only, inspect scope, type ID, execute, reopen status. Confirm User and seven operational scopes absent, pending jobs stopped, immutable/current-consent/protection/audit/shared records preserved, and old authenticated requests denied. Test partial failure and same-operation recovery on isolated live test data with two workers.
5. For reset: choose an ACTIVE target without open deletion work, including a self-admin case. Confirm unchanged User/provider/role and retained records. Refresh/sign in from another device: ON-04 must appear despite old daily rows. Submit valid data, exercise Skip without consent writes, finish ON-06 and confirm the same day's daily ID/Pair/snapshots are unchanged and reset is COMPLETED. Test failed step commit/response loss and retry without duplication.
6. Run current **014 / HC-014.0** Full Health, save/list/open its report. H12-031 stays BLOCKED until proven; H12-902 is separately recorded live acceptance. Existing daily/Calendar capability blockers, ON-05 same-account live closure and physical-device obligations are independent. OD-012 is resolved and behaviorally verified by the 014 continuation; it does not close these production blockers.

## Test and Health reconciliation

AT01…AT16 cover authorization, metadata privacy, preview binding/staleness, current actor, self/last-admin guards, multi-page ownership/indirect references, audit failure, partial deletion/acknowledgement loss, two fixture workers, stale tokens, reset persistence/normal validation/Skip, daily reuse and inactive/deletion/consent preservation. AU01…AU04 exercise actual components in TR/EN, 320px layout, ≥44px controls, preview/cancel focus, stale responses and duplicate-submit refusal. CLI adds four actual-App 360/1280 TR/EN lookup/preview/cancel scenarios, with no product writes.

Health add: H12-028/029/030, H13-016 (current synthetic); H12-031 (current BLOCKED); H12-902 (external). Update H13-014/AN01/AN08 to three tools; H04/D02/tooling evidence to two internal schemas; H05/HC12 to approved staged package 013. No case/suite removed or downgraded. Current catalog: 149 cases, 130 current, 7 future, 12 external, 16 suites.

Final local result: Chromium 156.0.8078.4 and WebKit 27.2 each passed 396 canonical tests and 93 local Health cases, with zero page errors. Clean install/tree, type/lint/build, Repo Health and bounded history passed. Fresh npm audit is BLOCKED_TLS_CERTIFICATE_CHAIN, including with system CA enabled; current vulnerability totals are unknown and TLS checks stayed enabled. No dependencies changed. Measurements are in [verification.json](test-tools-013/verification.json) and Development Notes. These results do not close the production coordinator, live acceptance or security scan.


## 014 continuation: actual prerequisites and rollout

Live Data UI now lists AdminTestOperation (0). A successful privileged official-CLI read confirms schema availability; no operation was created. `contentLibrary.verify` and `moonDryRun` execute live and report missing content/Moon data. This is not proof of independent-user RLS, deletion/reset, distributed fencing or a published function commit. Preview identifies main 29a64d3 and prod data; public deployment hash is not independently measured.

AT17 adds missing-schema fail-closed checks for onboarding/daily/admin and additive-schema recovery without product changes; H12-028 executes it. Original two-worker/partial-write tests remain isolated models. No new speculative coordinator is supplied. H12-031 and explicit-target H12-902 remain open.

[Rollout 014](SHINKA_RELEASE_ROLLOUT_014.md) replaces the former unverified “schema first” instruction with a generated 23-schema inventory, schema-only Git delta, tested pre-013/current-main preparation, official CLI read-only script, and full-sync repair warning/steps. The observed app already has the schema, so no repair was run. Missing schema never bypasses admission. No live delete/reset, main merge or publish occurred.

[Decision 014](SHINKA_PERSISTENCE_DECISION_014.md) distinguishes transactional reset from resumable physical deletion across SQL/Base44, defines authority/fencing/audit/identity/roster/migration/recovery, and requests approval/resources for the external design. This is pending approval, not implementation. Security scan now completes with 0 Critical/High and 2 Moderate; the prior 013 TLS result remains historical.
