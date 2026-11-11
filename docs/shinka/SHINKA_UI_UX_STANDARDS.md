# SHINKA — UI / UX Standards

**Document:** SHINKA_UI_UX_STANDARDS.md
**Status:** ACTIVE — reconciled with UI/UX Tasarım v1.1
**Current BuildMarker:** Buildmarker-070
**Last Updated:** 2026-11-11
**Authoritative Source References:** SRC-03 Shinka_UI_UX_Tasarim_v1.1_Tutarli.docx (one logical source, Part 1–4)
**Purpose:** Binding design system and UX contract for all Shinka surfaces.
**Scope:** Tokens, primitives, navigation, screens, states, accessibility, localization.
**Implemented:** Tokens (`src/foundation/designTokens.js` ↔ `src/index.css`), contract (`src/foundation/uiContract.js`), localization infra (`src/foundation/i18n/strings.js`), primitives (`src/components/shinka/`), Foundation shell aligned; scoped Profile/You admin menu and internal panel.
**Not Implemented:** Current-build hosted/device acceptance, approved legal destinations and permanent platform/provider erasure. Native ON-06/Home, Calendar and Pattern are implemented; live evidence remains separate.
**Supporting artifact:** Shinka_UI_UX_v1.1_Machine_Readable_Tables_Companion.docx — machine-readable mirror of SRC-03's 11 tables + visual-reference notes; mirrored verbatim in `src/foundation/uiuxTables.js` (design, icons, approved EN copy for onboarding/You, Home, Calendar, Pattern, You/account, QA checklist). Not a new source.
**Open Decisions:** OD-005, OD-011 (OD-010 resolved)


## 070 — ON-02 first-viewport sign-in priority

The empty artwork slot on the not-signed-in Welcome is a pure layout gap: the shared backdrop already paints the composition, so the slot now caps at 48px, may collapse to zero, and ON-02 uses a compact 12px stack rhythm. The 18+ declaration, Apple and Google therefore keep the first viewport on short mobile viewports, inside the Base44 Preview frame and at enlarged text, while the backdrop, wordmark, typography and control order are unchanged. Signing in, the 18+ gate and every other numbered step are untouched: a verified session still gets the existing authenticated Welcome (Continue resumes the form, no provider controls), and both branches keep the 2/5 counter. `/auth-shell-probe` now also reports `data-probe-viewport="IN_VIEW"` from the committed shell, so the running published app states whether the three controls are inside the visible viewport. [070 verification](reports/SHINKA_ONBOARDING_WELCOME_070.md)

## 070 continuation — Sign out on the signed-in Welcome (2026-11-11)

The owner's 2026-11-11 report ("Apple and Google never appear in the preview") is a session-state fact, not a layering defect: with a verified session ON-02 renders the authenticated Welcome, which carried only Continue, so the provider actions could not appear there. The 070 layout already keeps both controls inside the first viewport whenever the anonymous branch renders. To make the sign-in screen reachable on a device whose session is open, the authenticated Welcome now shows one secondary `Sign out` / `Çıkış yap` action under Continue; it ends the session through the existing `logout()` boundary, which returns to `/login` and therefore renders the anonymous ON-02 with the 18+ declaration, Apple and Google. Nothing else changed: the anonymous branch, the age gate before any provider call, provider order, the `resume` Continue behavior, the 2/5 counter, copy and layout are untouched, and the action exists only on the authenticated variant.

## 069 — ON-02 session-specific actions

Anonymous Welcome shows the 18+ declaration and both approved provider actions in the initial mobile viewport, with unobstructed touch targets. Authenticated Welcome shows Continue and resumes the current form. The onboarding shell exposes the canonical Buildmarker for read-only release verification. [069 verification](reports/SHINKA_ONBOARDING_AUTH_069.md)

## 068 — ON-02 mobile sign-in

On anonymous Welcome, the empty artwork slot can grow to 240px when the safe viewport has room. Its height yields to the 18+ declaration and Apple and Google buttons on shorter screens. Keep the shared PNG, the 2/5 counter and the existing touch targets. At enlarged text or reduced height the document can scroll to all actions. [068 measurements](reports/SHINKA_ONBOARDING_SIGN_IN_068.md)

## 067 — ON-01 spacing and counter

The usable height is the visible viewport after the shell's top and bottom safe padding and the 52px primary CTA. Aim to lower the 066 heading position by 10% of that height. The space from the heading to the introduction paragraph is 2.5%. Use 12px between consecutive boxes and between the third box and Begin. On short portrait screens the heading shift uses the available space so Begin stays in view. ON-02 through ON-05 show their respective page numbers. [067 measurements](reports/SHINKA_ONBOARDING_SPACING_067.md)

## 066 — ON-01 compact presentation

Anchor the single bundled composition at the safe top left on ON-01. Keep the original logo fully colored and proportional. Use the smaller heading token, compact three rows and the existing primary CTA. Moon and birth-chart descriptions fit on one line at the default text size on common portrait widths. At enlarged text or reduced height, copy can wrap and the document can scroll. [066 layout and verification](reports/SHINKA_ONBOARDING_INTRO_066.md)

## 065 — Shared branded screen background (2026-11-11)

Every user-facing App route shares the bundled 942 × 1670 owner PNG, including onboarding and first-content preparation, Apple/Google sign-in, Home, Calendar, Pattern, You, Account & Privacy, account deletion, and loading, retry and not-found states. The decorative layer sits outside route motion and behind the translucent bottom navigation. Fit the full image proportionally to the large viewport and anchor it at the bottom so the artwork reaches the navigation on tall screens. Fill any remaining space with matching cream and feather the narrow edge that meets it. A localized cream wash behind the PNG's wordmark keeps overlapping light-mode headings readable. Dark mode uses the existing theme-controlled veil. Keep the existing safe insets, page flow, 240px onboarding spacing and logo text. Internal administration keeps its flat surface. [065 scope and verification](reports/SHINKA_APP_BACKGROUND_065.md)


## 064 — Admin reset retirement and selected-user removal (2026-11-11)

Test Tools exposes only target lookup, user-removal preview/confirmation and existing-operation status/recovery. The reset card, explanation, confirmation branch, submit state and action copy are removed. Cancel and single-flight deletion retain the existing focus/identity rules. A legacy reset receipt has a localized read-only explanation and Check operation status only, never a Resume or restart control. An active legacy operation still disables a new removal; it is not hidden or treated as completed. The published reset button remains until the matching frontend is published. Normal auth-first onboarding, optional/NULL name, saved locale, manual theme and Account & Privacy are unchanged.

[064 delivery and execution](reports/SHINKA_ADMIN_RESET_RETIREMENT_064.md).


## 063 — Compact botanical Lunar Timeline (2026-11-10)

Presentation-only replacement of 059 numbered nodes/straight track/visible vertical list. Keep the localized Lunar Timeline heading, Pattern background, dominant-theme card and shared navigation unchanged. A soft cream/blush rounded card holds five static watercolor-style SVG moons joined by fine botanical curves/stars; no new image, animation, filter or dependency. Approved section images are complete compositions, not reusable isolated phase artwork; do not duplicate or crop the onboarding composition into nodes. Explicit `.dark` tokens follow the saved manual preference, never OS theme.

Each node has the same local dd.MM / HH:mm above and phase plus dd.MM HH:mm below. The fifth is explicitly Next New Moon / Sonraki Yeni Ay. Validated server UTC instants, `position`, `today_position`, `active_index`, current phase, timezone and all calculations/contracts remain unchanged. Actual DOM centers use the true ratios; the decorative curves follow those centers. Today is a small proportional marker, independently positioned from the single halo on the actual active node. IANA timezone remains a compact footer.

Five nodes fit 360/390/430px normal mobile in both locales. At 320px or 200% text, only the named, keyboard-focusable timeline region scrolls horizontally (Arrow Left/Right and Home/End, including WebKit); the document remains contained. Label sizes stay readable (14px phase, 12px date at default), grow with text enlargement and never shrink to force fit. The ordered DOM list is the accessible phase/time equivalent, with `aria-current`; duplicate top dates and all artwork are aria-hidden and pointer-inert. Loading, partial/missing coverage, error/Retry, retained-card recovery and privacy clearing are unchanged. [063 source, images and checks](reports/SHINKA_LUNAR_PRESENTATION_063.md).


## 062 — Calendar grid editing (2026-11-09)

