# Calendar corrections — Buildmarker-056 / HC-055.0

Status: local implementation and verification complete; dependency security gate remains OPEN. Hosted mutation/device acceptance remains open. Test only.

## Scope and evidence

Four requested corrections: contain Calendar native date input; remove its visible Refresh while keeping gesture/error recovery; truthful unknown deletion with same-intent reconciliation; add/edit/reopen and partial-grant recovery without new IDs. Preserve 052–055 and manual theme. No live mutation, cleanup, Full Health, Security scan, main merge or publish.

Attachments were inspected in order: two screenshots, then Gizem 14.mp4 (15.72s) and aydan1.mp4 (~39s). The first video shows one visible delete attempt returning to an ambiguous dialog; it does not prove an automatic retry loop. The second starts unresolved and does not expose the backend cause. Private attachment frames are not committed.

Read-only Base44 app 6ad5190f4845d4e3af03b420/Main and authenticated admin web session were used. Published Admin Panel displayed Buildmarker-055. Editor calendar/entry.ts and the visible nativeCalendarPersistence imports/receipt path match the 055 source; editor text is not proof of the deployed shared bundle hash. Calendar function Logs returned "No logs found". Platform log summaries showed calendar HTTP503 at 2026-10-31 20:03:34 local (invocation f2ff453d8bef4af3b60f17d2b6f68ef6) and HTTP500 at 20:24:57 (270cdf2a1dac4304bf0c92e4f0a111cc). No request payload, failing substage or exact video-to-request correlation was available.

UserCalendarAction displayed five rows: three historic APPLIED and two PENDING (delete c17cdf21-29fa-4818-afed-02de98bc841a, add 7e336f90-a65a-4fa7-b5e1-49728bddf9bb). The current UserPeriodRecord table displayed one row, neither pending owner had a current row. Each pending owner currently has exactly one ACTIVE profile and one GRANTED current consent; this is current metadata, not proof of the historical admission/event state. This supports partial persistence and possible completed deletion, but cannot prove who changed the data or the historical failing stage. No receipt, period or user was changed.

## Proven local defects and correction

- Unknown deletion used the ordinary Delete label and a deletion-failed message while the background said it might be saved. CU10 now verifies one truthful status action and no early success.
- The controller replayed writes before checking APPLIED evidence. A passive read could retain an unknown UI even when the durable operation was complete. Optional read action_id/revision now returns owner-scoped checkedAction; APPLIED + exact current revision/outcome confirms without another write. PENDING/ABSENT permits one explicit original-intent continuation inside the same 20s total budget. No periodic mutation/polling, new operation ID, silent conflict overwrite or rollback.
- Calendar RefreshControl had its default visible button. It remains mounted with showButton=false; explicit retained-error Retry was added so removal does not remove recovery.
- Native date had appearance:auto despite width/min-width/border-box already being present. The user's physical screenshot establishes overflow there; normal desktop WebKit did not reproduce it. WebKit also proved that the focused native editor can fail to match :focus-visible, so Calendar has a scoped :focus ring. Scoped appearance and native value sizing are prepared and measured locally; physical iOS acceptance remains open. Shared input and other forms are untouched.

Known validation/conflict errors stay rejected and editable/reviewable; transient/unknown writes keep the immutable draft. Initial grant, owner/ACTIVE/onam/lifecycle/deletion gates remain. Safe phase diagnostics do not serialize personal dates or exceptions.

## SDK contract

[Official Base44 entities reference](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities) specifies updateMany success/updated/has_more and deleteMany success/deleted. Actual SDK 0.8.54 (backend pin) and installed 0.8.57 each passed six loopback transport checks, including zero-count/failure responses and exact filtered request envelope. This excludes an assumed SDK wrapping mismatch in the inspected packages; it does not prove historical hosted response shape or physical write success.

## Execution

