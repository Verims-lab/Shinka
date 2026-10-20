# SHINKA — Development Notes

**Document:** SHINKA_DEVELOPMENT_NOTES.md
**Status:** ACTIVE — First Shinka repository work; production persistence and live closure blocked
**Current BuildMarker:** Buildmarker-012
**Last Updated:** 2026-10-20
**Authoritative Source References:** SHINKA_SOURCE_OF_TRUTH.md; explicit maintenance request
**Purpose:** Current findings, comparable measurements and handoff.
**Scope:** First Shinka/Home preparation and retained maintenance/admin evidence; no live import or deployment.

## Buildmarker-009 maintenance baseline and changes

Preflight: clean local Test = origin/Test at `63906f42a14e99f36f8934e9b42164c9b2ba24c7`. Main `b33c001fe30cceb0ad392aa38146ddbedc2c2461` was one commit behind Test with no divergence. No main merge was needed. Baseline was Buildmarker-008 / HC-007.0; the distinct maintenance package advances once to 009 / HC-008.0. Test-only delivery remains required.

Before editing, npm ci/tree/security/type/lint/build/Repo Health and Chromium canonical checks passed (287/287). WebKit baseline had two genuine failures: Health native select height 22px (T80/H13-002), ON-04 native selects 25px (U12). Both engines used the same canonical suite. The shared native control now suppresses browser appearance while preserving the popup and 52px control tokens. No failed check was removed.

| Finding | Implemented correction |
|---|---|
| Entry eagerly included internal pages, catalog and 21 test modules | Lazy internal/probe routes, shared loading/error/reload boundary, tiny separate probe path contract, lazy test execution. Guards stay in place. |
| Profile/cycle form and list presentation mixed with screen/controller orchestration | Cohesive OnboardingForms and BirthplaceList; readable Screen/controller; one linear pass for duplicate labels. |
| Repeated provider path reads, unnecessary preferences query | Per-picker TTL/LRU/byte-bounded public list cache; list operations read owner profile only. Server resolve/save contract unchanged. |
| History refresh races, repeat clicks, clipboard timer | Health run lock through persistence, latest-history ticket, disposed UI checks; completed audit save preserved; clipboard/test runner cleanup. |
| Browser viewport and intrinsic input sizing | 100dvh fallback, safe-area padding, shrinkable inputs/selects, zoom allowed. |
| Eight active package entries and repeated continuation prose | Generated latest-five source/Markdown, update-or-next writer, source/Health/Repo guards; at that delivery the five were 005…009. |
| Unregistered generated OAuthConsent/AuthLayout | Removed after App route, dynamic/action/test callsite and production graph checks. Not part of baseline bundle; no byte savings attributed to this removal. |
| Broken manifest reference without PWA implementation | Removed dangling link; no service worker, installed PWA or native WebView claim. |

No duplicated backend security/validation engine was introduced. Shared validation and SDK persistence remain authoritative; reverse dependencies/static cycles are guarded. Temporary admin-only GeoNames probe stays because hosted cascade/resolve/save and deployment parity are still unverified. Legacy search action remains registered for compatibility; new ON-04 does not call it. Necessary prior platform observations are retained in [prior evidence](reports/SHINKA_PRE_009_EVIDENCE.md), while active standards retain all approved product decisions.

## Performance evidence

Reproducible script: `node scripts/measureMaintenance.mjs /tmp/shinka-measure`. Baseline used the same build/measurement routine before edits. Actual production bundle sizes are distinct from the real-App lab, whose SDK transport is substituted. Three fresh headless Chromium contexts per route, 360×740, local loopback, no throttling, external font requests blocked; Node 26.0.0, macOS 27.0.1 arm64. Cold context means browser cache isolation, not an OS disk cold start. Time samples were collected alongside other local work and are noisy. No field LCP/INP or Lighthouse claim is made.

| Metric | Baseline | After |
|---|---:|---:|
| Initial production JS (raw bytes) | 1,026,028 | 447,024 |
| All production JS (raw bytes) | 1,026,028 | 1,039,179 |
| Production CSS (raw bytes) | 84,726 | 84,474 |
| Initial JS gzip bytes | 328,023 | 146,549 |
| CSS gzip bytes | 14,449 | 14,494 |
| Initial test modules | 21 | 0 |
| Total JS chunks | 2 | 12 |

