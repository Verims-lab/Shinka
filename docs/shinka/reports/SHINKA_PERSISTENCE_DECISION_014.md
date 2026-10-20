# Production persistence decision — Buildmarker-014

> **SUPERSEDED_BY_BUILDMARKER_016:** Historical decision/implementation evidence only. The user replaced the SQL direction with Base44 continuation and confirmed no SQL setup or transfer. Do not execute the setup/migration instructions below. See [current continuation](../SHINKA_BASE44_CONTINUATION.md).

Status: **APPROVED_FOR_ISOLATED_TEST — 2026-10-20 user decision; implementation in 015**. Supabase Free, proposed shinka-test, Frankfurt eu-central-1, 0 USD maximum authorized spend. Base44 auth/OAuth/User IDs preserved; PostgreSQL sole product/admin authority; no dual write or legacy fallback. Account/org access pending; no hosted provisioning or real-data migration performed. Production remains unapproved.

Implementation refinement: the existing Base44 server function owns both verified native identity and the SQL transaction, connecting directly via the Supabase transaction pooler. This removes the proposed separate gateway/signature service without weakening the server-only boundary. SQL application-admin bootstrap/last-admin/revocation and local real-PG recovery are implemented in 015; hosted runtime/pooler/native identity acceptance remains open. [015 implementation and Production proposal](SHINKA_POSTGRESQL_TEST_015.md) is the current handoff. The remaining sections preserve the original alternatives/rationale; requests for architecture approval below are historical, while Production migration/budget/window approval is still required.

## Current implementation and evidence

| Feature | UI / business logic | Production persistence / real entry | Missing requirement | Evidence |
|---|---|---|---|---|
| Home / ON-06 | Implemented, including OD-012 | `dailyMessage/entry.ts` supplies the real content inspector, **no atomic writer**; SDK existing-day reads work | Durable immutable `(user_id, shinka_date)` winner, authoritative access state; content and Moon preparation | Isolated daily tests; live Data UI shows all four reference tables empty. No live daily creation |
| Calendar | Implemented, including approved long-interval behavior | `calendar/entry.ts` supplies real SDK reader, **no transaction adapter** | One authoritative revision for actual starts, consent and derived display; durable request replay | Isolated CA/CR/CU tests; no hosted mutation |
| Admin reset/delete | UI, bounded SDK preview/cleanup and executor implemented | `adminTestTools/entry.ts` has policy/signer, **no coordinator/journal implementation** | Durable target/job exclusion honored by every writer, reset receipts, deletion recovery and admin-roster authority | Isolated AT/AU tests; live AdminTestOperation exists with 0 rows; no live reset/delete |

Preview observed on 2026-10-20 identifies commit `29a64d3c3d400090c1cd3081dcf54141de24e57b`, `functions_version=preview` and `base44_data_env=prod`. This is Preview evidence, not proof of the public published backend version. Branch/Preview is not data isolation.

## Required guarantee → capability → mechanism → evidence → boundary

Official references checked 2026-10-20; installed and function-pinned SDK 0.8.54:

