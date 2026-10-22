# SHINKA — Development Rules

**Document:** SHINKA_DEVELOPMENT_RULES.md
**Status:** ACTIVE — mandatory
**Current BuildMarker:** Buildmarker-028
**Last Updated:** 2026-10-22
**Authoritative Source References:** SHINKA_SOURCE_OF_TRUTH.md
**Purpose:** Incremental build governance and change control.
**Scope:** Every development package.

> ## NO FEATURE IS COMPLETE WITHOUT: SOURCE + TESTS + HEALTH + DOCS
> A functional or contract change is NOT complete until SOURCE, TESTS, HEALTH/REGRESSION and CANONICAL DOCUMENTATION are reconciled. If one is affected and not updated, the package is incomplete.

- NO SILENT SOURCE-CONTRACT CHANGE
- NO FUTURE FEATURE IMPLEMENTATION WITHOUT PACKAGE SCOPE
- NO LEGACY SHINKA IMPORT — NO LEGACY SHINKA CONTRACT MAY ENTER THIS PROJECT WITHOUT AN EXPLICIT CHANGE REQUEST.

## 027 — Bildirim Öncesi Kalite Milestone’u

The current user request authorizes audit **and** focused fixes, including a compatible Router major update after review. Advance once to Buildmarker-027 / HC-027.0 and retain 023–027. No notification work, infrastructure, live mutation/import, routine hosted Health, main merge/publish or device/store submission. Preserve 024 incident evidence, 025 cancellation/timing tests and 026 mobile acceptance. Current local evidence, comparable production measurements and remaining manual acceptance belong in [the single milestone report](reports/SHINKA_PRE_NOTIFICATION_QUALITY_027.md). App/SDK fixtures are not hosted proof.

## 026 mobile scope

Advance 025 → 026 / HC-026.0 once; recordBuild retains 022–026. Explicit request supersedes light-only/mobile native-select decisions. Source, meaningful regression, Health mapping and the existing single Android/iOS report must change together. Keep original 024 incident and 025 timing evidence; do not rerun hosted Health/probes/imports or mutate real users. Local Chromium/WebKit, install/tree/audit, type/lint/build, Repo Health, last-five and performance gates remain mandatory. No main merge/publish, native build, store scan or new platform. Publish/device acceptance stays owner-owned.


## 025 targeted timing fix scope

Advance 024 → 025 and HC-024.0 → HC-025.0 once; retain 021–025 through recordBuild. Preserve the supplied HC-024 timeout and all prior reports. This package authorizes local timing/cleanup corrections and focused plus mandatory local checks only: no live Full Health, GeoNames probe, product mutation, import, main merge or publish. Do not reopen the now-PASS readiness/content issues. Extend the existing staged content policy through 025 without changing content predicates or bytes. Report fault-injected laboratory measurements separately from the historical published incident; its exact active helper/visibility remains unknown. Owner alone runs post-publication Health and saves/opens its result; physical devices remain separate acceptance.

## 024 targeted Health fix scope

Advance 023 → 024 and HC-023.0 → HC-024.0 once; retain 020–024 in Internal Build. Preserve the supplied failed run and prior reports. Narrow read-only published diagnosis is authorized; live Full Health, content import, onam/reset/delete/resume, schema push and main merge/publish remain outside this agent task. No new service, architecture change or general audit. Mandatory local gates and both browser engines remain required. Owner runs Full Health after the existing main/sync/publish workflow.

## Privacy package governance — 023

Explicit scope advances 022 → 023 and HC-022.0 → HC-023.0 once, retaining 019–023 in Internal Build. H11-001 activates withdrawal; H11-003 replaces the superseded INACTIVE-only future requirement with real owner erasure; previous catalog/evidence stays in Git. Add owner/recovery and local UI cases; track platform/provider/physical acceptance separately. No normal Health mutation reaches a real user. Two new operational schemas require a full-inventory publication review. Required local install/tree/audit, Repo Health/type/lint/build, both browser engines and performance budgets remain mandatory. Publish and live destructive acceptance belong to the user with explicitly chosen disposable accounts. No external service, SQL, live agent reset/delete/resume or main push.


## You package governance — 022