Normal Calendar has one “Tarihleri düzenle / Edit dates” action and no below-calendar date input/form card. Editing is a single start-date draft: empty eligible cell → add; tapping that unsaved date again → clear; recorded start → explicit delete draft; another eligible date → move that same ID with edit. Save/Cancel are a compact action row. Delete Save opens the existing short confirmation; Cancel never writes. A recorded start dot, prediction dashed edge, today underline/bullet, selection ring and draft +/−/→ marks have localized accessible names, not color alone. Cells remain ≥44px; labels/actions wrap at 200% text. No global Refresh; pull and error Retry remain.

Save is disabled without a change, without required separate health consent, or for future/near-date drafts. Server-returned owner today is authoritative; future legacy starts can still be selected for repair/delete. The unchanged backend enforces ≥15 days and OD-012. Month/year navigation and retained product tabs preserve the in-memory intent/scroll; the helper explains that close/reload discards unsent drafts. Existing route Back behavior remains; a dialog consumes Back/Escape before route navigation and restores Save focus. Session end clears drafts and late results.

Check status only reads the original receipt. APPLIED confirms only after matching backend readback. PENDING/ABSENT stays unconfirmed and exposes a separate “Aynı işleme devam et / Continue the same change”; it rereads before explicitly continuing the same ID/revision/payload. No automatic rewrite, new intent or rollback. This supersedes 056's combined check-and-continue UI and native-date form rules, while preserving historical evidence. Manual verified light/dark, section artwork, bottom navigation and single safe-area ownership are unchanged. [062 evidence](reports/SHINKA_CALENDAR_GRID_062.md).

## 061 — Authentication before personal onboarding (2026-11-09)

**Current order: ON-01 Introduction → ON-02 Welcome / Apple+Google and separate unchecked 18+ → verified server progress → ON-03 optional name → ON-04 personal details → ON-05 optional cycle → unnumbered preparation → Home.** Only 1–5 are numbered. Verified completed users see Home without a name/login flash; unresolved admission/progress shows neutral loading or Retry. Existing backgrounds, typography, light onboarding and saved-language rules stay unchanged.

ON-02 Back returns to intro. ON-03 Back returns to authenticated welcome/Continue, without provider buttons or logout. Unsaved ON-04 Back returns to the current name draft; persisted/reset ON-04 and preparation retain authenticated welcome. ON-05 Back retains profile/cycle drafts. The name's associated inner label, optional/50-character rule and nonblank Skip guard are unchanged. The owner’s 2026-11-09 request supersedes older name-before-login mappings below; historical screenshots/source receipts remain historical.

[061 implementation and execution](reports/SHINKA_AUTH_FIRST_ONBOARDING_061.md).

## 060 — Approved concise deletion copy and status presentation

User approval on 2026-11-09 replaces the conflicting retention sentence and the old technical confirmation with these exact strings in `privacyCopy`:

- EN title: **Delete your account?** Body: **Your account and personal information will be removed from the app, and you will no longer be able to access Shinka. Permanent deletion will remain pending until it is verified.** Buttons: **Cancel / Delete Account**.
- TR title: **Hesabını silmek istiyor musun?** Body: **Hesabın ve kişisel bilgilerin uygulamadan kaldırılacak ve artık Shinka'ya erişemeyeceksin. Kalıcı silme, doğrulanana kadar beklemede kalacak.** Buttons: **Vazgeç / Hesabımı Sil**.

No provider/internal-scope detail belongs in this confirmation. Retain cancel-first focus, Escape/back, focus return, labelled dialog, >=44px controls, content growth and existing visuals/theme. Central TR/EN status copy distinguishes Checking status from mutation progress, in-progress from merely local pending intent, temporary failure/timeout from sign-in required. Never equate HTTP200 with completion or claim provider sign-out succeeded merely because active removal was verified. Saved recovery and sign-in-to-create-new-request messages are not shown together; expired authority offers existing-provider sign-in preserving locale and the privacy return route. [060 evidence](reports/SHINKA_PRIVACY_STATUS_060.md).


## 059 — Single Pattern theme, Lunar Timeline and navigation evidence (2026-11-09)

The current owner request replaces 038's two-theme/two-Moon-field presentation. Your Recurring Themes renders exactly the dominant assigned category, count descending then last assigned day descending, without day counters. The selected category alone may supply its approved bilingual explanation and decorative illustration; no random daily text, generic icon or wrong-category art is a substitute. The available authority contains six approved names, but no six-category explanation/asset catalog. Until supplied, only the selected heading is shown; the requested illustrated explanation card remains explicitly incomplete. The existing watercolor backdrop remains its sole composition owner; no repeated moon/plant hero and no header language selector.

Lunar Timeline / Ay Zaman Çizelgesi restores the five-node NEW→WAXING→FULL→WANING→next NEW projection from actual lookup interval boundaries. Horizontal positions and Today use true UTC time ratios and backend observed_at. At the historical 059 checkpoint numbered nodes mapped to wrapping textual rows. The 063 presentation above supersedes those rows and the no-horizontal-scroll rule; dd.MM HH:mm and validated IANA time zone remain unchanged. Current phase is distinct from Today. Missing cycle coverage shows unavailable and any provable current phase, never a complete invented graphic. Independent section retry, retained data and privacy clearing remain.

The 057 shared nav remains a 44px minimum auto-growing row plus 1px border and exactly one nav safe inset. No additional runtime height change was justified: published 058 measured 45px total/0 inset at 360 and 390px. 059 adds ancestor/footer-space and last-content assertions, injected duplicate-padding/margin negatives, 24px simulated Android inset and keyboard viewport restore. Physical APK/system-bar ownership remains unverified. [059 implementation, measurements and acceptance](reports/SHINKA_PATTERN_NAVIGATION_059.md)


## 057 — Shared navigation and reopen recovery (2026-11-01)

The shared Home/Calendar/Pattern navigation has three equal columns. Its icon and persistent label form one centered group, with a 44px minimum auto-growing link row (replacing 56px), horizontal containment and exactly one bottom safe inset on the nav. There is no fixed total height, negative margin, clipping, fourth tab or system-bar compensation. Preserve ≥44px targets and TR/EN 200% wrapping; wrapper/system-bar area requires physical evidence.

Home initial failure has one localized error/Retry and never claims a retained view. A transient failure in an already verified same session retains confirmed content/name and uses the central refresh-failure copy. Safe code/stage/status/duration/request ID remain diagnostic attributes, not product text. Proven session/owner/privacy/lifecycle denial still conceals personal data. Calendar keeps 056 status/read/same-intent continuation and never auto-writes on reopen.

## Historical 056 — form/status interaction superseded by 062 (2026-11-01)

This package hides only Calendar’s visible Refresh/Yenile action; its mounted RefreshControl keeps approved pull-to-refresh and coalesced foreground reads. Initial and retained failures retain explicit Retry. Scoped #calendar-start-date native appearance/box sizing contains the field in the card without clipping its date, picker or focus ring; shared onboarding/You inputs are unchanged. A scoped date :focus ring covers WebKit native editors that hold focus without matching :focus-visible; Tab/Shift+Tab is exercised.

An unknown delete stays in one dialog with central TR/EN Check status copy, not another Delete action or a contradictory background error. It closes only after verified absence. A passive read may confirm an APPLIED receipt; only explicit Check/retry can continue PENDING/ABSENT with the same immutable action ID/revision/payload. Pending/checking, rejected field/conflict, unknown and confirmed states remain distinct. Draft/month are retained; invalid dates do not write. No color/art/theme change. Desktop WebKit did not reproduce the supplied iOS overflow at normal text; scoped sizing and local 200% matrix are not physical iOS closure.


## 055 — Focus, birth-date feedback and transparent daily presentation

The 2026-11-01 four-item onboarding request supersedes white-card presentation for `FIRST_SHINKA_DEPENDENCY` and Home's Your Shinka / Today's Suggestion blocks only. These blocks retain spacing, text order, headings and Retry/actions on the existing background; `ShinkaCard surface="plain"` is opt-in. Other forms/cards retain their surfaces. Preparation is an unnumbered interstitial, not ON-05's cycle form. Current MessagePair text and immutable assignment IDs remain authoritative; historical snapshot/card wording below is not the current contract.

ON-04 BirthTime/Birthplace have one focus indication on the existing rounded outer frame. A scoped inner-input rule removes duplicate border/outline/shadow; global focus, date fields and other inputs remain intact. HH:mm editing, picker Set/Cancel/Clear, combobox keyboard/touch selection, Retry and labels are unchanged. Shared You birthplace uses the same rule.