| Actual runner | Result |
|---|---|
| Full foundation, Chromium 156.0.8078.4 | 781/781 PASS, zero page errors |
| Full foundation, WebKit 27.2 | 781/781 PASS, zero page errors |
| Calendar real App/native fixture, each engine | 20/20: TR/EN × 320/360/390/430 + 740×320 × normal/200% text; pull/Retry, Escape/focus, actual pending delete, linked date error |
| Final scoped focus correction | WebKit full run includes final Tab/Shift+Tab assertion; Chromium final 20-cell rerun also passed after the CSS change |
| Node native entry/SDK/authorization runners | PASS; actual SDK loopback 0.8.54 and 0.8.57: 6 requests each |
| Local in-app Health, each engine | 147 PASS / 13 expected hosted-prerequisite BLOCKED / 0 FAIL; failed-save recovery, history listing and private report opening PASS |
| Performance/layer budget | PASS: initial JS 481,142 B / gzip 160,214 B (limits 500,000 / 165,000); CSS 79,066 / gzip 14,508 B (90,000 / 16,000); no static cycles/eager internal test payload; 27 cold loopback page samples, 0 page errors; chunk-failure Retry PASS |
| Install, tree, typecheck, lint, build, Repo Health, generated last-five | PASS; active packages 052–056 |
| Dependency security | FAIL/OPEN: 0 Critical / 1 High / 8 Moderate (details below) |
| Physical Android/iOS, native picker/wrapper, hosted mutation acceptance | NOT_RUN; owner acceptance required |

The performance receipt is a local bundle/laboratory budget check, not production screen-speed evidence or field INP/p75. [Execution and commands](calendar-fix-056/execution.json), [Chromium detail](calendar-fix-056/chromium-execution.json), [WebKit detail](calendar-fix-056/webkit-execution.json), [performance](calendar-fix-056/performance.json), [SDK transport](calendar-fix-056/sdk-transport.json). Compressed raw full and historical failed-run logs remain beside these receipts.

Initial execution failures are retained separately: obsolete two-write assertions, a passive-read fixture that held every read, missing daily fixture initialization in a standalone probe, a pull gesture targeting the retained hidden Home heading, a synthetic `secret`-named sentinel triggering the repository credential scan, and a real WebKit focused-date ring omission caught by the new matrix. Corrections preserve the behavior assertions and secret scanner; the sentinel is now private response detail. The final runner cannot pass with a failed Health case. No historical failure was removed.

Quality already executed: clean `npm ci`, `npm ls --all`, typecheck, lint, build and Repo Health passed. Fresh `npm audit --json` / `npm run security:deps` still report **0 Critical / 1 High / 8 Moderate**; the security gate is **OPEN/FAIL**, not waived. High GHSA-mrwp-f3q8-3g9p is the inherited SDK → Axios → follow-redirects 1.16.1 chain. Patch 1.16.2 was published 2026-10-25T21:32:25.963Z and reaches the existing seven-day release-age floor at 2026-11-01T21:32:25.963Z (2026-11-02 00:32:25.963 Istanbul), after this execution. No forced override, downgrade, age-floor or threshold change.

Local screenshot pairs are synthetic matching scenarios against the pre-fix source and corrected source, with existing fonts/background assets. They are not photographs or proof of physical keyboard/native picker acceptance:

- [TR date before/after](calendar-fix-056/date-comparison-tr.png), [EN date before/after](calendar-fix-056/date-comparison-en.png).
- [TR unknown delete before/after](calendar-fix-056/unknown-comparison-tr.png), [EN unknown delete before/after](calendar-fix-056/unknown-comparison-en.png).
- [Read-only hosted metadata](calendar-fix-056/hosted-readonly.json) contains no raw user or health records.

Health delta: **0 added / 5 updated / 0 deleted** (H05-009, H08-004, H08-007, H12-027, H13-015); 186 IDs unchanged. RC06–RC10 and CU10 are executable isolated regressions; SDK03 is a loopback server runner. H08-901/H13-013 and physical wrapper acceptance stay open.

## Owner acceptance after main/sync/publish

1. Publish matching Calendar entry + shared files + frontend together; no schema migration is required.
2. On iOS/Android check TR/EN Calendar date field at narrow width/large text; no visible Refresh, date/picker/focus intact, pull and explicit error Retry work.
3. On the affected delete account use Check status once; verify the same action finishes and the dialog closes only with confirmed absence.
4. On the affected add account check/resume the saved intent; verify exactly one correct record after reopening, with future/near-date errors still specific.
5. If unresolved, retain the account and receipt; provide only safe error code/stage/duration/request or operation ID. No delete/reset workaround.