The explicit You request advances 021 → 022 and HC-021.0 → HC-022.0 once. Internal Build retains 018–022 through recordBuild; historical audits/Health/Git remain. Update H06/H10 common identity/GeoNames coverage, add executable profile/preferences and privacy/recovery cases plus local UI acceptance; preserve future withdrawal/deactivation/notification cases. Approved staged content policy continues through 022 without import/text changes. Deliver Test only after required local gates, both engines and performance budgets. Live Full Health and user mutations are expressly prohibited; the owner handles main sync/publish and hosted acceptance.

## Pattern package — 021

Explicit request advances Buildmarker-020 → 021 and HC-020.0 → HC-021.0 once. H10-001 moves from future to executable, targeted H12/H13/H15 coverage joins existing suites, and Internal Build retains 017–021 through recordBuild. Prior Health/audit/Git evidence and ON-05/live acceptances remain. Local mandatory gates, both browser engines and byte budgets precede Test-only push. No live Full Health, content import, user mutation, main merge/publish or new service. Source states/date metadata are not silently altered to make a check pass.

## Current package governance — 020 targeted fix

Advance once to Buildmarker-020 / HC-020.0; retain packages 016–020 in Internal Build. Scope is the four readiness type failures and selected-target removal/result consistency, not a repeated general audit. The user permits only targeted read-only live diagnosis; no agent-run hosted Health, delete, resume, reset or permanent deletion. Required local quality/regression gates remain; the user owns main merge/publish and in-app acceptance. [020 handoff](reports/SHINKA_TARGETED_CLOSURE_020.md).

## Historical package governance — 019

Advance once to Buildmarker-019 / HC-019.0; the Internal Build source/output must contain exactly packages 015–019. Preserve Git, security and historical Health evidence. This task permits only targeted read-only live diagnostics and local isolated mutations; no live deletion/reset/resume/new operation or hosted Full Health. The user performs publish/acceptance in the app. Test delivery remains MANUAL_USER_VALIDATION_PENDING for hosted/device behavior.

Required local checks include the full executable regression in Chromium and WebKit, current browser text-resize/focus matrix, typecheck/lint/build, Repo Health, dependency clean install/tree/audit, last-five ledger and production-bundle/laboratory performance budgets. Do not rerun adequate checks without a new change/failure. Case inventory audit must map requirement → real runner/predicate or measurement → actual evidence → environment for every current ID. Add/update/move decisions retain IDs/reasons and old failures. [019 delivery](reports/SHINKA_AUDIT_FIX_019.md) is the current handoff; older package-specific commands/rules below are historical.

## 018 Health scope and delivery decision

The user approved normal Health without terminal commands, Playwright setup or JSON import. Full in-app Health covers its declared in-app catalog only. Comprehensive browser regressions run in the existing local Chromium/WebKit harness; their original case IDs remain in a separate acceptance list and are not turned into live PASS or NOT_APPLICABLE records. Scope transfer mapping is canonical in healthExecutionScope.js and the 018 report. Required local regression remains mandatory. No routine agent live Health. Final user acceptance uses application screens only. Advance once to Buildmarker-018 / HC-018.0; display packages 014–018. The diagnostic target is read-only authorization for its existing job, not permission to restart deletion or recreate the account.

## Permanent validation rule — user decision, package 017

Do not automatically run hosted Full Health, live suites or repeats at the end of a prompt/package. Standard delivery checks run locally. Use the user's supplied report as evidence without reproducing it live. Only a concrete unresolved diagnostic question justifies targeted live access: state that question first, then use the narrowest authorized log/read/function. Full live execution is permitted only if that specific diagnosis truly requires it; never to turn a gate green. The user runs post-publish Health and supplies results. This rule overrides historical agent-run/live-closure wording below and in older reports.

Completed code is committed/pushed to Test after required local checks, even when hosted acceptance is **MANUAL_USER_VALIDATION_PENDING**. Never merge/publish main. Stop repeating adequate checks without a new failure/change/risk. Keep local, user-supplied published, independently measured hosted and physical-device evidence separate. Package 017 advances marker/catalog once; active display is 013–017. Do not prune operational/audit/user/Health history.

