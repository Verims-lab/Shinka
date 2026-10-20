# Shinka 018 — Health usability and deletion outcome recovery

**Buildmarker-018 / HC-018.0 — MANUAL_USER_VALIDATION_PENDING**

Test-only delivery. Existing shared Base44 app/prod is unchanged; no schema delta or new service. Main merge/sync/publish remains with the user.

## What changed

- Normal Health now runs from the application without terminal work, JSON import or a second test launcher. Full in-app results explicitly cover `IN_APP_HEALTH`; local browser and external/device acceptance remain visible separately. Local cases are preserved without fake live PASS or N/A. Shared synthetic helpers run once per Health context.
- Active tests receive cancellation. Onboarding fixture waits identify `FRAME_CREATE`, `CSS_WAIT`, `FIXTURE_RENDER`, `INTERACTION`; abort unmounts/removes the frame and clears delays/listeners. Current viewport overflow reports its actual width/height/path. No XFO/CSP weakening or increased timeout.
- Deletion announces progress immediately and distinguishes confirmed completion, partial cleanup and unknown response. Client timeout preserves its code; safe stage/request ID is available in collapsed details. At most two automatic **read-only** status checks reconcile an uncertain command. No automatic destructive retry. Reload recovers the same operation pointer; lookup works after User disappearance. Completed status is reverified against all operational scopes; late residuals are PARTIAL. The executor still reconciles every scope on resume, but avoids redundant checkpoint/audit writes and yields between stages after bounded work. All security/retention checks remain.
- Completed Health reports show Saving/Saved/Failed/Unknown. Retry uses the same report/runId; read-only `saveStatus` checks its digest without creating a file/row. A history refresh failure cannot invalidate or hide a verified save. Optional export remains.

## Evidence and uncertainty

Supplied published run `6cf22904-4781-46ae-a54e-81fa68ebb93e`, HC-017.0: **133 PASS / 0 FAIL / 4 BLOCKED /19 N/A**, about169s. H03-007/H10-003/H13-012 timeouts and H13-004 BROWSER_EVIDENCE_REQUIRED are preserved. H03-008/H09-004 PASS; no reimport. The source proves all three timeout paths included onboarding UI fixtures and failed to propagate cancellation. Local CSS-wait and interaction fault injection verifies distinct diagnostic phases and cleanup. It does **not** prove the exact hosted stalled subtest/phase, or attribute all timeouts to XFO.

One successful narrow live read inspected only the selected existing operation metadata, native User presence and authenticated lookup. Result at 2026-10-20T20:17:04.993Z: **RUNNING / user_cycle_prediction**, three checkpoints, no completion timestamp; native User still present; lookup succeeded. Login denial is consistent with target lifecycle protection, not completed deletion. Earlier lookup failure and exact reason the operation stopped remain unproven. Initial CLI attempts failed before network execution because local app selection/Deno were absent; existing explicit app selection/runtime then completed the read. [Redacted diagnostic](health-018/deletion-diagnostic.json) contains no target ID or health values. No live Full Health, delete/resume, reset, schema push, content/Moon import or publish was run.

## Preserved case mapping

| Existing case | Current execution | Preserved coverage |
|---|---|---|
| H03-007 | Local canonical Foundation, Chromium/WebKit | Complete auth/security/data/UI regression suite |
| H07-013 | Local DU tests | ON-06/Home components, locale and stale navigation |
| H12-025 | Local AN02–AN07 | Session/admin routes, revoke/logout/stale responses |
| H13-012 | Local U12–U14 and mobile App checks | 320/360px, landscape, enlarged text, input reachability, long TR lists |
| H13-015 | Local Calendar UI | TR/EN, keyboard, consent and explicit actions |
| H13-016 | Local AU tests + actual App scenarios | Confirmation, progress, timeout, lost reply, reload, same-operation resume |
| H10-003 | Pure helper checks in-app; U09–U12 local | Provider/cache/ownership/NULL/outage plus actual selection UI |
| H13-004 | Current Health viewport in-app; fixed-width pages local | Actual current width; 360px Health/Build and 360/1024 auth remain CLI |

H12-035 adds deletion readback/result, slow-recheck progress and save-state regression. An elapsed pass yields only after new progress; already-persisted checkpoints are still rechecked and cannot consume every retry without advancing. No prior failure is erased. Catalog, exact executed counts, commands and performance/security boundaries are in [verification](health-018/verification.json). Local engine results never certify physical Android/iOS or hosted mutations. No distributed lock, native transaction or cancellation of an already-transmitted SDK call is claimed.

## Local verification

Chromium/WebKit each passed 463 canonical regressions; the added E08 initially failed because its fixture did not use the repository's canonical projection. After fixing that fixture, focused E01–E08 (8/8), general Health (60/60) and normal Health UI passed in both engines. The remaining 37 local Health cases passed in the full run. All 464 distinct canonical IDs are covered across these runs; no single clean 464-test full rerun is claimed. The failed full-run artifacts remain available. Both engines report zero page exceptions. The stubbed normal Health UI records 119 PASS/0 FAIL/13 BLOCKED/19 N/A with six local cases separately listed; these are local results, not hosted readiness.

Fresh dependency scan has zero Critical/High and three Moderate affected packages. Two router paths remain; the additional [Vite/launch-editor advisory](https://github.com/vitejs/launch-editor/security/advisories/GHSA-698v-4r3x-3vcv) concerns Windows editor launching. No dependency was upgraded and no blanket safety claim is made. Production entry/CSS lab byte budgets pass; measurements precede the final E08/yield correction, as recorded in verification.

## User acceptance after sync/publish — application only

1. Admin Panel → Health Center → **Health’i çalıştır**. No file preparation. Confirm the declared in-app scope, separate acceptance list and visible save status. Open the same run in history. If needed choose **Bu raporu yeniden kaydet** or **Bu raporun kaydını kontrol et**; do not rerun Health to repair saving.
2. Test Tools → enter the previously affected ID → **Kullanıcıyı getir**. The existing unfinished operation should appear. Use its **Devam et** action, not a new delete. Verify progress, partial/unknown handling and explicit **Kullanıcı silindi** only after backend verification. Reload/query the same ID to see the same operation/result; retained history stays intact.
3. Normal-user/admin boundaries, original ON-05 same-account saveCycle/readback and physical Android/iOS remain separate acceptance items. Do not delete/recreate the ON-05 account to close it.
