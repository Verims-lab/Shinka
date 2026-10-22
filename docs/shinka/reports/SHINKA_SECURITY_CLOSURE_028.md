# SHINKA — Security Closure 028

**BuildMarker:** Buildmarker-028 · **Health catalog:** HC-028.0 · **Date:** 2026-10-22
**Status:** REPO_CLOSED_PENDING_BASE44_VERIFICATION — local Chromium/WebKit and quality gates complete; owner publish, Full Health, Security scan and physical acceptance remain pending. Latest evidence: §10–12; earlier failed/missing-browser evidence is retained in §6.

## 1. Changed files

Backend/shared: `base44/shared/boundedJson.js` (new), `geonamesGuard.js` (new; module-private WeakSet marks guard-created limit errors), `geonamesAdapter.js` (preserves guard 429 instead of remapping to 503), `nativeClient.ts`, `nativeWriteChecks.js`, `onboardingOperations.js`, `youOperation.js`, `privacyOperation.js`, `patternOperation.js`, `calendarOperation.js`, `dailyMessageOperation.js`, `domainAccess.js`, `internalAuthorization.js`, `healthConstants.js`, `healthExecutionScope.js`; functions `onboarding`, `you`, `applicationSession` entries.
Frontend: `src/foundation/i18n/onboardingCopy.js`, `src/features/profile/birthplaceSelection.js`, `src/services/youService.js`, `src/foundation/buildMarker.js`, `buildLedgerData.js`, `health/catalog.js`, `health/cases/security.js` (new).
Inspection: `src/foundation/inspection/onboardingRules.js` — `inspectGeoNamesEntry` updated to the 028 entry shape (`geoNamesFor` → `guard.forOwner` → `createGeoNamesAdapter` with the single `secrets.get('GEONAMES_USERNAME')`; imports runtime, adapter and guard; passes `{geoNamesFor}`). The rule was stale since the guard was introduced and made `repoHealth` fail on `onboardingGeoNamesEntry` (confirmed on the pre-change tree).
Tests/scripts: `scripts/verifySecurity028.mjs` (SC01–SC05, SC07–SC09), `verifyNativeEntries.mjs`, `verifyGeoNamesEntry.mjs`, `runFoundationTests.mjs`, `src/foundation/tests/security028UiTests.js` (SC06, SC10, SC11), `onboardingTests.js` (O32), `nativeFixture.js`, `nativeTests.js`, `foundationTests.js`.
Docs: canonical docs (marker line); 028 sections in SECURITY_PRIVACY, TECHNICAL_ARCHITECTURE, BASE44_CONTINUATION, BUSINESS_FLOW, RELEASE_HEALTH_CHECK, DEVELOPMENT_NOTES; BUILD_HISTORY (024–028, trailing newline restored).

## 2. Findings

| # | Finding | Result | Evidence |
|---|---|---|---|
| F1 | `SHINKA_WRITE_MODE` read in nativeClient; secret not set | **Fixed in code** | No active read (grep); NA07/NA22 **PASS in Chromium and WebKit** (§10); initial unexecuted state retained in §6 |
| F2 | Request bodies measured only after full read | **Fixed in code** | `boundedJson.js` streams + cancels; SC01, SC05 local PASS |
| F3 | GeoNames calls unbounded per user | **Fixed in code (worker-local)**; distributed quota = platform limit | SC02, SC03, SC07–SC09 local PASS |
| F3b | Adapter remapped user/worker upstream limit errors to 503 | **Fixed in code** | SC07/SC08 FAIL on pre-fix code, PASS after; SC09 PASS |
| F4 | GeoNames secret read before auth / on non-birthplace actions | **Fixed in code** | SC02, SC04, verifyNativeEntries, verifyGeoNamesEntry |
| F5 | Rate-limit shown as raw error | **Fixed in code** | SC06/SC10/SC11 and H12-040 **PASS in both browser engines** (§10); controller/service fixtures, not rendered rate-limit screens |
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

## 6. Historical Base44 checkpoint (before local verification; retained evidence)