The explicit 017 deletion decision replaces mandatory operator pause/drain/window/ACK and repeated typed-ID confirmation. Use the target-scoped durable lifecycle and bounded resumable cleanup defined in BASE44_CONTINUATION. No blanket permission for live deletion is implied. A hosted destructive acceptance needs a specifically selected disposable target; local regression is sufficient for code delivery.

## Historical approved package — 016

User's Base44 direction supersedes SQL implementation/provisioning. Keep all product data and roles in Base44, use native identity, preserve unrelated fixes and historical reports. No external setup/migration/deploy, main merge/publish, paid service or live target deletion/reset is authorized. User confirms no SQL setup/transfer; current remote read-only metadata checks are recorded separately.

Required checks: repository Health, both canonical browser engines, lint/type/build, dependency tree/audit, generated last-five ledger and performance budgets. Add regression for observed partial state, competing requests and lifecycle gates; no database-specific test requirement remains. New native schema/fields require data/security docs and hosted schema/permission acceptance. User/audit/Git history is outside five-package display retention. [Accepted simplifications and operator runbook](SHINKA_BASE44_CONTINUATION.md).

## Mandatory workflow
1. Read current source contracts. 2. Identify affected domains. 3. Implement. 4. Add/update tests. 5. Add/update Health. 6. Reconcile canonical docs. 7. Run required local regression; user owns published Health. 8. Increment BuildMarker exactly once. 9. Record build (ledger + BUILD_HISTORY). 10. Report remaining live/external verification honestly.

## BuildMarker rules
- Canonical authority: `src/foundation/buildMarker.js` (`BUILD_MARKER`). Format `Buildmarker-NNN`.
- Increment exactly ONCE per meaningful package, covering source + tests + Health + docs together.
- Never increment separately for UI/backend/docs/tests/Health of the same package.
- Do NOT increment for read-only investigation, Health execution only, doc inspection without tracked change, or external manual testing.
- Never decrement or skip (`validateTransition`). Every doc's `Current BuildMarker` header is updated in the same package.
- Active ledger is the latest five unique packages including current, generated through `scripts/recordBuild.mjs`; it is not a second marker authority. Older history remains in Git.

## Git and closure workflow
Fetch before each task. Compare origin/main and origin/Test: safely fast-forward Test from main only when main is ahead without divergence; if Test is ahead, continue and report. Stop for divergent branches, local-only commits, or unexpected dirty state. Bring a behind local Test forward before work. Work/commit/push only Test; never force or update main. At completion verify local Test equals origin/Test.

Repository closure is REPO_CLOSED_PENDING_BASE44_VERIFICATION only after repository/local checks pass with zero Critical/High. FULLY_CLOSED additionally requires deployed current-marker Full Health and required live history readback. Buildmarker-006 repository dependency blockers were resolved. Buildmarker-007 is the first data/security foundation package: CLOSED_PENDING_BASE44_VERIFICATION after its required repository checks. Authentication/onboarding and all four approved product decisions are implemented; its repository status is CLOSED_PENDING_BASE44_VERIFICATION after required checks.

## Dependency change workflow
Inspect fresh `npm audit --json` and full dependency paths before choosing removal, supported updates, compatible resolution or a necessary major migration, in that order. Preserve release-age controls. Regenerate the lock with npm, then run `npm ci`, `npm ls --depth=0`, `npm ls --all`, fresh audit, `npm run security:deps`, typecheck, canonical Foundation tests, lint and build. Critical/High must both be zero; build-only dependencies have no waiver. Remaining Moderate/Low findings need explicit technical disposition. Dependency-only changes do not bump the Health catalog unless case definitions or semantics change.

## Data/security package closure
Run branch preflight before implementation; do not overwrite unexpected local work. For Buildmarker-007, advance the marker once and Health catalog to HC-005.0 once because H04/H12 semantics changed. Verify physical repository representation, canonical source field receipt, owner/admin/protected guards, audit minimization, 12-cell access matrix and no seed/import. Run `health:repo` and the existing native dependency/type/lint/build/browser checks. Record REPOSITORY and SYNTHETIC_RUNTIME separately from LIVE_RUNTIME/LIVE_ENFORCEMENT. Missing external deployment/identity/timestamp proof remains explicit; it cannot be converted into PASS by a synthetic fixture or by suppressing a capability check. Push only Test; final Base44 Full Health runs separately.

