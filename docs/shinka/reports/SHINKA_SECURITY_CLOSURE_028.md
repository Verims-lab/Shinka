# SHINKA — Security Closure 028

**BuildMarker:** Buildmarker-028 · **Health catalog:** HC-028.0 · **Date:** 2026-10-22
**Status:** LOCAL_PARTIAL_VERIFICATION — browser regression suite not executed; owner runs publish, Full Health and Security scan.

## 1. Changed files

Backend/shared: `base44/shared/boundedJson.js` (new), `geonamesGuard.js` (new; module-private WeakSet marks guard-created limit errors), `geonamesAdapter.js` (preserves guard 429 instead of remapping to 503), `nativeClient.ts`, `nativeWriteChecks.js`, `onboardingOperations.js`, `youOperation.js`, `privacyOperation.js`, `patternOperation.js`, `calendarOperation.js`, `dailyMessageOperation.js`, `domainAccess.js`, `internalAuthorization.js`, `healthConstants.js`, `healthExecutionScope.js`; functions `onboarding`, `you`, `applicationSession` entries.
Frontend: `src/foundation/i18n/onboardingCopy.js`, `src/features/profile/birthplaceSelection.js`, `src/services/youService.js`, `src/foundation/buildMarker.js`, `buildLedgerData.js`, `health/catalog.js`, `health/cases/security.js` (new).
Inspection: `src/foundation/inspection/onboardingRules.js` — `inspectGeoNamesEntry` updated to the 028 entry shape (`geoNamesFor` → `guard.forOwner` → `createGeoNamesAdapter` with the single `secrets.get('GEONAMES_USERNAME')`; imports runtime, adapter and guard; passes `{geoNamesFor}`). The rule was stale since the guard was introduced and made `repoHealth` fail on `onboardingGeoNamesEntry` (confirmed on the pre-change tree).
Tests/scripts: `scripts/verifySecurity028.mjs` (SC01–SC05, SC07–SC09), `verifyNativeEntries.mjs`, `verifyGeoNamesEntry.mjs`, `runFoundationTests.mjs`, `src/foundation/tests/security028UiTests.js` (SC06, SC10, SC11), `onboardingTests.js` (O32), `nativeFixture.js`, `nativeTests.js`, `foundationTests.js`.
Docs: canonical docs (marker line); 028 sections in SECURITY_PRIVACY, TECHNICAL_ARCHITECTURE, BASE44_CONTINUATION, BUSINESS_FLOW, RELEASE_HEALTH_CHECK, DEVELOPMENT_NOTES; BUILD_HISTORY (024–028, trailing newline restored).

## 2. Findings

| # | Finding | Result | Evidence |
|---|---|---|---|
| F1 | `SHINKA_WRITE_MODE` read in nativeClient; secret not set | **Fixed in code** | No active read (grep); NA07/NA22 retargeted — **not executed** (browser suite) |
| F2 | Request bodies measured only after full read | **Fixed in code** | `boundedJson.js` streams + cancels; SC01, SC05 local PASS |
| F3 | GeoNames calls unbounded per user | **Fixed in code (worker-local)**; distributed quota = platform limit | SC02, SC03, SC07–SC09 local PASS |
| F3b | Adapter remapped user/worker upstream limit errors to 503 | **Fixed in code** | SC07/SC08 FAIL on pre-fix code, PASS after; SC09 PASS |
| F4 | GeoNames secret read before auth / on non-birthplace actions | **Fixed in code** | SC02, SC04, verifyNativeEntries, verifyGeoNamesEntry |
| F5 | Rate-limit shown as raw error | **Fixed in code** | SC06/SC10/SC11 (H12-040) — earlier local Node bundle run PASS; not run in a browser; not re-run this turn |
| F6 | validateContentArtifacts “unused” | **Usage confirmed; not a dead-code removal reason.** Security of the endpoint is a separate question | Usage: called by H05 via `artifactService.js`. Endpoint security: STATIC review only (`assertAdmin`, fixed mode, read-only) — no hosted negative-auth test; **not proven safe** |
| F7 | domainAccess has no UI caller | **Open — reviewed, not proven a false positive** | Presence in the documented contract explains why it exists, not that it is safe. STATIC review: `requireAuthenticatedUser`, admin for privileged actions, owner from principal, 10 000 B bound. Hosted cross-user/role tests not run |
| F8 | Recovery key reusable | **By design**, docs corrected | Read-only status lookup within 24 h TTL; PR15–PR17 cover invalid/expired |
| F9 | Distributed GeoNames quota | **Platform limit** | No shared counter store without a new service |
| F10 | Hosted enforcement of all above | **Not verifiable here** | Owner Full Health + Security scan |

No Security finding was acknowledged.

## 3. Per-function review (12)