Initial JS falls **56.4% raw / 55.3% gzip**. Total code is slightly larger because meaningful regression coverage was added; it is loaded on demand. All sizes include minified assets, gzip computed with Node zlib (not a claim about server transfer configuration).

| Lab route | JS decoded bytes before → after | DOM nodes before → after | Median DOMContentLoaded ms before → after |
|---|---:|---:|---:|
| `/` | 893,484 → 315,347 | 38 → 37 | 34.1 → 25.9 |
| `/login` | 893,484 → 315,347 | 42 → 41 | 27.8 → 18.2 |
| `/internal/build?sdkSession=admin` | 893,484 → 337,499 | 215 → 195 | 30.3 → 17.6 |
| `/internal/health?sdkSession=admin` | 893,484 → 863,929 | 1165 → 1196 | 32.3 → 16.4 |

Timing samples are descriptive, not evidence of a guaranteed latency gain. All routes have zero recorded page exceptions. Lazy Health chunk interruption shows a visible error and succeeds after Retry/reload. New byte budgets pass. Raw evidence: [baseline](reports/maintenance-009/baseline-measurements.json), [after](reports/maintenance-009/final-measurements.json), [provider call comparison](reports/maintenance-009/geonames-comparison.json).

Country→province→district→language switch followed by the same-language path revisit uses the unchanged provider fixture and controller from immutable baseline Git versus current. Baseline: 51 outbound / 18 service calls; after: 38 outbound / 14 service calls. Cold first path and first language refresh are unchanged (33 outbound / 12 service calls). The revisit changes 18→5 outbound and 6→2 service calls because two TR settlement scopes were not yet cached. M07 also verifies a fully cached same-language repeat makes zero new service calls. M06 verifies TTL, eviction and serialized-byte bounds. Each uncached list action now performs one owner-profile read instead of two profile/preferences reads; inactive/anonymous cases still cannot call the provider.

Native select pages remain at most 100 rows, countries at most 300; no whole-country tree is fetched. Retention is enforced in source and generated Markdown, so Internal Build renders at most five records without shipping an archive then slicing. Health DOM grows with the three explicit new cases; no DOM reduction is claimed for that page. All lab samples had CLS 0 and no recorded long tasks; blocked fonts and loopback conditions mean this does not prove live font/layout or interaction performance. There are no active raster images to optimize. Physical resource/network/CPU profiling remains part of the device handoff.

Client list invoke has a 30-second response deadline but no SDK AbortSignal option. Late generations are ignored and not cached. Provider fetch still has its supported abort/deadline/stream cleanup; an in-flight hosted SDK call is not claimed physically canceled.

## Verification

Final clean `npm ci`, `npm ls --depth=0`, `npm ls --all`, `security:deps`, typecheck, lint, build, Repo Health **16/16**, and generated-history check all passed. Fresh audit: **0 Critical / 0 High / 2 Moderate / 0 Low**. Final canonical: **298/298 in Chromium and 298/298 in WebKit**; each also passes **8/8 routing/Preview**, **5/5 mobile scenarios**, **52/52 static/general Health**, **21/21 onboarding Health**, and both actual-entry import-substitution checks, with zero browser exceptions. This is local evidence, not a deployed Full Health report. [Structured verification](reports/maintenance-009/verification.json).