## Historical authentication/onboarding closure rule — package 008

The initial package incremented the marker once to 008 and the catalog once to HC-006.0. Its technical continuation retains both and updates the existing ledger entry only. The production SDK persistence adapter and approved Sun/TR/consent/durable derivation decisions are implemented. Existing source-gap Health cases now have executed PASS evidence; their IDs, intent and applicability are unchanged, so HC-006.0 is retained. The subsequent measured Health closure advances only the catalog to HC-007.0 because H05-009 changes from schema absence to package-aware live row counts. No second 008 ledger entry is added. Passing repository regressions verifies adapter behavior using an isolated SDK transport; it does not prove deployed writes, cross-instance enforcement or native transactions. Restart before a real daily message may resume at the earliest unresolved safe step, by approved decision. FIRST_SHINKA_ENGINE_REQUIRED is a next-package dependency, not an 008 blocker. No extra entity/field, content import, scheduler or live deployment is authorized by this package.

Before each prompt fetch and compare main/Test/local Test; stop on divergence, local-ahead or unexpected changes. A clean main-ahead state may fast-forward Test; Test-ahead may proceed with final reporting. Complete work is committed/pushed only to Test. After user merge/publish, the user performs separate Base44 Health/live acceptance under the permanent 017 rule.

## ON-04 decision continuation — explicit same-package authorization

The user's country-led selection request explicitly retains Buildmarker-008 / HC-007.0 despite replacing the earlier interaction. Record the decision and update the existing 008 ledger entry, never create a duplicate or begin 009 within that selection continuation. The later maintenance request starts a new package under the normal +1 rule. H10-003 retains its structured-provider-boundary intent with expanded regressions; H10-004 remains external. Reconcile all 12 canonical documents; CONTENT_MODEL requires no edit because no content flow or source changed. User-reported old Preview search success is accepted with provenance, not promoted to new hosted cascade/save/Full Health success. Deliver only to Test; user merge/sync/publish and device/live verification remain separate.

## Permanent active package retention — maintenance decision 2026-10-20

Use `node scripts/recordBuild.mjs /absolute/package.json` to add the next package or update current. The JSON uses the existing ledger fields. The command validates a same-marker update or exact +1 transition, merges duplicate package identities with the latest concise fields, sorts numerically, retains the newest five including current, and rewrites the bounded source plus generated BUILD_HISTORY. Summaries are limited to 600 characters and notes to 1,600. Keep current verification and open issues in that summary. Use `node scripts/recordBuild.mjs --check` to detect drift. Do not hand-append an unbounded ledger or hide it with a UI slice. Fewer than five retains all; continuations replace one summary, never add a package for each commit or test run.

`buildLedgerData.js` → frozen `BUILD_LEDGER` → Internal Build is the sole active history path. No history database query exists. The generated Markdown has exactly the same retained package set. Security/audit rows, user data, Health reports and Git history are outside this policy; no rewrite or bulk deletion is authorized. Necessary older product decisions remain in canonical standards; prior live evidence is retained in the supporting evidence report.

This maintenance request advances the marker once to 009 and catalog once to HC-008.0 for changed/new cases. It does not import content. Both browser engines, the measurement budget and retention check join the existing final validation commands. Local PASS still requires deployed Full Health/history readback and separate physical-device evidence for full closure.

## ON-05 prioritized correction within maintenance

The user's instruction to preserve current work and prioritize the live ON-05 defect is treated as a correction within the active maintenance package, not a new feature/package. Retain Buildmarker-009 and consolidate its existing ledger entry. Advance the catalog once to HC-009.0 because H07-007/H11-004 semantics change and H11-006 adds the explicit live incident closure requirement. No case is removed or downgraded to hide a failure. P17 now states worker-local coalescing; P18 changes its obsolete native-clock blocking expectation to preservation of valid durable consent. P28 explicitly tests the unproven distributed boundary. ON-05 remains OPEN_PENDING_LIVE_SAVE_AND_READBACK until the same partial account succeeds after user sync/publish.