A complete DOB uses the shared date-only validation with server-provided today immediately on change; partial edits are silent. The adjacent, readable TR/EN alert retains aria-invalid/aria-describedby. Underage submit cannot call saveProfile and focuses the error text, not the native date input; explicit date editing remains available. Correction clears stale feedback. No checkbox, device clock or year-only age shortcut replaces backend validation.

Missing/invalid shared quota is distinct from temporary rate limiting and provider failure. Central onboardingCopy explains that place search is not set up yet, keeps typing, and offers the existing optional-clear path; quota exhaustion retains the existing try-later copy and Retry-After. No invented result, forced birthplace, automatic retry or settings button. Default/onboarding light, verified Profile-only dark, watercolor and 054's single composition remain unchanged. [Execution and matched images](reports/SHINKA_ONBOARDING_FIX_055.md).


## 054 — One onboarding moon/botanical composition

ON-01–ON-05 use only the approved fixed SectionBackdrop onboarding image. The former scrolling IntroArt bitmap duplicated a composition already inside that backdrop and is removed, including its asset URL/import/blend CSS. A transparent, empty, aria-hidden square layout slot (width 100%, max 240 CSS px, aspect-ratio 1) keeps the existing heading, subtitle, card, field and button positions. It paints no bitmap, pseudo-decoration, mask or covering layer. The three introduction row SVG icons remain. Palette, watercolor texture, lines, background crop/fade, typography and manual light-default/verified-Profile-dark policy are unchanged.

Full App/Onboarding checks cover five steps, forward/back, TR/EN, 320/360/390/430px and landscape, short/long/reduced viewports, top/middle/bottom scroll, name/date/time focus and 200% text. Matched loaded-asset Chromium captures measured zero layout displacement; screenshots were visually inspected. Browser focus/resize is not a physical keyboard/wrapper acceptance. [054 evidence](reports/SHINKA_ONBOARDING_LAYER_054.md).


## 052 — Calendar and Pattern read recovery (2026-10-30)

Calendar without a successful value has one loading/error area and one Retry. Only a rendered prior Calendar value may display the retained-view refresh message. Successful recovery displays the real grid and clears the error; transient failures preserve month/date/draft and unknown intent. Pattern retains each confirmed section independently and clears that section’s error after success. Access/session loss clears private content. Technical diagnostics remain out of product copy. No palette, typography, imagery or manual-theme change.

[Findings, execution and APK acceptance](reports/SHINKA_CALENDAR_PATTERN_052.md).


## 051 — Core Reliability & Performance

Pattern keeps confirmed cards visible while its retained tab is hidden. On return it starts the existing coalesced background refresh (one-second burst guard); it must not require an empty card before checking freshness. Independent section errors and retries remain. Build history renders known evidence aliases and explicitly shows NOT_RECORDED for missing historic fields. No visual palette, artwork, manual-theme, notification or onboarding-flow change.

051 observed published 050 English Home/Pattern/Calendar at 360 px; Pattern and Calendar had no horizontal document overflow. Real account calendar/theme-history screenshots are excluded from Git to avoid retaining personal data; generic Home and metadata-only cleanup evidence are retained. Full local TR/EN/mobile/200% matrices remain synthetic IO acceptance. Real BFCache restore was attempted but not observed; physical safe-area/native back still require device evidence.

## 050 — Verified mobile preference sheets and Calendar feedback

Preserve the Base44 bottom sheets and existing modal/history/focus infrastructure. The selected option receives initial focus. Arrow/Home/End navigation changes only the open sheet choice and uses one radio Tab stop; Enter/Space or click transfers that choice to the parent preference draft and closes the sheet. Cancel/Escape/browser Back discard only sheet navigation, preserve other form drafts and return focus. Only VERIFIED save/readback applies locale/theme; initial/reverted/cancelled/saved/reopened values have no false dirty notice. Existing centralized TR/EN notice and manual light-default theme contract remain.

Calendar selection is a draft, never a recorded period. A short central TR/EN live status distinguishes unsaved selection from pending save; form aria-busy follows the existing operation. Unknown outcome keeps the selected date, existing record view and same operation recovery, never optimistic success/rollback/new intent. Confirmed records and dates remain authoritative. Existing tab month/scroll/draft retention and safe-area ownership are verified, not redesigned. Browser inset simulation is not physical wrapper proof.

WebKit regression also reproduced lost trigger focus after dismissal. PreferencePicker now explicitly focuses its activating button before opening, so the shared modal captures the correct return target. Calendar pending status sits outside the aria-busy form to avoid deferring the announcement.

## 049 — Bounded opening and Home recovery

Initial session/settings reads settle within a 15-second total budget (including the existing two paced session retries). A transient timeout offers the existing retry state, not logout or a second sign-in. Home keeps its existing simple loading/error/Retry presentation; no technical notice is added. Returning to a visible same-day Home after a failed load starts one fresh coalesced attempt; inactive retained tabs do not request. Verified cards, theme/art and account/unmount guards remain. Local fault injection is not hosted incident closure.

## 048 — Current manual application theme

Authority: the owner's 048 request supersedes the **theme-only** light-only clauses in 037–039 and the older OS-driven 026 decision. Default, unverified identity/preference and onboarding use light. A verified active account may select light/dark in You. The existing `appTheme` resolver is the only DOM theme writer; OS preference never selects or changes it. Draft, rejected and unconfirmed saves retain the last verified theme. Check/retry accepts the same intent only after verified readback. Logout and account changes clear prior theme, including internal routes; old responses cannot apply to the new account.

H13-010 compares the resolver's independently accepted input to DOM class, color-scheme and meta; H13-006 compares the corresponding palette. Neither derives expected theme from rendered `.dark`. Existing section assets, positions, fixed owner and dark overlay remain. Measured dark text/primary-button contrast requires dark primary RGB 200 145 176 and on-primary RGB 30 20 25; `html.dark` prevents base accessibility defaults from overriding these values. Light tokens and copy stay unchanged. Local testing covers OS × app themes, TR/EN 360/390px and 200% text, including a conservative white-image bound under the actual dark overlay. Physical/native rendering remains separate.

## 047 — Focused onboarding presentation

ON-01 and ON-04 titles retain their typography, color, alignment, line layout and programmatic focus for screen announcements. The global mobile :focus-visible rule previously drew their apparent frames after screen navigation. Only these non-interactive h1 targets suppress that outline; input/button/birth-date focus indicators and field borders remain. ON-02 reuses the framed-field presentation with a persistent associated inner label above its editable value. No copy, name/skip validation, storage, navigation, progress, theme, art or section-background change. U16/U17/U19 and the real-App TR/EN 360/390px, 100/200% text matrix verify this scope; physical device acceptance remains separate.

## Historical 046 — Section backgrounds (superseded by 065)
Home, Calendar, Pattern, You and Account Privacy share one watercolor backdrop; Onboarding uses the moon backdrop. One fixed, decorative, non-interactive SectionBackdrop per section, chosen by the rendered section (not the URL); unresolved state shows neutral ivory. Native-size 941×1672 JPEG derivatives via CDN, no stretching on scroll/keyboard; desktop onboarding is contained at full height with ivory side fade. Dark theme darkens the same image with a token overlay, never inverts or recolors it.

## 044 — Profile notification choice and phone permission

You shows the saved on/off choice separately from the checkbox draft. An unsaved choice has an explicit status; while saving it says the saved choice is being checked. Unknown outcome retains and locks the draft with Check result / Retry same save beside it. Success appears only after VERIFIED readback; reopening shows the stored choice without old success. Existing language/profile editing and fixed local 06:00 display remain.

Central `notificationCopy` TR/EN uses short phone-settings guidance, a phone permission row and honest setup-pending text. This replaces 029/030's technical support-status row and exact denial wording for this surface, under the owner's 044 request. There is no native permission bridge: production remains UNKNOWN regardless of opt-in. Synthetic supported/denied/allowed props are test inputs, not observations. No browser Notification API, permission prompt, settings button or URI is introduced. Permission denial never gates product navigation; preference is separate from health consent. Each explanatory paragraph owns the existing caption token so its line box scales with enlarged text; no inherited fixed-pixel caption line box. Checkbox label/descriptions and live status are linked; keyboard, narrow widths and 200% text are exercised locally. Physical Android/iOS and assistive technology remain open.


## 041 — Home header

