# SHINKA — Data Model

**Document:** SHINKA_DATA_MODEL.md
**Status:** ACTIVE — 20 physical repository schemas; deployed verification pending
**Current BuildMarker:** Buildmarker-069
**Last Updated:** 2026-11-11
**Authoritative Source References:** SRC-05 DB v1.2, SRC-07 Entity_Iliskiler v1.2 (SRC-06 v1.1 superseded)
**Purpose:** Authoritative 20-entity product contract and its Base44 dependencies.
**Scope:** Product domain entities + separately listed internal tooling storage.
**Implemented:** 20 JSONC schemas in `base44/entities/`, canonical definitions in `base44/shared/domainSchemas.js`, source field receipt, validation and guarded backend access.
**Open Decisions:** OD-004, OD-009; OD-002 RESOLVED_BY_PRODUCT_DECISION
**External Verification Required:** Base44 native UNIQUE is unsupported; no multi-record transaction/CAS guarantee is claimed. Native handler tests use synthetic transport; hosted schema/authorization/mutation recovery remains pending.

Common: every user entity owns `user_id` → Base44 User.id (owner from auth context). Date = local YYYY-MM-DD; instant = UTC; time = local HH:mm; timezone = IANA. Optional user inputs stay NULL. 5/28 are cycle calculation defaults; the approved Sun rule uses only birth_date and has no time fallback.



## 064 — Admin reset retirement and selected-user removal (2026-11-11)

No schema change or data migration. AdminTestOperation.operation still accepts RESET_ONBOARDING for historical rows; RESET_ACTIVE, PROFILE/CYCLE/FIRST_SHINKA/DONE, step_fingerprints and actor/target/request IDs remain readable. Only DELETE_USER is an allowed new Test Tools command. Completed deletion tombstones, reset-history references and shared records are retained.

The complete visible live journal inventory was 9 rows: two active reset receipts, one completed reset and six completed deletions. Both active receipts belong to the two selected removal targets; there is no existing deletion receipt for either. Do not delete/reset their journal or discard lifecycle checks to enable removal. The compatibility writer can only advance an already admitted owner's existing reset after normal persistence/readback, never create a new reset.

[064 delivery and execution](reports/SHINKA_ADMIN_RESET_RETIREMENT_064.md).


## 059 — Single Pattern theme, Lunar Timeline and navigation evidence (2026-11-09)

No entity, native ID, category assignment or persisted summary changes. The domain UserPatternSummary contract retains primary/secondary fields; `themes` DTO contains zero or one primary category and rejects two rows. `lunar` DTO is `{observed_at,timezone,current,timeline}`; timeline is null or `{nodes:[{phase_code,instant,position}] × 5,today_position,active_index}`. Node instants are validated stored starts plus WANING.end (the next NEW transition), all ratios use UTC instants. READY iff timeline is complete; invalid order/ratios/current interval or naive timestamps fail strict response validation. No additional astronomical engine, cache, metadata authority or schema migration. [059 implementation, measurements and acceptance](reports/SHINKA_PATTERN_NAVIGATION_059.md)


## 058 — Narrow core closure (2026-11-01)

No entity/schema or ID contract change. The existing Moon schema now holds 107 verified intervals after four approved missing tail creates: all 103 prior IDs/phase/boundaries remain exact. The monthly expected set currently has 103 matches; that is not the physical total. Official export validates unique IDs/starts and continuous UTC coverage through 2028-12-02. The live UserDailyMessage schema was read and is already ID-only (six required application fields); 045/051 row cleanup is accepted and was not rerun. The previously absent GeoNames singleton is now operator-prepared and read back as one native ID with revision0/hour498210/credits8000; the schema is unchanged. Its startup wait and hosted conditional-write acceptance remain separate. Calendar receipt states and private Health file references remain separate operational evidence in [058](reports/SHINKA_CORE_CLOSURE_058.md).


## 056 — Focused Calendar corrections (2026-11-01)

No entity or receipt field is added/removed. UserCalendarAction keeps native IDs, fingerprint, base/result revision, PENDING/APPLIED/CANCELLED and original grant time. The read-only checkedAction transport projection is not a stored entity: ABSENT carries action_id/status; known valid intent also carries operation/date/period_id (where required)/revision. APPLIED is returned only for exact current result revision and matching actual period outcome; malformed/competing/changed evidence stays conflict. Withdrawn consent exposes no receipt/date projection. Partial grants use the existing validated recovery intent. No tombstone/receipt cleanup or health migration is performed.


## 055 — No data/schema migration

Typed GeoNames quota diagnostics do not add a product or quota field. The 053 APP_CREDITS_V1 singleton schema/credit arithmetic remains unchanged; missing/invalid state is never treated as zero. Diagnostics stay transient. DOB feedback and daily plain surfaces do not change User/Profile/consent/daily IDs, optional NULL, MessagePair references or persistence. No data import, reset or cleanup occurs. [055 evidence](reports/SHINKA_ONBOARDING_FIX_055.md).


## 053 — Shared GeoNames credits and endpoint classification (2026-10-30)

GeoNamesDailyQuota is the seventh **internal tooling** schema, separate from the unchanged 20 product entities and native User (28 physical files). Current scope APP_CREDITS_V1 has one operator-prepared native ID, integer revision/window_hour and at most 25 {hour,credits} buckets. Direct read/create/update/delete deny applies to all callers; only the admitted backend reserves. No user/place/credential fields or asserted unique index. Legacy quota_date/count remain optional for staged schema compatibility; old rows are retained, never interpreted as zero or silently migrated. Runtime does not create/upsert rows: missing, duplicate or malformed state blocks provider access. Initial preparation and hosted conditional-write verification are still required, not completed cleanup.


## 051 continuation — verified maintenance and measured performance

