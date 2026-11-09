# 059 — Pattern presentation and shared navigation evidence

Date: 2026-11-09. Buildmarker-059 / HC-058.0. Test only; no main merge, publish, live Full Health/Security scan or user/reference-data mutation.

## Preserved baseline and measured navigation

Main and Test were synchronized to 9b5da80 without loss; five main commits and Base44 package/auth changes preserved. Navigation source already contains 057's 44px minimum auto-growing row, three equal columns and centered icon/label groups. `ProductTabs` adds no footer padding. Product roots have zero bottom safe padding; the static, normal-flow nav owns `env(safe-area-inset-bottom)` once. Main content retains 32px bottom padding and does not extend behind the nav.

Published Shinka reported Buildmarker-058 / HC-057.0. Read-only Pattern DOM at 390×844 and 360×740 measured row 44, top border 1, safe inset 0, total white nav 45 and main bottom padding 32 CSS px. The attached Android screenshot cannot yield CSS px without device scale/viewport identity. Its white Home cards differ from current source/published styling. An old bundle is a hypothesis; APK/WebView build identity and native padding were not accessible. No live Home daily-assignment call was made.

No further runtime height change was justified. The prior 057 56→44px change and its before/after receipts remain in [057](SHINKA_REOPEN_NAVIGATION_057.md). This package adds measurement of shell padding, nav margin, main/nav gap, trailing document space and last-content overlap, including negative injected duplicate-padding/margin fixtures. Synthetic 0/24/34px insets do not measure physical Android system bars or iPhone home indicators. See Android's [WebView inset ownership](https://developer.android.com/develop/ui/views/layout/webapps/understand-window-insets); consumed native insets must be distinguished from CSS insets, but no Shinka wrapper defect is proven.

| Screen, normal text / zero inset | Row before → after | Safe inset | White nav total | Main bottom padding |
|---|---:|---:|---:|---:|
| Home | 44 → 44 | 0 → 0 | 45 → 45 | 32 → 32 |
| Calendar | 44 → 44 | 0 → 0 | 45 → 45 | 32 → 32 |
| Pattern | 44 → 44 | 0 → 0 | 45 → 45 | 32 → 32 |

Local actual-App synthetic transport measurements; published measurements above are Pattern only. A 24px injected inset gives 69px total, a 34px inset 79px; these are intentional single safe insets. At 200% text the measured row grows to 62 or 98px, depending on available width and wrapping; safe inset is added once. Browser before/after source layout is unchanged, not a fabricated size improvement. Final matrix receipts are linked below.

## Pattern decisions and implementation

The owner's later request preserves the in-progress nav work and supersedes 038's two-theme/summary-only Moon presentation. The 30-day calendar window, saved category IDs, native IDs, duplicate-day Home comparator, count-descending/latest-day-descending tie rule and schema are unchanged. `patternOperation` exposes only `primary` in themes, and `patternService` rejects a two-row or wrong-category response. Existing secondary summary fields remain derived metadata, never a second rendered theme.

The prior 021 timeline was reviewed and reused. Four validated contiguous NEW/WAXING/FULL/WANING intervals bound the current lunation; WANING.end is the next NEW transition. Each node and Today uses its real UTC ratio between previous and next NEW. Backend now is authoritative. The client checks node order, instants, ratios, active/current consistency and READY/PARTIAL state. Date/time labels use validated IANA zone and existing dd.MM HH:mm format in both locales. Numbered decorative nodes have a wrapping, accessible five-row textual counterpart. Missing coverage retains the known phase and shows unavailable; it cannot produce a complete graphic. No second engine, database field, cache or dependency was introduced. Old LunarSummary was removed and readiness consumers now use LunarTimeline.

Independent section loads, retained-data refresh/error/Retry, fresh owner/ACTIVE/lifecycle guards, account-change/late-response suppression, manual Profile-only theme and the sole approved watercolor backdrop remain. No repeated moon/plant hero or language buttons.

## Missing source — explicitly incomplete

SRC-03 part 3 was downloaded from its recorded public URL and reread (§6.1–6.3). It has the six approved category names, astronomical rules and an embedded whole-screen mockup; no category explanation table or standalone six-category illustration set. Code/canonical inventory has no approved description/asset mapping. The new reference has two sample cards, not six complete bilingual category definitions.

Still required for each of REST_AND_SLOW_DOWN, SELF_CARE_AND_WELLBEING, NOVELTY_AND_DISCOVERY, FOCUS_AND_PROGRESS, CONNECTION_AND_SHARING, SIMPLICITY_AND_LETTING_GO: one approved TR sentence, one approved EN sentence and an approved illustration asset association. The user was asked for the source location. Until available the real selected title is shown; no invented sentence, wrong image, placeholder approval or broken URL. Final title/description/illustration association acceptance is **NOT_RUN / SOURCE_REQUIRED**. This part is not reported complete.