Home, Calendar and Pattern headers show only Shinka (left) and the existing Profile/You access (right, ≥44×44; menu and admin entry unchanged). None renders TR/EN language buttons; no placeholder, hidden target or separator remains. Language changes only in Profile/You → Preferences; all product screens and bottom navigation render the persisted preference.

## 040 — Test Tools removal result

Use canonical TR/EN testToolsCopy. User-approved TR success is exactly “Kullanıcı silindi.”; a separate paragraph describes verified active User/operational absence and retained history, without promising permanent platform erasure. Pending, unknown and budget/no-progress states remain distinct. Pending authorized operation offers one Resume action; unknown/blocked/completed offers status read. Technical details expose safe operation/stage/progress/checkpoint/duration values, with uncounted remaining shown as unknown, never fabricated zero. Stage labels are neutral, not assertions that unfinished work completed. Completed/status responses clear the old target card. Reload uses the saved target/operation; session/account invalidation clears that local recovery context. No new confirmation is inserted between acknowledged same-operation passes.

## 039 — recovery lock and privacy presentation

You disables Edit profile as well as changed preference fields while a save is unknown. The existing Check saved result / Retry same save controls remain; a failed check cannot unlock a new edit or show success. Home clears old cards and the hydrated-name fallback after explicit access denial; ordinary network retry still preserves verified content. No copy/theme/layout redesign. CQ06–08/CQ10 cover real local React surfaces; physical Android/iOS acceptance stays separate. [039 milestone](reports/SHINKA_CORE_QUALITY_MILESTONE_039.md).

## 038 — retained cards and short recovery

First Pattern load uses loading text; later reads retain confirmed names and Moon values. A refresh failure shows a section retry with old information, distinct from empty history/first-load failure. Access loss hides both immediately. Calendar unknown outcome has one short explanation and same-operation retry; verified readback is required for success. A saved/recovered past date selects its month so the actual result is visible. Saved controls never imply rollback or cancellation of a transmitted call. [Current evidence and mobile limits](reports/SHINKA_CALENDAR_PATTERN_038.md).

## Historical 037 — theme superseded by 048; name, Calendar and Home retained

Historical 037 theme rule (superseded by 048): one light palette applied to onboarding/product/internal/overlay surfaces and supported form controls at initial paint and OS changes; watercolor and 026 accessibility amendments remain. No media-query listener, theme binding or dark palette remains. OS-owned date/time/browser/native surfaces are separate device acceptance. Name Skip is disabled for trimmed nonempty input; handler checks the current draft even before a render. Blank Skip may clear only blank draft; Continue carries normalized valid name through auth/profile save.

Calendar future cells remain browseable and selected is not recorded. Selected future date shows existing centralized TR/EN explanation, disables the submit button and is rejected again in the controller/backend. A persisted future row is explicitly warned, predictions withheld, and normal correction/delete available. Home has no normal Refresh button or hidden click target: passive pull observation stays, and error Retry appears alongside retained confirmed cards. Calendar retains its mounted gesture/error recovery control; 056 removes its visible Refresh action. Other screens are unchanged. ON-05 header already excludes privacy; You retains account/privacy functions.

## 036 — optional time and safe layers

BirthTimeField is a text HH:mm input (24-hour, no UTC conversion). 00:00/23:59 valid; partial/out-of-range input gets the existing TIME_INVALID copy and can be cleared. The icon is a labelled 44px button. The application dialog is portalled outside the profile form, constrained by viewport height with scrolling; Hour/Minute selects start empty unless an existing valid time exists. Only Set commits a valid draft. Cancel/Back/Escape preserve the prior value and restore trigger focus; Clear commits empty. Modal closes before page navigation; no hidden test language controls. Native birth-date calendar stays unchanged. New time helper copy is scoped to this user request and centralized EN/TR. All modal focus traps include editable controls. Physical Android/iOS acceptance is separate. [036 single delivery report](reports/SHINKA_ONBOARDING_CLOSURE_036.md).

## Current onboarding interaction — 036

The five numbered screens are Introduction, optional Name, Welcome/18+, Personal details, optional Cycle. Preparation, errors and inactive are unnumbered. ON-02/03/04/05 have visible accessible Back. ON-04 returns to an authenticated welcome: Continue restores the same form without OAuth/logout. ON-05→04→05 preserves entered cycle values while mounted. Reopen comes from backend state. Onboarding has no manual TR/EN controls. Saved preference precedes device TR/EN variants; unsupported device language falls back to EN. Propagated saved preference changes preserve drafts; You remains the preference editor.

Birthplace now uses BirthplaceCombobox/BirthplaceResults, replacing the historical sheet/native cascade below. It opens only for typed search (three-character threshold), offers explicit A/P selection, own-name literal matching, contextual labels, Clear, More and Retry. Editing a selected label removes its ID until a new pick; cancelling a You edit restores persisted fields on reopening. Arrow keys/Enter/Escape use listbox/active-descendant semantics; popup actions retain focus. A filtered empty page with more candidates is not final empty; an error is never empty. The 200-candidate notice describes Shinka’s limit. No exhaustive provider/world result promise.

Header Account & Privacy is absent from onboarding, including hydration/error header. You’s privacy links, direct protected routes and backend owner/admin checks remain. The latest Base44 presentation is retained, with only date/time and birthplace hit areas raised to the existing 44px minimum; this package is functional verification, not pixel or physical-device acceptance. [035 audit, execution and evidence](reports/SHINKA_ONBOARDING_AUDIT_035.md).

## 034 — retained onboarding and completed local browser acceptance

The onboarding-only light background and flat dark surface are preserved. T81 executes both themes with finally restoration and verifies six non-repeating light layers using each engine’s CSS serialization. U15 covers ON-04/ON-05 EN/TR background/overflow. SS06–09 exercise actual session/route/login components; TP01–04 exercise Test Tools pacing, partial/unknown/completed states with controlled wait/clock and real DOM commit observation. All pass within Chromium/WebKit 649/649; the 17 required IDs are unique. CLI admin/You passive refresh uses controlled elapsed time without long waits or changing product budgets. Physical keyboard/device/live acceptance remains pending. [034 results and evidence](reports/SHINKA_STABILIZATION_034.md).

## 032 — native readiness review, no UI behavior change

Review retained central notificationCopy TR/EN, stored preference versus draft, unknown native permission/support, setup-pending guidance, verified save/readback, recovery and session invalidation. Native recipient suitability is still unverified; a saved opt-in, OS permission or general platform support never promises receipt. No guessed bridge, browser permission read, settings link/button or new user-facing technical workflow is added. Denial must leave Home/daily content and normal use available; neutral notification text stays free of profile/cycle/health data.

The platform's documented first-open prompt is a setup expectation, not an observed Shinka device result or a JavaScript permission API. Current wrapper/OS/account-switch behavior is NOT_RUN; follow [032's two-stage device plan](reports/SHINKA_NATIVE_NOTIFICATION_READINESS_032.md) alongside the existing mobile report. The original approved denied-permission copy remains unchanged.

## 030 continuation — notification settings and honest permission states

030 retains the completed 029 UI without a new permission bridge or navigation-time send. The new manual admin backend guard and reported input adapter do not imply delivery activation. You keeps one on/off preference, fixed local 06:00 target, language selection and existing save/unknown/conflict/draft contract. The saved preference is displayed independently from the unsaved checkbox draft. 044 supersedes the technical support row with a simple phone permission row; native platform support remains an internal unknown. Production permission is unverified/unknown because no Base44 JavaScript native permission/registration bridge was documented. Browser Notification.permission, service workers and user-agent inference are not substitutes. No automatic permission request, unsupported settings URI, or pretend permission button is added.

044 replaces the former denial wording with the scoped short EN/TR settings guidance in notificationCopy. Manual guidance points to Shinka in OS notification settings; Base44 documentation describes a native permission prompt on first opening of a push-enabled store build; its behavior on Shinka devices is unverified. The current setup-pending text is truthful while the production binding is closed. Switching account/logout clears the You view through the existing session boundary; native device-token reassignment/revocation still needs physical acceptance. No health, birth, cycle or daily snapshot appears in lock-screen copy. Neutral 029 TR/EN text is centralized in notificationPolicy; UI states in notificationCopy.

## 027 — navigation quality boundary

