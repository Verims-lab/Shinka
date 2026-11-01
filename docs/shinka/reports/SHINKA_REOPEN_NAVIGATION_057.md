# Shared navigation and reopen recovery — Buildmarker-057 / HC-056.0

Status: local implementation/verification complete; dependency security gate remains OPEN. Test-only package; hosted incident and physical-device closure remain open. No live mutation, Full Health, Security scan, quota setup, cleanup, notification, main merge or publish.

## Evidence and scope

Main f2632f7 was one merge ahead of clean Test 6515d3a. Test was fast-forwarded and synchronized without resetting or losing 055/056 work. The screenshot and aydan2.mp4 (30.42s) were inspected. The video shows Home TEST_LIFECYCLE_UNAVAILABLE, subsequent content recovery, Calendar loading and an existing unresolved intent; it does not prove process kill or creation of that intent. Private video frames are not committed.

Read-only published Admin Panel showed Buildmarker-056 in app 6ad5190f4845d4e3af03b420. The phone attachment has opaque Home cards and a visible Calendar Refresh that differ from current 055/056 presentation. Its exact deployed frontend/backend/shared hash cannot be established from the attachments or the visible version label. No historical request is correlated to the video's failing stage.

## Finding → cause → correction → verification

- Navigation: zero-inset published web nav measured 57px (56px row + 1px border), with no duplicate inset. The shared row now has a 44px minimum with centered icon/label and automatic growth at 200% text; one safe-bottom remains. System/wrapper space is not removed based on a screenshot. Geometry and matching visual receipts are recorded separately below.
- Home: transient lifecycle unavailability was listed as a privacy-denial code; initial load also displayed retained-view copy, duplicate error and raw code. The service now preserves retained data only for unverified transient reads; real 401/403/owner/onam/deletion denial still clears it. One localized initial/retained Retry uses the actual service/hook. DU07–09/CQ06–07/10 cover this boundary.
- Diagnosis: daily entry overwrote the failing lifecycle substage with its outer phase. ID14 injects each lifecycle read failure through the actual entry and verifies safe stage/status/request ID/Retry-After and no product write. Public settings/session/daily cancellation diagnostics use the existing closed envelope; no raw exception or personal data is logged.
- Re-admission: cold check dispatched privacy-changed before React removed old scope, allowing old consumers to reload. Existing session-ended signal now seals old consumers and cached authority before fresh settings/session admission, without SDK logout. SS15 and real App no-early-read checks cover the race.
- Pending/retry: daily local wait now expires/cancels at its existing 20s deadline, rejects late generations, coalesces visible return events and respects Retry-After. It never inherits readonly transport auto-retry because today can create an assignment. Session's existing 15s/two-retry budget respects Retry-After; 401/403 do not retry. Calendar's 056 same-ID read/check/explicit continuation remains unchanged; reopening does not write a new period or delete an old intent.

## Execution

| Actual check | Result |
|---|---|
| Full foundation Chromium 156.0.8078.4 / WebKit 27.2 | **787/787 each**, 0 page errors |
| Final boundary follow-up after the last BFCache cooldown adjustment | **7/7 each** (SS14, SS15, DU07–09, NU03, OF03); final type/lint/build/performance and native entry also checked |
| Actual App startup/reopen | Both settings/session success orders and membership refusal orders; Home/Calendar/Pattern/You, cold no-early-product reads, stale account results, synthetic persisted-pageshow, logout/back; PASS |
| Real BFCache | NOT_OBSERVED in both engines; actual cross-document history reloaded. Synthetic pageshow is not native/BFCache proof |
| Shared nav, loaded original artwork/fonts | 108 matched cells per engine before and after: TR/EN × 320×568, 390×844, 740×320 × 100/200% × Home/Calendar/Pattern × env/0/34px inset |
| Nav normal text | Row **56→44px**; zero/env inset total **57→45px**; synthetic 34px inset total **91→79px**. Three equal columns; centered icon/label; one inset |
| Nav 200% text | Auto-growing **62–98px** content row, ≥44px targets, contained wrapping and no horizontal overflow; no fixed total height |
| Local synthetic Health | **147 PASS / 13 expected hosted-prerequisite BLOCKED / 0 FAIL** each; save retry, history listing and private report opening PASS |
| Actual TS entry/platform-substitution + Node session classification | PASS; nested lifecycle privacy failure carries 2,000ms retry hint; guards remain; no remote enforcement claim |
| Quality | Clean npm ci, npm ls --all, typecheck, lint, build, Repo Health and generated last-five PASS |
| Performance/layer budget | PASS: initial JS 486,546 B / gzip 162,578 B (500,000/165,000 limits); CSS 79,094 / gzip 14,519 B (90,000/16,000); no static cycles/eager internal test payload; 27 local cold samples, no page error; chunk-failure Retry PASS |
| Dependency security | **FAIL / OPEN: 0 Critical / 1 High / 8 Moderate**, unchanged gate |
| Physical APK process-kill/lock/native safe-area/back | **NOT_RUN** |

