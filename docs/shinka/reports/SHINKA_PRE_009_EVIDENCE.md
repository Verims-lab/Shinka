# Shinka — Evidence retained from before package 009

Historical evidence only; dates, markers and superseded handoffs below describe their original checkpoints. Current acceptance is in [Release Health](../SHINKA_RELEASE_HEALTH_CHECK.md); current product/transport rules are in the canonical architecture and source-of-truth documents. In particular, the former assumption that package 009 would import content is superseded by the explicit maintenance scope. No old result certifies the new deployment.

## Base44 findings (measured 2026-10-18)
- Backend function execution works; Deno `DecompressionStream` used to parse XLSX without dependencies.
- Unknown entity → HTTP 404 "Entity schema … not found" (used by the entity probe).
- Uploaded workbooks use namespaced XML (`<x:row>`); reader supports prefixes.
- Attachment limit 5 MB: large DOCX sources must be split into transport parts (UI/UX v1.1 → 4 parts).
- Attachment text preview drops DOCX tables; reading the DOCX XML directly exposes them (companion: 13 tables incl. 2 metadata tables, 11 source tables). OD-010 resolved.
- App login methods are not readable from the client at runtime (public settings expose only visibility); auth policy evidence is a recorded platform-state snapshot.


## Measured platform limits (Buildmarker-004)
- Entity text field: 16KB accepted, 24KB rejected ("exceeds the maximum allowed size"). Large internal reports go to private file storage.


## Measured Base44 Health closure — same Buildmarker-008

The supplied HC-006.0 live baseline had 126 total / 104 executed / 102 PASS / 2 FAIL / 22 N/A. This continuation addresses only H03-007/T74 and H05-009. Health advances to **HC-007.0** because H05-009 changes meaning; BuildMarker stays 008 and its single ledger entry is updated. Counts remain **16 suites / 126 cases / 104 current / 15 future / 7 external**.

T74 was reproduced read-only in the authenticated live browser at `https://shinka-rhythm-flow.base44.app/login?probe=1`. After hydration the path remained `/login`; `[data-probe-root]` existed, `[data-auth-shell]` did not, provider count was 0, and `data-onboarding-state` was `AUTHENTICATED_PROFILE_REQUIRED`. There was no observed URL redirect or missing PageContainer. App -> AuthProvider -> Onboarding hydrated the existing admin session, superseding the sign-in initial entry; `probe=1` had no isolation semantics. The old CLI directly mounted Login, hiding the production route-state difference. The old poll waited 15 seconds for a shell that could never appear and emitted only AUTH_PROBE_ROOT_TIMEOUT.

T74 now uses the exact `/auth-shell-probe` presentation route outside AuthProvider. It renders the real OnboardingScreen/SignIn with `UNAUTHENTICATED_SIGN_IN`, an isolated empty pending-name reader, unchanged Apple/Google service and unchecked 18+ boundary. It creates no authenticated principal, never hydrates/writes onboarding data and does not need an OAuth response. Normal `/login`, `/onboarding` and protected routing are unchanged. Root contract: `[data-auth-probe="unauthenticated-shell"]`, `data-probe-status=LOADING|READY|ERROR`, canonical route attribute, real `[data-probe-root]`/`[data-auth-shell]` and expected onboarding state. READY is emitted after commit/layout; a render boundary signals ERROR. The observer retains the existing 15-second bound and distinguishes READY, ERROR and TIMEOUT with route/path/state/elapsed evidence. Missing root/readiness, inaccessible documents, unexpected routes/redirect loops and malformed READY never pass. H03-007 retains successful T74 geometry evidence as well as failures.

H05-009's obsolete ABSENT-entity rule predated the 20 physical schemas deliberately introduced in 007. **Schema presence does not mean product data was imported.** H05-009 now requires exact unfiltered live counts of zero for MessageCategoryLookup, MessageCategoryMapping and MessagePair plus the read-only artifact validator's `importPerformed=false`. The admin-only internalHealth `contentCounts` action uses SDK `count()` on only those three entities; no product rows reach the browser. Missing/invalid/failed counts block, any positive count fails with `UNEXPECTED_PRODUCT_CONTENT_PRESENT`, entity/count and non-sensitive provenance. No rows are deleted. The validator flag describes its current read-only operation; it is not an invented global historical import log. Zero live rows plus this flag verify the current pre-content state, including absence of fake/demo rows.

