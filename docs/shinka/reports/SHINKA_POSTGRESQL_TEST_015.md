# PostgreSQL Test implementation — Buildmarker-015

> **SUPERSEDED_BY_BUILDMARKER_016:** Historical decision/implementation evidence only. The user replaced the SQL direction with Base44 continuation and confirmed no SQL setup or transfer. Do not execute the setup/migration instructions below. See [current continuation](../SHINKA_BASE44_CONTINUATION.md).

Status: **REPO_CLOSED_PENDING_HOSTED_TEST — LOCAL_CHECKS_PASS; HOSTED_ACCEPTANCE_PENDING_ACCESS**. This report concerns the approved isolated Test stage. No Supabase project, paid resource, Production migration, live reset/delete, main merge or publish was performed. Authorized external spend remains **0 USD**.

## What changed

The existing Base44 backend function names now route all product operations through `base44/shared/postgres`. Browser authentication/OAuth still uses Base44; native User IDs are the SQL owner IDs. Supabase Auth, client database access, dual product writes and Base44 product fallback do not exist. Missing Test SQL configuration fails closed.

The 014 proposal is approved for Test. The concrete implementation uses the Base44 trusted server directly with the PostgreSQL transaction pooler, eliminating the separate gateway/signature service proposed as one boundary option. This preserves a single verified identity/transaction boundary and avoids another service. Actual Base44 Deno/npm, outbound TCP and Supabase TLS/pooler compatibility must still be measured before hosted acceptance.

`postgres/migrations/001_test_authority.sql` stores 18 of the 20 logical product entities plus application, owner, receipt and operation infrastructure. The two cycle-derived entities are projections from a locked actual-record snapshot; there is no second writable phase cache. Migration is checksummed. SQL unique/FK/check constraints, the spacing trigger, immutable record triggers/privileges and tenant RLS are real PostgreSQL enforcement, exercised with a non-superuser runtime login. Native Base44 schemas remain deny-all compatibility artifacts, not active Test product storage. InternalHealthRun alone remains redacted diagnostic tooling in Base44, through SQL-admin-authorized functions; its direct read policy is now false.

The app row is shared-locked for normal requests and exclusively locked for roster changes, reference imports and lifecycle admission. Actor/target owner locks use sorted IDs. Calculation, consent/ACTIVE checks, writes, receipt and verification share the transaction connection. This intentionally favors clear correctness over maximum Test throughput. SQL RLS scopes the trusted server credential to the selected application; it is not browser/end-user RLS and does not protect against a compromised server/operator credential.

## Identity and admin authority

Every request verifies Base44 `auth.me()` and native User existence; request role/owner flags never authorize. Only explicitly allowlisted synthetic Test identities register in SQL. New profiles and all later business state stay in SQL.

The initial application admin is operator-bootstrapped only after explicit ID confirmation, fresh native identity verification and an ACTIVE SQL profile. It creates an audit record and a permanent bootstrap-closed marker in one transaction. It does not copy all Base44 admins. `applicationAdmin` supports audited grant/revoke with a receipt, exact target identity and last-ACTIVE-admin protection under the roster lock. Base44 dashboard role changes alone neither grant nor revoke SQL application permissions. Native account removal blocks access regardless of SQL role. Removing native access to the only SQL admin externally can still cause an operator-recovery incident; SQL cannot stop an independent Base44 dashboard action.

`applicationSession` drives both Profile/You and AdminGate. SQL revocation applies to the next authorized backend transaction; an operation already holding the shared roster lock may finish before revoke commits. UI refresh hides privilege while pending and rechecks on focus/visibility and every 60 seconds for admins. There is no instant push revocation claim. A missing profile may enter normal onboarding; application-admin access requires ACTIVE profile and explicit SQL grant, even before ON-05/06 completion.

## Commit and retry behavior

