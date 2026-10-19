# Shinka Android / iOS compatibility evidence

Research and execution date: **2026-10-20**. Application: **Buildmarker-009 / HC-008.0**. Baseline: `63906f42a14e99f36f8934e9b42164c9b2ba24c7`, Buildmarker-008 / HC-007.0. This report supports [UI/UX standards](../SHINKA_UI_UX_STANDARDS.md), [code standards](../SHINKA_CODE_STANDARDS.md) and [Release Health](../SHINKA_RELEASE_HEALTH_CHECK.md); it is not another product authority.

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
