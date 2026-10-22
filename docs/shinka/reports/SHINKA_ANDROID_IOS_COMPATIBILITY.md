# Shinka Android / iOS compatibility evidence

## 027 — pre-notification audit continuation (2026-10-22)

The new [single milestone report](SHINKA_PRE_NOTIFICATION_QUALITY_027.md) contains fresh Chromium/WebKit results, the corrected production before/after transition samples, ASVS scope and dependency closure. The current package preserves all 026 mobile and 025 timing/abort checks. The same 150 + 87 checks per engine pass across TR/EN, light/dark, narrow/landscape/200% text and keyboard/layers; new actual-App checks cover shared owner resolver, no backend prefetch, reload/back/forward, late completion, privacy/account switch and logout/back concealment. This is a local synthetic transport, not new hosted/native/device proof.

Representative 027 screenshots were visually inspected: [Chromium dark Home](quality-027/chromium-home-dark-320-200percent.png), [Calendar light](quality-027/chromium-calendar-light-320-200percent.png), [WebKit You](quality-027/webkit-you-dark-320-200percent.png), [settlement sheet](quality-027/webkit-birthplace-dark-long-list-200percent.png), [ON05](quality-027/webkit-cycle-dark-320-200percent.png), [landscape EN Pattern](quality-027/webkit-pattern-844-en-2x.png). Enlarged text wraps and scrolls; sheets retain a visible close action and scrollable options. Native keyboard, physical safe areas/system Back, actual touch and OAuth remain external acceptance. No universal WCAG/store certification is implied.

The Router Moderate advisory chain is resolved by reviewed 7.18.4; 027 audit has zero findings. Bundle limits remain unchanged. Route continuity removes a redundant Home-crossing hydrate; retained destination reads still require fresh server guards. Existing Pattern loading expansion/CLS observation remains labelled, not hidden. This section supersedes only current 026 dependency/timing status; all older evidence below remains historical.

## Current mobile package — Buildmarker-026 / HC-026.0 (2026-10-21)

This section supersedes historical light-only/mobile native-select presentation and old atomic-prerequisite statements below. Base44 remains the authority. The user supplied an eight-area mobile improvement request, not a raw store-scan result; no new store scan or hosted call was performed. Each recommendation was compared with source. Existing document scrolling, viewport-fit=cover, vh/dvh fallback, provider hierarchy/race guards, immutable daily selection and verified Calendar readback were retained.

| Finding / recommendation | Implemented decision | Executed evidence path | Remaining device/platform acceptance |
|---|---|---|---|
| Insets, bars and keyboard reach | Document scroll remains. Env-backed top/side insets; ProductNavigation owns the only product bottom inset; no fixed save bar or zoom cap. | Retained mobile matrix plus 026 simulated 24/28/28/34px inset accounting; narrow/landscape/reduced viewport and 200% text. Simulation proves arithmetic, not OS insets. | Physical notch/system bars, rotating keyboard, OS text scaling. |
| System light/dark | One media-query owner applies initial/live root class and color-scheme. Separate semantic dark palette, on-primary/control tokens, chart colors; subtle light secondary-text contrast correction. | Both engines measure actual text/control/focus contrast and root changes on product/admin/Health surfaces. | Native wrapper status/navigation bars and forced-color/device settings. |
| Android Back and layer dismissal | Real browser history: one same-URL entry per open layer; shared native modal focus/Back dismissal. No keydown hardware emulation or root history trap. Pending requests remain controller-owned. | Drawer/dialog focus and Back before route traversal; Back/Forward, logout/back and reduced-motion route regression. | Android system/predictive Back in the actual Base44 wrapper; iOS swipe-back and OS eviction. |
| Overscroll/touch | Vertical containment on the document and modal/list scroll owners. Passive single-touch observation, no touchmove preventDefault. Text remains selectable. Unsupported containment keeps accessible Refresh only. | Computed scrolling owner/Y containment, bounded list scroll, threshold/multi-touch rejection and no duplicate refresh. | Native bounce/pull-to-refresh interaction and physical pinch/horizontal navigation. |
| Mobile birthplace selection | Lazy native dialog bottom sheet at narrow/coarse-pointer viewports; desktop select retained. Existing single paged controller/backend ID resolution remains. Vaul was evaluated; existing dialog avoids another gesture/scroll engine. | U04/U09–U12 preserve hierarchy/empty/error/retry/stale/NULL behavior; real 50-row long/homonym list, next page, keyboard/selected labels/return focus and Back measured. | VoiceOver/TalkBack spoken labels, native keyboard and provider latency. |
| Page movement | Lazy Framer Motion animates the existing container: tab fade vs hierarchical ±12px entrance, 200ms, reduced-motion cancellation, no exit tree/remount. | MI05 policy assertions; real App navigation and session invalidation; bundle graph and SDK request counts. | Device frame pacing and platform gestures. |
| Calendar feedback / suggested optimistic rollback | Immediate draft + saving, verified success only. Definitive rejection retains draft; unknown response retains one action_id/revision/payload and refuses a new intent until retry. Refresh is read-only and preserves draft. | MI01–MI03/H08-007, existing CA/CU/native receipt tests, real Calendar refresh/dialog/Back flow. | Owner's hosted save/lost-response/readback acceptance; no new atomicity claim. |
| Home/Calendar pull refresh | Top-only threshold and visible feedback plus Refresh button. Coalescing, retained confirmed content on failure, known privacy/session concealment and late-response isolation. Same Home daily operation, no local regeneration. | MI01–MI04; scripted touch threshold/multitouch/single-flight/error retention and Calendar zero-write refresh. | Actual finger gesture/provider/network timing in Chrome/Safari/wrapper. |