| Flow | Commit/retry contract |
|---|---|
| Onboarding | Grant, immutable event, period, optional settings and action receipt commit together. Retry preserves persisted `granted_at`; a new time is allowed only when the prior attempt fully rolled back and no durable grant exists. Skip writes no health/consent. NULL durations are not converted into 5/28. |
| Home | Owner lock precedes selection reads; UNIQUE(app,owner,day), immutable triggers and the existing result ensure one daily snapshot. Response loss and independent processes reuse the winner. |
| Calendar | Expected revision checked under lock. Actual dates, necessary grant/event and receipt commit together; projections are recalculated coherently. A reused key with changed input or a receipt whose committed revision is no longer current conflicts explicitly. No silent overwrite. |
| Reset | Durable target operation and generation increment preserve identity/role/history. PROFILE → CYCLE → FIRST_SHINKA → DONE; each normal write + stage + step receipt is atomic. Existing same-day daily row is reused. Calendar and domain reads cannot bypass restart. |
| Delete | Commit fence, role removal, job and start audit first. Cleanup/checkpoint pairs commit per stage; notifications become SKIPPED, operational rows and target receipts are removed, approved protected history retained. Then native Base44 User deletion/absence is verified. The permanent SQL fence remains across crashes. A current SQL admin can resume; recovery by a different admin is audited. |

Base44 User deletion is external to PostgreSQL. There is no two-store transaction/rollback guarantee. If native deletion succeeds but its response/checkpoint is lost, retry detects absence and finishes. A revoked operator cannot resume; another current SQL admin can. No job automatically runs against a live user during Health.

`created_at`/`updated_at` are SQL storage metadata. `granted_at`, event and workflow times are server business times with explicit UTC/offset validation and UTC readback. No naive value gets a fabricated `Z`. Existing real partial ON-05 records have not been moved or inspected; their migration exceptions and same-account live closure remain open.

## Local evidence and its limits

[local-postgres.json](postgres-015/local-postgres.json) contains only case results, source digest, reference counts/hash/coverage and technical scope. The runner creates a fresh loopback PostgreSQL cluster, uses a restricted runtime role, separate connections and OS processes, kills a worker during an actual `saveCycle` transaction, restarts the DB, and exercises retry/lost-response/role/fence constraints. Base44 identities and the native deletion transport are synthetic fixtures. Entry tests execute actual transpiled function/config modules with only platform imports substituted; they are not Deno/hosted proof.

The imported local reference set is 6 categories / 240 mappings / 260 content pairs; Moon intervals use the existing pinned astronomy implementation and validated horizon. The manifest source and four content texts per pair are unchanged. No real profiles, consent, dates or health history are imported.

Executed results: **25/25 real PostgreSQL groups; Chromium and WebKit each 405/405 canonical tests and 99/99 local Health; zero page errors; Repo Health 18/18; clean install/tree, typecheck, lint, build and history checks pass**. Catalog: 155 cases (136 current / 7 future / 12 external). Initial JS 451,990 bytes raw / 147,413 gzip; CSS 86,240 / 14,800, within existing budgets. Fresh audit: 0 Critical / 0 High / 2 Moderate / 0 Low. Local/browser/dependency results are recorded in `postgres-015/verification.json` after execution. Source-bound Health evidence becomes invalid if server/migration/test files change. H04-016/H07-014/H09-005/H08-007/H12-032 cover executed local SQL evidence; H04-017 is a separate read-only connected schema/role probe. H09-004/H08-005/H12-031 remain hosted acceptance blockers; no failing case was deleted.

## Reproduce local PostgreSQL tests

Install PostgreSQL 17 binaries using a supported package/distribution, then from the repository:

```bash
SHINKA_PG_BIN=/absolute/postgresql/bin npm run test:postgres
```

The runner accepts a binary path, not a database URL, and always creates its own temporary synthetic cluster. Its default report is `/private/tmp/shinka-015-postgres-tests.json`; set `SHINKA_PG_REPORT` to the repository report path only for an intentional evidence refresh. This session compiled official PostgreSQL 17.11 source and verified its SHA-256 after Homebrew had no compatible bottle. The binaries for this session are at `/private/tmp/shinka-015-pg/bin`; this temporary path is machine-specific, not a project dependency. The runner records the actual binary version and requires major 17. Stop/delete the disposable test directory after reviewing failures; it contains synthetic data only. No OS service is installed or started by the runner.

