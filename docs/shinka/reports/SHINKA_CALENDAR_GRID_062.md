# 062 — Calendar direct start-date editing

Buildmarker-062 / HC-061.0. Local implementation; hosted user data untouched. Final execution receipt is `calendar-grid-062/execution.json`.

## Behavior and preserved contract

Previously a day selection populated a separate lower date form. Calendar now has **Edit dates → choose one start → Save / Cancel**. A blank eligible cell creates an add draft; repeat selection clears it. A recorded start creates an explicitly labelled delete draft; choosing another date moves that same native record through `edit`. Delete Save uses the existing confirmation. No first-tap write, multi-operation batch, end-date or bleeding-day model was added. Predictions and derived days remain separate from recorded starts. CalendarEditor and calendarDraft keep presentation logic out of backend persistence.

Backend owner today, minimum 15 days, OD-012 >60 rules, consent/ACTIVE/lifecycle and exact action ID/revision/payload validation remain unchanged. The client prevents future/too-close drafts and preserves month/year/tab drafts in memory. Cancel performs no write and clears unsaved consent. Verification is mandatory before success; the source period ID survives movement. Existing 059 Pattern, 060 privacy, 061 auth-first onboarding, backgrounds/manual themes and bottom navigation remain.

Inspection found that the old controller's combined reconciliation action could read PENDING/ABSENT then write in the same Check action. **Check status is now read-only** and coalesced. APPLIED confirms only with matching receipt and period readback. PENDING/ABSENT exposes a separate **Continue the same change**; that explicit action rereads, checks guards and continues the original intent within the remaining 20-second budget. A pending write is never silently replaced, cancelled or rolled back. No native transaction guarantee is introduced.

## Evidence and limits

Gizem 17 was inspected through local AVFoundation frames at 0/8/16/24/32 seconds; the reference interaction was used, not its visual design or multi-day model. The bundled Playwright ffmpeg cannot decode this MP4; local AVFoundation provided the source frames. No reference recording or private user data is committed.

Local before/after examples (same 390px TR layout, synthetic data; before is the old edit form, after is the new normal/grid-draft view):

- [Before: lower form](calendar-grid-062/media/before-form-tr.png)
- [After: normal calendar](calendar-grid-062/media/after-grid-tr.png)
- [After: move draft](calendar-grid-062/media/after-move-tr.png)
- [320px EN, dark, 200% text](calendar-grid-062/media/after-dark-200-en.png)
- [10.48-second add → move → delete recording](calendar-grid-062/media/add-move-delete.webm)

These are real local App/browser renders with isolated SDK/native-handler fixtures. Remote fonts/background images are blocked in this harness; original asset references/styles remain unchanged. This is not a hosted write or physical-device receipt. The video additionally demonstrates a partial deletion, repeated read-only status and explicit same-intent completion; one actual period delete occurs.

Final complete runs: **Chromium 156.0.8078.4: 805/805; WebKit 27.2: 805/805; zero browser page errors.** Each includes 8 Calendar flows, 2 retained-tab/scroll/unknown-result flows and 40 TR/EN × 320/360/390/430/landscape × 100/200% × manual light/dark combinations. Day targets measure ≥44×44 CSS px and no horizontal document overflow. Final focused CU03/CU11/FX02/RC02/RC07/RC09: 6/6 each, including Dec/Jan draft retention and cancelled uncommitted consent. Shared mobile suite: 87/87 each; unchanged onboarding/Pattern/You/privacy/native-entry/server suites also pass. Local synthetic Health: 147 PASS / 13 prerequisite BLOCKED / 0 FAIL; save/retry/list/private-report opening passed. This is not hosted Full Health.

`npm ci`, dependency tree, dependency audit (0 advisories), typecheck, lint, build, repo health, diff check and recordBuild last-five validation pass. Final performance gate passes: initial JS **491,758 raw / 163,966 gzip bytes** (limits 500,000 / 165,000); CSS **80,138 / 14,726** (90,000 / 16,000), zero dependency cycles, no initial test/Health modules and passing lazy-load recovery. Field p75/INP and physical-device acceptance remain NOT_MEASURED/NOT_RUN. [Execution](calendar-grid-062/execution.json), [performance](calendar-grid-062/performance.json), [source receipt](calendar-grid-062/source-receipt.json).

 Historical failures are retained in execution.json: initial hidden pull-control visibility wait, old single-input/multiple-grid selector, old lower-form delete trigger, and CalendarFlow's dependency on another test's Home fixture. Assertions were adapted to real replacement controls; fixture isolation was repaired. No assertion was weakened.

## Health and publishing

Health **added 0 / updated 4 / removed 0**: H08-007, H13-015, H13-012, H05-009 (062 metadata allowlist only). New CU11 and strengthened CU03/RC07 exercise actual UI/persistence; existing future/consent/recovery/access tests remain. The obsolete date-input containment expectation is replaced by grid/action geometry and the existing modal/focus/gesture/Retry checks. H08-901 and physical/native/workflow acceptance remain open. Active Internal Build history: 058–062, generated with recordBuild.

Owner: merge Test to main, synchronize the matching frontend/shared Health metadata through the existing Base44 flow, then publish. No schema change/import/migration is needed. On Android/iOS verify actual touch selection, Back/focus, safe area, text scaling and app reopen; synthetic browser and resized-viewport checks do not prove native keyboard/wrapper behavior. This task performs no live user mutation, Full Health, Security scan, import/cleanup or publication.