The source changes and local gate results are recorded in [026 verification](mobile-026/verification.json); [before performance](mobile-026/before-performance.json) and [after performance](mobile-026/after-performance.json) compare the same production byte budgets and actual-App laboratory route samples. [Initial findings](mobile-026/initial-findings.json) preserves the first measured failures (Health 200% overflow and 368-byte CSS raw-budget excess). They are not hidden by dropping checks. The fix makes Health controls/rows wrap and bounds the empty toast viewport/text lines; unused generated sidebar-only CSS is excluded after checking its lack of importers. WebKit’s button-click focus difference is fixed by explicitly focusing the sheet opener before mounting the modal. No byte budget is raised. External fonts/SDK are substituted or blocked in the lab; no field p75/INP or physical performance is inferred.

Health: add H08-007 (three controller helpers); update H13-001/006/010 and H13-012/015 local acceptance descriptions; update old light-only/tag expectations. No case/suite deleted. H13-013 remains external. H10-003/H13-014/H16-007 and their 025 timer fault-injection evidence remain. No live Full Health, provider probe, content import, real mutation, main publish or store artifact was run.

### Executed local results

Chromium 156.0.8078.4 and WebKit 27.2 each passed **574/574 canonical tests, 150/150 new mobile checks and 87/87 retained mobile checks**, with zero page exceptions. Each local in-app Health run saved 132 PASS / 0 FAIL / 13 expected hosted-prerequisite BLOCKED; this is synthetic transport, not published Full Health. Catalog: 170 total / 145 in-app / 10 local / 13 external / 2 future. H10-003 and H13-014 also pass normal and deliberately slowed fixture-timer runs, with zero external requests. HT01–HT09/H16-007 continue to check timeout cleanup and safe evidence/cache handling.

Clean install/tree, typecheck, lint, production build, Repo Health 17/17, five-package retention and whitespace gates passed. Security gate: zero High/Critical; two existing Moderate router-package findings remain, no dependency change. Both real text and element bounds are checked so clipping cannot conceal horizontal text overflow. The 144 surface/theme/language/size/text-scale rows per engine have no measured text-contrast failure (minimum observed 5.28:1), no <44px control and no horizontal text overflow. Semantic control/focus boundaries exceed 3:1. Disabled controls are excluded from contrast certification; this remains a limited lab test, not comprehensive WCAG certification.

| Comparable laboratory measurement | Before (`94da577`) | After (026) |
|---|---:|---:|
| Initial JS raw / gzip bytes | 478,329 / 158,980 | 485,450 / 161,080 |
| CSS raw / gzip bytes | 87,430 / 15,054 | 77,557 / 14,274 |
| Median route DOMContentLoaded range (nine routes, three cold samples each) | 15.4–25.9ms | 16.0–21.5ms |
| Home daily SDK requests per cold entry | 1 `dailyMessage.today` | 1 `dailyMessage.today` (no duplicate) |
| Dependency cycles / lazy-chunk error and reload retry | 0 / PASS | 0 / PASS |

Unchanged limits: JS 500,000 raw / 165,000 gzip; CSS 90,000 / 16,000. These are loopback/fallback-font samples, not cellular latency or field p75/INP. The new 50-of-150-row sheet opened in about 32ms Chromium / 33ms WebKit in the measured interaction; one next-page click made one request and rendered 50 rows. The former OS-native select opening time was not instrumented, so no before/after speed improvement is asserted.

An initial three-sample run showed Pattern CLS 0.1484 only after the patch. A separate [24-run comparison](mobile-026/pattern-loading-comparison.json) reproduced the identical lunar loading-to-content expansion and value in **both** preserved baseline and final bundles, with and without reduced motion and no route animation active. This pre-existing cold-load movement is retained as an observation, not hidden as zero or called a new animation regression. You (0.0770) and privacy (0.0055) loading shifts also remain; no field-vitals acceptance is claimed. The exact per-route samples, DOM counts and request counts remain in the raw before/after files.

Representative WebKit synthetic views: [Home dark at 200%](mobile-026/home-dark-320-200percent.png), [Calendar light at 200%](mobile-026/calendar-light-320-200percent.png), [long-list sheet](mobile-026/birthplace-dark-long-list-200percent.png).

### Official sources accessed 2026-10-21

