# 092 — Calendar empty state and consent refinement

Buildmarker-092 / HC-091.0. Clean AydanTest matched origin/AydanTest ee0112e. Fetch found main one merge commit ahead with identical files; fast-forward to 7879ca48854834351ca016d07fda3adcf7d11e08 preserved 091 before development. Delivery is AydanTest only.

## Current contract

Use the exact owner-approved Turkish invitation and a natural equivalent English translation only when no date is selected and the existing admitted server projection explicitly reports hasPeriods=false, pendingReview=false, writable=true, READY/CONSENT_REQUIRED, no recovery and no loading/busy/error/calculation restriction. An empty monthly starts array is not complete history; no onboarding skip flag exists or is inferred. No-consent server reads do not expose health rows, and this package adds no health read or new data contract.

CalendarDayDetails reuses its approved checkbox markup/copy in exactly one position: beneath the empty invitation before selection or inside the selected eligible-day details afterward. It starts unchecked. READY means server-validated GRANTED consent, with no repeated checkbox/event. Selecting a day hides the invitation. Existing records, predictions, validation, restrictions, saving and recovery keep their current feedback.

Investigation found a read-state defect relevant to this new journey: browsing to a different month cleared the local checkbox and every CONSENT_REQUIRED read reset it. Preserve only that unsaved checkbox intent across a read with an unchanged server revision, admitted writable empty data and no pending/recovery condition. For the unsaved pre-save checkbox, revised or restricted CONSENT_REQUIRED reads reset the draft; privacy/account invalidation and confirmed save clear it independently. A verified GRANTED state hides the checkbox, while an original uncertain write keeps its own private recovery payload. This is never a persisted grant or read/write authority. The existing explicit first-period save still performs fresh owner/consent/version/event/deletion/readback validation. Initial grant is never automatic; already granted consent is not rewritten.

Product backend/schema/services, onboarding, period add/edit/delete/recovery implementation, CSS/markers/layout, Home 088, profile 087, background and navigation 083 are unchanged. The three shared Health files change only package recognition, version and coverage metadata. Test fixture flags exist solely in the CLI aliased fake SDK.

## Permanent protection

CU14 checks both locales: initially unchecked single consent, zero writes before explicit save, date/month selection retention, one first grant/event/record and no repeat for a valid grant. CU15 checks complete history outside the viewed month, unverified/blocked replies, durable unresolved receipt, real synthetic withdrawn/open-deletion guards and privacy invalidation/reset. RC16 verifies that only unchanged admitted empty reads preserve the draft, while revised, paused, pending or private responses clear it without writes. CU13 retains selected-day concise-message assertions with the new approved introductory text. The existing 40-case Calendar App matrix adds 16 native consent journeys across TR/EN, four mobile widths and both themes per engine; prior 100/200% text, landscape, data flows and protected-surface assertions remain.

HC-091.0 retains 188 cases: 0 added / 4 updated / 0 removed (H05-009, H08-007, H13-012, H13-015). Canonical tests total 832. Generated active history retains 088–092. Historical reports/results remain in Git.

## Execution

Before implementation CU14 failed on the missing introduction. The first UI-only attempt then failed at checked intent being lost on month inspection; five existing/new companion tests passed. After the narrow read-state fix all six focused cases passed. These failed attempts remain evidence, not PASS.

Final local execution:

- Chromium and WebKit each passed **832/832 canonical regressions**, including CU14/CU15/RC16, with no page errors. The six focused Chromium cases passed after the read-state correction.
- Each engine passed **8/8 Calendar flows, 2/2 continuity scenarios, 40/40 Calendar locale/theme/text/mobile cases and 20/20 recovery/safe-area/spacing cases**. The 40-case matrix includes **16 additional native initial-consent journeys**: TR/EN at 320/360/390/430px, light/dark, empty with valid grant/no renewed checkbox, initially unchecked no-grant checkbox, no writes before save, preserved date/month selection and exactly one grant/event/period through explicit save. Existing 100/200% text, landscape, records/predictions, min15/future, read-only checks and original-intent continuation remain. 320px images were inspected; the checked screenshot represents an explicit test-user action, not the default state.
- Locked npm ci installed 456 packages. Dependency tree, security:deps (zero vulnerabilities), typecheck, lint, production build, Repo Health, generated five-package history and normal Git whitespace validation passed. **524 protected source files remain unchanged**; no unexpected/temp/backup or credential-pattern addition. Product backend/schema/services, onboarding, Home/background/profile/navigation remain protected.
- Existing performance gate: **FAIL**, initial JS **499,540 raw / 166,999 gzip** against 500,000 / 165,000 limits; CSS **86,224 raw / 16,820 gzip** against 90,000 / 16,000. Raw limits pass; the prior gzip overruns remain and no budget was raised. Cycles: 0; lazy-asset reload recovery passed; 27 cold-route samples had no page errors. These are local measurements, not field vitals.

Initial failures are preserved separately: the new UI test first found the missing introduction, then lost checkbox state on month browsing; the first typecheck required a JSDoc tuple annotation in the new fixture (no runtime change). The first concurrent WebKit core run passed 831/832 but failed HC01 auth-probe readiness; the first Calendar pipeline timed out in retained-tab continuity waiting for recovery time. These were not relabelled PASS. Final WebKit reruns ran sequentially under the same assertions/time budgets and passed. Auth/navigation code and the continuity test were not changed to obtain that result. Concurrency/timing is a possible explanation, not a proven live root cause.

The complete default Foundation pipeline, broad mobile and standalone navigation packages were not rerun; the explicit gates above were executed. Hosted Full Health and physical acceptance remain NOT_RUN. Earlier package failures remain historical evidence.

## Live boundary

Hosted Full Health, Base44 publication and physical Android/iOS acceptance are NOT_RUN. No live health record/consent/receipt was read or changed, and the separate November 11 pending-operation incident is not declared resolved.
