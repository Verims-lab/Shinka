# SHINKA — Data Model

**Document:** SHINKA_DATA_MODEL.md
**Status:** ACTIVE — 20 physical repository schemas; deployed verification pending
**Current BuildMarker:** Buildmarker-009
**Last Updated:** 2026-10-20
**Authoritative Source References:** SRC-05 DB v1.2, SRC-07 Entity_Iliskiler v1.2 (SRC-06 v1.1 superseded)
**Purpose:** Authoritative 20-entity product contract and its Base44 dependencies.
**Scope:** Product domain entities + separately listed internal tooling storage.
**Implemented:** 20 JSONC schemas in `base44/entities/`, canonical definitions in `base44/shared/domainSchemas.js`, source field receipt, validation and guarded backend access.
**Open Decisions:** OD-002, OD-004, OD-009
**External Verification Required:** Native UNIQUE/compound UNIQUE are UNSUPPORTED by official documentation. Index/FK/conditional update/transaction/rollback remain UNVERIFIED. Deployed enforcement pending.

Common: every user entity owns `user_id` → Base44 User.id (owner from auth context). Date = local YYYY-MM-DD; instant = UTC; time = local HH:mm; timezone = IANA. Optional user inputs stay NULL. 5/28 are future cycle calculation defaults; the approved Sun rule uses only birth_date and has no time fallback.

## PRODUCT DOMAIN ENTITIES (20)
| # | Entity | Purpose | Owner | Lifecycle | Uniqueness / index | Deletion |
|---|---|---|---|---|---|---|
| 1 | user_profile | Profile + account_status | user | editable | UNIQUE(user_id) | Delete Account → INACTIVE |
| 2 | user_preferences | language, notifications, notification_time 06:00, timezone | user | editable | UNIQUE(user_id) | retained |
| 3 | user_health_consent | current consent state | user | editable state | UNIQUE(user_id) | retained (metadata) |
| 4 | user_health_consent_event | GRANTED/WITHDRAWN history | user | append-only | — | never by admin |
| 5 | user_cycle_settings | entered duration/length (NULL if not entered) | user | editable | UNIQUE(user_id) | deleted on withdrawal |
| 6 | user_period_record | recorded starts | user | editable (update same id) | INDEX(user_id, period_start_date); ≥15 days | withdrawal / single delete |
| 7 | user_cycle_prediction | predicted cycles | user | derived | — | withdrawal; atomic recompute |
| 8 | user_cycle_phase_day | per-day phase cache | user | derived | UNIQUE(user_id, phase_date) | withdrawal |
| 9 | cycle_phase_lookup | length × duration × day → phase | system | reference | UNIQUE(cycle_length_days, period_duration_days, cycle_day) | not deletable |
| 10 | message_category_lookup | six categories | system | reference | UNIQUE(category_code) | not deletable |
| 11 | message_category_mapping | 240 mappings | system | reference | UNIQUE(sun_sign_code, moon_phase_code, cycle_phase_code) | not deletable |
| 12 | message_pair | 260+ TR/EN pairs, is_active "Active" | system | editable text | INDEX(category_id, is_active) | no delete function |
| 13 | user_daily_message | one immutable snapshot per user/local day | user | immutable | UNIQUE(user_id, shinka_date); INDEX(user_id, generated_at) | never by admin |
| 14 | notification_delivery | push job per message | user | stateful | UNIQUE(daily_message_id, notification_type) | retained |
| 15 | user_pattern_summary | single current summary | user | derived single row | UNIQUE(user_id) | overwritten |
| 16 | moon_phase_lookup | UTC phase intervals | system | rolling reference | INDEX(start_at_utc) | not user-deletable |
| 17 | admin_audit_log | admin VIEW/UPDATE/DELETE | system | append-only | INDEX(admin_user_id, performed_at) | never |
| 18 | system_error_log | deduplicated errors | system | stateful | — | retained |
| 19 | health_data_deletion_job | verified deletion | system | backend-only state | one open job per user | admin cannot complete/delete |
| 20 | data_protection_event | deletion/deactivation decision | system | append-only | — | never by admin |

Relationships: 25 logical links (see domainContract.js): 24 from `21_Iliskiler`, plus health_data_deletion_job.user_id → User.id explicitly required by SRC-05 §8.3 and SRC-07 entity sheet 19. Deleted health entities must never leave dangling references.

**Base44 dependency:** native UNIQUE is unsupported; remaining INDEX/FK capabilities are unverified. The single atomic adapter contract below fails closed until a durable implementation is proven.

## INTERNAL TOOLING STORAGE (excluded from the 20)
| Entity | Purpose | Access |
|---|---|---|
| InternalHealthRun | Health run history (redacted report JSON, counts) | admin read; direct create/update/delete denied |

Build Ledger is SOURCE-based (`src/foundation/buildLedger.js`), not an entity.

## Internal diagnostic storage hardening
InternalHealthRun remains tooling-only, outside the 20 domain entities. Admin read is declared in RLS; client create/update/delete is denied. The server-admin internalHealth function alone creates summary records after validating the report and creating a private artifact. Compact report_json is bounded to 15,000 UTF-8 bytes; full redacted report_file_uri points to private storage. Stored summaries and signed readback are synthetic-tested; final live RLS/persistence/readback is unverified. OD-004/OD-009 are PARTIALLY_VERIFIED with external live evidence required.

## Buildmarker-007 physical mapping and field contract
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

