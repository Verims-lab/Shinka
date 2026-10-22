# SHINKA — Data Model

**Document:** SHINKA_DATA_MODEL.md
**Status:** ACTIVE — 20 physical repository schemas; deployed verification pending
**Current BuildMarker:** Buildmarker-028
**Last Updated:** 2026-10-22
**Authoritative Source References:** SRC-05 DB v1.2, SRC-07 Entity_Iliskiler v1.2 (SRC-06 v1.1 superseded)
**Purpose:** Authoritative 20-entity product contract and its Base44 dependencies.
**Scope:** Product domain entities + separately listed internal tooling storage.
**Implemented:** 20 JSONC schemas in `base44/entities/`, canonical definitions in `base44/shared/domainSchemas.js`, source field receipt, validation and guarded backend access.
**Open Decisions:** OD-004, OD-009; OD-002 RESOLVED_BY_PRODUCT_DECISION
**External Verification Required:** Base44 native UNIQUE is unsupported; no multi-record transaction/CAS guarantee is claimed. Native handler tests use synthetic transport; hosted schema/authorization/mutation recovery remains pending.

Common: every user entity owns `user_id` → Base44 User.id (owner from auth context). Date = local YYYY-MM-DD; instant = UTC; time = local HH:mm; timezone = IANA. Optional user inputs stay NULL. 5/28 are cycle calculation defaults; the approved Sun rule uses only birth_date and has no time fallback.

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

Daily history uses only id,user_id,shinka_date,timezone,category_id,generated_at with owner and [today−29,today] predicates, limit 4001. More than 4000 rows, duplicate IDs or malformed/foreign/out-of-range rows fail rather than truncate. One request below the pinned SDK's 5000 limit avoids offset-page shifting; a second limit-1 earliest-date query determines early-history window metadata and checks visible inconsistency. Category lookup requests 7 sentinel rows and requires the six exact approved unique codes/names/native IDs. Moon requests at most 33 sentinel rows overlapping ±35 UTC days, rejects >32 and validates continuity/order/UTC fields before selecting the enclosing cycle. No product text or health table is needed.

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
| 13 | user_daily_message | one immutable snapshot per user/local day | user | immutable | UNIQUE(user_id, shinka_date); INDEX(user_id, generated_at) | ordinary/admin immutable; owner erasure removes all candidates |
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
| is_active | string; enum=['Active']; default=Active | required |

**user_daily_message**

| Field | Physical type / constraint | Requirement |
|---|---|---|
| user_id | string | required |
| shinka_date | string; format=date | required |
| timezone | string | required |
| category_id | string | required |
| message_pair_id | string | required |
| message_tr_snapshot | string | required |
| suggestion_tr_snapshot | string | required |
| message_en_snapshot | string | required |
| suggestion_en_snapshot | string | required |
| generated_at | string; format=date-time | required |

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

Current counts: VERIFIED 1; PARTIALLY_VERIFIED 11; UNVERIFIED 10; UNSUPPORTED 2. Native and repository evidence are distinguished per row.

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
| CAP-09 | Auth providers (Apple + Google only) | PARTIALLY_VERIFIED | Repository policy implemented (OD-003); recorded platform snapshot lists Apple/Google. Current dashboard configuration and live provider sign-in remain unverified. |
| CAP-10 | Row / owner security (RLS) | PARTIALLY_VERIFIED | 20 product schemas deny direct SDK CRUD; backend filters owner using auth.me().id, ACTIVE/consent gates. Synthetic cross-owner tests pass; live identities still required. |
| CAP-11 | Admin role authorization (platform-native) | PARTIALLY_VERIFIED | One shared auth.me()/admin guard for tooling and domain access; read-only CLI confirms current principal role admin. Separate non-admin live 403 evidence pending. |
| CAP-12 | Backend function execution | VERIFIED | validateContentArtifacts executed 2026-10-18 (live + fixture modes) returning structured results. |
| CAP-13 | Scheduler (06:00 local, rolling jobs) | UNVERIFIED | Not measured. |
| CAP-14 | Secrets | PARTIALLY_VERIFIED | Request-scoped backend secret binding and synthetic entry tests; user reports configured secret and Preview search HTTP 200. Secret value not inspected; independent hosted list/save verification pending. |
| CAP-15 | GeoNames backend proxy | PARTIALLY_VERIFIED | Search/resolve and cascading lists implemented with synthetic boundary tests; user-reported Preview search HTTP 200 returned eight places. New hosted selection/resolve/save/readback remains unverified. |
| CAP-16 | Astronomy Engine execution in backend | PARTIALLY_VERIFIED | Repository backend generator and local Node/browser reference tests implemented; hosted execution/import unverified. |
| CAP-17 | Native push (iOS/Android) | UNVERIFIED | Requires DEVICE evidence. |
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

