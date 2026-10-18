# SHINKA — UI / UX Standards

**Document:** SHINKA_UI_UX_STANDARDS.md
**Status:** ACTIVE — reconciled with UI/UX Tasarım v1.1
**Current BuildMarker:** Buildmarker-003
**Last Updated:** 2026-10-18
**Authoritative Source References:** SRC-03 Shinka_UI_UX_Tasarim_v1.1_Tutarli.docx (one logical source, Part 1–4)
**Purpose:** Binding design system and UX contract for all Shinka surfaces.
**Scope:** Tokens, primitives, navigation, screens, states, accessibility, localization.
**Implemented:** Tokens (`src/foundation/designTokens.js` ↔ `src/index.css`), contract (`src/foundation/uiContract.js`), localization infra (`src/foundation/i18n/strings.js`), primitives (`src/components/shinka/`), Foundation shell aligned.
**Not Implemented:** All customer screens (FUTURE_PACKAGE).
**Supporting artifact:** Shinka_UI_UX_v1.1_Machine_Readable_Tables_Companion.docx — machine-readable mirror of SRC-03's 11 tables + visual-reference notes; mirrored verbatim in `src/foundation/uiuxTables.js` (design, icons, approved EN copy for onboarding/You, Home, Calendar, Pattern, You/account, QA checklist). Not a new source.
**Open Decisions:** OD-005, OD-011 (OD-010 resolved)

## Authority
SRC-03 v1.1 governs presentation, copy and interaction. Business rules: SRC-01; flows: SRC-02; data: SRC-05/07.

## Mockup vs written specification precedence
Screenshots are representative mockups; sample dates/names and icon deviations are not real data or decisions. Written screen/field/icon specification wins (e.g. Pattern icon = moon even if a mockup differs).

## Navigation
Bottom navigation: **Home · Calendar · Pattern** only. **You** opens from the top-right profile icon (44×44) and is never a bottom-nav item. Back via top back arrow.

## Screen inventory
ON-01 Introduction · ON-02 What should we call you? · ON-03 Welcome / Sign In · ON-04 Personal Details · ON-05 Your cycle, your choice · ON-06 First Shinka preparation · Home · Calendar · Pattern · You · Withdraw consent bottom sheet.

## Colors (light-only, no dark target)
Primary Plum #6F415A · Deep Plum Text #4C263F · Muted Mauve #93637B · Dusty Rose #D8A5AA · Blush Pink #F2D7D4 · Soft Lavender #E7DCE8 · Warm Ivory #FFF8F3 · Soft Cream #F9EEE8 · Muted Taupe #87757D · Divider #EDE3E3 · White #FFFFFF.

## Typography
Headings: Cormorant Garamond Medium — 34/40, 28/34, 24/30, 20/26. Body: Inter Regular — 17/25, 15/22, 13/18. Label/Button: Inter Medium. Classes: `text-shinka-h1…h4`, `text-shinka-body-lg|body|caption`.

## Spacing
Horizontal page padding 20. Scale 4, 8, 12, 16, 20, 24, 32, 40.

## Radii
12 · 16 · 20 · 999.

## Card
White, radius 20, padding 20, 1px #EDE3E3 border, shadow 0 2px 10px rgba(76,38,63,.05).

## Button
Primary CTA: #6F415A, white text, radius 16, min height 52, disabled opacity .45. Secondary/ghost: ≥44×44.

## Input
White, radius 16, min height 52, horizontal padding 16; label required; field errors shown below the field.

## Icons
Thin-line Lucide for function: Home `house`, Calendar `calendar-days`, Pattern `moon`, You `user-round`. Decorative Moon/flower/star pencil line-art never acts as the only control; Lunar Timeline phase icons follow the line-art style.

## Touch targets
Minimum 44×44 for every functional control.

## Motion
Functional transitions ≈200 ms. No continuous decorative animation.

## Accessibility
44×44 targets; readable type; AA contrast; accessible names for icon controls and screen-reader text for icon-only controls; state never by color alone (icon + text); visible focus; text scaling supported; no horizontal overflow at supported mobile width (360). Foundation checks are not an accessibility certification.