The owner accepts published 051 / HC-050.0 functional and Full Health evidence (159 PASS, zero FAIL/BLOCKED). Preserve that acceptance and historical failures. This continuation retains Buildmarker-051 and active packages 047–051; HC-050.1 identifies changed assertions without creating a new product package. Live Full Health/Security scan and main/publish were not run. Detailed dated receipts and separate hosted/local limits: [051 continuation](reports/SHINKA_CORE_RELIABILITY_051.md#051-continuation).

All 18 hosted UserDailyMessage rows now verify READY with zero legacy fields and zero pending/broken references. Exactly 6 residual rows/24 fields were cleaned in this continuation; native IDs, assignment digests and NotificationDelivery link digests match before/after for all 18. Four old active DELETE_USER operations completed through the existing same-ID flow; six deletion tombstones/history remain, and the protected admin is unchanged. Final repository schema/generator/inspector/D23 now require ID_ONLY_SCHEMA. The four legacy constants remain only for reject/cleanup verification, not persisted properties. Static cleanupVerified:false means REPOSITORY_ONLY; it is not a contradiction of the separate dated hosted receipt. Live final schema publication remains owner-controlled.

## 051 — initial delivery (historical evidence retained)

InternalHealthRun remains operational tooling, outside the 20 product entities. New retention is per actual app/data store, never split by report environment labels (LOCAL/PREVIEW/PUBLISHED). Retain latest five completed reports regardless of PASS/FAIL/BLOCKED, plus incomplete, duplicate-run conflicts, explicitly active recovery IDs, and unknown/invalid report finish times or IDs. Ordering uses the canonical report completed_at with explicit UTC/offset; native created_date is fingerprinted without parsing or timezone repair. No new entity/field. Product cycle history, daily assignments, content, tombstones and notification links are not age-retention candidates. The four optional physical daily snapshot fields remain until every hosted page verifies clean; partial cleanup is not final schema completion.

051 actual hosted receipt: 18 daily rows/72 legacy fields before; 18 rows/24 fields after; 12 clean, 6 blocked, verify.clean=false. All assignment/link digests and IDs preserved; no final schema/generator/inspector/D23 transition. Five remaining rows join three active deletion owners, one joins a completed deletion owner. Completed deletion retains daily assignments by policy; the narrow maintenance exception checks native User absence and preserves the tombstone. INCOMPLETE reports remain protected even when completed_at exists.

## 049 — Cleanup remains pending; verification receipts strengthened

The four optional physical UserDailyMessage legacy text fields remain in the compatibility schema. Hosted cleanup has not run: 0 inspected by migration / 0 cleaned / remaining unknown / full verify NOT_RUN. Current MessagePair text and immutable assignment-only writes are unchanged. Reviewed receipts now include assignmentDigest and linksDigest/linkCount, derived from native daily ID, owner, date, timezone, category, pair, generated_at and linked NotificationDelivery ID/owner/daily ID. Only the existing four-field unset is writable. Native updated_date may change; assignment digests exclude it. Full completion requires every page, identical initial/final assignment and link receipts, zero legacy fields and invalid references. Any missing/new/unreviewed ID or changing old writer requires investigation and another complete inventory; a clean page is not global success. Final generator/inspector/D23/schema removal stays gated on actual hosted verification.

## 048 — Hosted four-field cleanup remains pending

The owner's 048 request authorizes only the four 045 legacy text-field removals in the named existing app/prod, preserving daily native IDs and every assignment plus NotificationDelivery references. Current actual result: **0 inspected / 0 cleaned / remaining unknown**, full verify NOT_RUN. CLI login was unavailable twice; the owner then explicitly deferred live cleanup and requested local theme delivery. No app data was read or changed. Consequently the four fields stay optional in the canonical physical schema, generator/inspector and D23; the logical/write ID-only model and current MessagePair reads stay unchanged. No final-cleanup claim or final schema deployment. [045 continuation](reports/SHINKA_ID_MODEL_045.md) · [safe receipt](reports/theme-cleanup-048/cleanup-status.json).

## 045 — Native IDs and current text (current)

27 repository schemas = 20 product + 6 operational + native User extension. All have Base44 native `id`; no manual replacement ID is added. UserDailyMessage's six domain fields plus native `id` define its immutable assignment. New writes exclude the four legacy text fields. After the 051 full hosted verification, the Test physical schema excludes those four fields, matching the logical/write schema. DTO names are derived from current MessagePair. Source receipt keeps SRC-05/07's original fields and declares the explicit 045 removals. MessagePair.is_active permits Active/Inactive; historical references ignore eligibility. Category ID on the daily row records the actual assignment and must not follow a later Pair category edit. NotificationDelivery's daily_message_id is now checked in a bounded projected owner/date reference query before admission; no link rewrite.

Schema removal does not delete old stored fields. The operator-only reviewed migration unsets precisely four keys, preserving all assignment fields/native IDs. The temporary compatibility schema is retired in Test after the dated 051 receipt. Repository conformity means final schema readiness, not its live publication; the receipt separately proves stored-field cleanup. [All-entity inventory, measurements and release steps](reports/SHINKA_ID_MODEL_045.md). Retention, consent/privacy and historical evidence are unchanged.


## 040 — removal receipt and progress semantics

No entity/schema migration. Existing AdminTestOperation fields/checkpoints retain their authority. New delete admission persists START before cleanup. One merged, readback-verified ordered checkpoint update per cleanup pass replaces per-stage metadata writes. A VERIFY checkpoint without COMPLETED is an incomplete operation awaiting fresh full-scope verification and final audit/status write. Checkpoints optimize forward work only; they cannot establish current absence. Reopening a stale/completed receipt truncates checkpoints before the earliest observed residual and preserves operation/request/actor/target/preview bindings. No CAS, transaction or distributed lock is implied.

The response's invocation-local `shinka.deletion-pass/1` projection contains safe operation ID, stage, confirmed processed count, checkpoint IDs, elapsed/work duration, data-write attempts, progress boolean and reason. `remainingAtLeast=1` is only a known residual; NULL means uncounted, never zero. Exact remaining zero is emitted only for freshly verified COMPLETED. Metadata/audit writes are measured separately from the 100 data-write ceiling. This projection is not another persisted source. Existing retention manifest is unchanged: consent/events/daily snapshots, stopped notification history, audit/protection/closed health jobs and operation tombstone remain; operational profile/preferences/cycle/Pattern/calendar actions and active User are removed. Shared references and unrelated owners remain untouched.

## 039 — bounded generic read contract

No schema/field/policy/content migration. `domainAccess` ordinary reads return at most 100 declared-field records plus explicit `truncated:boolean`, using a 101st sentinel. Exact 100 is complete; 101+ is partial. Owner validation includes the sentinel; malformed/duplicate/missing-ID readbacks fail with DOMAIN_READ_INVALID. The SDK projection requests only schema fields, ID and native timestamp aliases. This view is not an export or complete-history endpoint; Calendar/Pattern/import/deletion retain their dedicated bounded pagination/readers. Guard rechecks before return remain. [039 measured boundary](reports/SHINKA_CORE_QUALITY_MILESTONE_039.md).

## 038 — read-only response evolution; no entity migration

Historical 038 (superseded by 059 above): Pattern `lunar` response was `{section:'lunar',state:'READY'|'PARTIAL',lunar:{observed_at,timezone,current,next_full}}`. Selected interval fields are phase_code/start_at_utc/end_at_utc; next_full additionally has IANA-local `date` (YYYY-MM-DD). Either field is null when unprovable; READY requires both. No timeline nodes/coordinates/labels or persistent summary cache. Theme/count domain fields and all ranking inputs are unchanged.

Calendar `recovery` for a unique eligible PENDING receipt now includes original action_id/base revision, operation, date and optional period_id. It is owner/consent-scoped health data, never Health/log metadata. The same stored ID is resumed after reload. PENDING/APPLIED/CANCELLED schema enum remains for historical compatibility, but 038 has no bulk acknowledge/CANCELLED writer. No schema/retention change; withdrawal suppresses recovery date projection and existing cleanup scope still includes receipts.

## 036 — unchanged NULL and daily authority

No entity, field, default, consent timestamp or content data changes. Birth time is optional local HH:mm, including genuine 00:00; it is never generated on opening and receives no timezone conversion. Blank birthplace is all five canonical NULL fields, distinct from an unselected text draft. The source already allowed DOB-only profiles; actual native-adapter service/readback tests now cover that path explicitly with zero provider construction. Saved UserPreferences.language_code is the language authority; no parallel locale field/storage. Daily generated_at/day-key/snapshots and duplicate-candidate reconciliation remain unchanged. [036 single delivery report](reports/SHINKA_ONBOARDING_CLOSURE_036.md).

## 035 onboarding data boundary — no schema change

The 20 product entities and five birthplace fields are unchanged. Selected GeoNames **A or P** IDs are independently resolved; client label/coordinates are not writable request fields. Search query, display hierarchy, page and draft cycle inputs are memory-only; bounded same-tab pending name is the existing exception. No extra completion flag, cache entity, rollback or draft-recovery guarantee is added.

An existing verified daily row closes onboarding profile/cycle mutations independently of profile readiness. Direct persistence rechecks completion before profile/health writes; reset retains its separately authorized lifecycle adapter. Before completion profile correction keeps owner/ACTIVE/revision/readback guards, and back/Skip does not change consent/history. [035 audit, execution and evidence](reports/SHINKA_ONBOARDING_AUDIT_035.md).

## 030 continuation — retained 029 notification extensions

Original SRC-05/07 fields remain independently recorded in domainSourceReceipt. The following optional fields are authorized by this package, not retroactively attributed to the original files. D01 and repository inspection compare original fields plus this exact five-field extension; unexpected fields still fail.

| NotificationDelivery field | Meaning |
|---|---|
| shinka_date | Local date from the reconciled daily message; groups competing candidates across a changed canonical winner |
| dispatch_state | READY, IN_FLIGHT, RETRYABLE, ACCEPTED, PERMANENT, UNKNOWN or INELIGIBLE |
| next_attempt_at | UTC earliest retry/intent-settlement instant; window still rechecked |
| claim_id | Random attempt correlation for readback; not provider idempotency or a lock |
| error_stage | ADMISSION, PROVIDER or PROVIDER_ACCEPTANCE; safe code only |

030 adds no schema or field. Existing delivery_status stays PENDING/SENT/FAILED/SKIPPED. SENT means a verified provider acceptance response, never device display. The 030 Base44 adapter cannot establish acceptance and always returns UNKNOWN, including resolved objects and 403/502/timeouts; only explicitly accepted synthetic providers exercise SENT in tests. The reported user_id mapping to native User.id, no-device behavior and provider idempotency remain unverified. IN_FLIGHT is written before calling the provider; failure to persist/read back completion keeps it non-retryable. Unknown/malformed/timeout responses become FAILED + UNKNOWN; definite rejection may retry at most three total attempts within the current local 06:00–12:00 window. Original legacy rows without a known dispatch_state are not blindly resumed. Duplicate candidates remain evidence; canonical ID and existing sent/uncertain candidates suppress further sends. No physical UNIQUE/CAS/transaction is added or claimed.

NotificationSchedule is the sixth operational schema, outside the original 20 product entities. Its closed fields are schedule_key=DAILY_SHINKA, cursor (last preference record ID as a lexical boundary), last_tick_at. Direct CRUD denied. It stores no user/health payload or credential. Owner erasure removes NotificationDelivery through existing cleanup. The global positional cursor does not authorize or recreate the deleted identity; next sweep advances/resets it. No user-specific pending scheduler job exists outside delivery rows.

## 027 continuity

No entity, field, relation, consent timestamp or policy migration. Request-scoped principal reuse and frontend route continuity do not persist new state or alter native uniqueness/concurrency limits. Health report artifacts and immutable runId/digest keep the same schema. Repository direct-policy checks cover 20 product and five operational schemas; deployed enforcement remains separate acceptance.

## Health diagnostic metadata — 024

No schema, product field, timestamp authority or content-record change. Readiness samples at most one ID per operational schema and returns only readability/sample size and a closed diagnostic. Actual empty tables are readable; unmeasured content counts remain NULL, never zero. Existing InternalHealthRun private report artifacts carry safe diagnostic evidence through the unchanged persistence contract; no historical report is rewritten. Schema presence and policy enforcement require their own evidence.

## Owner erasure and withdrawal storage — 023

The 20 source product schemas are unchanged. Two closed operational schemas join the existing three: **UserPrivacyRequest** and **PrivacyRecoveryReceipt** (26 total files including built-in User). All direct CRUD policies are false. Full schema inventory must be deployed before updated applicationSession/native shared code and frontend; neither Git Test nor Preview is a separate database.

UserPrivacyRequest: native id; user_id; stable request_key (`DELETE_ACCOUNT` or withdrawal + previous grant instant); kind WITHDRAW_HEALTH/DELETE_ACCOUNT; status IN_PROGRESS/COMPLETED/NATIVE_REMOVAL_PENDING/PLATFORM_PENDING; requested_at (server UTC); optional original grant_at/consent_version and completed_at. It contains no profile, cycle date or content payload. Duplicate observed request keys are an explicit conflict, not an invented UNIQUE/CAS guarantee. One worker coalesces pending same-owner requests; reconstructed workers reread authority. A new withdrawal generation requires a later explicit grant.

PrivacyRecoveryReceipt stores SHA-256 token_hash, request_id and expires_at only. The browser generates 256 random bits before confirmed dispatch; receipts are valid for 24 hours, max five per erasure request, and can only expose kind/status/verified booleans. They authorize no mutation or arbitrary target lookup. Request IDs are not bearer credentials. The validity limit is a security limit, not an invented legal retention duration. The pending request and receipts still need platform disposition; no automatic final purge is claimed.

Withdrawal reuses current UserHealthConsent, append-only UserHealthConsentEvent, DataProtectionEvent HEALTH_DATA_DELETION and HealthDataDeletionJob. granted_at stays exact; withdrawn_at/occurred_at use one persisted backend instant. Cleanup is five scopes: UserCalendarAction, UserCyclePhaseDay, UserCyclePrediction, UserPeriodRecord, UserCycleSettings. Terminal verification rechecks all five. Personal daily snapshots and physical Pattern summaries are retained historical assignments, not raw cycle copies or new health inputs. Self-service account erasure instead removes all owner-linked product data and owner-related audit/admin-operation records; its narrow server path is the explicit exception to normal immutable protection. Shared sources, anonymous system-error records, redacted Health artifacts and repository evidence are unchanged. [Per-type matrix](reports/SHINKA_PRIVACY_023.md).


## You update contract — 022

No entity/field/RLS delta. Existing UserProfile and UserPreferences remain owner singletons; ready users are updated only, never recreated/upserted by You. Backend allows profile inputs display_name, birth_date, birth_time and birthplace_geonames_id; server derives the five-place fields and Sun. account_status/user_id/role/consent/derived Sun are never caller-owned. The profile patch excludes account_status. Preference patch contains language_code, notifications_enabled, fixed notification_time 06:00 and validated automatic timezone. Optional NULL values are explicit for merge updates.

The opaque SHA-256 revision binds row ID, native update metadata and canonical editable field projection; it is an observation token, not a native lock. Native timestamp strings are compared as supplied, never reparsed/appended with Z. Pre-write comparison plus exact previous-value/owner/ACTIVE filter, one-row result and exact readback detect observable conflict. Same desired state verifies without writing even after response loss. No new receipt/cache/table or multi-record transaction/CAS guarantee. Actual one-row SDK predicate/count behavior and concurrent remote visibility remain hosted acceptance.

Profile/Preference saves never modify UserDailyMessage, UserPatternSummary/history, consent/event/cycle/notification records or reset progress. Onam time/version authority is unchanged. Read-only consent status is taken from the existing current record after validation; missing record means NOT_GIVEN, not an inferred grant. Malformed/duplicate records produce an error.

## Pattern projection — 021

Native generic domainAccess also returns this same calculated summary; recordId-based owner/admin reads refuse with DERIVED_PATTERN_READ_REQUIRED rather than exposing an obsolete physical cache. Generic mutations remain denied.

No entity/field/policy changes. `UserPatternSummary` retains its original field contract; the current Pattern API computes and validates that shape from daily rows at read time, returns null category/count pairs for empty/absent secondary, and does not persist/cache a summary. Any old physical summaries are ignored by this reader (and still covered by existing deletion scope). `calculated_at` is the backend read instant, not consent/native metadata.

Daily history uses only id,user_id,shinka_date,timezone,category_id,generated_at with owner and [today−29,today] predicates, limit 4001. More than 4000 rows, duplicate IDs or malformed/foreign/out-of-range rows fail rather than truncate. One request below the pinned SDK's 5000 limit avoids offset-page shifting; a second limit-1 earliest-date query determines early-history window metadata and checks visible inconsistency. Category lookup requests 7 sentinel rows and requires the six exact approved unique codes/names/native IDs. Moon requests at most 33 sentinel rows overlapping ±35 UTC days, rejects >32 and validates continuity/order/UTC fields before projecting the current lunation’s five real transitions (059). No product text or health table is needed.

These bounded ordinary reads are not a transaction/snapshot/CAS guarantee. A newly visible daily candidate can change Home and Pattern consistently on next refresh using the same shared comparator. No silent overwrite or uniqueness claim. [SDK filter signature/field selection and limits](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities), checked 2026-10-21; implementation retains pinned 0.8.54's positional filter API, not newer cursor overloads.

## 020 removal result semantics — no schema or retention change

AdminTestOperation COMPLETED is persisted historical progress. execute, resume, status and lookup now share testOperationOutcome, which freshly verifies native User absence, all operational scopes, calendar receipts and pending-notification disposition before projecting COMPLETED. A reappearing active User/profile/residual projects PARTIAL even if the saved job says COMPLETED; failed or conflicting reads propagate an error and are not absence evidence. The existing same-operation resume policy remains; no new operation, account or silent journal rewrite is introduced.

Native User is distinct from UserProfile and retained consent/event/daily/audit/protection histories. Target lookup uses asServiceRole.entities.User.filter({id: target}) with exact-ID/role/cardinality validation. Empty profile or failed login alone is insufficient. The result verifies active-store removal, not physical erasure, trash emptiness, backup removal or all retained history. SDK 0.8.54 delete(id) has no separately exposed trash-purge option; no undocumented endpoint or credential was added. See the official-source distinction and sanitized selected-target observation in the [020 report](reports/SHINKA_TARGETED_CLOSURE_020.md).

## Current data contract — 019 audit

No entity, field, RLS or retention change in 019. Base44 native data remains authoritative; 016/017 schema deployment evidence stays historical. AdminTestOperation persists the same actor/target/operation identity, stage, checkpoints and sanitized error_code. A checkpoint is prior verified progress, not permission to skip residual cleanup. RETRY_REQUIRED/TEST_CLEANUP_MORE_REQUIRED is acknowledged bounded progress; a missing response is unknown. COMPLETED requires native User absence plus all operational scopes and notification disposition, followed by final audit/status readback. Retained consent/event/daily/protection/audit rows are not deleted.

InternalHealthRun's private report artifact adds executionContract, plannedCaseIds, evaluated predicate results and build/catalog/source bindings. Existing compact case summaries and entity columns remain unchanged. Current report writes require the server's complete case plan and matching counters; historical artifacts remain readable and are not rewritten. Base44 creation metadata remains distinct from persisted consent business time. [Current architecture and accepted limits](SHINKA_BASE44_CONTINUATION.md) supersede historical SQL/atomic-only descriptions below.

## 018 operation/report projection — no schema delta

No entity schema changes. Existing AdminTestOperation retains permanent target lifecycle and checkpoints. The API result_state is a read-only projection (PARTIAL, COMPLETED, RESET_ACTIVE), not a new persisted field; native User absence alone is insufficient. InternalHealthRun report_file_uri still points to immutable normalized JSON, now with optional IN_APP_HEALTH/transfer metadata for 018 reports; historical normalized payloads are unchanged. saveStatus validates and reads the same runId/digest without upload/create. No target/user record is added to the build history.

## Tooling retry metadata — 017

InternalHealthRun adds optional `report_digest` (SHA-256 of the normalized redacted full report) for immutable same-run retry identity. No product field or policy changes. Older rows lacking it remain readable/immutable; new save cannot overwrite them. Private file URI remains server-selected. Duplicate runId observations fail closed; there is no native UNIQUE guarantee. AdminTestOperation and UserCalendarAction schemas stay unchanged; completed DELETE tombstones remain and all cleanup stages are rechecked on retry. Audit/user/history retention is unchanged.

## Current physical contract — Base44 016

The original 20 product Entity schemas, native User extension and five internal/operational schemas (including two from 023) are the active Base44 model. Native metadata id/created_date/updated_date is not redeclared; normalization is not consent-time authority. Consent granted_at and event occurred_at remain persisted backend business instants, validated and preserved on retry; no timezone suffix is invented. Optional durations stay null/absent, 5/28 calculation-only.

Additional UserCalendarAction is an owner-scoped **health-data receipt**, all direct CRUD false: user_id/action_id/fingerprint/base_revision/result_revision/operation/period_id/desired_date/previous_date/initial_grant/grant_at/status/started_at. Status PENDING/APPLIED/CANCELLED; no uniqueness guarantee. It retains intent after failures; it is included in test-user cleanup and implemented 023 health-withdrawal cleanup. Never export dates/receipt bodies to audit or Health. AdminTestOperation gains optional step_fingerprints (intent hashes only) for reset continuation. InternalHealthRun remains closed to direct SDK access, with current native admin backend reads.

UserDailyMessage may have multiple physical candidates; ordering and conflict notice replace physical one/day as a prerequisite. Logical user/day selection uses generated_at then ID and retains every row. UserPeriodRecord is Calendar authority. Existing prediction/phase entities remain compatible schema artifacts but current readers calculate projections and writers do not maintain those caches. No SQL schema/runtime, second store, transaction or CAS is active. [Full contract and recovery](SHINKA_BASE44_CONTINUATION.md).

## PRODUCT DOMAIN ENTITIES (20)
| # | Entity | Purpose | Owner | Lifecycle | Uniqueness / index | Deletion |
|---|---|---|---|---|---|---|
| 1 | user_profile | Profile + account_status | user | editable | UNIQUE(user_id) | 023 owner erasure removes; INACTIVE only during cleanup |
| 2 | user_preferences | language, notifications, notification_time 06:00, timezone | user | editable | UNIQUE(user_id) | withdrawal retains; owner erasure removes |
| 3 | user_health_consent | current consent state | user | editable state | UNIQUE(user_id) | withdrawal retains WITHDRAWN metadata; owner erasure removes |
| 4 | user_health_consent_event | GRANTED/WITHDRAWN history | user | append-only | — | ordinary/admin immutable; owner erasure removes |
| 5 | user_cycle_settings | entered duration/length (NULL if not entered) | user | editable | UNIQUE(user_id) | withdrawal / owner erasure |
| 6 | user_period_record | recorded starts | user | editable (update same id) | INDEX(user_id, period_start_date); ≥15 days | withdrawal / owner erasure / explicit single delete |
| 7 | user_cycle_prediction | predicted cycles | user | derived | — | withdrawal / owner erasure; native calculation on read |
| 8 | user_cycle_phase_day | per-day phase cache | user | derived | UNIQUE(user_id, phase_date) | withdrawal / owner erasure |
| 9 | cycle_phase_lookup | length × duration × day → phase | system | reference | UNIQUE(cycle_length_days, period_duration_days, cycle_day) | not deletable |
| 10 | message_category_lookup | six categories | system | reference | UNIQUE(category_code) | not deletable |
| 11 | message_category_mapping | 240 mappings | system | reference | UNIQUE(sun_sign_code, moon_phase_code, cycle_phase_code) | not deletable |
| 12 | message_pair | 260+ TR/EN pairs, is_active "Active" | system | editable text | INDEX(category_id, is_active) | no delete function |
| 13 | user_daily_message | immutable assignment candidates per user/local day | user | immutable | UNIQUE(user_id, shinka_date); INDEX(user_id, generated_at) | ordinary/admin immutable; owner erasure removes all candidates |
| 14 | notification_delivery | push job per message | user | stateful | UNIQUE(daily_message_id, notification_type) | withdrawal retains history; owner erasure removes |
| 15 | user_pattern_summary | single current summary | user | derived single row | UNIQUE(user_id) | legacy cache ignored; owner erasure removes |
| 16 | moon_phase_lookup | UTC phase intervals | system | rolling reference | INDEX(start_at_utc) | not user-deletable |
| 17 | admin_audit_log | admin VIEW/UPDATE/DELETE | system | append-only | INDEX(admin_user_id, performed_at) | ordinary/admin immutable; owner-related rows removed on owner erasure |
| 18 | system_error_log | deduplicated errors | system | stateful | — | retained |
| 19 | health_data_deletion_job | verified deletion | system | backend-only state | one open job per user | withdrawal progress retained; owner erasure removes |
| 20 | data_protection_event | deletion/deactivation decision | system | append-only | — | ordinary/admin immutable; owner erasure removes |

Relationships: 25 logical links (see domainContract.js): 24 from `21_Iliskiler`, plus health_data_deletion_job.user_id → User.id explicitly required by SRC-05 §8.3 and SRC-07 entity sheet 19. Deleted health entities must never leave dangling references.

**Base44 dependency:** native UNIQUE is unsupported; remaining INDEX/FK capabilities are unverified. The single atomic adapter contract below fails closed until a durable implementation is proven.

## INTERNAL TOOLING STORAGE (excluded from the 20)
| Entity | Purpose | Access |
|---|---|---|
| AdminTestOperation | Test-operation journal, restart state, deletion tombstone | All direct CRUD denied |
| InternalHealthRun | Health run history (redacted report JSON, counts) | All direct CRUD denied; current admin backend read |
| UserCalendarAction | Owner-scoped health intent/result receipt for Calendar recovery | All direct CRUD denied; backend only |

Build Ledger is SOURCE-based (`src/foundation/buildLedger.js`), not an entity.

## Internal diagnostic storage hardening
InternalHealthRun remains tooling-only, outside the 20 domain entities. All direct CRUD, including read, is denied; the current native admin is checked by the backend for list/report access. The server-admin internalHealth function alone creates summary records after validating the report and creating a private artifact. Compact report_json is bounded to 15,000 UTF-8 bytes; full redacted report_file_uri points to private storage. Stored summaries and signed readback are synthetic-tested; final live RLS/persistence/readback is unverified. OD-004/OD-009 are PARTIALLY_VERIFIED with external live evidence required.

## Historical checkpoint — Buildmarker-007 physical mapping and field contract
Baseline inspected in the Greenfield app on 2026-10-19: dashboard Data listed only InternalHealthRun; SDK reads returned schema 404 for all 20 product names. Built-in User is separate. Repository after implementation: 20 product schemas, one InternalHealthRun, one built-in User extension, zero unexpected product schemas. This is not evidence that Test has been deployed. No CLI deployment bypasses the Git integration.

PascalCase schema filenames match the existing repository and exact SDK entity names. One snake_case logical name maps to one physical name; no aliases create duplicate tables.

| Logical entity | Physical Base44 entity |
|---|---|
| user_profile | UserProfile |
| user_preferences | UserPreferences |
| user_health_consent | UserHealthConsent |
| user_health_consent_event | UserHealthConsentEvent |
| user_cycle_settings | UserCycleSettings |
| user_period_record | UserPeriodRecord |
| user_cycle_prediction | UserCyclePrediction |
| user_cycle_phase_day | UserCyclePhaseDay |
| cycle_phase_lookup | CyclePhaseLookup |
| message_category_lookup | MessageCategoryLookup |
| message_category_mapping | MessageCategoryMapping |
| message_pair | MessagePair |
| user_daily_message | UserDailyMessage |
| notification_delivery | NotificationDelivery |
| user_pattern_summary | UserPatternSummary |
| moon_phase_lookup | MoonPhaseLookup |
| admin_audit_log | AdminAuditLog |
| system_error_log | SystemErrorLog |
| health_data_deletion_job | HealthDataDeletionJob |
| data_protection_event | DataProtectionEvent |

Native `id` is the unique platform identifier. All references are ID strings plus the canonical relationship registry; strings do not establish a native FK. `assertReferenceTargets` rejects missing and cross-owner targets; the atomic adapter must repeat referential checks in the same atomic operation. No cascading delete is assumed.

`validateDomainRecord` enforces required fields, unknown-field rejection, ranges, enum values, valid local dates, UTC `Z` event instants, HH:mm, IANA timezone, coherent birthplace fields, consent timestamps, Pattern category/count pairs and positive Moon intervals. Age validation is implemented by the onboarding backend. Current-day interval validation, Moon continuity and daily calculation/fallback now have scoped implementations. Calendar mutation/recompute and restore workflows remain future. Generic mutation routes stay disabled; onboarding uses its specific fail-closed atomic contract.

Optional fields use documented primitive types without `required`. Canonical logical NULL validation omits absent fields; reads normalize absence to NULL. The scoped onboarding adapter sends explicit NULLs when clearing merging SDK updates (see current-package mapping below). No `nullable`, unsupported type union or invented unique/index syntax is asserted. Native explicit-null acceptance remains unverified. No synthetic time or 5/28 calculation default is persisted. These are wire/storage adaptations, not entered values. Required schema fields with declared defaults are filled by the backend validator.

Sun codes adapt the 12 source signs in order: Koç→ARIES, Boğa→TAURUS, İkizler→GEMINI, Yengeç→CANCER, Aslan→LEO, Başak→VIRGO, Terazi→LIBRA, Akrep→SCORPIO, Yay→SAGITTARIUS, Oğlak→CAPRICORN, Kova→AQUARIUS, Balık→PISCES. No UNCERTAIN. OD-002 is RESOLVED_BY_PRODUCT_DECISION (explicit user approval, 2026-10-20). The six category_code/EN values are canonical in contentCategoryDecision.js and SOURCE_OF_TRUTH; they are not attributed to the original DB/workbook documents. Source TR display names are unchanged; no live seed is claimed.

### OD-004 timestamp reconciliation — PARTIALLY_VERIFIED
Semantic created_at → native created_date; semantic updated_at → native updated_date, for all 20 entities. No duplicate manual fields are created. A read-only InternalHealthRun response contained both at `2026-10-18T21:25:16.181000`; availability is observed, but the response has no UTC suffix. Native UTC interpretation, create/update mutability, product entity availability and immutable-record updated timestamp behavior still need live proof. The code preserves the native value instead of silently inventing a timezone. An updated timestamp never grants permission to update a snapshot. OD-004 is not resolved; do not treat these aliases as a certified immutable audit clock.

### Canonical uniqueness / atomicity strategy
11 logical UNIQUE contracts plus one-open-deletion-job-per-user use `canonicalUniqueKeys` and one `createOnce` primitive. JSON tuple encoding avoids concatenation collisions. A durable adapter must atomically reserve every key, validate references/owner/account/consent/deletion predicates, commit the record, and support safe readback. Existing daily snapshots are returned unchanged. `mutateConditionally` requires an opaque revision, forbids owner/key changes, rejects conflicts and validates readback. No in-memory lock, check-then-insert, unverified upsert or declared JSON property is accepted as a production guarantee.

Historical 007 atomic protocol: no native atomic adapter was proven; calls to that protocol return ATOMIC_CAPABILITY_REQUIRED. The current 016 entry paths use approved sequential reconciliation/recovery instead. Synthetic concurrent tests use an isolated map and prove helper protocol behavior only. Future daily generation, singleton writes, deletion scheduling and multi-record cycle recomputation stay disabled until durable cross-instance contention/crash/retry proof exists. Multi-record atomicity additionally needs a verified transaction or an approved durable coordinator with fenced ownership, a recoverable commit journal, atomic publication and failure recovery; no journal entity or rollback engine is introduced here. Native transaction/rollback/index support is not claimed.

### Schema field dictionary
Required fields are listed in each JSONC; optional fields are marked NULL below. Native id/created_date/updated_date are omitted from the product property dictionaries.

**user_profile**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| display_name | string; maxLength=50 | NULL / omitted |
| birth_date | string; format=date | required |
| birth_time | string | NULL / omitted |
| birthplace_geonames_id | number | NULL / omitted |
| birthplace_name | string | NULL / omitted |
| birthplace_country_code | string; maxLength=2 | NULL / omitted |
| birthplace_latitude | number; minimum=-90; maximum=90 | NULL / omitted |
| birthplace_longitude | number; minimum=-180; maximum=180 | NULL / omitted |
| sun_sign_code | string; enum=['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'] | NULL / omitted |
| account_status | string; enum=['ACTIVE', 'INACTIVE']; default=ACTIVE | required |

**user_preferences**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| language_code | string; enum=['tr', 'en'] | required |
| notifications_enabled | boolean; default=False | required |
| notification_time | string; enum=['06:00']; default=06:00 | required |
| timezone | string | required |

**user_health_consent**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| consent_status | string; enum=['GRANTED', 'WITHDRAWN'] | required |
| consent_version | string | required |
| granted_at | string; format=date-time | NULL / omitted |
| withdrawn_at | string; format=date-time | NULL / omitted |

**user_health_consent_event**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| event_type | string; enum=['GRANTED', 'WITHDRAWN'] | required |
| consent_version | string | required |
| occurred_at | string; format=date-time | required |

**user_cycle_settings**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| period_duration_days | integer; minimum=1; maximum=10 | NULL / omitted |
| initial_cycle_length_days | integer; minimum=15; maximum=60 | NULL / omitted |

**user_period_record**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| period_start_date | string; format=date | required |

**user_cycle_prediction**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| reference_period_id | string | NULL / omitted |
| predicted_start_date | string; format=date | required |
| predicted_end_date | string; format=date | required |
| estimated_cycle_length_days | integer; minimum=1 | required |
| calculated_at | string; format=date-time | required |

**user_cycle_phase_day**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| phase_date | string; format=date | required |
| phase_code | string; enum=['MENSTRUAL', 'FOLLICULAR', 'OVULATION', 'LUTEAL'] | required |
| calculation_basis | string; enum=['RECORDED_START', 'PREDICTED'] | required |
| reference_period_id | string | NULL / omitted |
| calculated_at | string; format=date-time | required |

**cycle_phase_lookup**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| cycle_length_days | integer; minimum=15; maximum=60 | required |
| period_duration_days | integer; minimum=1; maximum=10 | required |
| cycle_day | integer; minimum=1; maximum=60 | required |
| phase_code | string; enum=['MENSTRUAL', 'FOLLICULAR', 'OVULATION', 'LUTEAL'] | required |

**message_category_lookup**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| category_code | string | required |
| display_name_tr | string | required |
| display_name_en | string | required |

**message_category_mapping**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| sun_sign_code | string; enum=['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'] | required |
| moon_phase_code | string; enum=['NEW', 'WAXING', 'FULL', 'WANING'] | required |
| cycle_phase_code | string; enum=['MENSTRUAL', 'FOLLICULAR', 'OVULATION', 'LUTEAL', 'UNKNOWN'] | required |
| category_id | string | required |

**message_pair**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| category_id | string | required |
| message_tr | string | required |
| suggestion_tr | string | required |
| message_en | string | required |
| suggestion_en | string | required |
| is_active | string; enum=['Active','Inactive']; default=Active | required |

**user_daily_message**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| shinka_date | string; format=date | required |
| timezone | string | required |
| category_id | string | required |
| message_pair_id | string | required |
| generated_at | string; format=date-time | required |
| message_tr_snapshot / suggestion_tr_snapshot / message_en_snapshot / suggestion_en_snapshot | removed from domain and final physical schema | forbidden in new writes; hosted absence verified in 051; DTO text still resolves MessagePair |

**notification_delivery**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| daily_message_id | string | required |
| notification_type | string; enum=['DAILY_SHINKA']; default=DAILY_SHINKA | required |
| scheduled_at | string; format=date-time | required |
| delivery_status | string; enum=['PENDING', 'SENT', 'FAILED', 'SKIPPED'] | required |
| attempt_count | integer; minimum=0; default=0 | required |
| last_attempt_at | string; format=date-time | NULL / omitted |
| sent_at | string; format=date-time | NULL / omitted |
| error_code | string | NULL / omitted |

**user_pattern_summary**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| as_of_date | string; format=date | required |
| timezone | string | required |
| primary_category_id | string | NULL / omitted |
| primary_count | integer; minimum=1 | NULL / omitted |
| secondary_category_id | string | NULL / omitted |
| secondary_count | integer; minimum=1 | NULL / omitted |
| window_start_date | string; format=date | required |
| window_end_date | string; format=date | required |
| calculated_at | string; format=date-time | required |

**moon_phase_lookup**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| phase_code | string; enum=['NEW', 'WAXING', 'FULL', 'WANING'] | required |
| start_at_utc | string; format=date-time | required |
| end_at_utc | string; format=date-time | required |

**admin_audit_log**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| admin_user_id | string | required |
| target_user_id | string | NULL / omitted |
| target_entity | string | required |
| target_record_id | string | NULL / omitted |
| action_type | string; enum=['VIEW', 'UPDATE', 'DELETE'] | required |
| action_status | string; enum=['SUCCESS', 'FAILED'] | required |
| performed_at | string; format=date-time | required |
| error_code | string | NULL / omitted |

**system_error_log**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| error_code | string | required |
| process_name | string | required |
| severity | string; enum=['INFO', 'WARNING', 'ERROR', 'CRITICAL'] | required |
| error_status | string; enum=['OPEN', 'RETRYING', 'RESOLVED'] | required |
| retry_count | integer; minimum=0; default=0 | required |
| last_retry_at | string; format=date-time | NULL / omitted |
| resolved_at | string; format=date-time | NULL / omitted |
| alert_sent_at | string; format=date-time | NULL / omitted |
| correlation_id | string | required |

**health_data_deletion_job**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| protection_event_id | string | required |
| job_status | string; enum=['PENDING', 'PROCESSING', 'RETRYING', 'COMPLETED', 'FAILED'] | required |
| requested_at | string; format=date-time | required |
| started_at | string; format=date-time | NULL / omitted |
| completed_at | string; format=date-time | NULL / omitted |
| retry_count | integer; minimum=0; default=0 | required |
| last_retry_at | string; format=date-time | NULL / omitted |
| error_code | string | NULL / omitted |

**data_protection_event**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| event_type | string; enum=['HEALTH_DATA_DELETION', 'ACCOUNT_DEACTIVATION'] | required |
| event_status | string; enum=['PENDING', 'COMPLETED', 'FAILED'] | required |
| requested_at | string; format=date-time | required |
| completed_at | string; format=date-time | NULL / omitted |

## Capability evidence register at package completion

Current counts: VERIFIED 1; PARTIALLY_VERIFIED 13; UNVERIFIED 8; UNSUPPORTED 2. Native and repository evidence are distinguished per row.

| ID | Capability | Status | Evidence / remaining proof |
|---|---|---|---|
| CAP-01 | Entity field types (Date, Time, Enum, Long Text, Number) | PARTIALLY_VERIFIED | InternalHealthRun schema (string/number/date-time) accepted; Date/Time/Enum semantics not measured. |
| CAP-02 | Single-field UNIQUE | UNSUPPORTED | Base44 official entity-schemas documentation (2026-10-19): native unique constraints unsupported; unknown unique_fields ignored. Generic atomic adapter remains unproven. Onboarding uses SDK keyed upsert; live cross-instance uniqueness is not established. |
| CAP-03 | Compound UNIQUE | UNSUPPORTED | Same official native UNIQUE limitation. Synthetic createIfAbsent protocol tests do not establish platform atomicity. |
| CAP-04 | Indexes | UNVERIFIED | No declarative index mechanism proven. |
| CAP-05 | FK / reference integrity | UNVERIFIED | No FK declaration proven; backend equivalent required. |
| CAP-06 | Transaction / rollback (multi-record atomicity) | UNVERIFIED | Not measured. |
| CAP-07 | Conditional update | UNVERIFIED | Not measured. |
| CAP-08 | Concurrency safety | UNVERIFIED | Not measured. |
| CAP-09 | Auth providers (Apple + Google only) | PARTIALLY_VERIFIED | Repository policy implemented (OD-003); recorded snapshot and 032 read-only dashboard inspection (2026-10-22) show Apple/Google enabled, default Base44 Google OAuth. Live/native provider sign-in remains unverified. |
| CAP-10 | Row / owner security (RLS) | PARTIALLY_VERIFIED | 20 product schemas deny direct SDK CRUD; backend filters owner using auth.me().id, ACTIVE/consent gates. Synthetic cross-owner tests pass; live identities still required. |
| CAP-11 | Admin role authorization (platform-native) | PARTIALLY_VERIFIED | One shared auth.me()/admin guard for tooling and domain access; read-only CLI confirms current principal role admin. Separate non-admin live 403 evidence pending. |
| CAP-12 | Backend function execution | VERIFIED | validateContentArtifacts executed 2026-10-18 (live + fixture modes) returning structured results. |
| CAP-13 | Scheduler | PARTIALLY_VERIFIED | 033 local manual/machine separation and secret comparison; owner accepts scoped shared secret. Registration and secure workflow reference/transport remain unbound; disabled. |
| CAP-14 | Secrets | PARTIALLY_VERIFIED | Existing GeoNames evidence retained. 033 scheduler uses only synthetic readers; official request-time/set/delete publication behavior documented, actual registration NOT_RUN. |
| CAP-15 | GeoNames backend proxy | PARTIALLY_VERIFIED | Search/resolve and cascading lists implemented with synthetic boundary tests; user-reported Preview search HTTP 200 returned eight places. New hosted selection/resolve/save/readback remains unverified. |
| CAP-16 | Astronomy Engine execution in backend | PARTIALLY_VERIFIED | Repository backend generator and local Node/browser reference tests implemented; hosted execution/import unverified. |
| CAP-17 | Native push | PARTIALLY_VERIFIED | 034 user-relayed Dmytro / Base44 Support confirms only user_id/title/content/action_label/action_url names. Unknown/misnamed fields may be silently dropped on success; this proves neither all-field processing nor device display. Official integration docs confirm 100/500/50 limits, optional action/link and Home default. Full wire types/requiredness/nullability/Unicode counting, native User mapping, concrete acceptance/error/no-device response, eligibility/idempotency and logout/account rebinding remain open; adapter UNKNOWN, entry disabled. No new hosted/device evidence. |
| CAP-18 | Backup | UNVERIFIED | Not measured. |
| CAP-19 | Restore (deleted health data must not reappear) | UNVERIFIED | Not measured. |
| CAP-21 | Backend-only writes / service-role bypass | PARTIALLY_VERIFIED | Official security docs: service role bypasses RLS/FLS. Schemas deny direct writes; specific non-serializable server grants guard future workers. No live mutation enforcement test. |
| CAP-22 | Immutable / protected record enforcement | PARTIALLY_VERIFIED | Deployed enforcement pending. Repository RLS and shared guard deny protected human mutations and immutable system updates; synthetic negative tests cover all five protected entities. |
| CAP-23 | Native timestamp mapping (OD-004) | PARTIALLY_VERIFIED | 2026-10-19 read-only InternalHealthRun response includes created_date/updated_date. UTC offset absent; product timestamps, mutability and immutable updated timestamp semantics not live-proven. |
| CAP-24 | Nullable / optional field representation | PARTIALLY_VERIFIED | Optional fields use documented types; canonical validation normalizes absent values to logical NULL. Onboarding sends explicit NULLs to clear merging SDK updates and verifies readback; native NULL storage remains unverified. |
| CAP-20 | Deployment rollback | UNVERIFIED | Not measured. |

## Onboarding persistence mapping — current package

Exactly 20 product entities remain. No onboarding entity, progress field, calculation default, synthetic user, or uniqueness schema extension was added. Built-in User remains canonical identity.

| Step | Approved records | Semantics |
|---|---|---|
| Preferences | user_preferences | owner singleton; tr/en; valid device IANA or existing valid zone; false; 06:00. Missing new-user timezone produces retry. |
| Profile | user_profile | required adult DOB; trimmed optional name; optional genuine HH:mm; coherent five-field birthplace or all NULL; Sun is derived solely from birth_date using the approved fixed tropical table; missing time remains NULL and does not influence the sign. |
| Cycle grant | user_health_consent + user_health_consent_event + user_period_record | sequential verified current GRANTED, immutable event payload and actual period date last; production path uses approved health-consent-v1.0 and exact explicit EN/TR consent; no transaction claim. |
| Optional settings | user_cycle_settings | created only when at least one setting was entered; the other stays NULL. Start-only creates no settings row (logical values absent/NULL). |
| Skip | none | no fake health values, consent, predictions or phase rows. |

Canonical validation normalizes absent values to logical NULL. The production onboarding adapter explicitly sends NULL for absent optional fields because SDK updates merge, and verifies the cleared values on readback; native NULL support remains a live obligation. No 00:00 fallback reaches the Sun resolver; 5/28 remain UI placeholders and future calculation defaults only. Existing direct SDK deny policies and generic mutation denials remain. Profile/preferences retain user_id keys; new ON-05 consent/settings use insert-only create plus bounded singleton readback. Consent-event keys include all four domain fields; period keys use user_id + period_start_date. Existing period state rejects a different onboarding start. No action-receipt field/entity is added. The generic atomic protocol remains unchanged and synthetic-only; onboarding uses a separate sequential SDK adapter with explicit partial-failure behavior. All four onboarding source decisions are RESOLVED_BY_PRODUCT_DECISION. A real owner user_daily_message is the final completion marker; before it exists Skip may resume at ON-05 after restart. No product schema changed. Native live capabilities remain unverified.

## Current birthplace persistence invariant

035 supersedes the historical P-only/cascade rule. A country/administrative A record or populated P record may be a selected birthplace. Continue sends only its numeric ID; the backend resolves and validates birthplace_geonames_id, birthplace_name, birthplace_country_code, birthplace_latitude and birthplace_longitude together. Explicit clearing writes five NULLs. Existing saved values display without provider access; text editing invalidates the old ID. Native hosted NULL/readback and real provider availability remain external acceptance.

## Maintenance data impact

The initial package 009 maintenance changed no product schema, field or persistence contract; its ON-05 correction below reconciles consent timestamp authority without changing the schema. Read-only place actions skip the unused preferences read after owner/profile checks. Public list cache is memory-only, per picker and bounded; no selected path/cache is stored in entities. Internal Build's five-package policy affects generated repository history only. InternalHealthRun, protected audit/history and user rows are not deleted or subject to that policy. New package 009 remains pre-content; H05-009 still requires real zero counts and no import.

## ON-05 consent timestamp contract — correction, 2026-10-20

`granted_at` is an existing business field, distinct from the storage row creation metadata. For a new explicit grant, the authenticated backend creates one UTC ISO instant and persists it in UserHealthConsent. A valid existing GRANTED row's exact granted_at is authoritative for retry/reload and UserHealthConsentEvent.occurred_at; no retry reissues or rewrites it. Existing invalid/missing grant time, contradictory withdrawn_at, different version, orphan health/history or duplicate owner rows require a conflict response, not an inferred timestamp or silent migration. Optional cycle inputs remain logical NULL; start-only creates no settings row. Native created_date/updated_date aliases remain unchanged and unvalidated as storage metadata; no Z suffix, device timezone or native-clock fallback is introduced.

The [official schema documentation](https://docs.base44.com/developers/backend/resources/entities/entity-schemas) defines created_date as record creation time and supplies no explicit serialized timezone guarantee; it also explicitly disclaims unique constraints. [SDK entities documentation](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities) describes upsert as merging supplied fields into existing matches. Therefore upsert by owner must not be used to replace consent business time under racing initial grants. Insert-only and readback preserve existing rows but cannot establish distributed uniqueness. OD-004 remains PARTIALLY_VERIFIED for native audit metadata.

The agent observed one live consent row with visible granted_at and Created values, and zero consent-event/period rows in the Greenfield Data UI. These formatted cells do not establish raw API type/timezone or owner-specific identity correlation. See the minimized [incident evidence](reports/SHINKA_ON05_CONSENT_RECOVERY.md).


## Historical checkpoint — Daily content persistence and import — Buildmarker-011

No product field/entity/RLS declaration changes. Source Pair ID → native pair ID is reconstructed by exact canonical content identity and verified in the controlled import result; the native id remains platform-owned. Source hash/version/counts live in the repository manifest/receipt and returned verification, not invented entity fields. Admin apply audit uses existing metadata-only admin_audit_log; dry-run and verify do not write.

Daily assignment fields, with the explicit 045 source-contract amendment: authenticated user_id, backend-derived shinka_date, validated timezone, actual category_id, message_pair_id, backend UTC generated_at. The original four text fields are superseded by 045: same-day assignment stays unchanged and response text resolves current MessagePair. A legitimate earlier daily row remains the completion signal even if today's generation fails.

> Historical contract (superseded by the current 016 native contract above):
> Native compound uniqueness remains UNSUPPORTED. `createOnce` is used with its documented atomic requirements, now including an exact consent input predicate when health data influenced selection. Production has no accepted adapter and new daily writes are disabled. The SDK's upsert merge semantics cannot implement immutable winner selection. A native platform conditional-create guarantee, or an approved authoritative transactional store with UNIQUE(user_id,shinka_date) and a crash-safe integration/guard protocol, is required before enabling production. In-memory fixture concurrency is protocol proof only. No transaction/rollback/distributed-lock guarantee is claimed.

Current-day cycle inputs are calculated in memory. NULL settings stay NULL; no predictions/phase-day/lookup rows are fabricated to mark onboarding complete. Moon reference import is explicit admin work, with at least two future years and strict UTC continuity; no scheduler is active.

## OD-002 category data completion

The approved six-row definition populates only existing `message_category_lookup.category_code`, `display_name_tr`, `display_name_en` through the controlled importer. No entity, field, RLS policy or native ID contract changes. Codes are REST_AND_SLOW_DOWN, SELF_CARE_AND_WELLBEING, NOVELTY_AND_DISCOVERY, FOCUS_AND_PROGRESS, CONNECTION_AND_SHARING and SIMPLICITY_AND_LETTING_GO, each associated with exactly one source label in the [approval table](SHINKA_CONTENT_MODEL.md#approved-category-definition--od-002-continuation). Pair/mapping category references resolve through these source labels to verified native category IDs; the source associations and four language text cells are unchanged. Business uniqueness validation is not native Base44 uniqueness evidence.


## Historical checkpoint — Calendar data and atomic adapter contract — Buildmarker-012

Exactly 20 product schemas remain; no speculative receipt/revision/journal entity, timestamp alias or RLS relaxation is added. Actual starts retain native ID on edit. `user_cycle_prediction` stores full predicted cycle intervals (inclusive end); Calendar colors their menstrual portion through shared phase calculation. `user_cycle_phase_day` stores one owner/date, RECORDED_START or PREDICTED, valid actual reference and backend UTC calculated_at. Recompute reuses unchanged rows; last-start deletion clears derived collections only, keeping settings and consent. Historical daily records are immutable and excluded entirely.

`domainAtomic.commitCalendarAction` requires a server-owned `transactCalendar` implementation. It must serialize by authenticated owner across workers, read complete authoritative state, check ACTIVE/current consent/open deletion/references and expected revision, and atomically publish the actual change, derived replacement, consent/event when needed, and durable owner/action receipt. Receipt binds operation/target/date/explicit consent; same receipt with another payload conflicts. Replay returns current state without reapplying old writes or replacing the grant time, including after response loss. If current state differs from the receipt's committed revision, return CALENDAR_STATE_CHANGED rather than report a stale save as success. The adapter retains the projection's calculationDay alongside its transaction metadata so later-day replay verifies the committed projection rather than pretending a rolling cache was refreshed. These are adapter prerequisites, not added Base44 product fields.

> Historical contract (superseded by the current 016 native contract above):
> No production implementation or external store is configured. A compliant store must also be the source used by Calendar, Home, onboarding, consent and deletion readers/writers; a shadow store plus separate Base44 updates cannot supply the guarantee. Native UNIQUE remains unsupported; cross-collection transaction/CAS/rollback remain unverified. [Official schemas](https://docs.base44.com/developers/backend/resources/entities/entity-schemas#uniqueness), [SDK merge behavior](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities#upsert) and [Actors overview](https://docs.base44.com/developers/backend/resources/actors/overview) were rechecked 2026-10-20. None supplies evidence of an atomic commit across these Entity collections. Native documented transaction support or an approved authoritative transactional store with migration/guard/recovery design is needed.

Read-only Calendar uses owner-filtered pages of 100 starts, maximum 2,500 plus overflow detection; it never truncates and calculates success. A 40,000-day computation safety ceiling fails explicitly. Access and complete observation snapshots are re-read to detect changes; this is best-effort race detection, not snapshot isolation. Returned month contains only actual IDs/dates, recorded/predicted days and safe status/revision; no complete history, grant time, native metadata or tokens. Missing persisted derived rows after onboarding do not cause writes: the response is a read-time projection.

OD-012 now preserves >60-day observations and excludes them only from estimation within the fixed last-three window; see the 014 contract below. Settings are never clamped or filled with 5/28. No live data migration, import or write occurred.

## Historical checkpoint — Admin Test Tools operational state — 013 user decision

`AdminTestOperation` is a second internal tooling entity, outside the unchanged 20 product entities and built-in User. It stores operation/request ID, actor ID, target ID, closed operation/status enums, stage/checkpoints, preview fingerprint, server UTC started_at/progressed_at/completed_at business times and safe error code. Native created_date/updated_date are not duplicated or interpreted as workflow time. It stores no profile/health values, message snapshots, provider IDs or tokens. Direct read/create/update/delete RLS are false; the admin endpoint returns a bounded metadata projection. Operation identity, target exclusivity and conditional progress are required adapter constraints, **not** JSON-schema unique/FK declarations.

DELETE_USER stages: stop PENDING/FAILED notifications as SKIPPED; remove phase/prediction children, cycle settings and period parents, pattern summary, preferences, profile; call service-role User.delete(id); verify absence and stopped jobs; persist final audit/result. Retain current consent metadata, immutable consent events/daily messages, all audit/protection/deletion history and notifications. Shared lookup/content and unscoped system errors are untouched. See the exhaustive 20-entity scope/indirect-edge table in the [report](reports/SHINKA_ADMIN_TEST_TOOLS.md).

Retained actor/target/user references after physical deletion are historical identifiers, never reassigned or cascade-deleted. A COMPLETED DELETE operation is a permanent tombstone. RESET_ACTIVE stages PROFILE → CYCLE → FIRST_SHINKA → COMPLETED/DONE override old daily-based completion; reset creates no consent event and changes no grant time or existing product row by itself. Normal validated writes and stage advancement must commit with a durable receipt. Same-day daily snapshots are reused. This historical admin-test policy retained failed/start/result records; it does not authorize retention under 023 owner erasure, which removes owner-related journals/audit rows. For ordinary admin-test history, the five-package UI history rule does not apply.


## Historical checkpoint — OD-012 and proposed physical authority — 014

No entity/RLS/field change in this package. `dailyCycle.cycleEstimate` returns nullable length when the last-three completed window contains no 15–60 interval. Empty completed history still uses entered initial length or computation-only 28. `calculateCalendar` preserves all actual observations, emits no phase rows for unsupported closed intervals, keeps supported historical phases, and emits no current/future phases or predictions without an estimate. `planCalendarChange` replaces derived sets, so stale rows are removed in the same proposed commit. No default is written into settings; existing daily rows are untouched.

> Historical contract (superseded by the current 016 native contract above):
> The PostgreSQL proposal in [decision 014](reports/SHINKA_PERSISTENCE_DECISION_014.md) changes physical authority and derived storage only after approval/migration. Until then the 20 product schemas, two tooling schemas and native User extension remain authoritative as currently implemented. Actor storage is not treated as an Entity transaction. A full 23-schema release snapshot and schema-only Git patch can be prepared with `scripts/prepareSchemaStage.mjs`; it executes no deployment. Missing lifecycle schema still fails closed.
>