Live read-only evidence on 2026-10-19 (15:40–15:49 UTC observation window): Base44 admin Data panel, app `6ad5190f4845d4e3af03b420`, unfiltered tables displayed **MessageCategoryLookup (0), MessageCategoryMapping (0), MessagePair (0)** and no records. The supplied live artifact result is `importPerformed:false`. These are measured live UI counts, not inferred from repository schemas and not execution of the newly added backend action. No product data was written. After Git/Builder publication the new action and Full Health must be re-run; this evidence does not certify a new deployed HC-007.0 result.

The zero-row policy applies only to the pre-content 007/008 stage. At 009 or later H05-009 blocks with `APPROVED_CONTENT_VALIDATION_REQUIRED` until an approved imported-count/content-validation policy replaces it. Unknown packages block. H05-001…008 workbook integrity checks are unchanged; no content package or importer is implemented here.

Canonical tests retain all 215 and add HC01…HC16 for real probe readiness, negative probe states, package-aware content counts and server authorization. The CLI also mounts the real App/AuthProvider/Onboarding route with isolated SDK transports, checking anonymous sign-in, authenticated profile hydration even with `probe=1`, and the isolated probe with an existing session. These three extra route scenarios are separate from the canonical test count. Final validation results follow. Final live HC-007.0 Full Health remains required; First Shinka stays a next-package dependency.

Final validation for this Health closure: **231 canonical PASS / 0 FAIL**, plus **3/3 real App routing scenarios**, zero browser exceptions. T74 measured READY in 53ms at 360px and 52ms at 1024px (15,000ms bound); Apple/Google only, both 52px controls, 20px padding, zero passwords, age unchecked. Preserved current Health evidence: H06 6/6, H07 12/12, H10-003 1/1, H11 onboarding 2/2, H12 20/20 PASS. npm ci, npm ls --depth=0, security:deps, typecheck, lint, build and Repo Health PASS. Audit: 0 Critical / 0 High / 2 existing Moderate findings. All 20 schemas and 12 document headers remain aligned. Internal 008 blockers: 0; **CLOSED_PENDING_BASE44_VERIFICATION**. This is not a new deployed Full Health result.

Health closure branch preflight: local and origin Test started clean at 05a4c128e722e49201897d27a99b3550e21910c0; main 17d44e21acb237b108f9d4df4cdfaa93bda8ad71 was one merge commit ahead without divergence. Remote Test and local Test were fast-forwarded to main before edits. Changes and final push target Test only; main is not modified.


## Preview readiness correction — same 008 / HC-007.0

The supplied deployed HC-007.0 result was 126 cases / 104 applicable / 103 PASS / 1 FAIL / 22 N/A, with only H03-007 failing through T74 and HC01 `AUTH_PROBE_READY_TIMEOUT`. The prior route-state fix was already correct: `/auth-shell-probe` resolved `UNAUTHENTICATED_SIGN_IN`. H05-009 had live zero-count/importPerformed=false proof and is unchanged by this correction.

Reproduction (2026-10-19): the Base44 Preview Foundation test button reproduced 229/231 PASS, with T74 and HC01 timing out around 15 seconds. The same Preview `/auth-shell-probe` opened top-level showed document.readyState=complete, the expected root and real auth shell, and READY. A local equivalent cross-site Preview parent -> Health iframe -> hidden auth iframe reproduced the unmodified failure with normal Chromium frame scheduling: document complete, root/shell present, correct screen, two 52px provider controls, but status LOADING. A diagnostic animation-frame callback was not delivered during a 1,000ms timer observation; the old probe's sole READY transition depended on that animation callback. The existing 15-second deadline then removed the frame. The issue is the hidden nested-frame animation scheduling dependency, not a missing route, SDK hydration, OAuth, base path, message target/origin or listener ordering. There are no postMessage/event readiness messages in this implementation. Earlier default Playwright scheduling flags and a top-level-only harness did not cover the failing Preview topology.

