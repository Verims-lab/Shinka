# SHINKA — UI / UX Standards

**Document:** SHINKA_UI_UX_STANDARDS.md
**Status:** ACTIVE — reconciled with UI/UX Tasarım v1.1
**Current BuildMarker:** Buildmarker-008
**Last Updated:** 2026-10-20
**Authoritative Source References:** SRC-03 Shinka_UI_UX_Tasarim_v1.1_Tutarli.docx (one logical source, Part 1–4)
**Purpose:** Binding design system and UX contract for all Shinka surfaces.
**Scope:** Tokens, primitives, navigation, screens, states, accessibility, localization.
**Implemented:** Tokens (`src/foundation/designTokens.js` ↔ `src/index.css`), contract (`src/foundation/uiContract.js`), localization infra (`src/foundation/i18n/strings.js`), primitives (`src/components/shinka/`), Foundation shell aligned.
**Not Implemented:** Home business behavior, Calendar, Pattern and You/account workflows (FUTURE_PACKAGE); ON-01…06 current scope is described below.
**Supporting artifact:** Shinka_UI_UX_v1.1_Machine_Readable_Tables_Companion.docx — machine-readable mirror of SRC-03's 11 tables + visual-reference notes; mirrored verbatim in `src/foundation/uiuxTables.js` (design, icons, approved EN copy for onboarding/You, Home, Calendar, Pattern, You/account, QA checklist). Not a new source.
**Open Decisions:** OD-005, OD-011 (OD-010 resolved)

## Authority
SRC-03 v1.1 governs presentation, copy and interaction. Business rules: SRC-01; flows: SRC-02; data: SRC-05/07.

## Mockup vs written specification precedence
Screenshots are representative mockups; sample dates/names and icon deviations are not real data or decisions. Written screen/field/icon specification wins (e.g. Pattern icon = moon even if a mockup differs).

## Navigation
Bottom navigation: **Home · Calendar · Pattern** only. **You** opens from the top-right profile icon (44×44) and is never a bottom-nav item. Back via top back arrow.

## Screen inventory
ON-01 Introduction · ON-02 What should we call you? · ON-03 Welcome · ON-04 Personal Details · ON-05 Your cycle, your choice · ON-06 First Shinka preparation · Home · Calendar · Pattern · You · Withdraw consent bottom sheet.

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
- ON-04: DOB required; Birth time optional 24h HH:mm; Birthplace optional country-led cascading GeoNames selection (no text search); birth_date alone determines Sun; missing time stays NULL, no 00:00 fallback; no UNCERTAIN.
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
Onboarding H06/H07, GeoNames H10 and onboarding-consent H11 are current with the four approved decisions implemented; deployed verification remains separate. Home/content, Calendar, Pattern, account/withdrawal and notifications remain future.

## Foundation auth shell alignment
`PageContainer` now uses fixed 20px horizontal padding at mobile and desktop widths. `/login` uses ShinkaCard/ShinkaButton with Apple and Google only, primary controls at least 52px, localized safe error codes and no password fields/links. T74 measures actual 360px/1024px rendered layouts. The earlier Foundation shell has been replaced by ON-03 with a pre-auth age boundary. Live sign-in is still unverified.

Shinka application components do not activate a dark theme, expose a toggle or use dark variants. Unused generic library `.dark` selectors remain outside the application policy scan; they are not evidence of a Shinka dark target.

## CSS migration preservation — Buildmarker-006
Native Tailwind 4 theme mappings preserve all eleven canonical colors, fifteen RGB variables, Cormorant Garamond/Inter families and weights, fixed typography line heights, 20px page padding, spacing/radii, 200ms transitions, ≥44px touch targets and ≥52px primary controls. Existing neutral/status colors are also pinned. The product stays light with OS dark preference; retained generic library dark variables require a class the application does not apply.

T75–T80 measure real computed styles/primitives and existing H13 cases in the same canonical suite. Existing T24/T41/T49/T74 retain internal 360px overflow, missing-root and Apple/Google auth coverage. Before/after local captures at 360px/1280px for Health, Build and login showed identical sampled heading/control/card geometry and colors after fixing inherited label and desktop heading line heights. External font requests are blocked in the isolated harness; declared families are verified, live font/device rendering is still required.

## Authentication/onboarding screens — current package

ON-01…05 use shared primitives and approved order. EN/TR onboarding copy is centralized; TR status is APPROVED_PRODUCT_COPY. The Final Closure decision supplies title, age declaration and explicit consent copy; the subsequent helper reply approves the three helper translations. Terms of Service remains identical in both languages. Unrelated Foundation copy is unchanged. Existing canonical EN validation punctuation remains, including range(15-60); the receipt's space before parentheses is normalized only for that existing EN item.

Name is optional; whitespace becomes NULL, >50 characters gives the approved inline error. Age and health consent are separate unchecked checkboxes. DOB is required; time/place remain optional; existing structured place survives interrupted profile completion. Sun uses birth_date only. Cycle inputs are blank with 5/28 placeholders; no fabricated defaults are stored. ON-06 shows approved preparation copy plus FIRST_SHINKA_ENGINE_REQUIRED without an endless spinner or fake content. Before a real daily record exists, restart can return a skipped user to ON-05; once the real owner record exists, onboarding is durably complete.

All six screens have rendered EN/TR layout, named-control, input-size and touch-target tests at 360px and 430px. Long consent/age labels wrap and their checkboxes retain size. Physical keyboard, hosted fonts and provider callbacks still need live/device evidence.

Approved product copy (the exact additional source decision):

