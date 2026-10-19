# SHINKA — Business Flow Contracts

**Document:** SHINKA_BUSINESS_FLOW.md
**Status:** ACTIVE — contract summary with scoped implementation
**Current BuildMarker:** Buildmarker-008
**Last Updated:** 2026-10-19
**Authoritative Source References:** SRC-01 İş Analizi v2.5 (primary), SRC-02 Use Case v1.4
**Purpose:** Translate binding business behavior into implementation contracts.
**Scope:** Account, Onboarding, Home, Calendar, Pattern, You, Health Consent, Daily Content, Notifications, Data Protection.
**Implemented:** Data/security foundation plus authentication/onboarding screens and guarded contracts; approved Sun/TR/consent/durable-route decisions are implemented; CLOSED_PENDING_BASE44_VERIFICATION.
**Not Implemented:** UC-06/Daily Content, Calendar, Pattern, You editing, withdrawal/deactivation and notifications.
**Open Decisions:** OD-002 (OD-003 repository auth policy implemented; live provider proof remains external)

## Account / Authentication (UC-01, KK-01)
Apple or Google only; no Shinka password; one account per provider identity. 18+ checkbox (initially empty) must be checked before auth starts; age is re-checked from birth date (backend). Sign Out does not change account status.

## Onboarding (UC-02…06)
Intro → optional name (trim, ≤50) → sign-in → birth date (required, valid, not future, 18+) → optional birth time (HH:mm 24h) and GeoNames-selected birthplace (no free text) → optional period info with explicit health consent → ON-06 preparation dependency (first pair generation belongs to the next package). Sun sign uses only birth_date and the fixed tropical mapping in SOURCE_OF_TRUTH; birth_time stays NULL when missing, with no 00:00 fallback and no UNCERTAIN.

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
All 20 physical schemas now represent these contracts. Backend read boundaries derive owner from auth.me().id and check ACTIVE/consent state; protected mutations are denied. At the 007 checkpoint no Calendar, onboarding, Home, Pattern, daily-generation, scheduler, push or deletion execution flow had begun; the current onboarding implementation is described below. Future Calendar mutations still require ≥15-day inter-record validation and atomic derived-state replacement; future withdrawal must stop processing first, create minimal protection/job metadata, verify physical deletion and permit re-consent only after completion. Account deactivation retains records and closes normal access. No current schema or synthetic test constitutes implementation of those business flows.

## Authentication/onboarding implementation boundary — current package

ON-01 Introduction → ON-02 optional trimmed name → ON-03 Apple/Google with a separate unchecked 18+ declaration → ON-04 required adult DOB / optional time / optional structured birthplace → ON-05 optional cycle and independent explicit health consent → ON-06 finite dependency shell. The shared server resolver denies INACTIVE, returns incomplete profiles to ON-04 and only returns Home when ready profile/preferences and actual owner daily data exist.

Pre-auth name is transient only (same-tab session storage, versioned, 30-minute expiry, max 50 Unicode characters). No pre-auth profile/identity is created. Identity comes from auth.me(). Approved fixed-date Sun and EN/TR copy are integrated. Profile/preferences persist through the production SDK adapter; readback must succeed before progression. Restarted partial profiles retain existing optional birthplace/name/time while finishing their derived Sun.

Valid cycle data and explicit consent persist health-consent-v1.0 to current consent and immutable event, optional settings and the actual period start. Missing settings remain NULL; no fabricated 5/28. Skip/empty input creates no health records. Approved restart behavior may return skipped users to ON-05 until their first real user_daily_message exists; no Skip flag is added. The daily record is the final durable completion marker.

FIRST_SHINKA_ENGINE_REQUIRED remains YES. UC-06 generation, imports, engines, Calendar, Pattern, scheduler, push and withdrawal are outside 008. Package: CLOSED_PENDING_BASE44_VERIFICATION.