Fix: useLayoutEffect verifies the committed real DOM and synchronously resolved layout, then commits the durable data-probe-status attribute. `inspectAuthShell` requires the connected root, expected unauthenticated screen, actual auth shell/container, two measurable provider controls and nonzero container width. An absent or unmeasurable shell cannot become READY. No requestAnimationFrame, animation/painter availability, provider request, parent/top assumption or new auth/session state is required. Parent polling stays bounded at a 50ms interval / 15,000ms timeout; frame/listener disposal is explicit. Late observation reads the durable state, so no READY event can be lost. StrictMode plus explicit unmount/remount and observation before/after commit are covered. An observed root disappearing or a detached frame produces an explicit ERROR.

ERROR/TIMEOUT diagnostics include route/pathname, expectedSelector, selectorFound, documentReadyState, resolvedScreen, elapsedMs, frameState, readinessState and lastObservedProbeState. T74/HC01 propagate this as structured evidence through the canonical runner and H03-007 instead of losing it to the short UI error-text limit. No query strings, tokens, account values or user data are captured.

Regression matrix:

| Scenario | Evidence |
|---|---|
| A: unauthenticated top-level | Real App route, anonymous SDK transport: READY |
| B: unauthenticated iframe | Real hidden route, normal and nested cross-site Preview: READY |
| C: parent observes before child commit | AP03 plus normal iframe observer: READY |
| D: child commits before parent observes | AP04 and nested late-parent scenario: READY |
| E: authenticated session outside probe | Parent stays AUTHENTICATED_PROFILE_REQUIRED; isolated child READY |
| F: expected root absent | HC03 / AP07: bounded TIMEOUT, never PASS |
| G: redirect loop | HC05: ERROR |
| H: unmount / frame disposal before ready | AP05 / AP06: ERROR, fixtures/frames cleaned |
| I: 360px | Nested hidden Preview READY in 53ms |
| J: 1024px | Nested hidden Preview READY in 52ms |

Final repository validation: **239 canonical PASS / 0 FAIL** (all prior 231 retained, AP01…AP08 added), **8/8 actual routing/Preview scenarios**, zero browser exceptions. The harness preserves normal Chromium background/frame scheduling and nests the app cross-site before creating the actual hidden probe route. Late-parent observation sees READY immediately. H05-009 regressions remain PASS; H06 6/6, H07 12/12, H10-003 1/1, H11 onboarding 2/2, H12 20/20 and H13 11/11 current local checks PASS. npm ci, npm ls --depth=0, security:deps, typecheck, lint, build and Repo Health PASS; 0 Critical / 0 High, the same two Moderate router findings.

BuildMarker stays 008; catalog stays HC-007.0 / 16 suites / 126 cases / 104 current / 15 future / 7 external. This repairs the existing READY contract implementation, not case semantics; no ledger row, H05 change or product scope is added. The fix has not been deployed by this task. Internal blockers: 0; CLOSED_PENDING_BASE44_VERIFICATION. BASE44_FULL_HEALTH_REQUIRED=YES and FIRST_SHINKA_ENGINE_REQUIRED=YES remain. No content/daily/Moon/cycle engine, daily message generation, scheduler, Calendar or Pattern.

Branch preflight: local/origin Test clean at b4a2128f99da5b17e8ddde031ff49153364b7131; main 056dc07a1471123bd70027c7756adeee06c31c91 was one merge commit ahead without divergence. Test was fast-forwarded remotely and locally before edits. Work and push target Test only; main is not modified.



## GeoNames redirect-policy compatibility continuation — same package 008

This section records the prior redirect-policy handoff and supersedes the earlier v1 probe instructions. The later ON-04 selection handoff below is current. Buildmarker-008 / HC-007.0 remain unchanged under the existing same-package continuation rule: H10-003 retains its structured-provider boundary intent and H10-004 remains external. No new product SOURCE GAP or schema change. Relevant SRC-01/02/04/05 greenfield passages were reread; SRC-05 remains the data-model authority. Optional structured birthplace, read-only search, owner validation and server selected-ID resolution remain intact.