## Hosted Test preparation once access arrives

1. Confirm the account/organization is on **Free**, has an available free project slot and no paid add-ons. Create only the approved `shinka-test` in Frankfurt `eu-central-1`; verify the dashboard region and actual project reference. If Free placement is unavailable, stop provisioning rather than accept a charge. No project exists from this turn.
2. Identify an isolated **Base44 Test backend/function destination** and its native identity issuer/app ID. A Git branch label or a Preview URL alone is not backend isolation evidence. Do not point a shared Production function deployment at the Test database. Existing Production User IDs/OAuth configuration remain untouched. Synthetic Test accounts retain their own verified Base44 IDs; no identity is reissued in SQL.
3. Obtain operator and runtime connection details securely from the actual dashboard. Use direct/session connection for migrations; shared transaction pooler for the serverless runtime. Custom pooled username is the runtime role plus the verified project suffix. Never construct the pooler hostname from the region. No paid IPv4 add-on is needed for the shared pooler. Configure the server certificate chain and retain full verification.
4. Set operator-only environment values outside Git: `SHINKA_SQL_ENVIRONMENT=TEST`, exact `SHINKA_SQL_APP_ID`, `SHINKA_CONFIRMED_TEST_PROJECT_REF`, `SHINKA_OPERATOR_DATABASE_URL`, optional trusted `SHINKA_DATABASE_CA`. Run `node scripts/postgres/prepareTest.mjs`. It checks the project-bound endpoint, applies the checksummed migration, creates the NOLOGIN permission role and imports only validated references. It creates no external service and imports no users.
5. Create a dedicated LOGIN database role with no SUPERUSER/BYPASSRLS and grant only `shinka_runtime`; set its password through a secure operator session (e.g. psql `\password`, never a committed SQL literal). Do not deploy the database-owner credential; the runtime also rejects superuser, BYPASSRLS and inherited private-table ownership on every transaction. `anon`/`authenticated`/PUBLIC must have no private schema privileges and the schema must stay outside exposed Data API schemas. Verify grants and RLS with that login. No Supabase Auth configuration or client key is needed.
6. Configure backend-only secrets: `SHINKA_DATABASE_URL` (runtime transaction-pooler credential), optional `SHINKA_DATABASE_CA`, `SHINKA_SQL_ENVIRONMENT=TEST`, `SHINKA_SQL_APP_ID`, and `SHINKA_SQL_TEST_PRINCIPALS` (explicit synthetic Base44 IDs). Existing `GEONAMES_USERNAME` stays server-only. Initially omit `SHINKA_SQL_TEST_TOOLS`; later set `SYNTHETIC_ONLY` plus a strong `ADMIN_TEST_TOOLS_PREVIEW_KEY` only for the selected synthetic targets. These names are configuration requirements, not values in the report.
7. Deploy/sync only to the independently verified Test destination after the user-controlled publish step. First complete a synthetic intended admin's ACTIVE SQL profile through normal onboarding. Operator bootstrap uses `node scripts/postgres/bootstrapTestAdmin.mjs`, with exact `SHINKA_CONFIRMED_ADMIN_USER_ID`, fresh `SHINKA_BOOTSTRAP_USER_TOKEN` and authorized `SHINKA_BOOTSTRAP_SERVICE_TOKEN` supplied securely. It verifies native identity instead of trusting the typed ID; remove/expire bootstrap access after use. Do not extract browser storage tokens into chat/logs. No public bootstrap route exists.
8. Confirm SQL role drives the UI and backend with one admin and one ordinary synthetic account. Then run the controlled acceptance matrix below. Record deployed marker, app/environment identity, schema/driver versions and redacted outcomes. Hosted success must be collected independently of the local report.