`validateDomainRecord` enforces required fields, unknown-field rejection, ranges, enum values, valid local dates, UTC `Z` event instants, HH:mm, IANA timezone, coherent birthplace fields, consent timestamps, Pattern category/count pairs and positive Moon intervals. Age validation is implemented by the onboarding backend. ≥15-day inter-record spacing, Moon continuity, calculation/fallback and restore workflows remain future. Generic mutation routes stay disabled; onboarding uses its specific fail-closed atomic contract.

Optional fields use documented primitive types without `required`. Canonical logical NULL validation omits absent fields; reads normalize absence to NULL. The scoped onboarding adapter sends explicit NULLs when clearing merging SDK updates (see current-package mapping below). No `nullable`, unsupported type union or invented unique/index syntax is asserted. Native explicit-null acceptance remains unverified. No synthetic time or 5/28 calculation default is persisted. These are wire/storage adaptations, not entered values. Required schema fields with declared defaults are filled by the backend validator.

Sun codes adapt the 12 source signs in order: Koç→ARIES, Boğa→TAURUS, İkizler→GEMINI, Yengeç→CANCER, Aslan→LEO, Başak→VIRGO, Terazi→LIBRA, Akrep→SCORPIO, Yay→SAGITTARIUS, Oğlak→CAPRICORN, Kova→AQUARIUS, Balık→PISCES. No UNCERTAIN. Category codes/EN labels remain OD-002 OPEN and no guessed values are seeded.

### OD-004 timestamp reconciliation — PARTIALLY_VERIFIED
Semantic created_at → native created_date; semantic updated_at → native updated_date, for all 20 entities. No duplicate manual fields are created. A read-only InternalHealthRun response contained both at `2026-10-18T21:25:16.181000`; availability is observed, but the response has no UTC suffix. Native UTC interpretation, create/update mutability, product entity availability and immutable-record updated timestamp behavior still need live proof. The code preserves the native value instead of silently inventing a timezone. An updated timestamp never grants permission to update a snapshot. OD-004 is not resolved; do not treat these aliases as a certified immutable audit clock.

### Canonical uniqueness / atomicity strategy
11 logical UNIQUE contracts plus one-open-deletion-job-per-user use `canonicalUniqueKeys` and one `createOnce` primitive. JSON tuple encoding avoids concatenation collisions. A durable adapter must atomically reserve every key, validate references/owner/account/consent/deletion predicates, commit the record, and support safe readback. Existing daily snapshots are returned unchanged. `mutateConditionally` requires an opaque revision, forbids owner/key changes, rejects conflicts and validates readback. No in-memory lock, check-then-insert, unverified upsert or declared JSON property is accepted as a production guarantee.

There is NO production atomic adapter. Calls requiring it return ATOMIC_CAPABILITY_REQUIRED. Synthetic concurrent tests use an isolated map and prove helper protocol behavior only. Future daily generation, singleton writes, deletion scheduling and multi-record cycle recomputation stay disabled until durable cross-instance contention/crash/retry proof exists. Multi-record atomicity additionally needs a verified transaction or an approved durable coordinator with fenced ownership, a recoverable commit journal, atomic publication and failure recovery; no journal entity or rollback engine is introduced here. Native transaction/rollback/index support is not claimed.

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

Current counts: VERIFIED 1; PARTIALLY_VERIFIED 10; UNVERIFIED 11; UNSUPPORTED 2. Native and repository evidence are distinguished per row.

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
| CAP-16 | Astronomy Engine execution in backend | UNVERIFIED | Not implemented. |
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

Canonical validation normalizes absent values to logical NULL. The production onboarding adapter explicitly sends NULL for absent optional fields because SDK updates merge, and verifies the cleared values on readback; native NULL support remains a live obligation. No 00:00 fallback reaches the Sun resolver; 5/28 remain UI placeholders and future calculation defaults only. Existing direct SDK deny policies and generic mutation denials remain. Production singleton keys are user_id; consent-event keys include all four domain fields; period keys use user_id + period_start_date. Existing period state rejects a different onboarding start. No action-receipt field/entity is added. The generic atomic protocol remains unchanged and synthetic-only; onboarding uses a separate sequential SDK adapter with explicit partial-failure behavior. All four onboarding source decisions are RESOLVED_BY_PRODUCT_DECISION. A real owner user_daily_message is the final completion marker; before it exists Skip may resume at ON-05 after restart. No product schema changed. Native live capabilities remain unverified.

## ON-04 cascade persistence invariant

Country, administrative path, page offsets and list state exist only in the in-memory picker. No schema, entity, seed or profile field is added. Final selection must be a populated GeoNames record (featureClass P); administrative A/ADM records only narrow lists and are rejected by selected-ID resolution. Continue sends birthplace_geonames_id only. The backend resolves it independently and persists exactly birthplace_geonames_id, birthplace_name, birthplace_country_code, birthplace_latitude, birthplace_longitude, together or all NULL. Existing stored birthplace is displayed without requiring its hierarchy; loading failure cannot silently clear it. Native hosted NULL clearing and readback remain external proof requirements.

## Maintenance data impact

Package 009 changes no product schema, field or persistence contract. Read-only place actions skip the unused preferences read after owner/profile checks. Public list cache is memory-only, per picker and bounded; no selected path/cache is stored in entities. Internal Build's five-package policy affects generated repository history only. InternalHealthRun, protected audit/history and user rows are not deleted or subject to that policy. New package 009 remains pre-content; H05-009 still requires real zero counts and no import.
