# SHINKA — Stabilization 034 (session, Health 429, admin deletion load)

**Status:** LOCAL FIXES DONE — browser acceptance, BuildMarker recording, publish and live Health NOT RUN
**Base marker:** Buildmarker-033 (034 entry prepared, not recorded — see §6)
**Date:** 2026-10-26

## 1. Changes
| Area | Change |
|---|---|
| Server session (`base44/shared/internalAuthorization.js`) | `auth.me()` failure → 401 `AUTH_REQUIRED` only with explicit evidence (HTTP 401/403 or `AUTH_REQUIRED`). 429/5xx/timeout/network/unclassified transport → 503 `SESSION_UNAVAILABLE`. |
| `applicationSession` | Unclassified failures → 503 `SESSION_UNAVAILABLE` (was 500). |
| Client session (`src/lib/sessionCheck.js`, `AuthContext`) | Concurrent checks coalesced; passive triggers throttled; `reset()` on logout/account change now forces re-verification (bug found by SS02: reset to `0` did not force). |
| Health native prerequisite | BLOCKED for transient unavailability only if feature valid, authority/strategy match, and the five schemas each appear exactly once with well-formed rows. Otherwise FAIL. |
| `nativeReadiness` | Sequential reads; at most one retry per schema on `RATE_LIMITED`. `budgetMs` **only gates whether a retry wait is started**; it is NOT a hard total timeout (individual reads are unbounded by it). |
| Admin deletion guard | Post-write `guard()` was removed in an earlier step and is now **restored**. Equivalence of "next pre-write/final guard" was not proven, so the read reduction was withdrawn. |
| `useTestTools` | 1.5 s gap between automatic resume/status passes via injectable `wait`; generation check after each wait. |

## 2. Executed tests
Command: `node scripts/verifySessionStability.mjs` → 7/7 PASS
| ID | Result |
|---|---|
| SS03a server 429/503/504/ETIMEDOUT/ERR_NETWORK/`TypeError` without HTTP → 503 | PASS |
| SS03b real 401, null user, missing id → 401 | PASS |
| SS03c role loss → FORBIDDEN; 429 during admin check never grants | PASS |
| SS01 client classification | PASS |
| SS02 coalescing, throttle, reset | PASS (first run FAIL: reset did not force re-check — fixed, failure retained here) |
| SS05 sequential + one retry per schema | PASS |
| SS05b budget gates retries only | PASS |

Also: `npx vite build` exit 0; `npx eslint` on changed files exit 0.

## 3. Written, NOT executed (browser runner required)
- `src/foundation/tests/sessionStabilityTests.js`: SS01, SS02, SS04 (SS04 = Health BLOCKED/FAIL incl. mismatch+429 negative).
- `src/foundation/tests/nativeTests.js`: NA34A (A deletes B, A intact, single operation id), NA34B (role removed mid-deletion → zero later writes, no COMPLETED), NA34C (cross-target resume rejected).
- Not written: `useTestTools` pacing tests (unmount/account change during wait, budget exhaustion, status-only reconciliation, same operation id). They need a React render harness (browser).

## 4. Why some tests could not be placed
Base44 file-write rule: a **new** file under `src/` may not import from `base44/`, and an edit may not **add** new `base44/` imports to an existing `src/` file (pre-existing imports are tolerated). Concretely rejected: new `src/foundation/tests/sessionStabilityTests.js` importing `base44/shared/nativeReadiness.js`, `internalAuthorization.js`, `testDeletionResult.js`; and adding those imports to `src/foundation/tests/nativeTests.js`. Workaround used (no bypass): server-side tests in `scripts/verifySessionStability.mjs` (Node); deletion tests added to `nativeTests.js` using its existing `nativeFixture` import. `nativeFixture` cannot run in plain Node (extensionless ESM imports), so NA34A–C need the browser runner.

## 5. Two target users
Read-only inspection earlier in this package: both accounts still present; each has one DELETE_USER operation in RUNNING at the same step; profile/preference rows remain. State: **Kısmi (PARTIAL)** for both. Not re-read after these changes; current state must be re-checked by lookup before any resume.

## 6. Codex handoff
1. `node scripts/recordBuild.mjs docs/shinka/reports/stabilization-034/build-entry.json` then set `BUILD_MARKER` to `Buildmarker-034` and run `node scripts/recordBuild.mjs --check` (not done: the script writes repository files, which my tools may not do via shell).
2. `node scripts/runFoundationTests.mjs` (Chromium + WebKit) — must include SS01/SS02/SS04, NA34A–C, T81, U15.
3. Write `useTestTools` pacing tests with injected `wait` (no real timers).
4. `node scripts/verifySessionStability.mjs`, `node scripts/repoHealth.mjs`.