Home/Calendar/Pattern/You retain the existing guarded resolver across navigation. Product refresh remains available (Home uses pull/error Retry per 037) and each destination obtains current server results; no speculative mutation or optimistic Calendar success is introduced. Preserve 026 accessibility and the current 048 manual-theme contract, reduced motion, safe areas, layer history, text resizing and keyboard behavior. New-user auth/onboarding chunks remain accessible through the existing retry boundary. Health report opening handles blocked windows/failure explicitly and closes pending windows when the initiating screen/session ends.

## Current mobile experience — 026

Historical 037 superseded the original 026 system-theme implementation; 048 now supersedes its light-only restriction. Current startup defaults light; verified You preferences may select dark, independently of OS. Primary on-color remains independent of surface; approved secondary-text/control-border contrast corrections remain authoritative.

The document scrolls; 100vh/100dvh, zoom and in-flow actions remain. Shared env-backed inset variables preserve top/side safety. ProductNavigation alone owns the product bottom inset; PageContainer owns its own bottom inset on non-product pages. Overscroll containment is vertical on the actual document and modal list, without touchmove cancellation. Text stays selectable; buttons/nav/decorative icons alone suppress selection.

**Historical birthplace control (026; superseded by 035 single autocomplete):** Below 768px or with a coarse primary pointer, the shared birthplace resource opened a lazily loaded native dialog styled as a bottom sheet. Existing dialog behavior was selected after evaluating the installed Vaul wrapper: no extra gesture engine, background transform or initial dependency is needed. Desktop retains native select. Both use the existing hierarchy/cache/controller and bounded provider pages. Title, selected radio state, Arrow/Home/End, Tab/Escape, close/Back and return focus are required; no search/autoselection. Saved summary and five-field server resolution remain unchanged. Date/time controls are untouched.

Open layers have one same-URL history entry; Back dismisses before route traversal. Dismissing a pending confirmation hides presentation only: busy/intents/recovery remain owned by controllers. There is no root sentinel or Backspace handler. Route animation uses lazily imported Framer Motion on the existing node: tab fade, hierarchical ±12px entrance, 200ms, no retained exit subtree or keyed remount; reduced motion disables it. Native system back/status bars remain external acceptance.

Home and Calendar offer thresholded pull refresh without a normal visible Refresh action (037/056). Gesture observation is passive, single-touch, at document top, outside controls/layers/nested scrolls. On platforms without overscroll containment the custom gesture stays inactive; foreground/section return reads and explicit error Retry remain available. Requests coalesce. Last confirmed content survives refresh failure, while known privacy/session changes immediately conceal it. Calendar preserves draft and same-request unknown outcome; no optimistic confirmed save/rollback. Selection is immediate and saving/unknown/rejected/verified states stay distinct. Actual period days have a solid edge, predictions a dashed edge and selection a ring plus labels. Health case rows/control groups reflow with enlarged text.


## Implemented privacy experience — 023

Two Account & Privacy links open the corresponding scope in one modal. Cancel receives initial focus; Escape/Cancel writes nothing and returns focus. The modal traps keyboard focus, scrolls vertically on narrow/landscape screens, keeps 44px targets and permits 200% text. Shared Shinka primitives and centralized privacyCopy TR/EN preserve tokens; no technical IDs/JSON/maintenance steps appear in the user flow.

The confirmed action keeps a recoverable pending intent before dispatch. Busy blocks repeated taps. Loading/processing, consent withdrawn but cleanup pending, verified active health cleanup, unknown outcome and account active-data-removed/platform-pending are distinct. Check status only reads; Continue explicitly reuses the pending operation. Reload never auto-resumes destructive work. Scope and confirmation are separate for withdrawal and account deletion; no fake deactivation or permanent-erasure success text is used. The current backend cannot certify trash/provider purge, so the result remains visibly pending.

Since 035, onboarding has no Account & Privacy header link. Authenticated incomplete users retain direct protected `/account-privacy` access; verified admins retain direct internal-route access. `/delete-account` is a public web entry naming Shinka, links existing provider sign-in and does not require completing onboarding. The published origin and Play Console URL registration remain owner acceptance. Approved legal content/URLs remain unavailable and show unpublished status. Current admin accounts show the native owner/last-admin protection explanation. Physical devices/store approval remain unverified.


## Implemented You UX — 022

Top-right profile opens You for completed users, including normal users. Incomplete users retain onboarding; verified admins can use direct internal routes, without an onboarding header menu. You has My Profile, App Preferences, Account & Privacy, top Back and unchanged three-item bottom navigation. Admin Panel appears only under the existing fresh AuthContext.isAdmin decision. Shared ShinkaCard/Button/Input/Select, relative line heights, minimum 44px controls and 52px primary actions remain. ShinkaButton now forwards a DOM ref for proper focus return after Save/Cancel.

Inline profile edit opens with name focus; field validation moves focus to the failing field. Save failure preserves draft; success follows exact backend readback and returns focus to Edit. Current persisted Sun is read-only; its value changes after verified profile save, not client calculation. Saved birthplace remains visible independently of picker lists. Provider error, Clear and incomplete selection reuse the existing localized selector states. Profile and preferences have separate Save and success results; no blanket partial-success message.

Unknown write has Check saved result and explicit same-save Retry; edits are locked while outcome is unknown. A conflict retains the draft and offers explicit Reopen saved values. Notifications show fixed local 06:00 target, saved preference, separate unknown native support/permission and current setup-pending explanation (029). No timezone/time selector or unverified permission API. Legal headings show unpublished status, with no invented links. The 022 consent text remains read-only; 023 adds separate confirmed withdrawal and erasure links. TR/EN source and scoped-copy provenance is in SOURCE_OF_TRUTH.

## Implemented Pattern UX — 021

Pattern is enabled at `/pattern` behind the same session/onboarding route as Calendar. Existing Shinka header, top-right Profile/You, safe-area shell and three-item bottom navigation remain. Read-only Your Recurring Themes / Lunar Timeline cards load independently with section-specific status, error and ≥44px Retry; error never becomes the approved empty-history message. A privacy denial clears both sections. Locale switch reuses the same verified results.

Historical 038 summary-only presentation is superseded by 059 above. Current Pattern uses one selected theme and a real five-node timeline; original source tables and old execution receipts remain provenance.

Current Pattern source and local browser tests supersede earlier inactive/future descriptions below. Physical screen-reader output, safe-area/browser bars, OS text scaling, hosted font loading and real-device navigation remain manual acceptance.

## 020 Test Tools — current result versus prior identity

Each accepted operation response owns its displayed target; missing target is not merged with a prior lookup card. A confirmed removal clears the old card; a failed status read also clears stale identity and keeps the result unknown. Reload performs the existing read-only lookup and presents the same operation. User ID → lookup → one confirmation → progress → explicit result remains unchanged.

Central TEST_TOOLS_COPY now says “Kullanıcıyı uygulamadan kaldır” / “Remove user from app”. It distinguishes active User/operational removal from retained history and unverified permanent erasure/Recently deleted cleanup. Unsupported “Geri alınamaz” / “Irreversible” copy is removed. This copy correction is authorized by the 020 user request; unrelated approved product copy is untouched. AU10 checks TR/EN stale-card clearing and same-operation reopening; existing live regions and mobile controls remain.

## 019 responsive and outcome audit