## ON-04 cascade persistence invariant

Country, administrative path, page offsets and list state exist only in the in-memory picker. No schema, entity, seed or profile field is added. Final selection must be a populated GeoNames record (featureClass P); administrative A/ADM records only narrow lists and are rejected by selected-ID resolution. Continue sends birthplace_geonames_id only. The backend resolves it independently and persists exactly birthplace_geonames_id, birthplace_name, birthplace_country_code, birthplace_latitude, birthplace_longitude, together or all NULL. Existing stored birthplace is displayed without requiring its hierarchy; loading failure cannot silently clear it. Native hosted NULL clearing and readback remain external proof requirements.

## Maintenance data impact

The initial package 009 maintenance changed no product schema, field or persistence contract; its ON-05 correction below reconciles consent timestamp authority without changing the schema. Read-only place actions skip the unused preferences read after owner/profile checks. Public list cache is memory-only, per picker and bounded; no selected path/cache is stored in entities. Internal Build's five-package policy affects generated repository history only. InternalHealthRun, protected audit/history and user rows are not deleted or subject to that policy. New package 009 remains pre-content; H05-009 still requires real zero counts and no import.

## ON-05 consent timestamp contract — correction, 2026-10-20

`granted_at` is an existing business field, distinct from the storage row creation metadata. For a new explicit grant, the authenticated backend creates one UTC ISO instant and persists it in UserHealthConsent. A valid existing GRANTED row's exact granted_at is authoritative for retry/reload and UserHealthConsentEvent.occurred_at; no retry reissues or rewrites it. Existing invalid/missing grant time, contradictory withdrawn_at, different version, orphan health/history or duplicate owner rows require a conflict response, not an inferred timestamp or silent migration. Optional cycle inputs remain logical NULL; start-only creates no settings row. Native created_date/updated_date aliases remain unchanged and unvalidated as storage metadata; no Z suffix, device timezone or native-clock fallback is introduced.

The [official schema documentation](https://docs.base44.com/developers/backend/resources/entities/entity-schemas) defines created_date as record creation time and supplies no explicit serialized timezone guarantee; it also explicitly disclaims unique constraints. [SDK entities documentation](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities) describes upsert as merging supplied fields into existing matches. Therefore upsert by owner must not be used to replace consent business time under racing initial grants. Insert-only and readback preserve existing rows but cannot establish distributed uniqueness. OD-004 remains PARTIALLY_VERIFIED for native audit metadata.

The agent observed one live consent row with visible granted_at and Created values, and zero consent-event/period rows in the Greenfield Data UI. These formatted cells do not establish raw API type/timezone or owner-specific identity correlation. See the minimized [incident evidence](reports/SHINKA_ON05_CONSENT_RECOVERY.md).


## Historical checkpoint — Daily content persistence and import — Buildmarker-011

No product field/entity/RLS declaration changes. Source Pair ID → native pair ID is reconstructed by exact canonical content identity and verified in the controlled import result; the native id remains platform-owned. Source hash/version/counts live in the repository manifest/receipt and returned verification, not invented entity fields. Admin apply audit uses existing metadata-only admin_audit_log; dry-run and verify do not write.

Daily snapshot fields are precisely the existing source contract: authenticated user_id, backend-derived shinka_date, validated timezone, actual category_id, message_pair_id, all four TR/EN text snapshots and backend UTC generated_at. Existing same-day rows are returned unchanged regardless of locale/profile/library changes. A legitimate earlier daily row remains the completion signal even if today's generation fails.

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