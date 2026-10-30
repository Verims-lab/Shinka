# Calendar / Pattern targeted stabilization — 052 / HC-051.0

Date: 2026-10-30. Scope: read recovery and safe diagnostics. Original Android APK incident remains unproven; no inference that it shares the historical Health 429 or Home 500 cause.

## Evidence and boundaries

- Branch preflight: clean local Test d93e298, remote Test 7d895c4, main 508e622. Lossless fast-forward to main retains the 051 Health fix and Base44 daily GeoNames quota addition. No main push/publish.
- Existing signed-in published web Health screen showed Buildmarker-051 / HC-050.2. The user-created result visible on entry was 158 PASS / 1 FAIL / 0 BLOCKED, H04-007 failing; H05-009 and H09-004 PASS. The agent did not run/save Full Health or Security scan. Historical 051 acceptance and failures stay intact.
- Base44 app `6ad5190f4845d4e3af03b420`, Main editor and Calendar entry path were observed. Code-editor content did not expose a comparable deployed source revision through the available read interface. Exact published backend/shared SHA and APK Build/HC are **NOT_VERIFIED**; the web marker alone does not prove either. No CLI login requested.
- Targeted web reads in the existing account: Calendar grid and both Pattern sections loaded; no spontaneous incident reproduced. DevTools request durations (not model/tool wait or screen-ready times): Calendar 200 / 2590 ms; Pattern two 200 responses / 1260 and 1480 ms. Network timing sample counts are one Calendar refresh and two Pattern section reads. Browser background/return was attempted, but event-attributed timing/counts were not reliably isolated; controlled lifecycle regression supplies that evidence instead. Offline simulation retained Calendar and displayed a refresh error; online returned the real grid and cleared the error. Network setting restored to No throttling. No live data writes, import or maintenance.

## Finding → cause → correction → regression

| Finding | Proven code cause | Correction | Executed regression |
|---|---|---|---|
| Calendar says retained view with no grid; duplicate first-load controls | refreshError set without a value and RefreshControl always rendered | One initial loading/error/Retry area; retained-view refresh only when value exists; real grid required after retry | CU09 TR/EN, CP04, MI01 |
| Transport class/stage lost | Service rethrows code-only error and backend drops inner lifecycle diagnostic | Closed diagnostic envelope: code, HTTP status, stage, duration, request ID; bounded attempt count. No raw error/body/header/token. Stored in current controller error state, not technical product UI | CP01–03/CP07, native-entry server assertions |
| Settled event bursts cause redundant reads | Calendar has pending-only coalescing; Pattern explicit section retry does not timestamp lifecycle burst guard | Existing 1s background coalescing shared with direct starts; offline pauses reads; online/active return recovers; independent sections remain | CP06, PF01–03, PU05–08; read-pressure.json |
| Suspended timer can hold pending slot after its deadline; logout can later reopen reads | Slots rely only on promise completion; Calendar end signal only invalidates once; tab activation bypasses Pattern lifecycle end flag | 20s slot elapsed check at return/Retry; abort local waiter/timers and replace slot; ignore old generation/task. End-session seals controller, account remount starts fresh | CP03/CP05, RC03/04, MI03 |
| Transient lifecycle unavailable treated as privacy refusal in Pattern | Prefix classified TEST_LIFECYCLE_UNAVAILABLE as known access loss | Keep same-account prior value on unavailability; actual 401/403/consent/lifecycle refusal still clears immediately | CP02/04, RC05, PT11/12 |
| One transient failed read requires manual retry | No bounded read retry | Only completed 429/503 with neutral transport/admission wrapper can retry once, minimum 500ms, parsed Retry-After, inside original 20s with 250ms reserve. No timeout/network/auth/data/shape retry and no automatic mutation retry | CP01/02/03; same-intent RC01–05/CU08 |

SDK timeout/local abort does **not** cancel server execution. A later explicit/return attempt can overlap an old timed-out remote request. Local slot/generation ownership and the unchanged total budget bound starts; no distributed cancellation or zero remote overlap claim. No cross-account cache/storage introduced. Same Calendar action ID/revision/payload and readback success remain authoritative.

## Validation and unrelated baseline gate

Final focused acceptance: **39/39 PASS per Chromium/WebKit**, followed by **7/7 final boundary PASS per engine** (nested SDK errors and actual lifecycle metadata included). Eight new regression IDs: CP01–07 and CU09. Full regression: **759 PASS / 2 FAIL out of 761 per engine**; only existing D01/D22 remain. The first run’s three test adaptation failures are retained in full-*.json; PT10 now asserts the complete safe error envelope, PU03/PU07 explicitly separate the local AbortSignal from the backend business payload, without weakening assertions.

Typecheck, lint, build, locked install, dependency tree/audit (zero advisories), generated history and performance budgets pass. Local in-app Health stops at H04-007; subsequent save/list/open and timing acceptance is NOT_RUN after that assertion. No claim of a fully green repository or new live Health.

See [execution](calendar-pattern-052/execution.json), [request pressure](calendar-pattern-052/read-pressure.json), and per-engine receipts. Before/after uses the same immediate synthetic SDK boundary, not hosted speed: Calendar initial + three settled return events **4 → 1** calls; Pattern section Retry + focus **3 → 1**. No claim that call reduction measures APK latency.

Main 508e622 added GeoNamesDailyQuota without updating its physical-schema/creation-call inventory. Repository Health flags unexpected GeoNamesDailyQuota and geonamesDailyQuota.js create. This is separately visible in the user's H04-007 result. This package preserves that code and reports the existing failure; it does not whitelist a writer merely to make a gate pass, redesign quota concurrency, or claim repository-wide closure. Prior failures are retained in execution receipts.

Health delta: **0 added / 5 updated / 0 removed**. H08-007 and H12-037 execute the recovery/transport regressions; H13-015/H13-017 and serialized local requirements reference real component suites; H05-009 retains exact count/source/hash/relation policy for 052. Total 185 IDs (159 in-app, 12 local, 14 external) unchanged. H08-901 and physical/native acceptances remain external. Existing 051 Health memoization/retry and H13-012 manual-theme contract preserved.

## Publication and APK acceptance (owner)

Publish the matching Test package using the existing main workflow, including Calendar/Pattern entries and shared dependencies before frontend. No schema change belongs to this fix. Resolve the separately reported existing GeoNames inventory gate before treating repository-wide Health as closed.

1. Confirm the installed APK's current Buildmarker/HC, then open Calendar and Pattern; verify the real grid and both sections.
2. Select a Calendar date/month without saving; switch tabs and background/return. Verify selection/draft and normal interaction remain.
3. Turn connectivity off/on: retained data has a refresh warning; an empty failed load has one Retry. Retry restores actual data and clears errors.
4. Retry each Pattern section and tap rapidly during slow connectivity; each section recovers independently, with no indefinite spinner.
5. Test logout/account change and consent loss with authorized test accounts; old content must disappear. Any uncertain Calendar save must retain the same operation, never auto-replay as a new write.

Physical Android APK/wrapper and iOS acceptance are **NOT_RUN** here. Old APK transport cause and deployed fix behavior remain open until matching publication and device evidence.