Git preflight: clean local/origin Test `674f3cd596f6e9592856ace0195448ba1e98c04d`; origin/main `27ade074ec02e98a5655ca38df35adb5dfa910cd` was one merge commit ahead without divergence. Local and origin/Test were safely fast-forwarded to main before implementation. Only Test receives the completed correction; main is not a write target.

### Evidence and causal limits

- **LIVE_RUNTIME — user supplied, preview / internalHealth only:** geoNamesTransportProbe, geonames-runtime-isolation-v1, 8 requests, 899 ms total, PLAN_COMPLETE, all cleanup_confirmed true. A1/B1/A2/C1/A3/D1/E1 had no HTTP response, FETCH/UNKNOWN and 0 ms. F1 compared to D1 with REDIRECT_POLICY, HTTP 401, redirect_observed false and 899 ms. F1 used no credential and occurred once. No raw provider/body/exception/Location or secret is included in this record.
- **STATIC — source comparison at the reference commit:** D1 and F1 both clone the same anonymous target into a URL object and call the same captured detached fetch. Both use fresh AbortSignals under identical deadline/cleanup rules. RequestInit contains only signal and redirect; D1 uses error, F1 uses manual. Their execution order/time and signal instances differ by design, not by request configuration. F1 does not change host/path, request parameters, binding or credential omission relative to D1.
- Finding: **redirect-policy compatibility hypothesis supported**. A single F1 is insufficient for a definitive root cause; 0 ms is not proof of synchronous exception. The 401 establishes transport reachability only, not the configured credential's validity or successful provider search. It does not establish onboarding/prod success.
- [Cloudflare Workers Request documentation](https://developers.cloudflare.com/workers/runtime-apis/request/#properties) describes an unsupported error redirect mode and manual status inspection. This is a compatibility example, not proof that this Base44 invocation uses Cloudflare. [Base44 runtime documentation](https://docs.base44.com/developers/backend/resources/backend-functions/overview) describes Deno and per-function shared-code copies; neither the concrete hosted engine/version nor function-deployment parity is proven by the supplied probe. Generic TypeError remains UNKNOWN.

### Repository correction and narrowed probe

The common GeoNames adapter now uses redirect:manual for searchJSON and getJSON. All 300–399 and opaqueredirect responses are rejected before any success/body parsing, using existing GEONAMES_UNAVAILABLE / GEONAMES_HTTP_ERROR / RESPONSE_VALIDATION / REDIRECT_REJECTION fields (public HTTP 502; opaque http_status null). No Location read/follow, default/follow fallback, HTTP fallback, TLS change, retry, dependency update, URL-form or fetch-binding change. Ordinary missing-secret/HTTP/provider/invalid-response distinctions remain. Unread unlocked bodies are cancelled; late responses after timeout are discarded unread. Cancellation rejection cannot leak or replace the primary error, while stalled cleanup uses the existing 8-second timeout/abort. Physical cancellation of an abort-ignoring transport remains unproven.

The existing admin action now returns probe_version **geonames-redirect-policy-v2** and exactly this plan unless safety limits interrupt it:

| Sample | Redirect policy | Compared to | Variable |
|---|---|---|---|
| ERROR_1 | error | none | BASELINE |
| MANUAL_1 | manual | ERROR_1 | REDIRECT_POLICY |
| ERROR_2 | error | ERROR_1 | REPEAT |
| MANUAL_2 | manual | ERROR_2 | REDIRECT_POLICY |

Every sample uses the identical fixed GeoNames request and backend secret, URL-object form, captured detached fetch and signal policy. No query/credential/target is accepted from the caller. The plan completes both pairs even if a sample reaches HTTP. Existing admin guard, exact action validation, zero entity access, 3-second sample timeout, 30-second total budget, 250 ms cleanup grace, 8-request ceiling and 60-second warm-worker cooldown remain. The plan requires only 4 requests. Abort/unconfirmed cleanup still stops further samples and blocks that worker until settlement. There is no distributed-lock guarantee. No body is parsed, so even HTTP 200 is only transport evidence. Normal onboarding and Full Health never invoke the probe.

### Prior redirect-policy manual handoff — retained for diagnostic context

1. Merge Test to main and complete Base44 sync/publish in the intended environment. Verify both **onboarding** (manual rejection adapter) and **internalHealth** (v2 probe) include their updated shared modules. A frontend marker or one function's version alone cannot prove the other function's deployment; Base44 gives each function its own shared-code copy. Record the Builder revision/deployment evidence separately for each function. No CLI deployment is requested here.
2. As an authenticated internal admin, invoke existing **internalHealth** with exactly:

```json
{"action":"geoNamesTransportProbe"}
```

Expect geonames-redirect-policy-v2, ERROR_1/MANUAL_1/ERROR_2/MANUAL_2, request_count 4, PLAN_COMPLETE and confirmed cleanup if all samples settle. Record the intended environment explicitly outside the payload. If another session is needed, wait at least 60 seconds after completion; never bypass GEONAMES_PROBE_BUSY or auth guards. Share only the safe technical projection; no token, secret, headers, query, raw error or provider body. Compare both pairs: repeated manual reachability with error failures strengthens the compatibility hypothesis; mixed results remain inconclusive. HTTP 401/403 still requires provider/account investigation. A timeout-only difference must account for the diagnostic 3-second deadline versus normal 8 seconds.
3. In the normal application and intended test account, verify searchPlaces → real provider-result selection → explicit save. Confirm the server-selected ID and coherent structured fields are persisted through backend resolve/validation; do not report the personal query, place data or credential. Repeat the read-only search before saving to distinguish search from persistence. Keep preview and prod evidence separate.
4. Run deployed Full Health and retain STATIC / SYNTHETIC_RUNTIME / LIVE_RUNTIME scope. H10-004 stays open until actual normal provider search/selection/save and required deployed evidence are recorded. After a proven correction and normal flow pass, remove the temporary action, entry callback and probe runner, retaining relevant correction regressions.

No v2 probe or corrected onboarding was deployed/invoked live by this continuation: user-controlled merge/sync/publish is still required. Repository implementation: REPO_FIX_READY_PENDING_USER_DEPLOYMENT. Live GeoNames: OPEN_PENDING_MANUAL_VERIFICATION. H10 live closure remains OPEN.

Final measured repository checks: **268/268 canonical PASS / 0 FAIL**, **8/8 routing/Preview scenarios**, **49/49 static/general Health and 21/21 onboarding Health PASS**, zero browser exceptions. H10-003 ran all 36 selected regressions. Actual onboarding entry substitution PASS (3 request-scoped reads, zero module-load reads); internalHealth entry substitution PASS (3 rejected/invalid requests, 2 authorized requests, zero pre-authorization secret reads, one worker factory). npm ci, npm ls --depth=0, npm ls --all, security:deps, typecheck, test:foundation (including the package regressions), lint, build and Repo Health all exited 0. Repo Health: 14/14 checks, 20 product schemas, 12/12 aligned canonical documents. Fresh audit: **0 Critical / 0 High / 2 existing Moderate / 0 Low**; native npm audit exits 1 for Moderate, required High-threshold guard exits 0. Router advisory disposition is unchanged; no dependency/lockfile edits. Non-fatal npm config, mixed import and large-chunk warnings remain. This checkout lacks local Base44 build environment values; the successful build emits missing app-id/proxy warnings and is not a deployable live-connectivity assertion. Evidence is STATIC / SYNTHETIC_RUNTIME and LOCAL_PLATFORM_IMPORT_SUBSTITUTION, not a live v2 run or normal-provider success. Repository: REPO_FIX_READY_PENDING_USER_DEPLOYMENT. Live GeoNames/H10: OPEN_PENDING_MANUAL_VERIFICATION.

Changed files: base44/shared/geonamesAdapter.js; base44/shared/geonamesRuntimeProbe.js; src/foundation/tests/geonamesDiagnosticTests.js; src/foundation/tests/geonamesRuntimeProbeTests.js; src/foundation/health/cases/onboarding.js; src/foundation/buildLedger.js; and the five canonical documents SHINKA_TECHNICAL_ARCHITECTURE.md, SHINKA_SECURITY_PRIVACY.md, SHINKA_DEVELOPMENT_NOTES.md, SHINKA_RELEASE_HEALTH_CHECK.md, SHINKA_BUILD_HISTORY.md. No entrypoint, product schema, UI copy, dependency or marker file changed.