Pre-delivery fetch found main had advanced to merge commit `848e073` (PR #14) with the exact same file tree as the starting Test revision (`9f87ef1d42f8b30ba03e0908d910c9cfd3abfaec`). In accordance with the user's standing rule, remote Test and local Test were fast-forwarded to that merge before recording maintenance. No source changes or main writes occurred in that synchronization; existing test results remain applicable.

Dependency and lockfile versions unchanged. Native audit exit 1 represents two documented Moderate router findings; required High-threshold guard exits 0. There are no Critical/High findings. Existing npm configuration warnings and large/mixed-import warnings for the intentionally heavy Health/test bundle remain; normal application entry no longer carries it. Missing local Base44 deployment settings are not connectivity proof. The in-app canonical test set remains identical to the CLI set; mobile/real-App routing and byte budgets are additional CLI checks.

Health changes: update H01-006, H05-009, H10-003; add H03-010, H13-012, H13-013; no suite/case deletions. Catalog 16 suites / 129 cases / 106 current / 15 future / 8 external. Detailed reasons are in [Release Health](SHINKA_RELEASE_HEALTH_CHECK.md). All twelve canonical documents are reconciled, including the explicit pre-content maintenance exception. [Android/iOS report](reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md) carries the target/test matrix, sources and reproducible evidence.

## User handoff after Test delivery

1. Merge/sync/publish through the existing Git→Base44 Builder workflow when ready. Verify marker 009/catalog HC-009.0 and both onboarding/internalHealth function revisions; one frontend marker cannot prove both server bundles.
2. Run deployed Full Health, save/list/open the private report. Exercise Apple and Google on intended test accounts/devices; check session return/refresh and inactive/non-admin boundaries.
3. In ON-04 verify empty start, TR/EN, country/province/district/settlement, missing intermediate levels, large pages, outage/Retry, parent reset, and Clear. Explicitly save only a test account's chosen place, then read back its server-resolved five fields; Clear saves all NULL. Do not share credentials or personal place/DOB payloads.
4. Complete H13-013 physical Android/iPhone checklist in the mobile report. No physical device was accessible here (`adb` absent; `xcrun --find devicectl` unavailable). Native keyboard/sheets, browser bars/insets, zoom/assistive technology, background eviction and real mobile-network/fonts remain open.
5. Keep native timestamp, uniqueness/conditional-write/concurrency and protected-history enforcement obligations. FIRST_SHINKA_ENGINE_REQUIRED now represents the unresolved production persistence boundary; current implementation status is in the 011 section. Remove the temporary GeoNames admin diagnostic only after its documented hosted success condition is evidenced; it is not automatically run by Health or onboarding.

No live product rows, security/audit records or Git history were deleted; no main push, CLI deployment, provider sign-in or real-secret probe was performed during maintenance.

## Prioritized ON-05 correction — 2026-10-20

The live saveCycle incident was prioritized within this same maintenance work; no parallel agent or competing branch was started. Preflight local Test = origin/Test `9e6473d`, clean; main `848e073` two commits behind. Buildmarker-009 retained, HC-009.0 advances once for changed consent/partial-retry semantics and new external H11-006. The initial maintenance measurements above remain historical evidence; this subsection is the current correction result.

Proven repository defect: current consent was written, then native created_date (already normalized to created_at) was required as an explicit-zone timestamp and used to rewrite granted_at. The old adapter reproduced NATIVE_CONSENT_TIMESTAMP_REQUIRED with a valid business grant and zone-less native metadata. Corrected authority is the existing validated UTC granted_at; new explicit grants get backend time only when no consent exists. The native rewrite/error branch and its unused client code were removed. Reconciliation is separate from SDK persistence; insert-only consent/settings avoids replacement, matching history/period is reused, conflicts refuse writes, and hydration verifies the grant event before advancing. Optional durations remain NULL; Skip never writes.

LIVE_RUNTIME observation: published UI is still 008 / HC-007.0; Preview Main points to 848e073 with prod data. Greenfield table counts: consent 1, event 0, period 0. Date cells exist but are formatted; raw API type/offset, account correlation and exact deployed function hash are not proven. These limits and same-account retry/readback steps are in [the incident handoff](reports/SHINKA_ON05_CONSENT_RECOVERY.md). No live product mutation or deployment was made. The incident remains **OPEN_PENDING_LIVE_SAVE_AND_READBACK**.

Verification: clean install and both dependency-tree checks, native High-threshold security guard, typecheck, lint, build, Repo Health 16/16 and generated five-entry history check PASS. Fresh audit 0 Critical/High, 2 existing Moderate router findings. Chromium 156.0.8078.4 and WebKit 27.2 each pass **310/310 canonical tests**, **52 general + 21 onboarding Health**, **8 routing/Preview + 5 mobile scenarios**, zero page exceptions. P21…P32 cover native metadata variants, preserved/invalid business time, partial/lost writes, conflicts/guards, bounded duplicate requests and Skip; P28 deliberately demonstrates independent-worker duplicate detection without a uniqueness claim. No Health case was removed. [Compact verification](reports/ON05_VERIFICATION.json).

Previous performance guard also passes: initial production JS 447,080 raw / 146,566 gzip bytes; CSS 84,474 / 14,494; no initial test modules or static cycles; lazy reload/retry passes. The small JS increase comes from safe error-code handling. No physical-device or live performance claim. Cross-worker first-insert races remain possible under Base44's unsupported UNIQUE capability; detected ambiguity fails closed, neither record is silently rewritten. This correction does not certify distributed transactions or rollback.

## Buildmarker-010 — admin entry delivery

Preflight: clean Test/local `771db78`; main `848e073`, Test three commits ahead. Existing ON-05 correction retained. Added the top-right verified-admin menu, lazy two-card `/internal` panel and shared return navigation; ordinary profile stays disabled. Auth generation tickets prevent stale identity restoration, with guarded route/focus/visibility/periodic refresh and no onboarding form reset. The small single-link menu needs no additional library or menu chunk, preserving the initial-bundle budget. The new navigation adds no product writes or completion state.

Catalog advances to HC-010.0; H12-025/H13-014 add session/navigation coverage without removing backend/security cases. AN01…AN08 plus real-App CLI routing/keyboard/responsive fixtures are included. All eight requested standards are reconciled; 010 remains explicitly pre-content. Generated active ledger/history retains 006…010. Verification results and synthetic screenshots are recorded in [admin access evidence](reports/SHINKA_ADMIN_ACCESS_010.md). Live admin verification and ON-05 same-account saveCycle/readback remain unverified; no deployment performed.

Final 010 verification: **318/318 canonical tests in Chromium 156.0.8078.4 and WebKit 27.2**, each with **17/17 admin**, **8/8 routing/Preview**, **5/5 mobile**, **54/54 general Health**, **21/21 onboarding Health**, zero page exceptions. Clean install/tree, typecheck/lint/build, Repo Health 16/16, history and security guard passed; audit 0 Critical/High, 2 existing Moderate. Initial JS **454,513 raw / 148,104 gzip** bytes and CSS **85,018 / 14,572** stay within existing budgets. During delivery main advanced to PR #15 merge `3e663fe` with the same file tree; Test/local were fast-forwarded and origin/Test synchronized while working changes were preserved. Feature commit targets Test only.

## Buildmarker-011 — First Shinka / Home delivery, 2026-10-20

Preflight and pre-delivery fetch: local Test = origin/Test `ec63cae`, main `3e663fe`; Test one commit ahead, no main-only commits. Existing ON-05 recovery, GeoNames, maintenance and admin changes were preserved in the same checkout. Only Test is the delivery target; no deployment or live product mutation occurred.

Read the original business/use-case/UI/technical/database/entity sources and all three original content workbooks. Reproducible manifest: 260 exact SHF IDs with four language cells, six categories, 240 mappings = identical 192 base + 48 UNKNOWN; no missing/duplicate/unrecognized content. The manifest digest is `83ec8ad248483ef31c996b0f0782a2ce419de7d4d186590ce03b47c30cfd9a91`. At the initial 011 delivery, source hashes and the pending OD-002 proposal table were recorded in [the implementation/handoff report](reports/SHINKA_FIRST_SHINKA_011.md). At that checkpoint proposed category codes/English names were not marked approved or inserted; the user approval continuation below supersedes only that pending decision.

Added bounded, admin-only dry-run/reviewed-batch/exact-readback content and Moon import; partial/conflicting data never becomes ready and retry preserves exact matches. No product schema/RLS fields were added. Source/native Pair ID crosswalk is verified from unique exact copy. Moon intervals use source-approved Astronomy Engine 2.1.19, continuous UTC boundaries and at least two future years; controlled renewal is manual. Current-day cycle rules, last-three/outlier average, computation-only 5/28, UNKNOWN and guarded consent reads follow the sources. Selection implements backend local day, 40/41 boundary, all fallback stages, actual category and immutable TR/EN snapshots.

ON-06 invokes the daily service with a bounded deadline and explicit Retry; only verified persisted readback advances. Home shows the two snapshot cards, optional-name local greeting, language switch and preserved Profile/admin access. Existing users remain on Home when today's request fails. A malformed historical row cannot falsely complete onboarding; late/unmounted or previous-day/timezone responses cannot advance. Scoped Home TR localization is centralized; existing approved onboarding copy is unchanged.

**Production creation is BLOCKED.** Base44's documented unsupported UNIQUE and merging upsert do not prove durable cross-instance create-if-absent. The existing atomic protocol is implemented only by an isolated test fixture; production supplies no adapter and refuses new writes. Existing valid rows remain readable. H09-004 deliberately stays BLOCKED. OD-002 blocked content import at that checkpoint and is now resolved by the explicit approval below. No invented transaction/rollback or fixture-as-live claim. The handoff gives concrete conditional-insert/transactional-store closure options. ON-05 remains OPEN_PENDING_LIVE_SAVE_AND_READBACK.

Final local verification: Chromium 156.0.8078.4 and WebKit 27.2 each **346/346 canonical tests**, **54 general + 21 onboarding + 9 daily synthetic Health**, **17 admin + 8 routing/Preview + 5 mobile + 5 daily-flow scenarios**, zero page exceptions. DM01…DM25/DU01…DU03 add source/import, phase/timezone/DST, fallback, concurrency protocol, failure/recovery, privacy, offline and UI coverage. Clean install, direct/full dependency trees, security guard, typecheck, lint, build, Repo Health **16/16**, generated five-package retention and byte budgets pass. Audit: **0 Critical / 0 High / 2 existing Moderate** router findings. Astronomy Engine is the only added dependency and is pinned to 2.1.19. The npm configuration and intentionally lazy Health-chunk size/mixed-import warnings remain; missing local Base44 settings do not prove hosted connectivity.

Measured production entry: **459,519 raw / 149,604 gzip bytes**, versus 454,513 / 148,104 in 010; delta +5,006 / +1,500. CSS **84,916 / 14,553**; all below unchanged 500,000 / 165,000 JS and 90,000 / 16,000 CSS budgets. Source/import/test payloads are excluded from the initial graph; no static cycles. Home cold lab samples: 56 DOM nodes, DCL 15.3–20.4 ms, CLS 0 and no recorded long task, no horizontal overflow at 360px. Loopback/stubbed transport/blocked remote fonts are not hosted or user performance. [Structured evidence and measurements](reports/first-shinka-011/verification.json); [mobile/desktop captures and device limits](reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md).

HC-011.0 has 137 cases: 118 current / 9 future / 10 external. Six scoped future cases were activated, five cases added and H05-007/009 updated; none deleted or downgraded. All twelve canonical documents and generated history align with the implemented-but-blocked state. Active packages are 007…011. Deployed Full Health/private report readback, real import/daily creation, independent-worker guarantees and physical Android/iPhone acceptance remain unexecuted requirements; local subsets are not Full Health PASS.

## OD-002 user approval continuation — 2026-10-20

Preflight: clean local Test = origin/Test `9e0de86`; Test two commits ahead of main, no main-only commits. The user approved the exact six codes/EN names and retained source TR names, explicitly excluding all Pair text and category-association changes. Registered RESOLVED_BY_PRODUCT_DECISION with this conversation as authority. Canonical executable table, preparation/import validation, SOURCE_OF_TRUTH, CONTENT_MODEL, DATA_MODEL and UI_UX_STANDARDS are reconciled. Manifest/source-receipt files remain byte-identical; digest remains `83ec8ad248483ef31c996b0f0782a2ce419de7d4d186590ce03b47c30cfd9a91`. DM26…DM28 cover exact receipt, code/label bijection, required names and approved importer retry/readback. Buildmarker-011/HC-011.0 are retained as the same Home package. The executed continuation results follow. No live import/deployment or daily capability closure is implied.

Approval continuation verification: **349/349 canonical tests in each of Chromium and WebKit**, **54/54 general + 21/21 onboarding + 9/9 daily synthetic Health**, existing 17 admin/8 routing-Preview/5 mobile/5 daily scenarios, zero page exceptions. Typecheck/lint/build, Repo Health 16/16, dependency tree/security guard and byte budgets pass; no dependency/lock changes, 0 Critical/High and 2 existing Moderate findings. Initial JS 459,519 / 149,604 gzip bytes and CSS 84,916 / 14,553 are unchanged. [Approval receipt and executed evidence](reports/first-shinka-011/od002-approval.json). H09-004 remains BLOCKED; no live import, hosted Full Health or physical-device claim. The original verification.json retains the historical pre-approval snapshot.

## Buildmarker-012 — Calendar and cycle management, 2026-10-20

Preflight: clean local Test = origin/Test `f5fd7c4`; main `3c76cb4` two commits ahead. Fast-forwarded main into Test and pushed that synchronization before implementation. Pre-delivery fetch confirmed local/origin Test/main all `3c76cb4`, with only this package's working changes. Test-only feature delivery; main merge and publish remain with the user. No parallel agent or live product write.

Implemented the monthly TR/EN Calendar, shared navigation, explicit same-ID edit/delete/cancel, stable retry payloads, invalidated stale responses, consent path and read-only owner-gated function. Shared Home cycle rules supply actual/history/current/future phases, computation-only 5/28, source outlier/half-up behavior and three future cycles. Last deletion preserves settings and daily snapshots. Pure planning validates all reused/new rows before publication; the durable adapter contract requires an atomic owner mutation/derived replacement/consent/receipt boundary. Production intentionally supplies no adapter and keeps writes disabled. Fixture queue/receipt and post-read checks are not claimed as native transactions or rollback.

Read the listed original source sections and SRC-07 sheets 05…08. User reply explicitly defers >60-day interval policy; OD-012 remains OPEN, H08-006 BLOCKED, no clamping or invented upper limit. H08-005 remains BLOCKED for durable atomicity; Home H09-004 and ON-05 same-account live recovery remain open. Existing content/category source bytes, schemas and RLS remain unchanged.

Final local results: **376/376 canonical in Chromium 156.0.8078.4 and WebKit 27.2**, each **89/89 local Health** (54 general/21 onboarding/9 daily/5 Calendar), **17 admin/8 routing-Preview/5 mobile/5 daily/6 Calendar scenarios**, zero page exceptions. CA01…23 and CU01…04 add 27 meaningful regressions; all previous 349 remain. H13-008's old Home-only source check failed after shared navigation extraction and was updated to verify the common component plus both consumers; no case was removed. Catalog HC-012.0: 143 total, 125 current, 7 future, 11 external, 16 suites. Internal Build/history retains 008…012.

`npm ci`, direct/full dependency trees, typecheck, lint, build, Repo Health **16/16**, history check and existing performance budgets PASS. Initial production JS **460,387 raw / 149,852 gzip**, CSS **85,910 / 14,752** bytes; lazy Calendar **16,973 / 6,139**. Cold stubbed Calendar lab: 156 DOM nodes, DCL 14.8–18.1ms, CLS 0, no long task/page error/360px overflow. Both-engine TR/EN mobile/desktop images inspected; dialog centering/radius and focus distinction corrected. No physical Android/iOS or hosted latency proof.

**Fresh dependency security is BLOCKED:** official npm audit endpoint certificate issuer verification failed, including retries using macOS trust certificates. TLS verification stayed enabled; no persistent config was changed. The unchanged lock and previous 011 audit (0 Critical/High, 2 Moderate) do not prove fresh 012 security status. No unconditional repository closure or production-ready claim. Rerun `npm run security:deps` and `npm audit --json` when trusted TLS access is restored.

All ten requested canonical standards, these notes and generated history are aligned. Removed five unused main-introduced auth templates only after import/route/dynamic inspection; existing approved Apple/Google flow retained. [Full implementation, blockers and publish acceptance](reports/SHINKA_CALENDAR_012.md), [structured verification](reports/calendar-012/verification.json), [mobile research/screens/limits](reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md#buildmarker-012-calendar-extension).
