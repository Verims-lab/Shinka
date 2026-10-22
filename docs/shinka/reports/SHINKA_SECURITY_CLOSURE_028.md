# SHINKA — Security Closure 028

**BuildMarker:** Buildmarker-028 · **Health catalog:** HC-028.0 · **Date:** 2026-10-22
**Status:** LOCAL_PARTIAL_VERIFICATION — browser regression suite not executed; owner runs publish, Full Health and Security scan.

## 1. Changed files

Backend/shared: `base44/shared/boundedJson.js` (new), `geonamesGuard.js` (new), `nativeClient.ts`, `nativeWriteChecks.js`, `onboardingOperations.js`, `youOperation.js`, `privacyOperation.js`, `patternOperation.js`, `calendarOperation.js`, `dailyMessageOperation.js`, `domainAccess.js`, `internalAuthorization.js`, `healthConstants.js`, `healthExecutionScope.js`; functions `onboarding`, `you`, `applicationSession` entries.
Frontend: `src/foundation/i18n/onboardingCopy.js`, `src/features/profile/birthplaceSelection.js`, `src/services/youService.js`, `src/foundation/buildMarker.js`, `buildLedgerData.js`, `health/catalog.js`, `health/cases/security.js` (new).
Tests/scripts: `scripts/verifySecurity028.mjs` (new), `verifyNativeEntries.mjs`, `verifyGeoNamesEntry.mjs`, `runFoundationTests.mjs`, `src/foundation/tests/security028UiTests.js` (new), `nativeFixture.js`, `nativeTests.js`, `foundationTests.js`.
Docs: all 14 canonical docs (marker line); 028 sections in SECURITY_PRIVACY, TECHNICAL_ARCHITECTURE, BASE44_CONTINUATION, BUSINESS_FLOW, RELEASE_HEALTH_CHECK, DEVELOPMENT_NOTES; BUILD_HISTORY regenerated (024–028).
Git: Base44 auto-sync produced commits `78e2c87` and `40cb24c` on the connected branch; the rest of this package is pending the next sync. Branch settings were not changed.

## 2. Findings

| # | Finding | Result | Evidence |
|---|---|---|---|
| F1 | `SHINKA_WRITE_MODE` read in nativeClient; secret not set | **Fixed in code** | No active read (grep); NA07/NA22 retargeted; per-owner guards unchanged |
| F2 | Request bodies measured only after full read | **Fixed in code** | `boundedJson.js` streams + cancels; SC01, SC05 |
| F3 | GeoNames calls unbounded per user | **Fixed in code (worker-local)** + **platform limit** for distributed quota | SC02, SC03 |
| F4 | GeoNames secret read before auth / on non-birthplace actions | **Fixed in code** | SC02 (no adapter before call), SC04, verifyNativeEntries (0 reads on read), verifyGeoNamesEntry |
| F5 | Rate-limit shown as raw error | **Fixed in code** | SC06 (H12-040) |
| F6 | validateContentArtifacts “unused” | **Evidenced false positive** | Called by H05 via `artifactService.js`; kept |
| F7 | domainAccess has no UI caller | **Evidenced false positive** (not a removal reason) | Part of the documented domain contract; admin/owner-checked; kept |
| F8 | Recovery key reusable | **Evidenced: by design**, docs corrected | Read-only status lookup within 24 h TTL; PR15–PR17 cover invalid/expired; not one-time |
| F9 | Distributed GeoNames quota | **Platform limit** | No shared counter store without new service; recorded |
| F10 | Hosted enforcement of all above | **Not verifiable here** | Owner Full Health + Security scan |

No Security finding was acknowledged automatically.

## 3. Per-function review (12)

| Function | Identity/role | Cross-user isolation | Service role | Input bound | Resource use |
|---|---|---|---|---|---|
| domainAccess | `requireAuthenticatedUser`; admin for privileged actions | owner from principal | backend only, closed RLS | 10 000 B streaming | single-entity ops |
| validateContentArtifacts | admin (`assertAdmin`) | n/a (reference data) | read-only | fixed mode param | bounded workbook read |
| accountPrivacy | same-request principal; recovery key read-only | owner from principal; key returns status only | backend only | 1 200 B | bounded cleanup scopes |
| adminTestTools | current native admin re-read per stage | target explicit, admins protected | backend only | admin limit | journaled steps |
| applicationSession | principal required | own role only | none for writes | 1 000 B, empty object | none |
| calendar | principal + consent | owner from principal | backend only | 2 000 B | receipts bounded |
| contentLibrary | admin | n/a | backend only | admin limit | bounded import plan (not run) |
| dailyMessage | principal + ACTIVE + consent | owner from principal | backend only | 2 000 B | one record/day |
| internalHealth | admin | n/a; reports redacted | backend only | 1 000 000 B (report contract) | probe timeouts unchanged |
| onboarding | principal per request | owner from principal | backend only | 8 000 B | GeoNames guard |
| pattern | principal | owner from principal | read-only | 1 000 B | bounded window |
| you | principal, re-checked on write | owner from principal | backend only | 4 000 B | GeoNames guard, lazy secret |

Evidence class: STATIC source review + LOCAL synthetic fixtures. Hosted evidence: not obtained.

## 4. GeoNames limits (exact semantics)

Per 60 s fixed window: 30 **app requests**/user, 60 **upstream fetches**/user, 300 upstream fetches/worker; 10 min cache, 200 entries, in-flight de-duplication. Covers search, countries, regions, settlements and profile birthplace resolution in onboarding and You. 429 + `Retry-After`. Per worker, resets on restart/redeploy; not a distributed or exact quota. Admin transport probe is unchanged.

## 5. Test results (this package, local)

| Check | Passed | Failed | Not run |
|---|---|---|---|
| verifySecurity028 (SC01–SC05) | 5 | 0 | 0 |
| verifyNativeEntries | 1 suite (7 session, 5 routes, 2 artifact) | 0 | 0 |
| verifyGeoNamesEntry / RuntimeProbeEntry | 2 | 0 | 0 |
| verifyDependencyRules | 1 | 0 | 0 |
| Production build (`vite build`) / ESLint | 2 | 0 | 0 |
| repoHealth | 1 (ok) | 0 | 0 |
| `recordBuild --check` | 0 | 1 | 0 |
| Browser Foundation suite (Chromium/WebKit, incl. NA07/NA22, SC06) | 0 | 0 | **all** |

- Browser suite: pinned Playwright Chromium binary is absent; `npx playwright install` is blocked in this sandbox. Tried once, not repeated. NA07, NA22 and SC06 were therefore **not executed**, and no PASS is claimed for them.
- `recordBuild --check` fails only on a missing trailing newline in SHINKA_BUILD_HISTORY.md (the editing tool strips it); content is identical to the generated output. Fix: run `node scripts/recordBuild.mjs --check` after adding a final newline, or regenerate with `recordBuild.mjs`.
- 027 results are not used as 028 evidence.

## 6. Health changes

Added H12-040 (in-app synthetic, SC06) and H12-041 (local-only, SC01–SC05). Updated NA07/NA22 under H04-018/H12-033. Removed none. Recovery-key expiry → existing H12-039; validateContentArtifacts → existing H05. No live GeoNames load, real user mutation or hosted check added.

## 7. Remaining limitations

Worker-local limits; hosted enforcement unverified; browser regressions not run; physical device acceptance separate; the Security scan state is unknown until the owner runs it.