| Source | Decision supported / limit |
|---|---|
| [Base44 store preparation and wrapper](https://docs.base44.com/documentation/building-your-app/uploading-to-app-stores) | Published web app runs in a secure WebView. The inspected document specifies no usable JavaScript system-back or native bar-color API; no bridge is invented and no store scan/build was requested. |
| [Android core app quality](https://developer.android.com/docs/quality-guidelines/core-app-quality) | Orientation/form-factor parity and background/resume require device acceptance alongside responsive web tests. |
| [Android custom Back](https://developer.android.com/guide/navigation/custom-back) | System Back/predictive Back belongs to native host navigation; browser history tests and Escape are separate. |
| [WebKit safe areas](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) | viewport-fit=cover requires explicit inset-aware content edges; preserve minimum spacing and background. |
| [MDN overscroll](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior) | Apply containment to actual scroll containers. Y-only behavior preserves the separate horizontal axis; support/device behavior must be checked. |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Measure text contrast (4.5:1 normal / 3:1 large), interactive boundaries/focus (3:1), 200% text, reflow, keyboard/focus and alternatives to gestures. This limited matrix is not a full conformance certification. |

### Owner acceptance after the existing sync/publish flow (maximum five steps)

1. In TR and EN, open Home, Calendar, Pattern and You; switch the phone between light/dark while the app stays open. Rotate and enlarge text. Confirm all content/buttons remain reachable above system bars and with the keyboard open.
2. In ON-04 or You editing, open country/region/settlement sheets; try a long list/page, Back, close and keyboard selection. Verify the saved birthplace stays until explicitly changed/cleared.
3. On Home and Calendar, pull at the top and use Refresh. Confirm today's Shinka stays the same, Calendar's unsaved date stays, and offline retry keeps the last view. Never interpret an unknown save as rollback; use the same-change Check/Retry.
4. Open a confirmation then use system Back; verify the layer closes before the page. Try browser Back/Forward, reduced motion and sign out; prior private content must not return. Repeat native wrapper system Back/status-bar checks separately if that host is available.
5. Run the newly published Full Health in the app and save/open its report. Record actual Android/iPhone model/OS/browser or wrapper, keyboard, VoiceOver/TalkBack and gesture results separately; desktop WebKit is not physical iPhone evidence.

No full Android/iOS compatibility, native wrapper or store-acceptance PASS is asserted. Earlier original ON-05, legal-publication, provider/erasure and hosted acceptance remain separate.


## Privacy addition — Buildmarker-023 / HC-023.0 (2026-10-21)

The actual App `/account-privacy` and public `/delete-account` paths add single-confirmation, visible unknown/check/continue and post-User-removal read-only outcome. Local Chromium/WebKit coverage includes TR/EN at 320/360/390/430px and 844×390, computed 100%/200% text, modal Tab/Escape/initial-and-return focus, labels/status and ≥44px controls. Existing safe-area padding/100dvh remain; zoom is not disabled. Each engine passed 550 tests and 23 privacy flows; zero page exceptions. Initial JS 475,923/158,117 gzip and CSS 87,430/15,054 meet the existing budgets. Final engine/count/geometry evidence: [023 verification](privacy-023/verification.json). No physical device, OS text scaling, VoiceOver/TalkBack spoken output, provider callback or store acceptance was executed.

Official review on 2026-10-21: [Apple](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion), [Google Play](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en), [Base44](https://docs.base44.com/Community-and-support/Deleting-user-data). In-app initiation and external request route are implemented. Published-domain/Play Console URL, hosted native removal/Recently deleted disposition and Apple provider revocation remain separate acceptance; current SDK 0.8.54 has no verified purge/revocation method. See [one delivery report](SHINKA_PRIVACY_023.md) for matrix, limits and review. Physical Android/iOS and all earlier unresolved findings remain open.

## You/Profile acceptance — 022 (2026-10-21)

Current source adds You/profile/preferences and preserves Pattern. Canonical Chromium 156.0.8078.4 and WebKit 27.2 each pass 526/526 regressions, 24 actual-App You scenarios, 22 Pattern flows and 87 retained mobile checks with zero page exceptions. You includes TR/EN, 320/360/390/430px and 844px landscape, 100/200% text, field/name focus, Save/Cancel focus return, keyboard entry, labeled native form controls, provider outage/clear, unknown-save recovery and logout invalidation. A completed user's former menu test now checks keyboard navigation to You/heading focus; incomplete-admin menu/Escape checks remain. YU06 proves verified NULL name cannot revive an old Home name.

Local visual review of the 320px/200% form confirmed wrapping/vertical flow; measurements cover both engines. Synthetic provider outage is deliberately visible, not represented as a live GeoNames failure. Native date/time/select behavior, hosted fonts, virtual keyboard, screen-reader output, browser chrome/safe areas and OS scaling still need actual devices. No physical Android/iOS test was run; WebKit is desktop engine emulation.

Production byte budgets pass: initial JS 467,644 raw / 155,412 gzip; CSS 86,583 / 14,929; no static cycles and lazy-error reload retry passes. You is lazy. Local route LCP/CLS are laboratory observations; field p75/INP remains NOT_MEASURED. [Detailed evidence](you-022/verification.json), [performance](you-022/performance.json), [owner acceptance](SHINKA_YOU_022.md). Prior physical/live/ON-05 requirements and historical failures remain open.

## Pattern addition — Buildmarker-021 / HC-021.0

Local Pattern evidence extends this primary report: actual components/App at 320/360/390/430 and 844×390, TR/EN, 100%/200% computed text, five non-overlapping lunar labels, 44px controls, route/onboarding guards and section retry/unmount. Chromium 156.0.8078.4 and WebKit 27.2 each passed 507 canonical tests, 22 Pattern route/layout scenarios and the existing 87 mobile checks with zero page errors. Original computed sizes are captured before doubling to avoid inheritance compounding. [320px screenshot](pattern-021/pattern-tr-320.png), [200% WebKit](pattern-021/pattern-tr-320-200percent.png). Exact engine/count/results are in [021 verification](pattern-021/verification.json). Dedicated screenshots/geometry supplement the existing 87-scenario mobile matrix; old evidence below remains historical. Physical Android/iOS, browser-bar/notch insets, OS text scaling, VoiceOver/TalkBack and hosted font/network remain **NOT RUN**; no device PASS is inferred.

## Current acceptance — Buildmarker-019 / HC-019.0, 2026-10-21

This is the single primary Android/iOS report. The package 009/011/012 material below is historical; old atomic-capability/maintenance prerequisites are superseded by [Base44 continuation](../SHINKA_BASE44_CONTINUATION.md). The repository is **mobile web**, with no PWA service worker/manifest or native Android/iOS WebView wrapper. No wrapper was added. Vite is now 8.2.4; no claim that every browser at the historical toolchain floor was exercised.

| Current scenario | Actual environment and evidence | Result / limit |
|---|---|---|
| Onboarding personal/cycle forms, Home, Calendar, Profile menu, Admin/Test Tools | Playwright Chromium 156.0.8078.4 and WebKit 27.2 on macOS/arm64; real App, isolated SDK; 320/360/390/430px and 844×390 landscape; both TR/EN, 200% computed text sizes | Structured final results: [verification](audit-019/verification.json). 87 mobile/keyboard checks per engine; physicalDevice=false. This is neither Android nor iPhone execution. |
| Text resize and reflow | Every rendered text element enlarged from measured base style; newly opened modal also remeasured/resized without compounding inherited sizes; overflow and visible ≥44px controls asserted | Found/fixed header Profile/language overlap and long Admin card overflow at 320px. Visual QA additionally exposed text overlap from fixed line-height, missed by width-only checks; proportional line boxes preserve normal geometry and scale at 200%, now asserted in T76 and every matrix surface. Approved copy remains unchanged. Text-resize is not native pinch zoom or OS text scaling. |
| Calendar modal keyboard | Open actual delete confirmation; Tab remains inside, Escape closes and returns to the initiating delete button; 200% modal remains scrollable within viewport | WebKit initially failed 10 focus scenarios across both languages/five widths. Explicit initial focus and bounded Tab/Escape behavior fix it. Original failure retained in verification.json; no forced Playwright click hides overlap. |
| Profile/You | Existing one-item Admin menu, Escape returns to its trigger | Full You/settings profile editor is not implemented; no such flow is claimed tested. |
| Native date/time/select, country hierarchy, long TR labels and reduced-height scrolling | Existing input round-trip, optional NULL, 300-country list, clear/retry/race tests retained; browser focus/scroll observed | Actual mobile keyboard/picker sheets remain physical acceptance. |
| Status and authorization | AU06–AU09 and CU regressions exercise visible progress, role=status/alert, uncertain/partial/completed outcomes, reload and same-operation continuation | Semantics and DOM outcomes checked. VoiceOver/TalkBack spoken output not executed. Normal Health does not mutate live product data. |
| Safe-area / viewport | Existing 100dvh fallback, viewport-fit=cover and env safe-area padding inspected; layout/reduced heights tested | Physical notch, browser bars and keyboard overlay remain untested. No Android WebView-insets claim. |
| Performance | Emitted production bytes + isolated cold browser LCP/CLS samples; external font/network services blocked | [Measurements](audit-019/performance.json). INP and real-user mobile/desktop p75 NOT_MEASURED; no field acceptance implied. |

Current screenshots contain synthetic data only: [320px profile at 200%](audit-019/profile-tr-320-200percent.png), [320px Home](audit-019/home-tr-320-200percent.png), [Calendar modal](audit-019/calendar-modal-tr-320-200percent.png), [Admin](audit-019/admin-tr-320-200percent.png). Automated dimensions are in the structured report; screenshots supplement assertions.

Official controls: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) 1.4.4/1.4.10, 2.1.1/2.4.3/2.4.7, 2.5.8 and 4.1.3 inform resize, reflow, focus, touch and status checks. Shinka retains its stricter 44×44 and 52px control standards; this is not a full conformance audit. [Playwright isolation](https://playwright.dev/docs/best-practices) governs separate contexts/visible interactions; [WebKit safe-area guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) governs existing inset styles; [Web Vitals](https://web.dev/articles/vitals) requires field p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 separately for mobile/desktop.

Physical acceptance still needed: record one Android Chrome and one iPhone Safari's exact device/OS/browser versions; test real keyboard/date/select sheets, OS text size/pinch zoom, notch/browser-bar scrolling and orientation, spoken live status/modal focus, Apple/Google callback and background return. No paired physical device was available. These items stay H13-013 / external acceptance, not PASS or suppressed failure.

## Historical package evidence (009–012)


Research and execution date: **2026-10-20**. Latest extension: **Buildmarker-012 / HC-012.0**, at the end of this report. The initial sections retain the **Buildmarker-009 / HC-008.0** evidence against baseline `63906f42a14e99f36f8934e9b42164c9b2ba24c7`, Buildmarker-008 / HC-007.0; the Home section records package 011. This report supports [UI/UX standards](../SHINKA_UI_UX_STANDARDS.md), [code standards](../SHINKA_CODE_STANDARDS.md) and [Release Health](../SHINKA_RELEASE_HEALTH_CHECK.md); it is not another product authority.

## Target versus executed matrix

| Platform | Intended compatibility floor / target | Actually executed | Evidence classification |
|---|---|---|---|
| Android Chrome | Chrome 111+ toolchain floor; current supported Android Chrome also requires physical acceptance. Repository has no separately approved Android OS floor. | Playwright Chromium **156.0.8078.4**, macOS **27.0.1 (26A434), arm64**, headless; desktop and mobile/touch contexts. No Android OS execution. | Automation / viewport and touch emulation; **not Android device proof** |
| iOS Safari | iOS/Safari **16.4+ toolchain floor**; actual minimum and current device versions need acceptance. | Playwright WebKit **27.2**, revision **2370**, same macOS host. Playwright **1.64.0**. No iOS simulator or physical Safari. | WebKit engine automation; **not physical iPhone/Safari proof** |
| Physical devices | Record exact Android/iOS build, browser, device and viewport during acceptance | Unavailable: `adb` absent; Xcode `devicectl` unavailable through installed command-line tools; no paired device exposed to this task | NOT TESTED, H13-013 remains external |
| PWA / native WebView | Not implemented in this repository | No service worker, manifest file or Android/iOS wrapper. Dangling manifest reference removed. | Source inspection; no install/offline/WebView certification |

Toolchain floor is not a tested support guarantee. Vite 8.2.0's installed default targets include chrome111, safari16.4 and ios16.4; its [official build target documentation](https://vite.dev/config/build-options#build-target) agrees. Tailwind 4.3.3 relies on modern CSS; its [compatibility documentation](https://tailwindcss.com/docs/compatibility) specifies Chrome 111 and Safari 16.4 minimums. Older versions were not emulated or tested. No package upgrade was needed.

## Findings, changes and retest scope

| Area | Baseline / inspection | Correction and evidence | Health |
|---|---|---|---|
| Touch/native select | WebKit Health select **176×22px**, ON-04 selects **25px high**; Chromium-only baseline hid the issue | Shared `appearance:none` + decorative chevron preserves native select, measured controls ≥44px (product select 52px). Baseline T80 and U12 failures fixed; contract unchanged. | H13-002, H13-012 |
| Portrait / landscape | Existing checks covered mainly 360/430/1280px | Added 320×568, 390×844 and 844×390 mobile/touch contexts; 390×320 reduced viewport; no horizontal overflow. Existing 360/430/1280 checks retained. | H13-004, H13-012 |
| Dynamic viewport / safe area | `min-height:100vh` and no explicit safe inset contract | 100dvh with 100vh fallback, viewport-fit=cover, max(existing 20/24px padding, env inset); Home keeps existing spacing plus insets. Source/computed layout checked. Real notches and expanding browser bars remain untested. | H13-012, H13-013 |
| Keyboard / focus | Native keyboard not accessible in headless engines | Reduced-height scroll/focus tests prove fields and submit can be reached in normal document flow. No fixed keyboard overlay or scroll lock added. Does not simulate an actual OS keyboard. | H13-012; physical H13-013 |
| Date/time | Native engine widgets can have intrinsic minimum widths | Shrinkable full-width inputs; ISO date and 08:30 values round-trip, blank optional time remains NULL, shared/server validation preserved. Native iOS/Android picker sheets pending. | H07-001/003, H13-012/013 |
| Cascade / localized names | Duplicate label detection scanned nested lists | O(n) label counts; long Turkish characters/homonyms get context plus ID disambiguation. 300-country fixture produces 301 option nodes including placeholder, <450 total fixture DOM nodes. Provider pages stay bounded at 100. No automatic selection. | H10-003, H13-012 |
| Text size / zoom | Zoom was not capped | U13 doubles label/body/button text (200%) at narrow/landscape/reduced heights and checks overflow/focus; fields retain ≥16px text. This is text enlargement, not native pinch zoom or OS accessibility text sizing. | H13-012; physical H13-013 |
| Back / forward / reload | Auth callbacks rely on live provider/session | Real App with isolated SDK checks anonymous/admin routing and back→forward→reload. Existing nested hidden Preview and late-parent READY probes retained. No bfcache or OS process-eviction guarantee inferred. | H03-007, H06-004/006/007 |
| Slow/offline/retry | Existing delayed-response/outage tests | B12/B13/B15/U10/U11 retain late response, parent change, failure/Retry and Clear coverage. M06/M07 add TTL/eviction/scoped cache. Emitted lazy route is intentionally failed once and recovered by visible reload Retry in the production-shaped lab. Real cellular impairment remains manual. | H10-003, H03-010 |
| Lifecycle/resources | Repeated Health start/history completion and clipboard timer could update obsolete UI | Run lock through audit persistence; history tickets; unmount guards; timeout cleanup. M09 preserves completed report persistence after navigation and rejects duplicate start. Picker subscriptions unsubscribe; disposed/old responses cannot restore state. | H03-007, H10-003 |
| API compatibility | Uses dynamic import, Intl, crypto.randomUUID, AbortController, CSS env/dvh | Tested in the two actual engines; build target retained. SDK `functions.invoke` has no AbortSignal argument, so pending hosted calls are ignored/deadlined, not claimed canceled. Provider transport continues supported abort/manual redirect rejection. | H03-010, H10-003 |
| Fonts / layout / interaction | External Inter/Cormorant font requests blocked in deterministic lab | All measured lab routes CLS=0, no recorded long tasks. This only covers fallback-font/loopback samples; real font download and field LCP/INP were not measured. No active raster-image delivery issue found. | H13-003; physical H13-013 |

## Executed evidence and reproduction

Chromium and WebKit each: **298/298 canonical PASS**, **8/8 routing/Preview PASS**, **5/5 additional mobile scenarios PASS**, **52/52 general/static Health PASS**, **21/21 onboarding Health PASS**, zero page exceptions. Real entry import-substitution checks pass; they do not load Base44 runtime secrets. Baseline Chromium was 287/287, WebKit 285/287 (T80/U12); all 287 retained and 11 meaningful tests added (M01…M09, U13/U14). Both engines pass U13 at 200% text. Generated retention and actual production byte budgets pass; the real-App lab also passed deliberate lazy-chunk failure and Retry/reload.

[Structured results](maintenance-009/verification.json) · [WebKit 390×844 screenshot](maintenance-009/mobile-tr-390x844.png) · [WebKit landscape screenshot](maintenance-009/mobile-tr-844x390.png). Screenshots contain only synthetic fixtures. Native date/time presentation follows the test host's locale even when product copy is TR; real device locale/sheet behavior remains in physical acceptance.

Evidence files in [maintenance evidence](maintenance-009/) preserve baseline/final measurements, test summary and representative screenshots. Baseline output explicitly records the two pre-existing WebKit failures. Full local command logs are retained under `/private/tmp/shinka-maintenance/`; committed summaries omit no failures from the reported final runs. No real OAuth, Base44 deployment or personal-profile writes were performed by these tests.

```bash
npm ci
npx playwright install chromium webkit
npm run test:foundation
FOUNDATION_BROWSER=webkit FOUNDATION_MOBILE_DIR=/tmp/shinka-mobile npm run test:foundation
node scripts/recordBuild.mjs --check
node scripts/measureMaintenance.mjs /tmp/shinka-measure
```

The byte comparison and three-run route measurements are in [Development Notes](../SHINKA_DEVELOPMENT_NOTES.md). The production graph uses the real build; the separate lab uses the real App with SDK substitution and blocked external fonts. Byte budgets and import boundary checks are regression guards, not Core Web Vitals. Playwright mobile context changes viewport/touch behavior; it does not run the mobile OS. Playwright's [browser documentation](https://playwright.dev/docs/browsers#webkit) explicitly distinguishes its patched WebKit build from branded Safari.

## Official sources accessed 2026-10-20

| Direct source | Applied conclusion / limit |
|---|---|
| [WebKit Web Inspector](https://webkit.org/web-inspector/) | Use real page network, layout, memory and accessibility inspection for device follow-up. |
| [Apple Responsive Design Mode](https://developer.apple.com/documentation/safari-developer-tools/responsive-design-mode) | Responsive exploration is distinct from physical device execution; page shell is JS-rendered, no invented device result. |
| [Apple inspecting apps/devices](https://developer.apple.com/documentation/safari-developer-tools/inspect-apps-and-devices) | Paired-device inspection path for Safari acceptance. |
| [WebKit responsive design mode](https://webkit.org/blog/14670/simplified-responsive-design-mode/) | Responsive layouts and device/simulator workflows have different scope. |
| [Chrome Device Mode](https://developer.chrome.com/docs/devtools/device-mode) | Emulation approximates conditions; device characteristics require actual hardware. |
| [Chrome remote debugging Android](https://developer.chrome.com/docs/devtools/remote-debugging) | USB device inspection is the follow-up path; none was available here. |
| [WebKit safe-area guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) | viewport-fit=cover needs explicit inset-aware content padding; do not discard minimum spacing. |
| [WebKit 15.4 viewport units](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/) | dvh accounts for changing browser UI; preserve fallback and test real bars separately. |
| [Chrome keyboard viewport behavior](https://developer.chrome.com/blog/viewport-resize-behavior) | Visual/layout viewport behavior and native keyboard differ from merely shrinking a desktop viewport; no universal WebView claim. |
| [Android WebView architecture](https://developer.android.com/develop/ui/views/layout/webapps/webview) | WebView is a native embedded surface with its own integration; no such wrapper exists here. |
| [Web Vitals](https://web.dev/articles/vitals) | Field distributions/device segmentation are separate from controlled lab samples; no invented LCP/INP/75th percentile. |
| [Playwright browsers](https://playwright.dev/docs/browsers) | WebKit automation is not branded physical Safari. |
| [Tailwind compatibility](https://tailwindcss.com/docs/compatibility) and [Vite build targets](https://vite.dev/config/build-options#build-target) | Derive toolchain floors from current docs and installed code, without claiming all intervening versions were tested. |

## Physical acceptance still required (H13-013)

Record device model, OS/build, browser/version, app revision, environment, network and result for each step. Use intended test accounts; share only sanitized evidence.

1. Android Chrome and iPhone Safari: open in portrait and landscape at default and enlarged system text; pinch/page zoom to 200%; confirm labels, controls, summaries and Continue remain reachable without horizontal page scrolling.
2. Expand/collapse browser bars, rotate with keyboard open, focus first/last input, open native date/time/select sheets and return; verify safe-area edges, scroll position and visible continuation. Repeat with hardware keyboard, VoiceOver/TalkBack and native popup selection.
3. Walk TR/EN country→province→district→settlement, long names/homonyms, absent intermediate levels, pagination, Clear and saved-summary edit. Interrupt cellular/Wi-Fi during a list load; confirm safe error, explicit Retry and no stale selection revival.
4. Complete Apple/Google callback using test accounts; navigate back/forward, reload, background and resume, then repeat after an OS-evicted tab or expired session. Confirm durable state is rehydrated without duplicate writes and no invented First Shinka success.
5. Observe actual font requests, layout shift, interaction and CPU/network with Safari Web Inspector / Chrome remote debugging. Record raw traces separately from any field metrics; do not convert these lab results into real-user values.
6. After explicit test-account save, verify backend-selected ID/five-field readback and Clear→NULL. Record new deployed Full Health and private report readback. These remain H06-007/H10-004/live enforcement obligations even if layout passes.

No release/device PASS is asserted until these physical and hosted checks have evidence.

## Buildmarker-011 Home and ON-06 extension

Local evidence only: Chromium 156.0.8078.4 and WebKit 27.2, Playwright 1.64.0 on the same macOS host. Both engines passed 346 canonical tests, 17 admin, 8 routing/Preview, 5 existing mobile and 5 new daily-flow scenarios; 54 general + 21 onboarding + 9 daily synthetic Health cases also passed, with no page exceptions. No Android OS, physical iPhone, real sign-in, hosted import or daily persistence was exercised.

The new actual-App scenarios cover ON-06 failure → explicit Retry → confirmed fixture readback → Home, TR/EN at 360×900 and 1280×900, same Pair/snapshots and no new daily request on language switch, and completed-account errors staying on Home. Controls measure at least 44×44 and no horizontal overflow; existing Profile/admin paths remain available. Canonical DU cases also check offline/failure distinction, unmounted responses and day/timezone changes in flight. Captures use the original SHF-001 copy, a synthetic name and isolated transport; they are not real user records. Hosted font loading and native UI remain unverified.

| Engine | Mobile TR | Mobile EN | Desktop TR | Desktop EN | ON-06 Retry |
|---|---|---|---|---|---|
| Chromium | [Home 360 TR](first-shinka-011/chromium/home-360-tr.png) | [Home 360 EN](first-shinka-011/chromium/home-360-en.png) | [Home 1280 TR](first-shinka-011/chromium/home-1280-tr.png) | [Home 1280 EN](first-shinka-011/chromium/home-1280-en.png) | [Retry TR](first-shinka-011/chromium/on06-retry-360-tr.png), [Retry EN](first-shinka-011/chromium/on06-retry-1280-en.png) |
| WebKit | [Home 360 TR](first-shinka-011/webkit/home-360-tr.png) | [Home 360 EN](first-shinka-011/webkit/home-360-en.png) | [Home 1280 TR](first-shinka-011/webkit/home-1280-tr.png) | [Home 1280 EN](first-shinka-011/webkit/home-1280-en.png) | [Retry TR](first-shinka-011/webkit/on06-retry-360-tr.png), [Retry EN](first-shinka-011/webkit/on06-retry-1280-en.png) |

Production initial JS is 459,519 raw / 149,604 gzip bytes (+5,006 / +1,500 versus 010); CSS 84,916 / 14,553. Existing budgets pass and source/import/test modules are not in the initial graph. Three cold 360px Home lab samples have 56 DOM nodes, DCL 15.3–20.4 ms, CLS 0, no recorded long task or page error. These are loopback samples with stubbed SDK and blocked external fonts, not field Web Vitals or device speed claims. [Structured verification](first-shinka-011/verification.json).

OD-002 has since been approved by the user (2026-10-20); this adds no device evidence. After durable persistence closure, extend physical acceptance with first real ON-06 → Home, reload twice, TR/EN switch, lost-network Retry, background/OS-eviction restore and local midnight/timezone change. Verify a single owner/day record and unchanged four snapshots through the backend, then deployed Full Health/private report readback. Preserve all earlier native keyboard/sheet/assistive-technology requirements. [Exact import and live acceptance steps](SHINKA_FIRST_SHINKA_011.md).

## Buildmarker-012 Calendar extension

Chromium **156.0.8078.4** and WebKit **27.2**, Playwright **1.64.0**, same macOS host: each **376/376 canonical**, **89/89 local Health** (54 general, 21 onboarding, 9 daily, 5 Calendar), **17 admin / 8 routing-Preview / 5 mobile / 5 daily / 6 Calendar scenarios**, no page exceptions. The existing mobile suite still covers 320px, landscape, reduced viewport and 200% text; Calendar's own actual-App captures/geometry are 360×900 and 1280×900 in TR/EN, plus blocked/consent states at 360×740. These are browser automation, not Android OS, native Safari, physical devices or live Base44 writes.

New Calendar checks cover the monthly grid and keyboard arrows, explicit selection without writes, native date input, same-ID edit, delete confirmation/cancel, last-delete empty state, Home return with identical saved daily ID, consent concealment and production-unavailable state. Day targets are ≥44×44px and date text is 17px; no horizontal overflow in measured Calendar viewports. Screenshot review corrected the native dialog's initial top-left placement/missing rounding and distinguished keyboard focus with a dashed outline from the solid selection ring. Final mobile and desktop TR/EN images were visually inspected in both engines. The native date widget's visible formatting follows the host/browser locale; ISO YYYY-MM-DD values remain stable.

| Engine | Mobile TR | Mobile EN | Desktop TR | Desktop EN | Confirmation and states |
|---|---|---|---|---|---|
| Chromium | [Calendar TR](calendar-012/chromium/calendar-360-tr.png) | [Calendar EN](calendar-012/chromium/calendar-360-en.png) | [Calendar TR](calendar-012/chromium/calendar-1280-tr.png) | [Calendar EN](calendar-012/chromium/calendar-1280-en.png) | [Delete](calendar-012/chromium/calendar-delete-360-en.png), [blocked](calendar-012/chromium/calendar-blocked-360-tr.png), [consent](calendar-012/chromium/calendar-consent-360-tr.png) |
| WebKit | [Calendar TR](calendar-012/webkit/calendar-360-tr.png) | [Calendar EN](calendar-012/webkit/calendar-360-en.png) | [Calendar TR](calendar-012/webkit/calendar-1280-tr.png) | [Calendar EN](calendar-012/webkit/calendar-1280-en.png) | [Delete](calendar-012/webkit/calendar-delete-360-en.png), [empty](calendar-012/webkit/calendar-empty-360-tr.png), [blocked](calendar-012/webkit/calendar-blocked-360-tr.png) |

Official sources rechecked for this extension:

- [HTML date input specification](https://html.spec.whatwg.org/multipage/input.html#date-state-(type=date)): native date control, ISO value and constraint validation are separate from locale-dependent presentation. Backend validation remains authoritative; no conversion to device-local midnight is used.
- [Chrome keyboard viewport behavior](https://developer.chrome.com/blog/viewport-resize-behavior): Android keyboard changes can obscure fixed controls. Calendar keeps the date/form in scrollable document flow; no fixed save bar or new viewport override is introduced.
- [WebKit safe-area guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/): existing inset-aware shell keeps minimum product spacing. Dialog max-height/overflow and existing dvh fallback remain; real notches/browser bars/native picker sheets still require device testing.

Production initial JS is **460,387 raw / 149,852 gzip bytes**, +868 / +248 versus 011. CSS is **85,910 / 14,752**, +994 / +199. These pass the unchanged 500,000 / 165,000 JS and 90,000 / 16,000 CSS budgets. Calendar's lazy chunk is **16,973 raw / 6,139 gzip**; its production dependency closure contains no fixture/test bundle. No static cycles or initial source/import/test modules; the intentional Health tooling chunk still emits the existing large-chunk/mixed-import warnings.

Three cold 360px Calendar lab samples: **156 DOM nodes**, DCL **14.8–18.1ms**, CLS **0**, no recorded long tasks/page errors, scroll width **360px**. SDK calls are substituted, external fonts blocked, loopback unthrottled. The lab Calendar route also loads its isolated transaction fixture, so its transferred JS is not the production Calendar payload. These measurements do not establish hosted API latency, device speed or field Web Vitals. [Raw measurement receipt](calendar-012/measurements.json) and [executed verification](calendar-012/verification.json).

New physical acceptance: choose dates via native Android/iOS sheets, rotate/background/reopen during editing, use VoiceOver/TalkBack and hardware keyboard, check Cancel/Escape focus and dialog scrolling with enlarged text. Verify remote consent withdrawal/session loss hides health on refresh/resume; the current app uses known-event/focus/visibility invalidation plus a 60-second foreground refresh, not an instant remote revocation push channel. After the atomic prerequisite is closed, execute the [hosted lifecycle sequence](SHINKA_CALENDAR_012.md#publish-sonrası-kabul). **H13-013, H08-901 and deployed Full Health remain unverified.**