| Function | Identity/role | Cross-user isolation | Service role | Input bound | Resource use |
|---|---|---|---|---|---|
| domainAccess | `requireAuthenticatedUser`; admin for privileged actions | owner from principal | backend only, closed RLS | 10 000 B streaming | single-entity ops |
| validateContentArtifacts | admin (`assertAdmin`) | n/a (reference data) | read-only | fixed mode param | bounded workbook read |
| accountPrivacy | same-request principal; recovery key read-only | owner from principal | backend only | 1 200 B | bounded cleanup scopes |
| adminTestTools | current native admin re-read per stage | target explicit, admins protected | backend only | admin limit | journaled steps |
| applicationSession | principal required | own role only | none for writes | 1 000 B | none |
| calendar | principal + consent | owner from principal | backend only | 2 000 B | receipts bounded |
| contentLibrary | admin | n/a | backend only | admin limit | bounded import plan |
| dailyMessage | principal + ACTIVE + consent | owner from principal | backend only | 2 000 B | one record/day |
| internalHealth | admin | reports redacted | backend only | 1 000 000 B | probe timeouts unchanged |
| onboarding | principal per request | owner from principal | backend only | 8 000 B | GeoNames guard |
| pattern | principal | owner from principal | read-only | 1 000 B | bounded window |
| you | principal, re-checked on write | owner from principal | backend only | 4 000 B | GeoNames guard, lazy secret |

Evidence class: STATIC review + LOCAL synthetic fixtures. Hosted evidence: not obtained.

## 4. GeoNames limits (exact semantics)

Per 60 s window: 30 app requests/user, 60 upstream fetches/user, 300 upstream fetches/worker; 10 min cache, 200 entries, in-flight de-duplication. Onboarding and You count separately (separate function workers). All three limits return 429 `GEONAMES_RATE_LIMITED` + `Retry-After` through the real guard + adapter chain. Per worker, resets on restart/redeploy; not a distributed or exact quota.

## 5. O32 defect and fix

- **Defect:** the negative fixture `entry.replace('guard.forOwner(owner,','((o,')` produced invalid JavaScript (`SyntaxError: Unexpected token ';'`). The parser threw before the rule ran, so "guard missing → false" was never tested.
- **Fix:** replaced it with a valid unguarded entry (`geoNamesFor = owner => createGeoNamesAdapter({username: secrets.get('GEONAMES_USERNAME')})`). The test asserts the fixture changed, parses (`syntaxNodes`), and is rejected. Positive check on the fixture is kept. The rule was not relaxed.
- **Syntax-broken source** is reported separately (below) and is not counted as the guard test.

## 6. Test results (this turn, local, no network)

| Check | Command | Exit | Result |
|---|---|---|---|
| Focused O32 browser run | `FOUNDATION_TEST_IDS=O32 FOUNDATION_BROWSER=chromium node scripts/runFoundationTests.mjs` | 1 | **NOT RUN** — `browserType.launch: Executable doesn't exist` (chrome-headless-shell-1248). 0 tests executed; not counted. Install not retried |
| Local source rule check (real `onboardingRules.js` + `sourceRules.js` under Node) | ad-hoc script reading the O32 fixture from `onboardingTests.js` | 0 | 9 cases, 0 failed: real entry true; fixture true; 6 negatives (secret name, Deno.env, runtime, cached secret, mock adapter, **unguarded**) parse and return false; old `((o,` variant confirmed SyntaxError |
| O32 present in list | grep `['O32'` | — | 1 entry |
| verifySecurity028 | `node scripts/verifySecurity028.mjs` | 0 | 8/8 PASS: SC01–SC05, SC07–SC09 |
| repoHealth | `node scripts/repoHealth.mjs` | 0 | `failed: []` (previously `onboardingGeoNamesEntry`) |
| Build history | `node scripts/recordBuild.mjs --check` | 0 | "Active history verified: 5 packages" (previously FAIL on trailing newline) |

Not executed this turn: SC06, SC10, SC11 (earlier local Node bundle PASS only), NA07, NA22, full Foundation suite (Chromium and WebKit). This is a **local source rule check**, not an O32/browser suite PASS.

Remaining browser commands (CI with Playwright browsers installed):
```
npx playwright install chromium webkit
FOUNDATION_BROWSER=chromium node scripts/runFoundationTests.mjs
FOUNDATION_BROWSER=webkit node scripts/runFoundationTests.mjs
FOUNDATION_TEST_IDS=O32,NA07,NA22 FOUNDATION_BROWSER=chromium node scripts/runFoundationTests.mjs
```

## 7. Health changes

H12-040 (in-app synthetic: SC06 copy/mapping, SC10 picker state, SC11 You draft; not rendered screens). H12-041 (LOCAL ONLY: SC01–SC05, SC07–SC09; in-app Full Health does not run it). NA07/NA22 updated. None removed.

## 8. Sync status

Last synced commit: `5a2f0b6` (repo health / onboarding rule). This turn's O32 fixture fix and doc updates are pending the next Base44 sync. No branch changes.

## 9. Remaining limitations

Worker-local limits; hosted enforcement unverified; browser regressions not run; F6/F7 endpoint security only statically reviewed; physical devices separate; Security scan state unknown until the owner runs it.