| Guarantee | Available platform capability | Mechanism evaluated / selected | Evidence | Remaining limit |
|---|---|---|---|---|
| Home immutable first winner | Entity `create`, merging `upsert`, generated native ID | Current SDK cannot establish insert-if-absent by owner/day. Proposed SQL `UNIQUE(owner, day)`, insert conflict returns winner without update | [Entity schemas: uniqueness](https://docs.base44.com/developers/backend/resources/entities/entity-schemas#uniqueness), [SDK upsert](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities#upsert), installed entity types | Documentation explicitly excludes native UNIQUE; upsert updates matched fields. Re-read can detect a duplicate after creation but cannot prevent it |
| Calendar consistent publication | Independent Entity mutations | Proposed one transaction for authoritative period/consent/revision/receipt; derive phases from that committed snapshot | No transaction/CAS interface in installed Entity types; [SDK entities](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities) | Several SDK calls cannot publish one coherent revision; failure after period write leaves old caches |
| Reset progression | Entity row persistence | Proposed SQL operation + validated normal write + progress/receipt in one transaction | Existing source requires persistent progress; SDK row persistence alone does not arbitrate two writers | A separate stage write can advance without the product write, or replay it after response loss |
| Physical User deletion | Service-role `User.delete(id)` | Proposed durable saga: SQL fence/cleanup/outbox, Base44 User deletion, absence confirmation, final SQL audit/status | [User/entity access](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities) | SQL and Base44 are **two stores**; there is no joint transaction or rollback. Recovery must reconcile unknown outcomes |
| Target exclusion | Actor session identity/storage, Entity metadata | Actor option considered below; recommended shared SQL owner lock + persistent lifecycle state | [Actors overview](https://docs.base44.com/developers/backend/resources/actors/overview), [Actor storage/reference](https://docs.base44.com/developers/backend/resources/actors/reference) | Actor storage documents get/put/delete and idle survival; it does not document a transaction with Entity collections or the required conditional-write failure semantics |
| Schema-before-functions | Git sync on main, separate entity CLI push | Additive Git schema stage, read-only check, then code publish; full-schema repair only as explicit operator action | [GitHub sync](https://docs.base44.com/developers/app-code/local-development/github), [entities push](https://docs.base44.com/developers/references/cli/commands/entities-push) | Docs provide no atomic schema/function ordering. `entities push` is a **full sync**, removing remote schemas absent locally |

Counterexamples are material: two workers can both observe no daily row and both insert; keyed upsert may overwrite the earlier random Pair/snapshot; a Calendar failure between actual and derived writes exposes mismatched results; a deletion admission read cannot stop an onboarding request that already passed it. Worker-local queues and repeated reads narrow these windows but do not establish the required invariant.

This finding is limited to the reviewed public interfaces and installed runtime. It is not a claim that Base44 can never add a suitable guarantee. Written platform support for conditional create/CAS, serialization, crash recovery and cross-resource behavior could change the decision.

## Simpler models considered

1. **One Base44 aggregate per owner, derived phases computed on read.** This removes the need to transactionally update three Calendar collections. But initial singleton creation, concurrent aggregate replacement, durable action receipts and immutable Home winner still need conditional creation/update. Using the existing User ID removes one creation race but does not prove compare-and-set or prevent lost updates to the aggregate. Not enabled.
2. **One Base44 Actor as the entire owner authority.** This could avoid cross-Entity transactions only by moving authoritative owner state, consent, daily history, lifecycle and every writer into actor storage. Keeping Entity rows authoritative while merely adding an actor lock does not solve uncertain Entity writes. Reviewed storage APIs expose no conditional insert/transaction and do not specify the needed interleaving, crash/retry and retention guarantees; actor auth/transport and admin-roster coordination also need a design. The SDK skill states actors require hosted verification, not `base44 dev`. A user-approved platform proof experiment is an alternative investigation, not a ready production solution.
3. **SQL as the sole application authority, read-time Calendar derivation. Recommended.** Native unique constraints, transaction-scoped row locks and durable receipts provide explicit primitives. Keep Base44 for identity and hosting. Do not mirror each write into Base44 as a second authority. [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html), [row locks](https://www.postgresql.org/docs/current/explicit-locking.html).

## Proposed destination and exact ownership

Recommended deployment: user-owned **Supabase managed PostgreSQL**, in a user-approved region, with separate Test and production projects. Use PostgreSQL through a server-only gateway; do not add Supabase sign-in, browser table access or a second user identity. A managed PostgreSQL instance already owned by the user is an implementable alternative with the same schema/transaction model; it requires an HTTPS gateway/runtime, pool, backup and monitoring ownership.

* Base44 remains authoritative for OAuth provider identity and built-in `User.id`. Preserve IDs as text, scoped by Base44 app ID; never match users by email.
* PostgreSQL becomes authoritative for application profile/preferences/account status, consent/current history, periods/settings, immutable daily history, notification/protection/deletion/audit state, application admin membership and lifecycle operations. Retained owner IDs remain tombstones after User deletion.
* Import shared source content/Moon to PostgreSQL as versioned, verified reference data. Source workbooks and category decision remain authoritative definitions. There is no change to the 260 texts, 240 mappings or six names/codes.
* Calendar predictions/phases become reproducible projections of one committed period/settings revision and calculation-rule version. They need not be independently writable authoritative collections. Existing caches are checked/exported during migration, then discarded as stale caches only after approval; actual observations/history are never discarded.
* Base44 product Entity rows become a frozen migration source, then read-only archive under an agreed retention/deletion policy. No runtime fallback to them after cutover. `InternalHealthRun` can remain Base44 tooling; it cannot grant product access or coordinate transactions.
* AdminTestOperation and audit move to the same SQL transaction domain. Existing Base44 rows must be imported/verified before switching lifecycle authority; the current live observation of zero rows is not a future migration assumption.

This changes the physical data contract and needs the user's approval before provisioning or moving health data.

## Identity, authorization and transaction boundary

The browser continues using existing Base44 functions. A function validates `auth.me()` and current Base44 User existence; it forwards only an authenticated server assertion to the gateway over TLS. The assertion binds app ID, subject, request ID, action, payload digest, audience and a short expiry. The gateway rejects direct anonymous/browser calls, reused nonces with changed payload and unknown app identities. Service credentials/signing keys stay in backend secrets.

Application ACTIVE/consent/deletion/admin-membership authority is read and checked inside the **same PostgreSQL transaction** as writes. Every writer uses one gateway; no generic table write or old SDK path remains enabled after cutover. Connection pooling must keep BEGIN/COMMIT on one transaction connection, or expose a single bounded database function per operation; two HTTP requests are not a transaction. Supabase [database functions](https://supabase.com/docs/guides/database/functions) are an available implementation path; execute permissions and security-definer search path must be restricted.

The Base44 identity read and SQL transaction are not atomic together. SQL lifecycle tombstones deny old tokens even if Base44 identity removal is delayed. For last-admin guarantees, SQL application-admin membership becomes the transactional authorization roster; initial Base44 admins are explicitly imported. Base44 dashboard role changes must not independently grant destructive permission. A later role-management operation must use this roster. This is a deliberate authorization-model decision requiring approval, not a silently assumed synchronized role mirror.

## Implementation and opening order after approval

1. **Common authority first.** Migrate owner state/consent and all existing writer admission paths. SQL `owner(app_id,user_id)` primary key provides a lock row; one lock ordering covers owner and global admin-roster changes. Enable no lifecycle operation during mixed writer versions.
2. **Home first.** Lock/recheck owner state; use committed inputs and content version; insert immutable daily record with non-null unique `(app_id,user_id,local_day)`. Conflict returns the existing record. Select/validate in the same transaction snapshot (or bind an outside calculation to checked input revisions and retry on change). Grant withdrawal and daily insertion serialize on the same owner row. No daily update privilege. Return only after commit/readback. Admin mutation can remain disabled.
3. **Calendar next.** Lock owner; verify revision, access, neighbors and action fingerprint; persist actual starts/consent and new revision with receipt in one transaction. Compute response from that exact snapshot. Readers use the authoritative revision and shared OD-012 rule; stale projections are never published as current. Optional materialized projections must carry revision and be ignored unless it matches.
4. **Reset next.** Lock owner, check ACTIVE/no deletion, insert unique active reset. Each normal onboarding write, next stage and receipt commit together. Skip changes only progress; Home reuses the unique day record. No product history deletion.
5. **Delete last.** Transaction locks roster+target, verifies actor/self/last-admin, persists permanent fence + job + audit and durable outbox. All writers check that fence in their transaction; existing transactions finish before fence acquisition. Cleanup of SQL operational rows/checkpoints is idempotent. A worker calls Base44 User.delete outside SQL, then rereads User absence. Lost response → same job verifies absence before repeat; no success until verified. Final SQL audit/status commit together. Failure retains the fence, with a restricted audited recovery path if the original actor loses access. No deadline silently releases a destructive fence.

The current executor's interfaces are reference behavior, not a constraint to preserve unnecessary multi-collection cache writes. Implement the approved simpler model directly; do not add another nonfunctional adapter layer.

## Migration, interruption and rollback

* Prepare schema, unique keys, owner-consistent foreign keys, immutable-history privileges, request receipts and backup/restore in isolated Test first. Export only through authorized tooling into encrypted restricted storage. Never log payloads/tokens.
* Dry-run full paginated migration; preserve Base44 record IDs, exact grant/event times, nulls, daily Pair and all four snapshot strings. Compare per-entity counts and canonical hashes. Duplicate singleton/daily keys, owner/reference conflicts, invalid times and partial ON-05 state are explicit exceptions; do not silently pick a winner or fabricate missing consent. Use existing safe consent recovery before approval of that account's migration.
* Freeze all product writes at the backend, drain in-flight requests, disable old function versions/direct paths, take final export and consistent SQL import. Verify owner/consent/reference counts and hashes. No dual-write interval. Read-only maintenance behavior is preferable to split authority.
* Switch all readers/writers together to the SQL authority generation, then separately enable Home/Calendar/reset/delete after their evidence passes. Old clients may call existing endpoints but cannot choose the data store or bypass the fence. Unknown server generation refuses writes. Do not allow stale pre-cutover functions to continue writing Base44.
* Crash during copy: discard only the unactivated staging import or resume via source-ID keys; live source stays frozen. Crash after SQL activation: recover SQL using its receipts/outbox and backup plan; never “fall back” to stale Base44 rows.
* Rollback before SQL activation can use unchanged Base44 state with the existing blocked capabilities. After any SQL write, rollback requires a new write freeze plus verified reverse migration of changes, including protected history/tombstones, and a compatible code version. Switching an environment variable back is unsafe.

## Security, operation, cost and maintenance

New storage means an additional processor and region decision for profile/health data, private network/HTTPS access, encrypted backups, restricted server roles, key rotation and tested recovery. Browser anon roles get no table access. Backups/exports follow the same retention and incident controls as live health data. No platform compliance status is inferred.

Budget baseline: Supabase's official [pricing](https://supabase.com/pricing) lists Pro from **US$25/month**; compute, additional Test project, egress and point-in-time recovery can add costs. This is not a two-environment all-inclusive quote. Approve a monthly ceiling and backup/recovery requirements before purchase. An existing managed PostgreSQL account may reduce new subscription cost but adds gateway/operations work.

Maintenance: SQL migrations/version compatibility, weekly backup verification, periodic restore drills, retention review, alerting for stuck deletion outbox/receipt conflicts, dependency patching and runtime monitoring. Define an operator for privileged recovery; do not make ordinary admins able to erase audit/tombstones.

## Exact approval/resources needed

Approve **the recommended single-authority PostgreSQL design**, including read-time derived Calendar data and SQL application-admin roster, and provide:

* Supabase organization/project access (or an existing managed PostgreSQL + gateway), separate Test/production destinations and approved region.
* Monthly spending ceiling and backup/PITR/retention requirements.
* Permission for a later, separately reviewed write-freeze/migration window, plus the operator responsible for recovery.

Do not paste credentials into chat; use backend secret configuration. Approval of this design authorizes implementation/provisioning within the selected scope, **not automatic production migration, publish, or live user reset/delete**. Each still needs its reviewed destination and the user's existing release workflow.

If external storage is declined, the actionable alternative is a Base44 support-confirmed actor/conditional-write proof project with exact guarantees above and disposable data. Until such guarantees are established, existing content reads/OD-012 work remain available and the three mutation blockers remain visible.
