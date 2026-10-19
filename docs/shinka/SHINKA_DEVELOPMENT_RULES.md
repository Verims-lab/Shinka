# SHINKA — Development Rules

**Document:** SHINKA_DEVELOPMENT_RULES.md
**Status:** ACTIVE — mandatory
**Current BuildMarker:** Buildmarker-009
**Last Updated:** 2026-10-20
**Authoritative Source References:** SHINKA_SOURCE_OF_TRUTH.md
**Purpose:** Incremental build governance and change control.
**Scope:** Every development package.

> ## NO FEATURE IS COMPLETE WITHOUT: SOURCE + TESTS + HEALTH + DOCS
> A functional or contract change is NOT complete until SOURCE, TESTS, HEALTH/REGRESSION and CANONICAL DOCUMENTATION are reconciled. If one is affected and not updated, the package is incomplete.

- NO SILENT SOURCE-CONTRACT CHANGE
- NO FUTURE FEATURE IMPLEMENTATION WITHOUT PACKAGE SCOPE
- NO LEGACY SHINKA IMPORT — NO LEGACY SHINKA CONTRACT MAY ENTER THIS PROJECT WITHOUT AN EXPLICIT CHANGE REQUEST.

## Mandatory workflow
1. Read current source contracts. 2. Identify affected domains. 3. Implement. 4. Add/update tests. 5. Add/update Health. 6. Reconcile canonical docs. 7. Run regression (Full Health). 8. Increment BuildMarker exactly once. 9. Record build (ledger + BUILD_HISTORY). 10. Report remaining live/external verification honestly.

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

Before each prompt fetch and compare main/Test/local Test; stop on divergence, local-ahead or unexpected changes. A clean main-ahead state may fast-forward Test; Test-ahead may proceed with final reporting. Complete work is committed/pushed only to Test. After the user merges Test to main and publishes, run the separate Base44 Full Health/live auth/GeoNames/enforcement verification.

## ON-04 decision continuation — explicit same-package authorization

The user's country-led selection request explicitly retains Buildmarker-008 / HC-007.0 despite replacing the earlier interaction. Record the decision and update the existing 008 ledger entry, never create a duplicate or begin 009 within that selection continuation. The later maintenance request starts a new package under the normal +1 rule. H10-003 retains its structured-provider-boundary intent with expanded regressions; H10-004 remains external. Reconcile all 12 canonical documents; CONTENT_MODEL requires no edit because no content flow or source changed. User-reported old Preview search success is accepted with provenance, not promoted to new hosted cascade/save/Full Health success. Deliver only to Test; user merge/sync/publish and device/live verification remain separate.

## Permanent active package retention — maintenance decision 2026-10-20

Use `node scripts/recordBuild.mjs /absolute/package.json` to add the next package or update current. The JSON uses the existing ledger fields. The command validates a same-marker update or exact +1 transition, merges duplicate package identities with the latest concise fields, sorts numerically, retains the newest five including current, and rewrites the bounded source plus generated BUILD_HISTORY. Summaries are limited to 600 characters and notes to 1,600. Keep current verification and open issues in that summary. Use `node scripts/recordBuild.mjs --check` to detect drift. Do not hand-append an unbounded ledger or hide it with a UI slice. Fewer than five retains all; continuations replace one summary, never add a package for each commit or test run.

`buildLedgerData.js` → frozen `BUILD_LEDGER` → Internal Build is the sole active history path. No history database query exists. The generated Markdown has exactly the same retained package set. Security/audit rows, user data, Health reports and Git history are outside this policy; no rewrite or bulk deletion is authorized. Necessary older product decisions remain in canonical standards; prior live evidence is retained in the supporting evidence report.

This maintenance request advances the marker once to 009 and catalog once to HC-008.0 for changed/new cases. It does not import content. Both browser engines, the measurement budget and retention check join the existing final validation commands. Local PASS still requires deployed Full Health/history readback and separate physical-device evidence for full closure.
