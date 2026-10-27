# SHINKA — Core Audit 042 closure

**Status: LOCAL_VERIFIED; hosted/device acceptance separate and notification entry disabled.**

Buildmarker-042 / **HC-041.0**, 2026-10-28 (Europe/Istanbul). No new general audit. Base44 audit changes from main `e368e5a` and Test's `f762acd` 040 preflight were merged without reset/force or overwriting user work. Main/publish remain owner-owned. User-reported successful deletion and live Health acceptance are preserved with that provenance; neither was rerun. Twelve backend findings remain OPEN / USER-DEFERRED. No live user operation, Full Health, Security scan, workflow, push, store setup or external service.

## Preserved changes and targeted corrections

Home keeps Shinka and Profile/You, without TR/EN header buttons; saved Profile/You preference still determines language. Updated DU01 and checkDailyFlow execute the real UI. Public settings/applicationSession startup reads remain parallel. Membership refusal invalidates late session results; a new startup/account boundary invalidates old settings/refusal/session results. New real-App checks also assert zero product/backend work while either prerequisite pends or membership is refused, on Home, You and Test Tools routes.

Entry-principal reuse in dailyMessage/You stays scoped to the same request's first admission. AR01 now requires **exactly two** actual checks for Home reopen/You read and valid output with no writes; zero no longer passes. AR02/03 require the exact AUTH_REQUIRED/401 class/code/status and unchanged state. AR04–08 cover first production, profile/preferences, pre/post-write identity loss, ACTIVE/health-deletion/consent and reset. These read counts are **not a general two-auth budget for writes**. Existing session/route/admin, NA22, YT and reset regressions remain.

A new valid-reset regression proved one additional defect: a normal first-daily request could persist after RESET_ACTIVE began during its SDK/content reads. Subsequent normal daily admissions now reread lifecycle and reject ONBOARDING_RESTART_REQUIRED/409. The coordinated reset flow retains its existing separate admission. No transaction/atomic race exclusion is claimed. This adds reads, intentionally reported below.

The Base44-added startup SS10 collided with the existing readiness SS10. Readiness SS10 is unchanged; startup is **SS11**, with the same and expanded intent. Global test ID uniqueness remains enforced.

## Written Support adaptation — sending disabled

[Exact provenance, contract and operator runbook](core-audit-042/support-contract.md): user-relayed Fode/Base44 Support, not an independently accessed ticket, published specification or live result. Workflow creator admin/owner fallback uses existing current-native-admin authorization. Shinka never invents fallback identity. No workflow secret/custom-header support: unused 033 comparator/machine branch and measurement/test scaffolding removed after reference checks; historical evidence retained. NS/NC/NM negatives retain 401/403/503 and fresh role/owner/consent/lifecycle protection. Workflow example requires `args:{action:"tick"}`; demoting/deleting its creator does not stop platform owner fallback.

Installed SDK 0.8.57 integrations return the unwrapped JSON body, verified by actual SDK against loopback HTTP (SDK01). Only `status:"sent"` with both present/non-null opaque channel fields becomes ACCEPTED; stored SENT means provider acceptance, not device display. Channel inner types are not invented. 403/404 are permanent refusals. 502, malformed/lost response and the eight-second wait deadline are UNKNOWN with no fallback/blind retry. Controlled timers verify cleanup and late success/rejection suppression. The deadline does not cancel already-dispatched SDK work. NotificationDelivery intent/readback/UNKNOWN protection remains; no exact-once guarantee.

Only allowlisted required neutral fields are sent; optional fields omitted, local limits retained. No unsupported eligibility query is required. NOT_EXPOSED is an observation with UNKNOWN support/permission, never GRANTED. App preference/ACTIVE/consent/lifecycle and native configuration remain separate. Real entry is **enabled:false**; H14-901/H16-901 retain external workflow/native/physical acceptance.

## SDK measurements — scope and cost of the safety correction

All rows use the same synthetic native SDK harness, fixed clock and product inputs. These are entity/auth call counts, not screen latency or credit measurements. Original JSON artifacts are unchanged.

| Scenario | Original before | Base44 audit after (retained) | Final 042 |
|---|---:|---:|---:|
| Home first entity reads | 60 | 54 | **57** |
| Home reopen entity reads | 17 | 11 | **12** |
| You read entity reads | 21 | 18 | **18** |
| Home first auth checks | 11 | 9 | **9** |
| Home reopen auth checks | 4 | 2 | **2** |
| You read auth checks | 3 | 2 | **2** |

Final 3/1 additional Home reads enforce fresh reset exclusion. [Before](core-audit-042/before-core-data.json), [Base44 after](core-audit-042/after-core-data.json), [final same-instrument measurement](core-audit-042/final-core-data.json). No screen-speed percentage is derived from these counts. Local production-screen measurements are reported separately below.

## Build/Health and evidence

`core-audit-042/build-entry.json` uses the actual recordBuild fields. `recordBuild.mjs` generates marker, bounded ledger, canonical headings and history together; active packages **038–042**. 041 retained HC-040.0, so changed catalog semantics advance once to **HC-041.0**, independently of build numbering.

Health add **0** / update **7** / delete **0**: H05-009, H12-025, H14-002/003/004/901 and H16-901. Registered scope remains **177 / 151 in-app / 12 local / 14 external**. SM01–07 removed with the unsupported unused secret comparator; NM01–08 kept and rewritten for supported native-admin workflow semantics, NS11 now verifies invalid empty args. No failed case was removed or relabeled PASS. Backend plan/execution mapping stays aligned.

