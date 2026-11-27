# 091 — Calendar concise selected-day messages

Buildmarker-091 / HC-090.0. AydanTest began clean at 2df5fba, matching origin/AydanTest. After fetch, main was one merge commit ahead with identical files. Fast-forward to ce3b484cd48677b0facae66e33e339d2bf278bcf preserved all 090 work before editing. Only AydanTest is delivered.

## Scope and implementation

The current owner request removes two redundant Calendar informational messages, in both TR and EN: no period start on the selected date and no period predictions yet. CalendarDayDetails now uses the existing selection prompt before a day is chosen. An eligible unrecorded selected day shows only its date heading and Save as period start action. Unused runtime localization entries are removed; historical approved-source tables remain unchanged.

The empty status element stays hidden with no text so the selected grid button retains a valid aria-describedby target without a visible paragraph or spacer. Recorded starts, derived intervals, predictions and their estimate disclaimer, future-date restrictions, draft validation, explicit consent, actual errors, saving/success and 090 recovery information remain. Selection, add/move/confirmed delete, controller, backend product logic, schema and services are unchanged. No CSS, grid/markers/month navigation, background/logo/profile, bottom navigation 083, other screen or dependency change. The three shared Health files change only catalog/package recognition and coverage metadata.

## Permanent protection

CU13 verifies TR/EN empty-calendar prompt, exact eligible-date heading/action-only content, valid accessible descriptions, future prevention, confirmed saving/recorded/derived status and explicit consent without unintended writes. CU12 retains original uncertain-intent/record evidence assertions while expecting the retired absence paragraph to be hidden. CU02 still verifies last deletion and removal of predictions, now waiting on the meaningful deletion-success message. Existing checkCalendarCorrections adds concise selected-day and empty-calendar assertions to its real App matrix; checkCalendarRecovery retains PENDING/no-saved-marker checks without obsolete copy.

HC-090.0 retains 188 cases: 0 added / 3 updated / 0 removed (H05-009, H13-012, H13-015). Canonical tests total 829. Generated active history retains 087–091. Historical test results and failures remain intact.

## Execution

Before changing the UI, the new CU13 failed on the existing redundant empty-calendar message with no page errors. This is deliberate reproduction evidence, not a passing run.

Final local execution:

- Chromium and WebKit each passed **829/829 canonical regressions**, including CU13 and all existing Calendar/native/auth/privacy cases, with no page errors. The focused seven-case Chromium check also passed.
- Each engine passed **8/8 Calendar flows, 2/2 continuity scenarios, 40/40 Calendar locale/theme/text-size/mobile combinations and 20/20 recovery/safe-area/spacing scenarios**. The 40-case matrix covers TR/EN, 320/360/390/430 and landscape, 100/200% text, light/dark, empty and recorded calendars, predictions, future restrictions, add/move/confirmed delete, consent and failed/unknown recovery. Empty-state screenshots were inspected at 320px; protected heading/profile/navigation and artwork comparisons passed.
- Locked npm ci installed 456 packages; complete dependency tree and fresh audit passed with zero vulnerabilities. Typecheck, lint, production build, Repo Health, generated five-package history and normal Git diff whitespace validation passed. The scope review confirms **526 protected source files unchanged**, no unexpected/temp/backup source files and no added credential-pattern findings.
- The existing performance gate remains **FAIL**: initial JS **499,540 raw / 166,996 gzip** against 500,000 / 165,000 limits; CSS **86,188 raw / 16,810 gzip** against 90,000 / 16,000. Raw limits pass; the prior JS/CSS gzip overruns remain. No budget was raised. Static cycles: 0; lazy-asset reload recovery passed; 27 cold-route samples had no page errors. These are local measurements, not field performance or publication acceptance.

The first added empty-state browser extension timed out waiting for deletion after reusing the prior operation sequence in both engines. It is retained as failed-attempt evidence, not PASS. The final empty-state scenario starts a fresh isolated SDK fixture by reloading before deleting its only record; existing add/move/delete, receipt and no-duplicate-write assertions remain. No backend guard, test timeout or budget was weakened. A temporary review command disabled Git CRLF normalization and produced spurious whitespace output; the normal repository Git configuration passes diff --check, with only intended changes. The first security:deps invocation could not locate nested npm in the execution PATH; a QA-only command wrapper corrected the environment, and the final unchanged script passed with zero vulnerabilities. No dependency or global setting changed.

The complete default Foundation pipeline and broad mobile/standalone navigation packages were not rerun; the explicit gates above were executed. Prior WebKit timeouts and performance failures remain historical evidence. Hosted Full Health and physical-device acceptance remain NOT_RUN.

## Live boundaries

Hosted Full Health, publication and physical Android/iOS acceptance are NOT_RUN. This package does not cancel or edit the real November 11 receipt, inspect private live data, invoke real OAuth or publish to Base44. Local synthetic UI verification does not resolve the separate live pending-operation investigation.