[Execution/commands](reopen-navigation-057/execution.json), [Chromium](reopen-navigation-057/chromium-execution.json), [WebKit](reopen-navigation-057/webkit-execution.json), [performance](reopen-navigation-057/performance.json), [safe hosted observation](reopen-navigation-057/hosted-readonly.json). The final single retry-cooldown reset was verified by the seven-case follow-up after the full suites, not silently represented as another complete run. Performance is a local budget/laboratory receipt, not field latency, device p75 or proof of screen speedup.

Matched 390×844 local captures with loaded existing assets: [TR before](reopen-navigation-057/nav-before-chromium-tr-0.png) / [TR after](reopen-navigation-057/nav-after-chromium-tr-0.png); [EN before](reopen-navigation-057/nav-before-webkit-en-0.png) / [EN after](reopen-navigation-057/nav-after-webkit-en-0.png); [34px inset before](reopen-navigation-057/nav-before-webkit-tr-34.png) / [34px inset after](reopen-navigation-057/nav-after-webkit-tr-34.png). These are synthetic desktop-browser viewports, not physical Android/iOS photographs.

Initial unsuccessful checks remain as compressed logs beside the receipts. They exposed: an early React-commit assertion (replaced with a condition wait), missing test type declarations/explicit nullable Refresh error, NU03's obsolete zero-argument assertion (now permits only AbortSignal/deadline, still forbids URL date/content input), OF03's fake clear(undefined) count (native no-op modeled accurately), and the mobile pull assertion's former duplicate status location (now exactly one alert). A temporary baseline transform omitted Tailwind's old min-h-14 class; the measured baseline reintroduces that exact original utility. The new explicit label span initially overflowed with loaded WebKit fonts at 200%; max-width and word wrapping fix it, with containment assertions preserved. None of these failures was suppressed or converted to PASS.

The inherited High is GHSA-mrwp-f3q8-3g9p in SDK → Axios → follow-redirects 1.16.1. Patch 1.16.2 reaches the unchanged seven-day age floor at 2026-11-01T21:32:25.963Z, after this execution. No forced override, dependency downgrade, age-floor reduction or security waiver. Fresh [audit](reopen-navigation-057/dependency-audit.json) and native failing security command are retained; the earlier 055/056 disposition remains historical evidence.

## Remaining uncertainty and publication

Targeted existing-session web Home open/reload, Calendar open, Pattern return and You/Admin navigation succeeded; the reported lifecycle error was **not observed**. No model/tool waiting interval was counted as screen time. The original backend/DB failing stage, rate limit/network cause and APK bundle version remain **unproven**. Background/online/late-response behavior is covered by controlled local tests; physical process termination, lock return and wrapper/system-bar separation still need the phone. No old Calendar intent or health record was changed.

Publish the matching **applicationSession + dailyMessage entry/shared dependencies + frontend** from Test together through the owner's normal main/Base44 flow; no schema migration is needed. The agent did not publish or merge main. Preserve the open security gate and resolve it under existing dependency policy before release acceptance.

Phone acceptance after publication (at most five checks):
1. Confirm Buildmarker-057; fully close/reopen and visit Home, Calendar and Pattern. Distinguish initial failure from a retained-view refresh error.
2. Background/foreground and lock/unlock separately; confirm no endless loading and no stale error after recovery.
3. Disconnect/reconnect; use the single Retry when needed. If failure remains, retain only safe code/stage/status/duration/request ID for diagnosis.
4. In TR/EN and 200% text, check all three nav groups, taps and real system/home-indicator space; tab scroll/month/draft must remain.
5. Reopen an existing Calendar PENDING view without submitting a new date: it must not start a new write. Use the existing same-intent status/resume path only if needed; do not clear the record as a workaround.

Health delta: 0 added / 5 updated / 0 removed (H05-009, H07-013, H09-003, H12-025, H13-012), unchanged 186 cases. External device cases remain open. Active packages are 053–057.
