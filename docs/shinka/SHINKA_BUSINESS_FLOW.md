# SHINKA — Business Flow Contracts

**Document:** SHINKA_BUSINESS_FLOW.md
**Status:** ACTIVE — contract summary (not implemented)
**Current BuildMarker:** Buildmarker-002
**Last Updated:** 2026-10-18
**Authoritative Source References:** SRC-01 İş Analizi v2.5 (primary), SRC-02 Use Case v1.4
**Purpose:** Translate binding business behavior into implementation contracts.
**Scope:** Account, Onboarding, Home, Calendar, Pattern, You, Health Consent, Daily Content, Notifications, Data Protection.
**Implemented:** None (foundation package only).
**Not Implemented:** All sections below.
**Open Decisions:** OD-002, OD-003

## Account / Authentication (UC-01, KK-01)
Apple or Google only; no Shinka password; one account per provider identity. 18+ checkbox (initially empty) must be checked before auth starts; age is re-checked from birth date (backend). Sign Out does not change account status.

## Onboarding (UC-02…06)
Intro → optional name (trim, ≤50) → sign-in → birth date (required, valid, not future, 18+) → optional birth time (HH:mm 24h) and GeoNames-selected birthplace (no free text) → optional period info with explicit health consent → first pair prepared immediately. Sun sign: always one of 12; missing time ⇒ 00:00 for calculation only, birth_time stays NULL; no UNCERTAIN.

## Home (UC-11, KK-11/14)
Shows the pair for the device's current local calendar day. Reopen/Retry/profile/language changes never create a second Pair ID. Greeting adapts to time and name; does not affect selection.

## Calendar (UC-12/13/15/27, KK-15…20, 29/30)
Only distinguishes recorded vs predicted period days. Selecting a date never saves. "Mark period start" creates; selecting an existing start + new date updates the same ID. Delete requires confirmation. ≥15 days between distinct starts. All recalculation is atomic; failure keeps prior state. Last start deleted ⇒ predictions/phases removed, settings kept, messages use UNKNOWN.

## Pattern (UC-16/17, KK-21/22/34)
Recurring Themes: 1–29 days use all history, ≥30 rolling last 30; based on user_daily_message.category_id actually assigned; max two categories; ties → most recently seen; no inference. Lunar Timeline: previous New Moon → next New Moon, proportional, local dd.MM HH:mm, no horizontal scroll.

## You (UC-18…24)
Edit name, birth date, time, birthplace in one screen; Sun sign read-only. Language TR/EN. Notifications on/off; time fixed 06:00 (notification_time stored, not editable). Privacy Policy, Terms of Service, Health Data Consent, Sign Out, Delete Account (→ INACTIVE via "Deactivate account" confirmation, no routine deletion; no separate Deactivate screen). Presentation per SRC-03 §7 (see SHINKA_UI_UX_STANDARDS.md).

## Health Consent (UC-05/22, KK-25/26/36)
Explicit separate consent with version + time. Withdrawal: warning + confirmation → processing stops immediately → settings, records, predictions, phase days deleted and verified → success only after verification; retries automatic; one open job per user; re-consent only after completion; deleted data never returns.

## Daily Content (UC-09, KK-10…14, 31/32)
Existing record for local day ⇒ return it. Else category from 240 mapping (sign × moon × phase/UNKNOWN) → random Active pair not shown in last 40 days (day 41 eligible) → else other categories → else least-recently-shown Active pair (ties random). Store actual category_id + immutable TR/EN snapshots. No AI.

## Notifications (UC-10/20, KK-13/24)
06:00 local generation; push only if enabled + OS permission + ACTIVE account; push failure never regenerates the message; not a guaranteed 06:00 delivery.

## Data Protection (KK-35/37)
Delete Account ⇒ INACTIVE + ACCOUNT_DEACTIVATION event. Admin cannot modify/delete daily message history, consent events, protection events, audit log; deletion job status backend-only.