| Check | Command | Exit | Result |
|---|---|---|---|
| Focused O32 browser run | `FOUNDATION_TEST_IDS=O32 FOUNDATION_BROWSER=chromium node scripts/runFoundationTests.mjs` | 1 | **NOT RUN** — `browserType.launch: Executable doesn't exist` (chrome-headless-shell-1248). 0 tests executed; not counted. Install not retried |
| Local source rule check (real `onboardingRules.js` + `sourceRules.js` under Node) | ad-hoc script reading the O32 fixture from `onboardingTests.js` | 0 | 9 cases, 0 failed: real entry true; fixture true; 6 negatives (secret name, Deno.env, runtime, cached secret, mock adapter, **unguarded**) parse and return false; old `((o,` variant confirmed SyntaxError |
| O32 present in list | grep `['O32'` | — | 1 entry |
| verifySecurity028 | `node scripts/verifySecurity028.mjs` | 0 | 8/8 PASS: SC01–SC05, SC07–SC09 |
| repoHealth | `node scripts/repoHealth.mjs` | 0 | `failed: []` (previously `onboardingGeoNamesEntry`) |
| Build history | `node scripts/recordBuild.mjs --check` | 0 | "Active history verified: 5 packages" (previously FAIL on trailing newline) |

Not executed at that historical checkpoint: SC06, SC10, SC11 (earlier local Node bundle PASS only), NA07, NA22, full Foundation suite (Chromium and WebKit). This is a **local source rule check**, not an O32/browser suite PASS.

Commands proposed at that historical checkpoint (full engine runs now completed in §10; no redundant focused rerun needed):
```
npx playwright install chromium webkit
FOUNDATION_BROWSER=chromium node scripts/runFoundationTests.mjs
FOUNDATION_BROWSER=webkit node scripts/runFoundationTests.mjs
FOUNDATION_TEST_IDS=O32,NA07,NA22 FOUNDATION_BROWSER=chromium node scripts/runFoundationTests.mjs
```

## 7. Health changes

H12-040 (in-app synthetic: SC06 copy/mapping, SC10 picker state, SC11 You draft; not rendered screens). H12-041 (LOCAL ONLY: SC01–SC05, SC07–SC09; in-app Full Health does not run it). NA07/NA22 updated. None removed.

## 8. Sync status

The earlier report listed `5a2f0b6` and pending O32/docs sync. Fresh `git fetch origin --prune` verified GitHub main at **`0f243df4b6512079baa0c0e64c45b0e9173c4b20`**, which contains both the parseable O32 negative and the revised report. Local/origin Test began clean at `242ea3c`; main was ahead by ten commits with no divergence. Local Test was fast-forwarded to `0f243df`; no old Test files were copied over Base44 changes. Local executable corrections are captured exactly in [validation-source.patch](security-028/validation-source.patch), applied to that base. Delivery remains Test only; main/publish is owner-owned.

## 9. Remaining limitations

Worker-local limits; hosted enforcement unverified; F6/F7 endpoint security only statically reviewed; physical devices separate; Base44 Security scan state unknown until the owner runs it. Local npm audit is dependency evidence only.

## 10. Completed local verification — 2026-10-22

Tested source: GitHub Base44 base `0f243df4b6512079baa0c0e64c45b0e9173c4b20` plus [the exact executable correction patch](security-028/validation-source.patch). [Verification receipt](security-028/verification.json) records its SHA-256 and the unchanged package-lock SHA-256. Final report/ledger metadata was then updated and checked separately. Buildmarker-028 / HC-028.0 retained. Environment: macOS arm64, Node 26.0.0, npm 11.12.1, locked Playwright 1.64.0. `npm ci` installed 456 packages; the installed pinned browser binaries were available. No dependency upgrade or alternate runner.

| Full canonical command | Engine | Foundation results | Node server fixtures within the same command | Browser exceptions / missing required IDs | Exit |
|---|---|---|---|---|---|
| `FOUNDATION_BROWSER=chromium npm run test:foundation` | Chromium 156.0.8078.4 | **582 PASS / 0 FAIL** | **8 PASS / 0 FAIL** | **0 / 0** | 0 |
| `FOUNDATION_BROWSER=webkit npm run test:foundation` | WebKit 27.2 | **582 PASS / 0 FAIL** | **8 PASS / 0 FAIL** | **0 / 0** | 0 |

O32, NA07, NA22, SC06, SC10 and SC11 are present individually and PASS in **both** complete result lists: [Chromium](security-028/chromium.json), [WebKit](security-028/webkit.json). Nonzero unique IDs, counts matching the runner totals, exact required IDs and statuses were checked. O32 parses and rejects the valid unguarded fixture while retaining its positive and other negative checks. The earlier Node-only source inspection is not substituted for this browser execution.