## Health and execution

0 Health cases added / 4 updated / 0 removed: H05-009 strict package policy, H10-001 calculation/DTO, H13-017 Pattern UI, H13-012 nav/inset ownership. Catalog remains 186; external/native cases stay open. PT20 and PU09 cover new contract gaps; existing PT07–09/PU01/03/07 are updated to actual product decisions. No assertion or physical prerequisite is downgraded.

Initial focused run retained one PU03 failure: the fixture's 320px host used a wide viewport's valid two-column layout, while its old assertion required vertical rows. The replacement tests actual pairwise rectangle intersection, containment and ≥44px controls. First typecheck caught a mixed tuple type in a new test and was corrected with explicit string conversion. Final results and safe evidence: [execution.json](pattern-navigation-059/execution.json).

Inherited follow-redirects 1.16.1 had one High. Standard npm update selected compatible 1.16.2 (published 2026-10-25), respecting the seven-day cooldown; 1.16.3 (2026-11-08) was not selected. No direct dependency/Base44 version change. npm also normalizes optional bundled WASM lock metadata; `npm ci` verifies the result. Previous 057/058 security failures remain historical evidence.

## Owner publication / outstanding acceptance

After review, merge Test via the existing owner flow and sync matching `pattern` entry/shared code before publishing the matching frontend. No schema push/import/cleanup or notification activation. Mixed old/new Pattern DTO versions fail validation rather than silently mixing presentation.

Provide the six-category approved copy/illustration set for the incomplete card design. Verify the actual APK build against the published marker, then measure system/native/CSS inset ownership on Android three-button/gesture and iOS indicator, landscape and real keyboard. Desktop Chromium/WebKit emulation is not that physical evidence. DB cleanup, live Full Health and Security scan were not run.

## Final local results

- Chromium 156.0.8078.4 and WebKit 27.2: **791/791 PASS each**, zero page errors. Each run includes the actual native/SDK/server fixtures, independent Pattern/account/late-response tests, retained Calendar/scroll/tab history and the normal local synthetic Health save/list/open flow.
- Each engine: Pattern **40 visual cells + 2 route denial checks**; TR/EN, manual light/dark, 320/360/390/430/844 widths and 100/200% text. Public approved backdrop/fonts loaded for the visual matrix; all product transport remains synthetic.
- Each engine: navigation **192 geometry cells + 12 simulated keyboard resize/focus checks + 1 negative-spacer scenario**, then a focused loaded-asset capture on the final source. Actual Android keyboard/system UI and iOS indicator behavior remain NOT_RUN.
- Local synthetic Health: **147 PASS / 13 expected hosted-prerequisite BLOCKED / 0 FAIL**, not a hosted Full Health result. H13-017 serialized scope wording was reconciled after the full bundles; final metadata assertions, build, repo check and focused harness rebuild validate that text-only follow-up.
- `npm ci`, full/direct dependency tree, typecheck, lint, build, repository Health, generated last-five history and native dependency security pass. Fresh npm audit: **0 vulnerabilities**. No policy override or new direct dependency.
- Performance gate PASS: initial JS **489,223 raw / 163,444 gzip bytes** (limits 500,000 / 165,000); CSS **79,191 / 14,545** (limits 90,000 / 16,000). Lazy chunk failure/reload recovery passes. Loopback headless 360×740 with synthetic SDK and blocked external fonts; not real-user latency or native performance. [Measurements](pattern-navigation-059/performance.json).

### Comparable screenshots

Same Chromium engine, TR/EN fixture state, loaded font/background and 390×844 viewport; full-page height changes naturally with content. Only synthetic user data appears.

| Surface | Before | After |
|---|---|---|
| Home | [058 source](pattern-navigation-059/home-before.png) | [059](pattern-navigation-059/home-after.png) |
| Calendar | [058 source](pattern-navigation-059/calendar-before.png) | [059](pattern-navigation-059/calendar-after.png) |
| Pattern | [058 source](pattern-navigation-059/pattern-before.png) | [059 — copy/art still missing](pattern-navigation-059/pattern-after.png) |

[Chromium TR dark 320px/200%](pattern-navigation-059/chromium-pattern-320-tr-dark-2x.png) · [WebKit equivalent](pattern-navigation-059/webkit-pattern-320-tr-dark-2x.png). Compared visually with the supplied reference: one theme instead of two; approved existing background retained; proportional timeline and text equivalent restored. The illustrated explanatory card cannot be matched until its six-category source assets/copy are provided.