## Admin navigation feature package — 2026-10-20

The new explicitly requested Profile/You admin entry and panel form one distinct feature package: advance 009 → 010 once and catalog HC-009.0 → HC-010.0 for added H12/H13 coverage. Consolidate corrections in the same package. Retain active packages 006…010 through recordBuild; do not remove security evidence or unresolved ON-05 live closure. This is another pre-content package: extend only the explicit zero-row allowlist through 010; unapproved 011+ remains blocked until its own content policy is authorized. Deliver Test only; user sync/publish and deployed/physical verification remain separate.


## Historical checkpoint — First Shinka package — Buildmarker-011 / HC-011.0

> Historical contract (superseded by the current 016 native contract above):
> This explicit feature request advances 010 → 011 once and updates the catalog for staged content readiness and scoped daily/phase cases. Active ledger retains 007…011. At the initial 011 delivery, category approval and verified production daily persistence were blockers; category approval is now resolved by the user continuation below. Production persistence remains blocked; do not claim live completion or change a failing prerequisite to PASS. Repository regressions may verify correct refusal while deployed Full Health remains BLOCKED. No CLI deployment, merge to main or live product import is part of Test delivery. H08 Calendar mutation, H10 Pattern, H11 withdrawal, H14 scheduler/push and physical-device requirements remain deferred/external.

## OD-002 approval continuation within Home

The explicit 2026-10-20 reply completes the pending category decision within package 011. Retain Buildmarker-011 and update its single ledger entry; active history remains 007…011. Retain HC-011.0: H02-006's provenance contract and H05-010's exact-import contract are unchanged, with three added canonical regressions supplying the newly approved data; no case ID, applicability, severity or gate is changed. Source content/mapping hashes must stay unchanged. The decision does not authorize live import, deployment, a main push or removal of H09-004's unverified-production-adapter blocker.


## Historical checkpoint — Calendar package — Buildmarker-012 / HC-012.0

Advance once for the requested Calendar feature; retain 008…012 through recordBuild. H08-002 and H11-002 move from placeholders to scoped current tests; new Calendar protocol/privacy/UI and explicit production/source blockers update the catalog. No failing case is removed or downgraded. Package 012 retains the source-approved staged content policy; unapproved 013+ still blocks.

At the 012 checkpoint the user deferred OD-012's >60-day rule. The explicit 014 decision below supersedes that source gap and refusal; apply the approved rule and behavioral tests. Production Calendar writes and reconsent remain disabled without a verified coherent-commit mechanism. Passing local tests is repository implementation evidence, not complete product availability. Test-only push; user main merge/sync/publish and hosted/device acceptance remain required. ON-05 same-account live save/readback and Home H09-004 remain open.

## Historical checkpoint — Admin Test Tools package — Buildmarker-013 / HC-013.0

Advance the package/catalog once for the explicit two-tool feature request. Active generated history retains 009…013; previous source decisions/security evidence remain. Add four current synthetic cases, one current production blocker and one external explicit-target acceptance case; update admin inventory/schema isolation tests. Do not downgrade the blocker or run live destructive actions in normal Health. Content validation stays staged for 013 with unchanged content bytes; unapproved 014 remains blocked.

Test-only delivery includes UI/backend protocols/schema/tests/docs. Actual production mutation enablement is separately contingent on a verified durable coordinator, configured environment/preview signing and deployed enforcement evidence. The user's request explicitly requires refusal where safety is unproven, so repository completion is not live delete/reset acceptance. Sync/publish and main merge stay with the user. Fresh audit failures remain visible and cannot be reported as zero vulnerabilities.


## Historical checkpoint — Production closure package — Buildmarker-014 / HC-014.0

This requested corrective package advances each authority once. Record OD-012's explicit approval with implementation evidence, preserve 012/013 features, and retain latest five packages 010…014. A security scan must use current lockfile/TLS verification. Architecture approval is required by the user's current request before external provisioning or live migration; prepare the complete decision first and complete independent work. Do not close production blockers with protocol-only tests or read-only schema/import success. Main merge, publish and target-specific live actions remain user-owned.