SC01–SC05 and SC07–SC09 run automatically through `verifySecurity028()` before browser launch. Their eight individual results are now included in the canonical runner JSON; they are **LOCAL_SERVER_FIXTURE**, excluded from the 582 browser count. No extra standalone/focused run was made after the complete runs supplied this evidence.

Both complete commands also passed 150 mobile-experience checks, 87 viewport/mobile checks, 19 admin-navigation, 23 privacy, 24 You, 22 Pattern, 5 daily, 8 Calendar and 4 Test Tools flows; production routing and Preview probes passed. Four H10/H13 normal/clamped-timer checks passed per engine with zero external fetch/XHR. These are desktop engine/synthetic transport results, not physical-device or live provider proof.

Local in-app Health: **133 PASS / 0 FAIL / 13 BLOCKED**, 146 executed current cases per engine. H12-040 and H16-005 PASS; H12-041 is retained outside in-app execution and is covered by the eight server fixtures. Catalog: **172 total = 146 in-app + 11 local + 13 external + 2 future**. BLOCKED: H04-019, H05-001–009, H08-005, H09-004, H12-031, because the local harness has no hosted backend evidence. Their refusal is expected by the harness; none is relabeled PASS. Local save-failure/retry/list/private-open passed with synthetic transport only. No published Full Health was run.

Quality gates: clean `npm ci`; direct and full `npm ls`; `npm audit --json` and `npm run security:deps` (**0 Critical / 0 High / 0 Moderate / 0 Low**); `health:repo`, `typecheck`, `lint`, `build`; `recordBuild.mjs --check`; and the existing `measureMaintenance.mjs` byte/route/lazy-retry gates. All completed successfully. [Dependency audit](security-028/dependency-audit.json), [performance](security-028/performance.json) and [command receipts](security-028/quality-gates.json). Internal Build retains exactly **024–028** through `recordBuild`; no historical Health/security/Git evidence is pruned.

## 11. Corrections found by required gates; failed evidence retained

1. Initial typecheck exited 2 on the new guard’s variadic `fetch`, untyped SC test tuples, and regenerated OAuthConsent/AuthLayout header/optional-prop types. Narrow signature/JSDoc/default-prop fixes preserve behavior and all Base44 files. [Original diagnostics](security-028/typecheck-before.txt).
2. First full runs: each **580 PASS / 2 FAIL** (HC08, DM23), followed by Health H05-010 failure. The content-policy allowlist ended at 027 despite the 028 marker. Added **only 028** to the same strict policy; source hash/counts/bijection/conflict predicates remain unchanged. HC08/DM23 and HC12’s unapproved-next-package rejection all pass after correction.
3. Second full runs: each **582 PASS / 0 FAIL**, but command exit 1 at **H16-005** because new H12-040 was absent from the backend’s closed report plan. Added H12-040 to that plan, keeping H12-041 local-only. The third complete runs pass both browser and Health integrity checks. No assertion was removed or reduced.

[Initial failures and source identities](security-028/initial-failures.json) preserve all four unsuccessful engine logs and corresponding source patches. On those aborted runs later Health assertions, timer checks and the final summary/audit did not complete; they are not counted as successful full runs. Earlier Base44 SC07/SC08 failures, O32 syntax error, missing-browser attempt, repo-rule failure and build-history newline failure remain recorded above.

## 12. Health reconciliation and owner handoff

- **Update descriptions only:** NA07 accurately covers inactive/sign-out denial and no daily row; NA22 covers identity loss after create and the remaining persisted row. Neither claims a global write pause or rollback.
- **Update H12-041 and the scope transfer:** include SC07–SC09 and identify SC08’s exact boundary: real onboarding search chain, plus a real guard error injected into the You read-handler error envelope. It does not exercise a rate-limited full You saveProfile/provider path. SC06/SC10/SC11 remain service/controller fixtures, not rendered rate-limit screens.
- **Repair registration:** H12-040 is now in the closed server persistence plan. H16-005’s original equality/disjointness assertion is retained. No new case, deletion, severity/applicability downgrade or additional catalog bump.

Owner remaining acceptance: merge Test through the normal workflow; sync the complete shared/backend graph and frontend, then publish; run current-marker Full Health and save/list/open its private report; run the Base44 Security scan and evaluate F6/F7 plus anonymous/owner-A/owner-B/admin endpoint enforcement. Live GeoNames/worker/load, distributed quota limitations and physical Android/iOS/provider/restore acceptance remain separate. This task performed no main merge, publish, hosted Full Health, Base44 Security scan, content import or real-user operation.