The runtime disables prepared statements and query pipelining, caps active warm-worker connections, verifies certificates and holds transaction-local state only. These choices follow [Supabase connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres) and [Postgres.js](https://github.com/porsager/postgres). Base44 functions run in Deno; runtime compatibility remains a required check, per [Base44 functions](https://docs.base44.com/developers/backend/resources/backend-functions/overview).

## Hosted acceptance still required

| Area | Required observed Test result |
|---|---|
| Isolation/identity | Correct Test app/project; unchanged native ID; anonymous/ordinary/forged owner denied; no browser SQL credentials; native role alone ineffective; last-admin and revoke behavior measured. |
| Home/onboarding | Two independent clients/functions race for first day; one stored snapshot and one consent/event/period set; lose response then reopen/retry; null durations stay null. No Base44 product writes. |
| Calendar | Race add/edit/delete with same revision; only one coherent revision; failure/retry/readback and >60-day rules; existing Home snapshot unchanged. |
| Reset | Explicit synthetic target preview/confirm; disconnect at each stage, restart function/client, progress resumes without duplicate daily/health events. |
| Delete | Explicit disposable native Test User; staged failure and response loss at native deletion; permanent fence denies old token; another current admin can resume; retained/deleted records match scope. |
| Health | H04-017 read-only proof plus current-marker Full Health save/list/open; deploy InternalHealthRun direct-read denial; record external/physical/old ON-05 obligations honestly. |

## Production proposal — not approved or executed

Production should be a separate user-owned project with separate operator/runtime credentials, explicit application identity binding, MFA-protected organization access, named backup/incident owners and a chosen migration window. Frankfurt is the proposed baseline matching Test; confirm latency, actual Base44 hosting behavior and residency requirements before selecting it. The region is available according to [Supabase regions](https://supabase.com/docs/guides/platform/regions).

Current vendor pricing checked on 2026-10-20: Free is $0 with 500 MB database and inactivity pausing; automatic backups are not included. For Production, **Pro with one Micro project starts around $25/month**, including the plan's compute credit. An extra project in a paid organization adds compute cost; keeping Test Free requires an appropriate separate free organization/placement. Pro includes seven days of daily backups. These are baseline estimates excluding taxes, usage overages, extra projects and existing Base44 charges. [Supabase pricing](https://supabase.com/pricing)

If the chosen recovery objective needs PITR, the published seven-day option adds about $100/month and requires at least Small compute. With the listed $15 Small compute and $10 credit, one-project Pro + Small + seven-day PITR is approximately **$130/month** before other usage/tax. This is a proposal, not authorization. Daily backups alone can lose roughly a day's writes; propose deciding an explicit RPO/RTO after restore rehearsal. For Test Free, use reproducible synthetic fixtures/reference manifests and securely retained logical exports when needed. [Backup/PITR policy](https://supabase.com/docs/guides/platform/backups)

The migration must be a controlled authority cutover, not dual writing:

1. After hosted Test acceptance and separate Production budget/window approval, inventory the actual current Base44 product data read-only with full pagination. Preserve native IDs, original grant/event times, nullable inputs and every immutable daily snapshot. Produce count/hash/reference/conflict reports without logging full health rows.
2. Rehearse encrypted export → isolated staging import → canonical validation and restore. Quarantine duplicates, owner/reference violations, invalid timestamps and partial consent flows for explicit resolution; never silently synthesize consent or merge conflicting days. Test retention/fences after restore so deleted health data cannot reappear.
3. In the approved maintenance window, disable all old Base44 product writers and drain in-flight requests. Take final export and backup, import transactionally into Production SQL, validate counts/hashes/relationships and exact immutable records, then bind all readers/writers to SQL together. Keep the old store read-only for the approved recovery/retention period.
4. Before any new SQL business writes, a failed cutover can restore the pre-switch configuration while still in maintenance. After SQL writes begin, do not fall back to stale Base44 data: stop writes and repair/restore/reconcile PostgreSQL under a separately approved recovery plan. Native identity remains Base44 throughout.
5. Rehearse restore into an isolated environment, replay authoritative deletion fences/protection history before reopening access, validate snapshots and reconcile native identities. Measure actual restore duration and data-loss window; use that evidence to set the final RTO/RPO and migration window. Retention/purge and off-site backup custody need explicit operational decisions.

No Production project/region, paid subscription, real-data import, live reset/delete or migration window is selected by this implementation.
