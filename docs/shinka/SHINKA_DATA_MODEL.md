# SHINKA — Data Model

**Document:** SHINKA_DATA_MODEL.md
**Status:** ACTIVE — documented only (no domain entity physically created)
**Current BuildMarker:** Buildmarker-006
**Last Updated:** 2026-10-19
**Authoritative Source References:** SRC-05 DB v1.2, SRC-07 Entity_Iliskiler v1.2 (SRC-06 v1.1 superseded)
**Purpose:** Authoritative 20-entity product contract and its Base44 dependencies.
**Scope:** Product domain entities + separately listed internal tooling storage.
**Implemented:** Contract in `src/foundation/domainContract.js`; 0 of 20 physically created.
**Open Decisions:** OD-002, OD-004, OD-009
**External Verification Required:** UNIQUE, compound UNIQUE, indexes, FK, transactions (all UNVERIFIED).

Common: every user entity owns `user_id` → Base44 User.id (owner from auth context). Date = local YYYY-MM-DD; instant = UTC; time = local HH:mm; timezone = IANA. Optional user inputs stay NULL (5/28 defaults and 00:00 are calculation-only).

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

Relationships: 24 logical links from `21_Iliskiler` (see domainContract.js). Deleted health entities must never leave dangling references.

**Base44 dependency:** every UNIQUE/INDEX/FK above is UNVERIFIED; if unsupported, a race-safe backend equivalent must be proven before the owning package closes.

## INTERNAL TOOLING STORAGE (excluded from the 20)
| Entity | Purpose | Access |
|---|---|---|
| InternalHealthRun | Health run history (redacted report JSON, counts) | admin-only RLS (read/create/update/delete) |

Build Ledger is SOURCE-based (`src/foundation/buildLedger.js`), not an entity.

## Internal diagnostic storage hardening
InternalHealthRun remains tooling-only, outside the 20 domain entities. Admin read is declared in RLS; client create/update/delete is denied. The server-admin internalHealth function alone creates summary records after validating the report and creating a private artifact. Compact report_json is bounded to 15,000 UTF-8 bytes; full redacted report_file_uri points to private storage. Stored summaries and signed readback are synthetic-tested; final live RLS/persistence/readback is unverified. OD-004/OD-009 remain future product-model decisions.
