# SHINKA — Development Rules

**Document:** SHINKA_DEVELOPMENT_RULES.md
**Status:** ACTIVE — mandatory
**Current BuildMarker:** Buildmarker-006
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

Repository closure is REPO_CLOSED_PENDING_BASE44_VERIFICATION only after repository/local checks pass with zero Critical/High. FULLY_CLOSED additionally requires deployed current-marker Full Health and required live history readback. Buildmarker-006 is REPO_CLOSED_PENDING_BASE44_VERIFICATION; repository dependency blockers are resolved. No next product package is started.

## Dependency change workflow
Inspect fresh `npm audit --json` and full dependency paths before choosing removal, supported updates, compatible resolution or a necessary major migration, in that order. Preserve release-age controls. Regenerate the lock with npm, then run `npm ci`, `npm ls --depth=0`, `npm ls --all`, fresh audit, `npm run security:deps`, typecheck, canonical Foundation tests, lint and build. Critical/High must both be zero; build-only dependencies have no waiver. Remaining Moderate/Low findings need explicit technical disposition. Dependency-only changes do not bump the Health catalog unless case definitions or semantics change.
