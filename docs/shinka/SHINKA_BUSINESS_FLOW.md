# SHINKA — Business Flow Contracts

**Document:** SHINKA_BUSINESS_FLOW.md
**Status:** ACTIVE — contract summary with scoped implementation
**Current BuildMarker:** Buildmarker-008
**Last Updated:** 2026-10-19
**Authoritative Source References:** SRC-01 İş Analizi v2.5 (primary), SRC-02 Use Case v1.4
**Purpose:** Translate binding business behavior into implementation contracts.
**Scope:** Account, Onboarding, Home, Calendar, Pattern, You, Health Consent, Daily Content, Notifications, Data Protection.
**Implemented:** Data/security foundation plus authentication/onboarding screens and guarded contracts; production writes/source gaps remain OPEN.
**Not Implemented:** UC-06/Daily Content, Calendar, Pattern, You editing, withdrawal/deactivation and notifications.
**Open Decisions:** OD-002 (OD-003 repository auth policy implemented; live provider proof remains external)

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

## Foundation readiness — Buildmarker-007
All 20 physical schemas now represent these contracts. Backend read boundaries derive owner from auth.me().id and check ACTIVE/consent state; protected mutations are denied. No Calendar, onboarding, Home, Pattern, daily-generation, scheduler, push or deletion execution flow has begun. Future Calendar mutations still require ≥15-day inter-record validation and atomic derived-state replacement; future withdrawal must stop processing first, create minimal protection/job metadata, verify physical deletion and permit re-consent only after completion. Account deactivation retains records and closes normal access. No current schema or synthetic test constitutes implementation of those business flows.

## Authentication/onboarding implementation boundary — current package

ON-01 Introduction → ON-02 optional trimmed name → ON-03 Apple/Google with a separate unchecked 18+ declaration → ON-04 required DOB / optional time / optional structured birthplace → ON-05 optional cycle and independent explicit health consent → ON-06 finite dependency shell. Existing users with usable profile/preferences and actual daily data retain Home shell access; INACTIVE wins over all onboarding paths.

Pre-auth name is transient only (same-tab session storage, versioned, 30-minute expiry, max 50 Unicode characters). No pre-auth profile or identity is created. Backend identity always comes from Base44 auth.me(). Profile/preferences and health persistence are implemented as guarded adapter contracts, tested synthetically; production writes fail closed because no durable adapter is verified. Sun and consent source gaps additionally prevent the affected saves. No failed write is presented as completion.

Cycle skip creates no health/consent/settings rows. A start date requires separate consent; settings require a start date. Empty settings never materialize 5/28. Exact screen resume after skip is not durably representable; current session can reach ON-06, reload safely derives state again. UC-06 generation remains unimplemented and explicitly FIRST_SHINKA_ENGINE_REQUIRED.