Existing surface is mobile web; no PWA/native WebView wrapper is added or claimed. Typography line boxes scale with text using em-based ratios while retaining the exact 100% design sizes; width-only checks are supplemented by line-height assertions and visual inspection. Header language/Profile controls wrap at narrow widths with 200% text; card text wraps without changing copy. Keep the approved 44×44 minimum (stricter than WCAG 2.2's 24 CSS-pixel minimum), primary 52px minima, readable native form controls, focus restoration and live operation status. Local browser text-size tests are not physical OS font scaling/keyboard evidence.

Test Tools still uses one explicit selected-target confirmation. Progress includes the persisted stage, bounded same-operation continuation, separate partial/unknown/completed results and recovery after reload. Health lists executable in-app scope apart from local/future/external acceptance, with no fake N/A dispatch or hidden failures. [Primary Android/iOS evidence](reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md) records both browser engines and the remaining physical checks; [019 handoff](reports/SHINKA_AUDIT_FIX_019.md) records the actual measured results.

## 018 approved Health and deletion interaction

Admin Panel → Health Center → Run Health → result and save status. Remove the browser measurement upload and in-app Foundation test launcher. Separate local/browser/device acceptance is visible, with no manual artifact preparation required. Explain that READY refers to in-app scope only. Current viewport measurements include actual width; desktop is not mobile evidence. Optional export remains.

Show Kaydedildi / Kaydedilemedi; bu raporu yeniden kaydet / Kayıt sonucu doğrulanamadı; mevcut runId’yi kontrol et, with equivalent EN copy in healthCopy. Technical code/stage/request ID is collapsed. Deletion shows Kullanıcı siliniyor… immediately, Kullanıcı silindi only on backend verification, partial completion with same-operation Continue, and unknown response with bounded read-only status reconciliation. No second confirmation or global maintenance setup. Save only target/operation recovery IDs in tab session storage; no form/health data. Reload looks up the existing operation, never executes deletion. Not-found differs from service/permission failure. Normal User absence alone is not full cleanup evidence.

## Current Admin/Health interaction — 017

Deletion uses one entered User ID, current target ID/name/email/role/status and deletion/retention preview, then the explicit primary “Kullanıcıyı sil” / “Delete user” action. No second ID input or routine maintenance controls. Changing target invalidates preview; busy disables duplicate action. Preview takes heading focus, Cancel restores lookup focus, errors/results are live regions. Retry/continue uses the existing operation; completed deletion can be rechecked with the same target tombstone. Retained history is stated, never “all data deleted.” TR/EN helper copy is centralized.

Health retains “Bu raporu yeniden kaydet” / “Save this report again” for a completed unsaved report. Retry saves the identical runId without launching tests. Safe code/stage/request ID are available in collapsed details. The 017 browser-measurement JSON import was removed by the 018 decision above. Actual top-level viewport evidence remains in local regressions; desktop Chromium/WebKit evidence is not physical Android/iOS evidence.

## Historical native authority and recovery UI — 016

Profile/You and AdminGate use applicationSession backed by current native User.role; no SQL availability dependency or Supabase login. Onboarding completeness does not decide admin membership. Pending/failed authorization hides privileged UI.

Home localized duplicate-reconciliation notice accompanies the selected stored snapshot. Calendar retains explicit save/delete confirmation, date editing ID, focus/privacy invalidation and responsive controls. Pending conflict suppresses predictions; a unique saved intent exposes one Check / retry the same change action, including after reopen. Passive loading cannot disable that recovery action. Multiple/conflicting intents require review; no bulk-clear control or endpoint remains. A partial explicit grant resumes its original persisted timestamp and action ID. Do not claim unchanged saved state after an unconfirmed write; already-sent calls may have persisted. Reset conflicts direct the user to review/retry matching input or use Calendar for history edits. Deletion disabled preview explains the required operator maintenance window; normal Home/Calendar/reset are not disabled by its missing attestation. [Behavior and limits](SHINKA_BASE44_CONTINUATION.md).

## Authority
SRC-03 v1.1 governs presentation, copy and interaction. Business rules: SRC-01; flows: SRC-02; data: SRC-05/07.

## Mockup vs written specification precedence
Screenshots are representative mockups; sample dates/names and icon deviations are not real data or decisions. Written screen/field/icon specification wins (e.g. Pattern icon = moon even if a mockup differs).

## Navigation
Bottom navigation: **Home · Calendar · Pattern** only. **You** opens from the top-right profile icon (44×44) and is never a bottom-nav item. Back via top back arrow.

## Screen inventory
ON-01 Introduction · ON-02 What should we call you? · ON-03 Welcome · ON-04 Personal Details · ON-05 Your cycle, your choice · ON-06 First Shinka preparation · Home · Calendar · Pattern · You · Withdraw consent bottom sheet.

## Light palette (037 current authority)
Primary Plum #6F415A · Deep Plum Text #4C263F · Muted Mauve #93637B · Dusty Rose #D8A5AA · Blush Pink #F2D7D4 · Soft Lavender #E7DCE8 · Warm Ivory #FFF8F3 · Soft Cream #F9EEE8 · Muted Taupe #77636C (026 contrast correction) · Divider #EDE3E3 · White #FFFFFF.

**Historical 034 onboarding background (user-approved 2026-10-26; superseded by 046 SectionBackdrop and 054 single-composition ownership).** ON-01–ON-06 use a static layered watercolor background on the full-width onboarding shell (`PageContainer className="shinka-onboarding"`, rendered only by `OnboardingScreen`): five translucent radial gradients over a 165° linear base. Separate tokens: Soft Blush #FCEDEA, Pale Rose #F8E3E5, Warm Ivory #FFF9F5, Peach Mist #FBE9E5, Rose Haze #F5DDE3; global Warm Ivory #FFF8F3 and Blush Pink are unchanged. Distribution: powder pink/peach at top, asymmetric pink at left/right edges, near-white center, faint pink at the bottom. No animation, image, canvas, blur or dependency. Dark theme keeps the existing flat dark surface. Home, Calendar, Pattern, You, the onboarding loading/retry shell and admin keep the flat Warm Ivory surface; this is the only exception to the flat-surface rule.

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
Thin-line Lucide for function: Home `house`, Calendar `calendar-days`, Pattern `moon`, You `user-round`. Decorative Moon/flower/star pencil line-art never acts as the only control; 063 Lunar Timeline uses static watercolor-style SVG phase artwork with decorative botanical line art.

## Touch targets
Minimum 44×44 for every functional control.

## Motion
Functional transitions ≈200 ms. No continuous decorative animation.

## Accessibility
44×44 targets; readable type; AA contrast; accessible names for icon controls and screen-reader text for icon-only controls; state never by color alone (icon + text); visible focus; text scaling supported; no horizontal overflow at supported mobile width (360). Foundation checks are not an accessibility certification.

## Responsive rules
Mobile-first; content within 20 px page padding; 063 Lunar Timeline shows five nodes at normal mobile widths; narrow screens or enlarged text may scroll only inside its keyboard-accessible region.

## Localization
EN/TR. Centralized stable keys; no duplicated visible strings in components; business enums locale-independent; "Terms of Service" consistent everywhere. Approved English strings in v1.1 are source copy; TR via localization. Short mobile messages have no terminal period. Device language applies to opening texts. Approved EN copy dictionary: `APPROVED_COPY` in `src/foundation/uiuxTables.js` (verbatim, e.g. "We couldn’t sign you in. Please try again", "Deactivate your account?", "Your account is now inactive"); customer screens import it via central localization.

## Loading / Error / Empty states
Centralized states: LOADING, OFFLINE, LOAD_FAILURE, NOT_READY, VALIDATION_ERROR, ACTION_ERROR, SUCCESS, RETRY, DISABLED, EMPTY (`StatePanel`, `uiContract.UI_STATES`). Never collapsed into one state; machine code kept separately. Field errors below fields; screen/system errors in the section or with Retry.

## Onboarding UX
Introduction → Welcome / Sign In → Optional name → Personal Details → Your cycle, your choice → First Shinka preparation → Home (five main steps + interstitial).
- ON-01 (user decision 2026-10-26): brand (036: automatic saved/device language, no TR/EN buttons) → single decorative moon/botanical composition in SectionBackdrop (054: no separate content image; empty 240px-square flow space retained) → centered unframed title "A gentle guide to your daily rhythm" / "Günlük ritmine nazik bir rehber" → intro paragraph → three rows together from first render (no carousel/auto-advance): Your cycle (Flower2) "Understand your unique rhythm"; The Moon (Moon) "Discover its influence on your day"; Your birth chart (Sun) "See the bigger picture about you" → primary Begin (→ ON-02 once). Rows sit on the watercolor shell (no single white card); vertical scroll on short screens; step indicator unchanged; no new consent/legal text. New TR strings (Döngün, Ay, descriptions, paragraph) approved by the user on 2026-10-26.
- ON-03: authenticated optional name ≤50; Continue / Prefer not to say; blank not stored. The persistent Adın/Name label sits inside the existing soft framed-field container, above the input in normal flow; htmlFor/id association and given-name autocomplete remain. It is never a disappearing placeholder. Only one label; entered value never overlaps it, including 200% text. The wrapper keeps a visible focus-within ring; no duplicate outer label or inner ring.
- ON-02: 18+ checkbox default empty; Apple/Google auth not started until checked; no warning on user cancel.
- ON-01–ON-05 shared presentation (user decision 2026-10-26, five reference images): one shell/header (back slot · centred Shinka · empty balance slot), "N of 5" counter, one shared SectionBackdrop moon/botanical composition on every numbered step (054: no second scrolling bitmap), centred title + subtitle (ON-03 nameSubtitle, ON-02 signInSubtitle, ON-04 aboutSubtitle, ON-05 cycleSubtitle), plum primary buttons. Pre-auth Back appears on ON-02 (→ON-01); ON-03 is authenticated and returns to welcome/Continue without restarting OAuth. ON-05 → ON-04 back (user decision 2026-10-26) is a local view change that keeps entered values; re-saving ON-04 updates the profile server-side only while no daily message exists (onboarding unfinished), otherwise ONBOARDING_ALREADY_SAVED. 061: unsaved ON-04 Back returns to authenticated name; saved/reset profiles return to authenticated welcome/Continue. ON-05 primary is Finish/Bitir (same save); 5/28 are placeholders only. Account & Privacy is not shown on any onboarding header; it stays under You/Profile and its direct route. Legal links omitted (no approved targets).
- ON-04 presentation (036 current): the unframed Base44 title and existing subtitle/moon/botanical shell remain; framed date is required, time and birthplace optional. Birthplace is the single non-modal autocomplete defined above. The 036 user decision supersedes the old no-Back rule: 061: saved/reset profiles return to authenticated welcome with session-preserving Continue; new unsaved profile forms return to the authenticated name draft. The 035 report retains the historical decision. The prior inline country/region/settlement panel is historical, superseded by the attached GeoNames decision.
- ON-04: DOB required; Birth time optional 24h HH:mm; Birthplace optional A/P GeoNames search and explicit selection; birth_date alone determines Sun; missing time stays NULL, no 00:00 fallback; no UNCERTAIN.
- ON-05: Last period start date, Period duration, Cycle length; 5/28 faint placeholders only; Skip for now; independent explicit consent checkbox when data entered.
- ON-06: "A little moment, just for you" / "We’re preparing your first Shinka insight"; first pair prepared once, then Home.

## Home UX
Greeting is followed directly by the cards; the technical `DAILY_DUPLICATE_RECONCILED` notice is not rendered (no hidden/empty placeholder). Greeting is a fixed **Hello** / **Merhaba** at every hour in the saved Profile language (+ optional name as “Hello, Name”; no comma without a name); only **Your Shinka** and **Today’s Suggestion** cards from the day's immutable snapshot; no new pair on reload; IANA timezone auto-detected (fallback last saved); Loading / offline / load failure / not-ready / Retry states.

## Calendar UX
Monthly view; actual period pastel pink, predicted light lavender, selected day ring; legend Period / Predicted / Selected; phases not color-split. Mark period start (select date → validate → save). Correction: select existing start → new date → same action updates. Delete period start only on actual starts, with confirmation (date + prediction update explained; Cancel changes nothing); busy state blocks re-taps; success only after actual-date readback and recalculation; error keeps prior state + Retry; last start deleted → empty state, mark action available. Health display hidden without consent.

## Pattern UX
Read-only: **Your Recurring Themes** (one dominant assigned category; approved copy/art only) and **Lunar Timeline / Ay Zaman Çizelgesi** (proportional five transitions and Today, with accessible ordered local date/time labels). See 063 above for presentation and preserved incomplete-source behavior.

## You UX
Opened from top-right icon only. **My Profile** (inline edit: optional name, required DOB, optional birth time, optional GeoNames birthplace, read-only Sun sign). **App Preferences** (Language TR/EN; Daily Notifications on/off, local 06:00 shown, no time picker, no timezone picker). **Account & Privacy** (Privacy Policy, Terms of Service, Health Data Consent, Sign Out, Delete Account). Delete Account → one owner-erasure scope confirmation; active account/data removal must be verified and platform erasure stays explicitly pending (023). No menstrual data editing in You.

## Consent UX
Withdraw bottom sheet opens only when triggered: "Withdraw health data consent?" / "The current localized 023 scope also includes cycle settings and calendar action data, while account/profile and approved history remain." Processing stops immediately; success only after verified deletion; re-consent blocked while in progress; historic health data never restored. Distinct from Delete Account.

## Future package boundaries
Onboarding H06/H07, GeoNames H10 and onboarding-consent H11 are current with the four approved decisions implemented; deployed verification remains separate. Home/content modules are implemented with production capability/import blockers. This was the historical Foundation boundary; Calendar and Pattern are implemented by 012/016 and 021. Account erasure and withdrawal are implemented by 023; 029 implements the local notification engine; production binding and device delivery remain unverified.

## Foundation auth shell alignment
`PageContainer` now uses fixed 20px horizontal padding at mobile and desktop widths. `/login` uses ShinkaCard/ShinkaButton with Apple and Google only, primary controls at least 52px, localized safe error codes and no password fields/links. T74 measures actual 360px/1024px rendered layouts. The earlier Foundation shell has been replaced by ON-03 with a pre-auth age boundary. Live sign-in is still unverified.

Current 048 decision: default light, verified You light/dark preference; no OS-driven theme. Historical 037 light-only and 026 system-theme decisions are superseded.

## CSS migration preservation — Buildmarker-006
Native Tailwind 4 theme mappings retain the original brand palette with the documented 026 secondary-text contrast amendment, RGB variable names, Cormorant Garamond/Inter families and weights, proportional typography line boxes, 20px page padding, spacing/radii, 200ms transitions, ≥44px touch targets and ≥52px primary controls. Existing neutral/status colors are also pinned. 048 supersedes the 037 light-only rule: no OS-driven class/listener; verified manual dark uses the existing theme.css palette.

T75–T80 measure real computed styles/primitives and existing H13 cases in the same canonical suite. Existing T24/T41/T49/T74 retain internal 360px overflow, missing-root and Apple/Google auth coverage. Before/after local captures at 360px/1280px for Health, Build and login showed identical sampled heading/control/card geometry and colors after fixing inherited label and desktop heading line heights. External font requests are blocked in the isolated harness; declared families are verified, live font/device rendering is still required.

## Authentication/onboarding screens — package 008 checkpoint

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

## Historical ON-04 selection presentation — replaced by 035

The following cascade/native-select observations belong to 008/009/026 and are not the current combobox contract.

The SOURCE_OF_TRUTH decision replaces search with visible Country, State/Province/Region, District/County or Subregion, and Birth settlement selection controls (mobile bottom sheet / desktop native select since 026). Turkish labels are Ülke, İl / Bölge / Eyalet, İlçe / İdari bölge, Alt bölge and Doğduğun yerleşim. No search input, magnifier, debounce, inferred country or automatic first choice remains. TR normally follows country → province → district → settlement. Other countries use their available ADM levels; no-subdivision countries can select a settlement directly. Settlement selection remains available within any selected scope without requiring unnecessary lower levels.

ShinkaSelect uses existing input tokens, 52px height, 17px text, visible focus, visible linked labels and native keyboard semantics. The single-column layout has no horizontal overflow at 360px/1280px in measured EN/TR fixtures. Long selected labels/context wrap below the control; country/administrative context distinguishes same-name records, with ID disambiguation when labels/context are identical. The selected birthplace has an explicit summary. Native option menus remain browser/OS UI; the application does not introduce a custom menu dependency.

Parent changes clear descendants and the final place. Language changes reload lists while retaining the explicit path/selection; late responses cannot replace newer state. Saved birthplace initially shows its summary without requesting hierarchy. Change opens editing without erasing it; only an explicit parent replacement or Clear discards it. Clear / Leave empty for now resets the whole optional selection. Partial country/region selection blocks Continue with a localized complete-or-clear message. Service failure never prevents explicitly leaving this optional field empty.

Each list distinguishes loading, empty results, no further administrative subdivisions, incomplete hierarchy data and service failure with an explicit Retry. No automatic retry. Counts and previous/next page controls expose incomplete lists; the provider window warning requests a narrower region. All new labels/help/status/error text comes from onboardingCopy.js. The exact earlier approved copy and Terms of Service are unchanged.

Visual QA inspected empty/selected EN/TR ON-04 at 360px and 1280px. Rendered tests verify labels, focus, control sizes, language changes and overflow; the screenshot runner also exercises Tab movement. Native popup arrow/Enter selection could not be verified through the local automation surface (events did not change the value; native-app automation timed out). Physical keyboard and assistive-technology verification remain explicit device checks, not claimed PASS. Hosted fonts are not covered by isolated fixture screenshots.

## Mobile maintenance implementation

Desktop native select uses `appearance:none` with a decorative noninteractive chevron to enforce the existing 52px/17px tokens in WebKit; native selection semantics remain. Inputs have shrinkable width, PageContainer uses 100dvh with a 100vh fallback, and safe-area padding preserves the existing 20px/24px minimum. Home adds only device insets to its own spacing. Viewport permits user zoom; there is no zoom cap or keyboard scroll lock. The missing manifest link was removed: this checkout is a responsive web app, not an implemented PWA or native WebView shell.

Browser-level layout, focus, localized long options, date/time and network retry evidence is in [Android/iOS compatibility](reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md). Native keyboard/date/select sheets, VoiceOver/TalkBack, pinch zoom, real insets and background eviction require physical-device evidence (H13-013); desktop WebKit is not Safari certification. Product copy is unchanged.

## Historical checkpoint — Admin profile access — Buildmarker-010

Explicit current user decision adds a small Profile/You menu for verified admins, including before onboarding completion. The existing top-right `user-round` trigger is 44×44; the ordinary user's trigger remains disabled and opens no empty profile. This implements admin access only. Full My Profile, preferences, account/privacy editing and other You workflows remain FUTURE_PACKAGE. Bottom navigation stays Home · Calendar · Pattern.

The executable internal route inventory is `src/foundation/internalNavigation.js`:

| Screen | Route | Access / contents |
|---|---|---|
| Admin Panel | `/internal` | Verified admin; exactly two tool cards below |
| Health Center | `/internal/health` | Existing admin tool; unchanged purpose |
| Build & Environment | `/internal/build` | Existing admin tool; unchanged purpose |

Health description: “Sağlık kontrolleri, testler ve sonuçlar.” / “Health checks, tests and results.” Build description: “Güncel sürüm, ortam bilgileri ve paket geçmişi.” / “Current version, environment details and package history.” New labels, descriptions, access status and return copy live in `strings.js`; language passed between internal routes is display state only. A direct visit falls back to device language. Existing tool body copy is unchanged.

Shared navigation links to the panel, both tools and the existing `/` app resolver. The small controlled navigation menu supports keyboard opening, Escape, trigger focus restoration and outside dismissal. Cards and links are at least 44px, use visible keyboard focus and existing Shinka cards/tokens. Responsive and keyboard proof is synthetic/local; physical device and deployed admin/user evidence remain separate.


## Historical checkpoint — Daily preparation and Home presentation — Buildmarker-011

ON-06 retains the approved EN/TR title/preparation text and starts the real daily service. Loading is bounded by the client deadline; error/not-ready/offline have localized Retry. At the 011 checkpoint technical codes were DOM diagnostics only; 036 adds a visible allowlisted failure code for support, with the existing localized message. No successful advancement occurs without id and both language snapshots in the backend's confirmed persisted response.

Home has the existing Shinka header/Profile access, local greeting with optional name, exactly Your Shinka and Today’s Suggestion cards, and the three-item bottom navigation. Calendar is enabled by package 012; Pattern was inactive in 011 and is enabled in 021. Greeting presentation is time-independent (Hello / Merhaba; supersedes the former morning/afternoon/evening rule); it never changes selection. `dailyCopy.js` centralizes original SRC-03 English state copy and scoped Turkish translations under this request; existing approved onboarding strings are unchanged. The selected preparation language carries into Home. Home language switches only the displayed snapshot; preference editing/persistence remains outside this scope.

Local date/timezone changes trigger a backend refresh; stale previous-day content is cleared while loading. Existing-user errors retain Home/Profile access. Existing safe area, typography, 44px controls and card tokens are preserved. Local browser captures use source copy with an isolated fixture transport; they are not hosted or physical-device evidence. See the updated Android/iOS report.

## OD-002 category display-name approval — 2026-10-20

The user's explicit six-row approval supplies the English category display names and preserves the source Turkish names exactly. The [canonical category table](SHINKA_CONTENT_MODEL.md#approved-category-definition--od-002-continuation) and `contentCategoryDecision.js` carry all six pairs. These English names are product-decision copy, not strings from the original UI/UX document. Home still shows the two existing snapshot cards; this decision adds no category widget, translates no other text and changes no Pair/mapping. Any future category display must select the stored display_name_tr/display_name_en; codes remain locale-independent.


## Historical checkpoint — Calendar presentation — Buildmarker-012

The real monthly Calendar uses existing tokens: Blush Pink recorded days, Soft Lavender predicted days and Plum selection ring. Source Period / Predicted / Selected English legend is exact; scoped TR equivalents are Regl / Tahmini / Seçili. Accessible day labels include full local calendar date and each applicable state; actual starts also have a small marker. No new phase color layer is introduced. Monday-first month presentation, previous/next named buttons, arrow/Home/End focus and native labeled date input are implemented. Choosing a day or moving focus never writes.

Selected existing ID/date and destination date remain separate across month navigation. Mark period start performs add/edit; Cancel editing exits the draft. Delete appears only when the current selection is that actual start; a modal names its date and prediction effect, focuses Cancel initially, supports Escape/cancel without writes and restores focus. Busy blocks repeated submissions. Error/retry preserves selection and confirmed state; privacy invalidation conceals health. Empty, loading, offline, validation, operation error, success and production capability-unavailable states are distinct. Backend machine codes remain diagnostic attributes, not instructions shown to users.

`calendarCopy.js` centralizes original companion English and scoped Turkish/helper translations under this implementation request. The exact previously approved health-consent checkbox comes from onboardingCopy and starts unchecked. No fabricated duration/cycle setting is displayed. Disabled production mutations have a clear localized availability explanation; fixtures with the transaction model exercise the enabled UI without implying hosted support.

Shared bottom navigation enables Home/Calendar and kept Pattern inactive at the 012 checkpoint; 021 enables it; Profile/admin behavior is unchanged. The route is lazy and only resolves for durably completed active users. Controls retain ≥44px, native date text 17px, dialog scrolling, safe-area/page padding and no fixed keyboard-obscuring save bar. Browser screenshots and physical-device limits are recorded in the existing mobile report.

## Historical checkpoint — Test Tools — 013 user-requested extension

Admin inventory now has three destinations: Health Center, Build & Environment, Test Tools. Existing top-right Profile/You access, shared navigation, route guards and return path remain. Test Tools copy is centralized in `testToolsCopy.js`; it is new copy for this explicit feature, not attributed to the original UI/UX tables. Catalog parity is tested.

User ID lookup must precede operation preview. ID edits discard target/preview/typed confirmation and invalidate late responses. Delete has its own irreversible-action description and complete removal/retention preview. Both operations show actual destination app/server and environment uncertainty; blocked prerequisites remain visible with the execute control disabled. An exact typed ID is required when execution is available. Preview receives heading focus; cancel restores the lookup input. Single-flight submit, status/recovery controls, live region results, mobile wrapping and ≥44px controls use existing primitives. A result never says all data were deleted. No second OAuth requirement or localStorage reset is introduced.


## Historical checkpoint — OD-012 information state — 014

Calendar keeps actual dates and uses a status live region when the completed sample window cannot support a current estimate. Central `calendarCopy.estimateUnavailable` EN: “Your recorded dates are preserved. A prediction or current phase cannot be calculated because the latest completed intervals are longer than 60 days”. TR: “Kayıtlı tarihlerin korunuyor. Son tamamlanmış aralıklar 60 günden uzun olduğu için tahmin ve güncel evre hesaplanamıyor”. This helper copy is scoped to the user's 014 request; original approved onboarding copy is unchanged.

This informational result is independent of production save availability and save success/error. It neither disables an otherwise available valid mutation nor paints stale predictions. No new screen is added. CU05 and actual-App TR/EN mobile scenarios exercise the state. Production still displays the separate unavailable-write explanation until persistence is enabled with evidence.

## Mobile store-readiness review (2026-10-28)
- You → Language / Appearance use `PreferencePicker` + `PreferenceSheet` (bottom sheet, `role=radiogroup`, `role=radio` options) on the shared `useModalSurface` (focus trap, Escape, back closes the sheet first, focus returns to the trigger). The visible label and the selected value stay on the trigger. A pick only changes the draft; Cancel/Escape/back leave the draft and the saved value unchanged. Native `<select>` stays where it is used elsewhere; it is not documented as a store violation.
- An unsaved preference draft shows "Kaydedilmemiş değişiklik var…" / "Unsaved changes…". "Saved" still appears only after a verified save.
- Theme: the app preference only. Light is the default, and anonymous users and onboarding stay light. Dark applies only after a verified You save. No System/Auto option, and the OS theme is never read.