| EN | TR |
|---|---|
| A gentle guide to your daily rhythm | Günlük ritmine nazik bir rehber |
| Your birth chart | Doğum haritan |
| Begin | Başla |
| What should we call you? | Sana nasıl hitap edelim? |
| Name | Adın |
| Continue | Devam et |
| Prefer not to say | Belirtmek istemiyorum |
| Welcome | Hoş geldin |
| Continue with Apple | Apple ile devam et |
| Continue with Google | Google ile devam et |
| I confirm that I am 18 or older | 18 yaşında veya daha büyük olduğumu onaylıyorum |
| Personal Details | Kişisel bilgilerin |
| Date of birth | Doğum tarihi |
| Birth time | Doğum saati |
| Birthplace | Doğum yeri |
| Your cycle, your choice | Döngün, senin seçimin |
| Last period start date | Son regl başlangıç tarihi |
| Period duration | Regl süresi |
| Cycle length | Döngü uzunluğu |
| Skip for now | Şimdilik geç |
| A little moment, just for you | Sana özel küçük bir an |
| We’re preparing your first Shinka insight | İlk Shinka içgörünü hazırlıyoruz |
| Please enter a shorter name | Lütfen daha kısa bir isim gir |
| Please confirm that you are 18 or older | Lütfen 18 yaşında veya daha büyük olduğunu onayla |
| We couldn’t sign you in. Please try again | Giriş yapılamadı. Lütfen tekrar dene |
| Please enter your date of birth | Lütfen doğum tarihini gir |
| Please enter a valid date | Lütfen geçerli bir tarih gir |
| Date of birth cannot be in the future | Doğum tarihi gelecekte olamaz |
| Shinka is available for users aged 18 and over | Shinka yalnızca 18 yaş ve üzeri kullanıcılar içindir |
| Please enter a valid time | Lütfen geçerli bir saat gir |
| Please select a place from the list | Lütfen listeden bir yer seç |
| No places found | Yer bulunamadı |
| We couldn’t load places. Please try again | Yerler yüklenemedi. Lütfen tekrar dene |
| Please enter your last period start date | Lütfen son regl başlangıç tarihini gir |
| Period start date cannot be in the future | Regl başlangıç tarihi gelecekte olamaz |
| Please enter a whole number of days | Lütfen gün sayısını tam sayı olarak gir |
| Please enter a valid period duration | Lütfen geçerli bir regl süresi gir |
| Please enter a duration within the supported range | Lütfen desteklenen aralıkta bir regl süresi gir |
| Please enter a valid cycle length | Lütfen geçerli bir döngü uzunluğu gir |
| Please enter a cycle length within the supported range (15-60) | Lütfen 15–60 gün arasında bir döngü uzunluğu gir |
| Please consent to the use of your cycle data to continue | Devam etmek için döngü verilerinin kullanılmasına açık rıza vermelisin |
| I consent to Shinka processing my cycle data to provide cycle-based features and personalization. | Shinka’nın döngü verilerimi döngüye dayalı özellikler ve kişiselleştirme sunmak amacıyla işlemesine açık rıza veriyorum |
| Something went wrong. Please try again | Bir şeyler ters gitti. Lütfen tekrar dene |
| We couldn’t save your changes. Please try again | Değişikliklerin kaydedilemedi. Lütfen tekrar dene |
| Your account is inactive | Hesabın aktif değil |
| Terms of Service | Terms of Service |

## ON-04 selection presentation — current decision

The SOURCE_OF_TRUTH decision replaces search with visible Country, State/Province/Region, District/County or Subregion, and Birth settlement native selection controls. Turkish labels are Ülke, İl / Bölge / Eyalet, İlçe / İdari bölge, Alt bölge and Doğduğun yerleşim. No search input, magnifier, debounce, inferred country or automatic first choice remains. TR normally follows country → province → district → settlement. Other countries use their available ADM levels; no-subdivision countries can select a settlement directly. Settlement selection remains available within any selected scope without requiring unnecessary lower levels.

ShinkaSelect uses existing input tokens, 52px height, 17px text, visible focus, visible linked labels and native keyboard semantics. The single-column layout has no horizontal overflow at 360px/1280px in measured EN/TR fixtures. Long selected labels/context wrap below the control; country/administrative context distinguishes same-name records, with ID disambiguation when labels/context are identical. The selected birthplace has an explicit summary. Native option menus remain browser/OS UI; the application does not introduce a custom menu dependency.

Parent changes clear descendants and the final place. Language changes reload lists while retaining the explicit path/selection; late responses cannot replace newer state. Saved birthplace initially shows its summary without requesting hierarchy. Change opens editing without erasing it; only an explicit parent replacement or Clear discards it. Clear / Leave empty for now resets the whole optional selection. Partial country/region selection blocks Continue with a localized complete-or-clear message. Service failure never prevents explicitly leaving this optional field empty.

Each list distinguishes loading, empty results, no further administrative subdivisions, incomplete hierarchy data and service failure with an explicit Retry. No automatic retry. Counts and previous/next page controls expose incomplete lists; the provider window warning requests a narrower region. All new labels/help/status/error text comes from onboardingCopy.js. The exact earlier approved copy and Terms of Service are unchanged.

Visual QA inspected empty/selected EN/TR ON-04 at 360px and 1280px. Rendered tests verify labels, focus, control sizes, language changes and overflow; the screenshot runner also exercises Tab movement. Native popup arrow/Enter selection could not be verified through the local automation surface (events did not change the value; native-app automation timed out). Physical keyboard and assistive-technology verification remain explicit device checks, not claimed PASS. Hosted fonts are not covered by isolated fixture screenshots.
