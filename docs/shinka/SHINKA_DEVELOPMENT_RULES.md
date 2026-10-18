# SHINKA — Development Rules

**Document:** SHINKA_DEVELOPMENT_RULES.md
**Status:** ACTIVE — mandatory
**Current BuildMarker:** Buildmarker-008
**Last Updated:** 2026-10-19
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
- Ledger (`src/foundation/buildLedger.js`) is append-only history; it is not a competing authority.

## Git and closure workflow
Fetch before each task. Compare origin/main and origin/Test: safely fast-forward Test from main only when main is ahead without divergence; if Test is ahead, continue and report. Stop for divergent branches, local-only commits, or unexpected dirty state. Bring a behind local Test forward before work. Work/commit/push only Test; never force or update main. At completion verify local Test equals origin/Test.

Repository closure is REPO_CLOSED_PENDING_BASE44_VERIFICATION only after repository/local checks pass with zero Critical/High. FULLY_CLOSED additionally requires deployed current-marker Full Health and required live history readback. Buildmarker-006 repository dependency blockers were resolved. Buildmarker-007 is the first data/security foundation package: CLOSED_PENDING_BASE44_VERIFICATION after its required repository checks. Authentication/onboarding is now implemented at repository contract/UI level and remains OPEN on its named source/capability gaps.

## Dependency change workflow
Inspect fresh `npm audit --json` and full dependency paths before choosing removal, supported updates, compatible resolution or a necessary major migration, in that order. Preserve release-age controls. Regenerate the lock with npm, then run `npm ci`, `npm ls --depth=0`, `npm ls --all`, fresh audit, `npm run security:deps`, typecheck, canonical Foundation tests, lint and build. Critical/High must both be zero; build-only dependencies have no waiver. Remaining Moderate/Low findings need explicit technical disposition. Dependency-only changes do not bump the Health catalog unless case definitions or semantics change.

## Data/security package closure
Run branch preflight before implementation; do not overwrite unexpected local work. For Buildmarker-007, advance the marker once and Health catalog to HC-005.0 once because H04/H12 semantics changed. Verify physical repository representation, canonical source field receipt, owner/admin/protected guards, audit minimization, 12-cell access matrix and no seed/import. Run `health:repo` and the existing native dependency/type/lint/build/browser checks. Record REPOSITORY and SYNTHETIC_RUNTIME separately from LIVE_RUNTIME/LIVE_ENFORCEMENT. Missing external deployment/identity/timestamp proof remains explicit; it cannot be converted into PASS by a synthetic fixture or by suppressing a capability check. Push only Test; final Base44 Full Health runs separately.

## Authentication/onboarding closure rule — current package

This package increments the marker once to 008 and the catalog once to HC-006.0. It remains OPEN while approved Sun/TR/consent sources and a durable production persistence adapter are missing. Passing repository regressions verifies contracts and refusal behavior; it does not prove deployed writes or satisfy those missing capabilities. Exact skip-resume and FIRST_SHINKA_ENGINE_REQUIRED remain explicit. No extra entity/field, content import, scheduler or live deployment is authorized by this package.

Before each prompt fetch and compare main/Test/local Test; stop on divergence, local-ahead or unexpected changes. A clean main-ahead state may fast-forward Test; Test-ahead may proceed with final reporting. Complete work is committed/pushed only to Test. After the user merges Test to main and publishes, run the separate Base44 Full Health/live auth/GeoNames/enforcement verification.
