# SHINKA — Development Notes

**Document:** SHINKA_DEVELOPMENT_NOTES.md
**Status:** ACTIVE — repository maintenance; live closure pending
**Current BuildMarker:** Buildmarker-009
**Last Updated:** 2026-10-20
**Authoritative Source References:** SHINKA_SOURCE_OF_TRUTH.md; explicit maintenance request
**Purpose:** Current findings, comparable measurements and handoff.
**Scope:** Maintenance only; no new product engine, content import or live deployment.

## Baseline and changes

Preflight: clean local Test = origin/Test at `63906f42a14e99f36f8934e9b42164c9b2ba24c7`. Main `b33c001fe30cceb0ad392aa38146ddbedc2c2461` was one commit behind Test with no divergence. No main merge was needed. Baseline was Buildmarker-008 / HC-007.0; the distinct maintenance package advances once to 009 / HC-008.0. Test-only delivery remains required.

Before editing, npm ci/tree/security/type/lint/build/Repo Health and Chromium canonical checks passed (287/287). WebKit baseline had two genuine failures: Health native select height 22px (T80/H13-002), ON-04 native selects 25px (U12). Both engines used the same canonical suite. The shared native control now suppresses browser appearance while preserving the popup and 52px control tokens. No failed check was removed.

| Finding | Implemented correction |
|---|---|
| Entry eagerly included internal pages, catalog and 21 test modules | Lazy internal/probe routes, shared loading/error/reload boundary, tiny separate probe path contract, lazy test execution. Guards stay in place. |
| Profile/cycle form and list presentation mixed with screen/controller orchestration | Cohesive OnboardingForms and BirthplaceList; readable Screen/controller; one linear pass for duplicate labels. |
| Repeated provider path reads, unnecessary preferences query | Per-picker TTL/LRU/byte-bounded public list cache; list operations read owner profile only. Server resolve/save contract unchanged. |
| History refresh races, repeat clicks, clipboard timer | Health run lock through persistence, latest-history ticket, disposed UI checks; completed audit save preserved; clipboard/test runner cleanup. |
| Browser viewport and intrinsic input sizing | 100dvh fallback, safe-area padding, shrinkable inputs/selects, zoom allowed. |
| Eight active package entries and repeated continuation prose | Generated latest-five source/Markdown, update-or-next writer, source/Health/Repo guards; current five are 005…009. |
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
5. Keep native timestamp, uniqueness/conditional-write/concurrency and protected-history enforcement obligations. FIRST_SHINKA_ENGINE_REQUIRED is a future engine dependency. Remove the temporary GeoNames admin diagnostic only after its documented hosted success condition is evidenced; it is not automatically run by Health or onboarding.

No live product rows, security/audit records or Git history were deleted; no main push, CLI deployment, provider sign-in or real-secret probe was performed during maintenance.

## Prioritized ON-05 correction — 2026-10-20

The live saveCycle incident was prioritized within this same maintenance work; no parallel agent or competing branch was started. Preflight local Test = origin/Test `9e6473d`, clean; main `848e073` two commits behind. Buildmarker-009 retained, HC-009.0 advances once for changed consent/partial-retry semantics and new external H11-006. The initial maintenance measurements above remain historical evidence; this subsection is the current correction result.

Proven repository defect: current consent was written, then native created_date (already normalized to created_at) was required as an explicit-zone timestamp and used to rewrite granted_at. The old adapter reproduced NATIVE_CONSENT_TIMESTAMP_REQUIRED with a valid business grant and zone-less native metadata. Corrected authority is the existing validated UTC granted_at; new explicit grants get backend time only when no consent exists. The native rewrite/error branch and its unused client code were removed. Reconciliation is separate from SDK persistence; insert-only consent/settings avoids replacement, matching history/period is reused, conflicts refuse writes, and hydration verifies the grant event before advancing. Optional durations remain NULL; Skip never writes.

LIVE_RUNTIME observation: published UI is still 008 / HC-007.0; Preview Main points to 848e073 with prod data. Greenfield table counts: consent 1, event 0, period 0. Date cells exist but are formatted; raw API type/offset, account correlation and exact deployed function hash are not proven. These limits and same-account retry/readback steps are in [the incident handoff](reports/SHINKA_ON05_CONSENT_RECOVERY.md). No live product mutation or deployment was made. The incident remains **OPEN_PENDING_LIVE_SAVE_AND_READBACK**.

Verification: clean install and both dependency-tree checks, native High-threshold security guard, typecheck, lint, build, Repo Health 16/16 and generated five-entry history check PASS. Fresh audit 0 Critical/High, 2 existing Moderate router findings. Chromium 156.0.8078.4 and WebKit 27.2 each pass **310/310 canonical tests**, **52 general + 21 onboarding Health**, **8 routing/Preview + 5 mobile scenarios**, zero page exceptions. P21…P32 cover native metadata variants, preserved/invalid business time, partial/lost writes, conflicts/guards, bounded duplicate requests and Skip; P28 deliberately demonstrates independent-worker duplicate detection without a uniqueness claim. No Health case was removed. [Compact verification](reports/ON05_VERIFICATION.json).

Previous performance guard also passes: initial production JS 447,080 raw / 146,566 gzip bytes; CSS 84,474 / 14,494; no initial test modules or static cycles; lazy reload/retry passes. The small JS increase comes from safe error-code handling. No physical-device or live performance claim. Cross-worker first-insert races remain possible under Base44's unsupported UNIQUE capability; detected ambiguity fails closed, neither record is silently rewritten. This correction does not certify distributed transactions or rollback.