## Responsive rules
Mobile-first; content within 20 px page padding; Lunar Timeline fits screen width without horizontal scroll (labels alternate top/bottom when needed).

## Localization
EN/TR. Centralized stable keys; no duplicated visible strings in components; business enums locale-independent; "Terms of Service" consistent everywhere. Approved English strings in v1.1 are source copy; TR via localization. Short mobile messages have no terminal period. Device language applies to opening texts. Approved EN copy dictionary: `APPROVED_COPY` in `src/foundation/uiuxTables.js` (verbatim, e.g. "We couldn’t sign you in. Please try again", "Deactivate your account?", "Your account is now inactive"); customer screens import it via central localization.

## Loading / Error / Empty states
Centralized states: LOADING, OFFLINE, LOAD_FAILURE, NOT_READY, VALIDATION_ERROR, ACTION_ERROR, SUCCESS, RETRY, DISABLED, EMPTY (`StatePanel`, `uiContract.UI_STATES`). Never collapsed into one state; machine code kept separately. Field errors below fields; screen/system errors in the section or with Retry.

## Onboarding UX
Introduction → Optional name → Welcome / Sign In → Personal Details → Your cycle, your choice → First Shinka preparation → Home (five main steps + interstitial).
- ON-01: "A gentle guide to your daily rhythm"; "Your birth chart" kept verbatim; primary Begin; no input.
- ON-02: optional name ≤50; Continue / Prefer not to say; blank not stored.
- ON-03: 18+ checkbox default empty; Apple/Google auth not started until checked; no warning on user cancel.
- ON-04: DOB required; Birth time optional 24h HH:mm; Birthplace optional GeoNames select (typed text invalid); 00:00 only for Sun-sign calculation, never shown as entered; no UNCERTAIN.
- ON-05: Last period start date, Period duration, Cycle length; 5/28 faint placeholders only; Skip for now; independent explicit consent checkbox when data entered.
- ON-06: "A little moment, just for you" / "We’re preparing your first Shinka insight"; first pair prepared once, then Home.

## Home UX
Greeting Good morning/afternoon/evening by local time (+ optional name); only **Your Shinka** and **Today’s Suggestion** cards from the day's immutable snapshot; no new pair on reload; IANA timezone auto-detected (fallback last saved); Loading / offline / load failure / not-ready / Retry states.

## Calendar UX
Monthly view; actual period pastel pink, predicted light lavender, selected day ring; legend Period / Predicted / Selected; phases not color-split. Mark period start (select date → validate → save). Correction: select existing start → new date → same action updates. Delete period start only on actual starts, with confirmation (date + prediction update explained; Cancel changes nothing); busy state blocks re-taps; success only after atomic recompute; error keeps prior state + Retry; last start deleted → empty state, mark action available. Health display hidden without consent.

## Pattern UX
Read-only: **Your Recurring Themes** (assigned categories, ≤2 themes) and **Lunar Timeline** (previous New → next New Moon, five proportional nodes, active phase + Today marker, local dd.MM HH:mm, no horizontal scroll).

## You UX
Opened from top-right icon only. **My Profile** (inline edit: optional name, required DOB, optional birth time, optional GeoNames birthplace, read-only Sun sign). **App Preferences** (Language TR/EN; Daily Notifications on/off, local 06:00 shown, no time picker, no timezone picker). **Account & Privacy** (Privacy Policy, Terms of Service, Health Data Consent, Sign Out, Delete Account). Delete Account → confirmation explaining INACTIVE (access + new messages/notifications stop, records not deleted); "Deactivate account" confirm; no success if still active. No menstrual data editing in You.

## Consent UX
Withdraw bottom sheet opens only when triggered: "Withdraw health data consent?" / "Your cycle records, predictions, and calculated phases will be deleted. Your account will remain active." Processing stops immediately; success only after verified deletion; re-consent blocked while in progress; historic health data never restored. Distinct from Delete Account.

## Future package boundaries
Onboarding (H07), Home/content (H09), Calendar (H08), Pattern (H10), You/consent/account (H11), notifications (H14). No customer screens in Foundation.