Initial evidence remains under [initial-failures](core-audit-042/initial-failures/): original Base44 report and NOT_RUN/FAIL, original permissive AR PASS, missing generated-history newline, duplicate SS10 source finding, expanded fixture error-code expectation, malformed reset fixture corrected to a real valid reset (then revealing the actual write defect), JSDoc/type failures, and first real-App run with inconsistent synthetic new-account identity. Earlier suite logs also contain HC08/DM23 failures: 041/042 were missing from the explicit content-policy allowlist (it ended at 040). Both approved packages now reuse the existing strict source/hash/count policy; HC12 still rejects the next unapproved package. A later generated-history UTC date mismatch came from manual document-date normalization and was corrected by rerunning recordBuild with the unchanged entry. A narrow Health diagnostic identifies DM23 by safe helper ID. None of these failed attempts is final suite success.

## Final local verification

[Machine-readable receipt](core-audit-042/verification.json) binds the final executable/config/harness snapshot: **537 files**, SHA-256 `febfce037350301e4a52d55c684494db1657d6f35c0d62d0cd531132b29f25cd`, based on lossless merge commit `b4bbcfa45fb49d3c369f3ee24ab8bd308adf5719`. [Per-file manifest](core-audit-042/tested-source.json); documentation/evidence receipts are deliberately outside that executable hash. All 537 hashes were checked again after execution. The delivery commit is the Test commit containing this manifest; the final delivery message records its Git ID and local/remote equality.

| Gate | Final observed result |
|---|---|
| Full Chromium 156.0.8078.4 | **708 PASS / 0 FAIL**, 708 globally unique IDs, zero page errors |
| Full WebKit 27.2 | **708 PASS / 0 FAIL**, identical 708 IDs, zero page errors |
| Actual App/startup and UI flows | Both engines: 8 startup orders/account/logout cases, 5 checkDailyFlow cases, 19 admin-navigation checks; DU01, SS10 and SS11 executed |
| Local in-app Health | Both engines: **138 PASS / 0 FAIL / 13 BLOCKED**; save, same-run save retry, list and private-report open verified |
| Node admission/session | **AR01–08 8/8**, session stability **9/9** |
| Server and native entries | Each canonical run: 8 server fixtures, 11 disabled notification entry fixtures, installed SDK01; 7 native-session checks, 5 native routes, 2 artifact entries, 7 deletion entry checks, GeoNames entry/probe substitution — no live requests |
| Quality | npm ci, dependency tree, typecheck, lint, build, Repo Health, recordBuild --check and dependency/security audit PASS; **0 advisories** |
| Existing performance budgets | Initial JS **480114 / 158480 gzip** bytes; CSS **77728 / 14239 gzip** bytes; all four original budgets PASS; zero import cycles; 9 routes × 3 samples and real-App lazy chunk failure/reload recovery PASS |

The 13 local Health blockers are H04-019, H05-001–009, H08-005, H09-004 and H12-031: the synthetic transport does not supply their hosted evidence. They are not new live failures and do not retract user-reported published acceptance. Registry/backend plan/execution remains **177 total / 151 in-app / 12 local / 14 external**. H14-901/H16-901 stay separate external requirements. Full [Chromium](core-audit-042/chromium.json), [WebKit](core-audit-042/webkit.json), per-case source/actual evidence [Chromium](core-audit-042/chromium-audit/case-audit.json) / [WebKit](core-audit-042/webkit-audit/case-audit.json), [quality gates](core-audit-042/quality-gates.json), [performance](core-audit-042/performance.json). Initial failures remain separate; no test/case was hidden or converted to PASS.

## Comparable local screen timings

Same instrument and lockfile, sequential before `a1c87ca` / final-source runs, production assets and real SDK with synthetic HTTP: Chromium, 390×844, 4× CPU slowdown, 200 ms API and 40 ms asset delay, external fonts blocked. Five sessions × 12 transitions = **60 transitions per revision**, zero browser errors. This measures route transitions after initial Home is ready, **not cold app startup**. Exact calls/feedback/visible/usable timings and long tasks are retained in [before](core-audit-042/transitions-before.json), [after](core-audit-042/transitions-after.json), [summary](core-audit-042/timing-summary.json) and [identical instrumentation](core-audit-042/timing-instrument.json).

| Destination / visit | Samples per revision | Usable median before → after (ms) |
|---|---:|---:|
| Calendar first | 5 | 319.9 → 322.2 |
| Pattern first | 5 | 295.8 → 296.4 |
| You first | 5 | 295.2 → 296.4 |
| Home revisit | 15 | 246.8 → 246.8 |
| Calendar revisit | 10 | 247.6 → 247.4 |
| Pattern revisit | 10 | 246.8 → 246.8 |
| You revisit | 10 | 246.5 → 247.1 |

This small local sample shows no meaningful route-speed change; it cannot establish hosted latency, cold-start improvement, field INP or credit savings. No speedup percentage is inferred from reduced backend read counts.

## Owner handoff

Merge Test using the existing owner flow; sync the complete matching native entry/shared graph and frontend before publishing. No schema/content import, new secret, workflow creation or enablement. Notification entry stays disabled. Owner-run published Health and separately authorized physical/workflow acceptance remain separate from local fixtures. This task does not reopen successful user-reported deletion/Health or clear the 12 deferred backend findings.
