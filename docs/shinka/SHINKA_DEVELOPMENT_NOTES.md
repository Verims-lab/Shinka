# SHINKA — Development Notes

**Document:** SHINKA_DEVELOPMENT_NOTES.md
**Status:** ACTIVE — working notes (does not override sources)
**Current BuildMarker:** Buildmarker-008
**Last Updated:** 2026-10-19
**Authoritative Source References:** SHINKA_SOURCE_OF_TRUTH.md
**Purpose:** Current state, findings, constraints, debt.
**Scope:** Implementation notes only.

## Current state
Routes `/` and `/onboarding` resolve the canonical onboarding/account state; `/login` starts at provider sign-in and resolves authenticated users. `/internal/build` and `/internal/health` remain admin-only. Home business behavior is unchanged. Current authentication/onboarding package is CLOSED_PENDING_BASE44_VERIFICATION; all four approved source decisions are integrated.

## Base44 findings (measured 2026-10-18)
- Backend function execution works; Deno `DecompressionStream` used to parse XLSX without dependencies.
- Unknown entity → HTTP 404 "Entity schema … not found" (used by the entity probe).
- Uploaded workbooks use namespaced XML (`<x:row>`); reader supports prefixes.
- Attachment limit 5 MB: large DOCX sources must be split into transport parts (UI/UX v1.1 → 4 parts).
- Attachment text preview drops DOCX tables; reading the DOCX XML directly exposes them (companion: 13 tables incl. 2 metadata tables, 11 source tables). OD-010 resolved.
- App login methods are not readable from the client at runtime (public settings expose only visibility); auth policy evidence is a recorded platform-state snapshot.

## Known constraints
- Canonical Foundation tests run in-app and through `npm run test:foundation`; results appear in Health Center/H03-007 or CLI.
- Current-marker live Full Health requires a deployed Base44 admin browser session. Local Chromium evidence is explicitly synthetic/static.
- Internal tooling copy stays English diagnostic text; customer-facing Foundation strings go through `src/foundation/i18n/strings.js`.

## Technical debt
- Two Moderate runtime router findings remain with scoped technical disposition; see SECURITY_PRIVACY. Critical/High are zero after Buildmarker-006.
- TR equivalents of approved EN copy are produced per customer-screen package.
- OD-003 repository policy is implemented. Historical dashboard snapshot lists Apple/Google only; current panel and live sign-in must be verified separately.
- Base shadcn `.dark` variables remain in `src/index.css` for library components; no dark class is ever applied (light-only).

## Future package notes
Authentication/onboarding is the current package. Daily Content/First Shinka remains a later package.

## Measured platform limits (Buildmarker-004)
- Entity text field: 16KB accepted, 24KB rejected ("exceeds the maximum allowed size"). Large internal reports go to private file storage.

## Corrective package — Buildmarker-005
- Starting typecheck: 80 errors in 22 files. Corrected optional props/ref types, typed test tuples/history state, DOM iterable handling and removed obsolete password pages. Checking was not disabled; App/Foundation/services/components coverage expanded. Node/punycode types and no-emit TS imports support the shared build-time contracts.
- H03-004 root cause was the T50 history-redaction fixture's non-reserved email literal in uiContractTests.js. It now uses example.test; the scanner no longer exempts the Foundation test file, and T53 verifies detection in all relevant path classes.
- Replaced raw glob source/doc loading with build-time findings/hashes; source receipt records remain distinct from verification of external artifact bytes.
- Added server-authenticated admin operations, private artifact readback and summary validation. T68–T72 prove synthetic guard/persistence behavior only.
- Security: removed unused react-quill-new/jspdf; updated supported transitive patches. Declared compatible chokidar 4 optional peer for Nitro so npm's tree is valid while Tailwind retains its own 3.x watcher. No forced audit fix or major framework migration. Remaining High prevents closure.
- Appended one ledger entry, bumped marker once and catalog once. No product engine, product data import or legacy Shinka source added.
- The dependency install reports npm's existing `min-release-age-exclude` configuration warning; release-age controls were not disabled.

Required post-push evidence: BASE44_FINAL_FULL_HEALTH_REQUIRED, BASE44_HISTORY_READBACK_REQUIRED, BASE44_AUTH_CONFIG_VERIFICATION_REQUIRED; live ordinary-user/admin direct backend/RLS enforcement and provider/device proofs remain unverified.

## Corrective local verification record — Buildmarker-005 (2026-10-19)
- Clean `npm ci`: PASS. `npm ls --all`: PASS (no invalid/missing dependency).
- `npm run typecheck`: PASS, 0 errors (baseline 80 errors / 22 files). `npm run lint`: PASS.
- `npm run test:foundation`: 74/74 PASS, 0 FAIL, no browser exceptions. H03-001/H03-004/H03-008 STATIC and H03-009 SYNTHETIC_RUNTIME PASS locally; not deployed Full Health.
- `npm run build`: PASS. This local checkout has no VITE_BASE44_APP_ID / VITE_BASE44_APP_BASE_URL, so compilation does not demonstrate working live API connections. Existing large-chunk/mixed import warnings remain non-blocking.
- Bundle inspection: no complete canonical Markdown bodies/headings, sampled raw source module bodies or CLI-only SDK replacement in production assets. Static manifest contains 12 doc records and hashes/findings; no raw glob registry.
- `npm audit --json`: exit 1, 0 Critical / 5 High / 4 Moderate / 0 Low. Foundation remains OPEN; exact advisory paths/dispositions are in SECURITY_PRIVACY.

## Dependency security closure — Buildmarker-006 (2026-10-19)
- Actual start differed from the expected branch relationship: origin/main contained the merge of Buildmarker-005 and was one commit ahead of Test with identical tracked contents. Test was safely fast-forwarded from 00fded7 to f464c5b before implementation; main was untouched.
- Fresh baseline reproduced 0 Critical / 5 High / 4 Moderate / 0 Low. Tailwind 3.4.19 was already the latest 3.x; braces 3.0.3 had no patched release. Required CSS use, constrained transitive versions and unsupported override alternatives justified a controlled major migration.
- Tailwind 4.3.3 and native Vite integration remove the entire High chain and selector-parser Moderate chain. Removed both obsolete root configs and direct Autoprefixer/PostCSS/Chokidar. No forced audit fix or override. The used animation plugin moved from runtime to development dependencies.
- Added native `security:deps`: failed on the real High baseline, passes after remediation. No custom audit parser. Lockfile generated with npm; release-age controls retained.
- Original 74 canonical tests preserved; six CSS tests added. Before/after local layout comparison caught a 2.5px desktop heading shift and 26.875px capability-card height shift caused by inherited label line heights; both fixed and covered. All six sampled page/viewport layout records then matched.
- Marker incremented once, 005→006. HC-004.0 remains unchanged because Health semantics are unchanged. No product feature/data or legacy import.
- Repository status: REPO_CLOSED_PENDING_BASE44_VERIFICATION. Two Moderate router findings remain; no Critical/High exception. Final Base44 Full Health, history readback, Authentication configuration and device/font proof remain external.

## Security closure local verification — Buildmarker-006 (2026-10-19)
- `npm ci`: PASS from regenerated lock; `npm ls --depth=0` and `npm ls --all`: PASS, no invalid/extraneous dependencies. The only changed existing resolved package version is Tailwind 3.4.19→4.3.3; new native Tailwind dependencies are recorded in the lock.
- Fresh `npm audit --json`: 0 Critical / 0 High / 2 Moderate / 0 Low, exit 1 for the documented Moderate findings. `npm run security:deps`: PASS, exit 0. The same guard returned non-zero against the real pre-migration High baseline.
- `npm run typecheck`: PASS / 0 errors; `npm run test:foundation`: 80 PASS / 0 FAIL / 0 browser exceptions; `npm run lint`: PASS; `npm run build`: PASS.
- CSS snapshots/measurements were local synthetic browser evidence at 360px/1280px. Original 74 tests remained passing before and after migration. Canonical CSS tests also passed on Tailwind 3 before replacing the pipeline; final coverage additionally pins the two measured line-height regressions.
- Existing npm configuration, large-chunk and mixed-import warnings remain. This checkout lacks live Base44 app environment values, so successful compilation does not prove API connectivity or deployment. The production bundle includes safe static metadata (including CSS hashes), not source/document bodies.

## Data Model & Security Foundation — Buildmarker-007 (2026-10-19)
Preflight: starting local/origin Test 28dba276f07ff10cb75207857e779b8d6ecac6bc; main be2a72d82a80cbaa7f4e127378ec32f6408cd447 was one merge commit ahead with identical files. Safely fast-forwarded remote/local Test to main before implementation; main unchanged. Clean starting tree, marker 006, catalog HC-004.0, 80 baseline tests passed; fresh dependency guard passed with 0 Critical/High, 2 Moderate.

Actual Base44 inspection used the Greenfield app (not the legacy app): dashboard Data had only InternalHealthRun. Read-only authenticated SDK calls returned 404 for every approved product entity. Native timestamp metadata on one existing tooling row was readable; UTC suffix/update/immutability not proven. No live entity mutation, seed, deployment or protected-record cleanup was performed.

20 physical schema files and 25 source-backed relationships; one shared owner/admin implementation, deny-direct RLS, guarded reads, protected record checks, audit allowlist, conditional deletion-state contract and fail-closed atomic adapter primitives. Native UNIQUE is documented unsupported; no production adapter or rollback guarantee invented. OD-004/OD-009 partial, OD-002 open. CLI and Health use the same 46 added domain/security tests. All 12 canonical headers updated, with UI/UX content unchanged.

Final status is CLOSED_PENDING_BASE44_VERIFICATION only after required repository checks. External requirements: Test deployment, Base44 Full Health, history readback, Apple/Google configuration/device evidence, owner A/B/admin/anonymous enforcement, native timestamp behavior, durable concurrency/conditional-write/reference/index/transaction/rollback capabilities before dependent workflows. No product features, product data or legacy import.

## Final repository verification — Buildmarker-007
2026-10-19: `npm ci`, `npm ls --all`, `security:deps`, typecheck, lint, build and `health:repo` PASS. Fresh npm audit: 0 Critical / 0 High / 2 Moderate / 0 Low (native JSON audit exit 1 for Moderate, High-threshold guard exit 0). No dependency versions/lockfile changed; Tailwind remains 4.3.3. Existing npm configuration and build chunk/mixed-import warnings remain non-blocking.

Canonical CLI: **126 PASS / 0 FAIL**, no browser exceptions; existing 80 preserved, 22 data-model + 24 security tests added, none removed. Local H04: 14 PASS / 0 FAIL / 0 BLOCKED current cases; H12: 20 PASS / 0 FAIL / 0 BLOCKED current cases. H04-006 and H12-901 are external requirements, excluded from those current counts and not certified. Registry: **HC-005.0 / 16 suites / 109 cases / 83 current / 21 future / 5 external**. Repository health confirms 20/20 schemas, zero extras, complete policy matrix and no unexpected seed/import call.

REPOSITORY VERIFIED and SYNTHETIC_RUNTIME VERIFIED. LIVE_RUNTIME evidence covers only the read-only baseline inventory and tooling timestamp availability. LIVE_ENFORCEMENT remains REQUIRED. Internal package blockers: 0. Package: **CLOSED_PENDING_BASE44_VERIFICATION**. Final deployed Full Health, live enforcement and the capability dependencies above remain external; no product flows or imported/seeded data.

## Authentication & Onboarding — current package

The original 008 delivery had 171 tests and explicit source gaps. The technical continuation implemented the production persistence adapter with 192 tests. This Final Closure continuation applies the user's four approved decisions and helper-copy reply without a new product package, marker or ledger entry.

Final Closure preflight: clean local/origin Test **036ccac6ab741320d0f9682bde984aacda6d2042**; main **f5c0995625fd184fdb2b55ecb5771d0a546c8979** was one merge commit ahead, no divergence. Test was fast-forwarded remotely and locally to main before editing. Main was never written. Work and final push target Test only.

Implemented canonical date-only tropical Sun; removed the obsolete 00:00 resolver fallback; retained missing time as NULL. Integrated all exact approved TR text and health-consent-v1.0 with explicit EN/TR consent. Ready profiles validate the derived sign; restarted partial profiles retain optional structured birthplace. Only actual owner daily records durably complete onboarding; Skip restart may return to ON-05. No extra entity/flag, content engine or fabricated completion record.

Source authority and exact decision receipts are documented in SOURCE_OF_TRUTH/UI_UX_STANDARDS. Tests compare approved copy against an independent request receipt. Existing EN remains except the explicitly approved Welcome/age/consent/helper replacements. Terms of Service is intentionally identical in EN/TR. All four previous source gaps are RESOLVED_BY_PRODUCT_DECISION.

## Prior final repository verification — Buildmarker-008 / HC-006.0 (2026-10-19)

After clean npm ci: npm ls --depth=0, security:deps, typecheck, test:foundation, lint, build and health:repo all PASS. Audit: **0 Critical / 0 High / 2 Moderate / 0 Low**. Existing React Router Moderate dispositions remain in SECURITY_PRIVACY; no dependency/lockfile changes. Non-fatal existing npm-config and shared-test chunk/mixed-import build warnings remain.

Canonical regression: **215 PASS / 0 FAIL**, zero browser exceptions. Previous 192 tests retained and reconciled to approved decisions: Foundation 80 + Data 22 + Security 24 + Auth 9 + Onboarding 31 + Production Adapter 20; rendered UI expands from 6 to 8 and approved-decision tests add 21 (including 12 sign boundary groups covering 48 edge assertions). Every day of a leap year, invalid/leap input, time/place independence, exact copy receipt, consent retry and durable routing are covered. EN/TR layout probes run at 360px and 430px. CLI now fails for any non-PASS current onboarding Health case.

**HC-006.0 / 16 suites / 126 cases / 104 current / 15 future / 7 external** retained. Existing case intent/IDs/applicability remain; approved source decisions fill the previously blocked cases. H06: **6 PASS / 0 FAIL / 0 BLOCKED**, plus one external live case. H07: **12 PASS / 0 FAIL / 0 BLOCKED**. H11 relevant onboarding: **2 PASS / 0 FAIL / 0 BLOCKED**. H10 contract unchanged; live availability remains external. No external case is converted to PASS.

Repository inspection: 20 product schemas, no extras/undocumented fields, unchanged direct SDK deny rules, complete access matrix, no seed/import/legacy/credential findings, a single 008 ledger entry, all 12 canonical headers aligned. Evidence: REPOSITORY / STATIC / SYNTHETIC_RUNTIME only. No live product writes or deployment performed.

All four source gaps are RESOLVED_BY_PRODUCT_DECISION. Internal package blockers: **0**. Package: **CLOSED_PENDING_BASE44_VERIFICATION**. FIRST_SHINKA_ENGINE_REQUIRED remains YES / NEXT_PACKAGE_DEPENDENCY; no content import, generated user_daily_message, Calendar, Pattern, scheduler, push or withdrawal implementation.

BASE44_FULL_HEALTH_REQUIRED, BASE44_LIVE_AUTH_REQUIRED, BASE44_LIVE_GEONAMES_REQUIRED and BASE44_LIVE_ENFORCEMENT_REQUIRED remain YES. Native keyed uniqueness, conditional updates, NULL clearing, timestamp offsets and immutable native event metadata require deployed evidence. NATIVE_CONSENT_TIMESTAMP_REQUIRED still fails closed for ambiguous native timestamps; no fabricated UTC, transaction or rollback guarantee is claimed.

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


## GeoNames live integration diagnosis — same package 008

Preflight: clean local/origin Test at `2f53b9eb5b93dde5fbada8f20bdb72eac65f8641`; main was one merge commit ahead at `7a86e55da4ea2ba5d41ba5d464ff5ef7c9e61e10`. Remote Test and local Test were fast-forwarded to main before edits. Main is not a write target.

Confirmed defect: `createGeoNamesAdapter` used `https://api.geonames.org`. A credential-free HTTPS request failed certificate hostname verification (curl 60 / HTTP 000). The official free HTTPS host is `secure.geonames.org` ([GeoNames maintainer reference](https://forum.geonames.org/gforum/posts/list/35422.page)); a request there, also without credentials, completed TLS and returned HTTP 401 / GeoNames JSON status 10 (username required). This proves the transport correction, not account-authorized search success. No demo account, actual username, TLS bypass or raw provider exception was used or recorded.

The hosted application's existing Birthplace search for the public city name `Istanbul` reproduced the approved Turkish retry state. No profile was saved. Base44's masked Secrets list confirms the exact key `GEONAMES_USERNAME` exists; its value was not opened. The Builder Code tree shows `base44/functions/onboarding/entry.ts`. Builder currently shows Main. These observations do not prove deployment of the new Test revision.

Exact flow:

| Layer | File / function | Contract |
|---|---|---|
| Page | `src/pages/Onboarding.jsx` | Hydrates authenticated state; renders OnboardingScreen with its production default request=onboardingRequest. |
| Birthplace UI | `src/features/onboarding/OnboardingScreen.jsx`: `changeQuery`, `search`, profile submit | Explicit search button; no typeahead/debounce. Minimum two trimmed characters, loading disable + aria-busy; sequence ignores stale responses. Typed text invalidates selection. Approved empty/retry copy stays in canonical catalog. |
| Frontend service | `src/services/onboardingService.js`: `onboardingRequest` | Production defaults to existing Base44 SDK client; invokes `onboarding` with action `searchPlaces`, query and language only. Optional injected transport is test-only. |
| Function entry | `base44/functions/onboarding/entry.ts` | Reads exactly `Deno.env.get('GEONAMES_USERNAME')` into the real provider adapter. No synthetic runtime adapter. |
| Backend dispatcher | `base44/shared/onboardingOperations.js`: `handleOnboardingRequest`, `onboardingOperation` | Authenticated request; search performs no product writes; `saveProfile` accepts selection ID only and re-resolves it server-side. |
| Provider | `base44/shared/geonamesAdapter.js`: `sanitizePlaceQuery`, `createGeoNamesAdapter.search/resolve` | HTTPS `secure.geonames.org/searchJSON` and `/getJSON`; NFKC/trim/space normalization, 2–80 characters, allowlisted characters, URLSearchParams encoding, maxRows 8, lang en/tr, style FULL, featureClass P; username only from backend secret. 8s abort, redirects rejected, bounded response length, safe error codes. |
| Normalization | `base44/shared/onboardingValidation.js`: `normalizeGeoNamesPlace`, `emptyBirthplace` | Returns only birthplace_geonames_id, birthplace_name, birthplace_country_code, birthplace_latitude, birthplace_longitude; validates ID/name/country/coordinates; malformed data rejected. |
| Persistence | `base44/shared/base44OnboardingAdapter.js` via backend `saveProfile` | Selected ID resolves to five structured fields. Typed query never persists. Clear/X removes selection; empty save clears all five fields to NULL with verified readback. Provider failure still permits clearing and continuing without birthplace. |

Deployment: `base44/config.jsonc` has no functionsDir override, so the default `base44/functions/<name>/entry.ts` discovery includes `onboarding`; shared imports stay under `base44/shared`. The existing function must receive the updated shared adapter. Follow README's Git sync + Builder Publish workflow once this Test commit reaches the intended Builder branch. A Test push alone does not publish the currently selected Main branch. No main merge, platform code edit, Base44 AI or deployment was performed here. If a separately managed function deployment is explicitly chosen on the correct linked app, the exact command from the repo root is `npx base44 functions deploy onboarding`; this bypasses the normal Git/Builder workflow and was not run. After publishing, verify real structured results and select/clear behavior in the deployed app; H10-004 remains external until then.

Regression coverage: updated O11 verifies the HTTPS host/path/username/maxRows; O32 inspects the actual entry's exact server secret binding and rejects frontend provider URLs; O33 checks encoding, five-field normalization, server detail lookup, no search writes, safe malformed/provider errors and no credential in responses/stored data. U09–U11 exercise real React UI → onboarding service → HTTP handler → real GeoNames adapter → production persistence adapter, with only SDK transport/provider HTTP simulated: short query, explicit button, loading, unselected text, results/selection, empty/error retry, optional empty save, late-result suppression and clearing all five stored fields. H10-003 consumes these regressions under its existing structured-boundary semantics. BuildMarker 008, HC-007.0 and 126 Health cases stay unchanged.

Measured final GeoNames regression result: **244/244 canonical PASS**, **0 FAIL**, **8/8 routing/Preview scenarios**, zero browser exceptions. H10-003 executed all 12 selected regressions including O32/O33/U09–U11 and passed; 49 static/general Health checks and 21 onboarding Health checks passed locally. Typecheck, lint, production build and Repo Health PASS. Dependency audit: 0 High/Critical, the same two Moderate router advisories; no dependency changes. Build warnings remain the existing large-chunk/mixed dynamic-import warnings. These are repository/synthetic results; updated deployed GeoNames success remains unverified.


## GeoNames live diagnostics after configured-secret rebuild — same package 008

User evidence: GeoNames account exists, Web Services enabled, GEONAMES_USERNAME configured, application rebuilt/published, and public query Istanbul still returns `{error_code:"GEONAMES_UNAVAILABLE",field:null}` from onboarding. This evidence is accepted; no username was requested/read/printed. Initial local/origin Test was clean at `4ca595f6d73b137c10be59cf964de260ada07024`; main `f7eb61df9c2e9953aa8f922fc0672eefd15337e0` was one merge commit ahead without divergence. Remote/local Test were safely fast-forwarded before work. Main remains a non-write target.

Confirmed implementation defects: the adapter caught network/timeout/HTTP/provider/JSON failures under one generic error, and non-2xx responses were rejected before examining provider JSON. The entry also used module-load Deno.env.get instead of the current documented request-scoped Base44 secrets API. The secure HTTPS host from the previous correction was already present and is unchanged. No wrong search/save wiring was found. The old adapter's missing-value path produced GEONAMES_CONFIGURATION_REQUIRED, so the reported generic response alone is not grounds to diagnose missing GEONAMES_USERNAME. Neither provider authorization/quota nor a deployed runtime mismatch is asserted as the proven live root cause without new runtime evidence.

Current implementation uses `secrets` from `base44:runtime` within a default exported request handler, following [Base44's current function/runtime documentation](https://docs.base44.com/developers/backend/resources/backend-functions/overview#read-secrets). No unrelated functions were migrated. Backend trims surrounding username whitespace and explicitly rejects empty configuration. Search/body deadline is bounded even for a stalled transport, abort is signalled, UTF-8 payload cap is 100,000 bytes, and only normalized fields survive. [GeoNames error documentation](https://www.geonames.org/export/webservice-exception.html) defines authorization 10, no result 15 and quota 18/19/20; these are handled independently of raw messages.

Exact call graph:

| Stage | File / function |
|---|---|
| Authenticated screen | src/pages/Onboarding.jsx renders OnboardingScreen with its production default service |
| Input / explicit search | src/features/onboarding/OnboardingScreen.jsx: changeQuery invalidates selection; search invokes searchPlaces; minimum 2 trimmed characters; no debounce/typeahead |
| Frontend request | src/services/onboardingService.js: onboardingRequest → existing src/api/base44Client.js → functions.invoke('onboarding', payload) |
| Actual SDK wire path | Installed @base44/sdk/dist/modules/functions.js uses axios.post('/apps/<app-id>/functions/onboarding'); SDK client base URL is /api, so JSON POST /api/apps/<app-id>/functions/onboarding |
| Secret / handler | base44/functions/onboarding/entry.ts: default onboarding(req), per-request secrets.get('GEONAMES_USERNAME'), real createGeoNamesAdapter, handleOnboardingRequest |
| Read-only action | base44/shared/onboardingOperations.js: require authenticated owner, validate action fields, owner-scoped profile/preferences reads, searchPlaces branch; no save/initialize/commit |
| Provider request | base44/shared/geonamesAdapter.js: sanitizePlaceQuery → searchJSON with URLSearchParams q/username/maxRows=8/lang=en-or-tr/style=FULL/featureClass=P; no authorization header; fixed secure.geonames.org; redirects rejected |
| Status / JSON handling | Same adapter: read bounded body, parse JSON, inspect provider status before generic HTTP classification, safe machine failures; successful empty results remain empty |
| Normalize / render | onboardingValidation.normalizeGeoNamesPlace → {places:[five canonical birthplace fields]} → OnboardingScreen selectable name/country buttons |
| Selection / persistence | Explicit Continue passes selected birthplace_geonames_id; backend saveProfile → geoNames.resolve/getJSON → base44OnboardingAdapter.saveProfile; raw typed query never persists |

Safe response contract (public error_code stays GEONAMES_UNAVAILABLE and field stays null):

| diagnostic.code | App HTTP | Additional evidence |
|---|---|---|
| GEONAMES_SECRET_MISSING | 503 | No outbound request; blank/undefined runtime value, not an assertion about dashboard configuration |
| GEONAMES_REQUEST_TIMEOUT | 504 | 8-second deadline; provider HTTP status only if headers arrived |
| GEONAMES_NETWORK_ERROR | 503 | Transport/body failure; no raw exception |
| GEONAMES_HTTP_ERROR | 502 | Provider HTTP status without a valid provider-status envelope |
| GEONAMES_PROVIDER_REJECTED | 502 | Provider HTTP status + documented numeric status + AUTHORIZATION/QUOTA/SERVICE/REQUEST/NOT_FOUND class |
| GEONAMES_INVALID_RESPONSE | 502 | Invalid JSON/envelope/fields, oversized UTF-8 body or selected-ID mismatch |
| Successful empty lookup | 200 | `{ "places": [] }`, canonical GEONAMES_EMPTY UI; successful search status 15 also maps here |

### Manual verification without Base44 AI

1. Ensure this Test revision is the code being built by the intended Builder branch, then use the existing Git sync → Publish workflow. A Test push alone is not proof of a Main-based deployment. Do not copy the username into frontend settings or DevTools. This task does not merge/push main, deploy functions separately, or invoke Base44 AI.
2. Open the authenticated Personal Details page. In Chrome DevTools → Network → Fetch/XHR, clear existing entries, enter the public city name Istanbul and click the Birthplace search button. Merely typing does not send a lookup. Inspect the request named onboarding.
3. Headers should show POST `/api/apps/<app-id>/functions/onboarding` on the app origin. Payload must be `{"query":"Istanbul","language_code":"tr","action":"searchPlaces"}` (en is also allowed). There is no saveProfile action, action_id, username or provider URL in this request. The provider URL is server-side and should not appear as a browser GeoNames request.
4. Successful lookup: HTTP 200 and `{ "places": [...] }`, with each item containing ONLY `birthplace_geonames_id` (number), `birthplace_name` (string), `birthplace_country_code` (string), `birthplace_latitude` (number), `birthplace_longitude` (number). Results must be selectable. Empty legitimate lookup: HTTP 200 and `{"places":[]}` with approved no-results copy.
5. Failed lookup: inspect only app HTTP status and `diagnostic`, for example `{"error_code":"GEONAMES_UNAVAILABLE","field":null,"diagnostic":{"code":"GEONAMES_PROVIDER_REJECTED","http_status":200,"provider_status":10,"provider_class":"AUTHORIZATION"}}`. This is an illustrative error shape, not an observed provider result. Code 10 requires checking provider authorization; 18/19/20 indicate quota; timeout/network differ from these. A response without diagnostic means the updated handler/adapter revision is not yet evidenced by that request. Do not copy/share authorization headers, cookies, full HAR files, usernames or provider bodies.
6. Before selecting a result, typed text must not save. Select a result and explicitly save only in the intended test account to verify structured persistence. For a failure, use X to clear and continue without birthplace; all five fields must be NULL. Search alone must create/update no profile/preferences/health/cycle data. No live profile mutation was performed by this task.

Existing H10-003 semantics remain the structured provider boundary; it now includes G01–G08. H10-004 stays external and is not promoted to PASS. No live-capable Health probe, product scope, logical source, marker increment or catalog increment was added. GeoNames status is FIXED_PENDING_MANUAL_LIVE_VERIFICATION, with final local checks PASS. The manual provider response is still required to identify and close the remaining live failure.

Measured final verification: npm ci and npm ls --depth=0 PASS; security:deps PASS with **0 Critical / 0 High / 2 existing Moderate** findings. Baseline **244/244 PASS**; final **252/252 PASS / 0 FAIL**, **8/8 routing/Preview scenarios**, actual-entry platform-substitution probe PASS (3 request reads, 0 module-load reads), zero browser exceptions. All 49 static/general Health checks and 21 onboarding Health checks PASS; H10-003 executed its 20 selected regressions. Typecheck, lint, build and Repo Health PASS. Existing build chunk/mixed-import warnings remain; dependencies are unchanged. Manual hosted provider verification is still required; these results do not establish live H10-004 PASS.

## Pre-response fetch failure — diagnostic continuation, same package 008

New user-supplied LIVE_RUNTIME failure evidence: both the application and Base44 Test Function (`onboarding`, displayed file `onboarding.ts`) return app HTTP 503 for `{"action":"searchPlaces","query":"Istanbul","language_code":"tr"}`. The diagnostic is GEONAMES_NETWORK_ERROR with http_status/provider_status/provider_class all null. The current repository entry, operation, server-owned host/query parameters, default fetcher, URL-object invocation, redirect:error, 8-second timeout and exception mapping match the supplied observed source. This is reported live failure evidence, not a new agent-executed live probe.

Proven: the old catch discarded the distinction between invocation and transport failures before a response status was recorded. With the matched source, the call passed the missing/blank-secret guard and did not take the adapter's timeout path. The supplied response does not prove valid provider credentials, provider authorization/quota status, DNS, TLS/certificate, connection, redirect rejection or a runtime/binding incompatibility. An upstream response might have been hidden by fetch's redirect policy; http_status null does not prove no packet or response existed on the network. No functional repository defect causing this live failure has been established.

Git preflight: local/origin Test were clean and equal at `c16d533cb978ffd30f71b175776653e96c25f500`. Fresh origin/main was `e208e4a6d21738905409f40167e42975e271cea0`, one merge commit ahead with no independent Test commits. Remote/local Test were fast-forwarded to main before edits. Only Test is a write target.

Only two fields are added to the existing diagnostic; error_code, field, app HTTP mapping and all four earlier diagnostic fields remain:

| Field | Allowed values and meaning |
|---|---|
| failure_stage | CONFIGURATION: missing runtime secret; FETCH: invoking/awaiting fetch before headers; RESPONSE_BODY: headers captured, reading body; RESPONSE_VALIDATION: JSON/provider/record validation; UNKNOWN: no recognized stage |
| transport_class | DNS, TLS_CERTIFICATE, CONNECTION, REDIRECT_REJECTION, INVOCATION_INPUT, TIMEOUT or UNKNOWN for an exception/deadline; null for configuration, HTTP/provider and invalid-response errors |

Classification reads at most four error/cause nodes, stops cycles, and emits only fixed enums. Recognized evidence is an explicit Node-style code, a specific Deno/DOM error name, an exact Deno/Undici redirect-policy message, or a bounded Deno DNS failure signature. Conflicting classifications, generic TypeError, unknown names/codes, inaccessible properties or unrecognized runtime messages stay UNKNOWN. Some runtimes do not expose enough detail. Raw messages/cause/stack are never retained, logged, persisted or copied to the response/report. Timing and exception-name/code fields were unnecessary and were not added. Runtime-reported TIMEOUT can coexist with GEONAMES_NETWORK_ERROR/503; only the adapter's own deadline emits GEONAMES_REQUEST_TIMEOUT/504.

Runtime contract review: [Deno fetch API](https://docs.deno.com/api/web/fetch/) accepts RequestInfo or URL. [Deno fetch implementation](https://github.com/denoland/deno/blob/main/ext/fetch/26_fetch.js) does not require a receiver for this call and deliberately rejects redirects under redirect:error. Its DNS error shape is supported by the [upstream fetch regression](https://github.com/denoland/deno/blob/main/tests/unit/fetch_test.ts); [Undici](https://github.com/nodejs/undici/blob/main/lib/web/fetch/index.js), [Node error codes](https://nodejs.org/api/errors.html) and [Deno error names](https://docs.deno.com/api/deno/errors/) inform the explicit allowlists. These are runtime contract references, not proof of the deployed Base44 runtime version or of the live cause. URL-to-string conversion, fetch binding changes and redirect-policy changes are therefore not justified and were not applied.

G01–G08 retain configuration/HTTP/provider/invalid/empty/read-only coverage with the additive diagnostic contract. G09 covers known, unknown, nested, cyclic and conflicting pre-response errors; G10 separates synchronous invocation and body-read failures and verifies successful search/selected-ID resolve; G11 verifies cleared deadlines, one abort and no unhandled rejection for immediate failure, abort rejection and late fetch/body rejection; G12 exercises synthetic sensitive message/stack/cause/name/code values, safe response projection, zero console calls and unchanged entities. All run in existing H10-003 (24 selected regressions). The case's intent/applicability remain unchanged, so HC-007.0 and its 126 cases are retained. No endpoint, product field, auth exception, UI copy or save/idempotency behavior changed. No new product SOURCE GAP; external evidence gap is the deployed runtime's classified result and account-authorized success.

Repository implementation status: DIAGNOSTICS_COMPLETE_PENDING_LIVE_VERIFICATION. Live GeoNames closure: OPEN_PENDING_MANUAL_VERIFICATION. Earlier FIXED_PENDING_MANUAL_LIVE_VERIFICATION wording records prior repository corrections; it must not be read as live resolution. This task performs no live deployment, provider call with a real secret, main mutation or Base44 AI action.

### Manual handoff after user Test → main merge and Base44 sync/publish

1. Check `/internal/build`: BuildMarker 008, catalog HC-007.0, intended environment and updated ledger notes (256 tests and fetch-failure classification). Reconcile with existing build metadata (`generatedAt`/source hashes in the build-time static manifest) and Builder sync/publish revision. The same marker, or frontend metadata alone, cannot prove the onboarding function was redeployed.
2. In onboarding Test Function run exactly `{"action":"searchPlaces","query":"Istanbul","language_code":"tr"}`. On failure, share only the new safe diagnostic JSON and app HTTP status. The two new diagnostic fields establish that the diagnostic contract reached this function invocation; absent fields mean the new function code is not evidenced. UNKNOWN remains a valid result, not proof of any particular transport cause.
3. On success, verify the application search → real provider-result selection → explicit save flow with the intended test account. Structured selected-ID resolution remains mandatory; search alone must not write product data.
4. Run Full Health. Preserve STATIC/SYNTHETIC_RUNTIME versus LIVE_RUNTIME separation and keep H10-004 external until actual provider success is evidenced. No publish or live profile mutation was performed here.

Measured final checks for this continuation: **256/256 canonical tests PASS / 0 FAIL**, **8/8 routing/Preview scenarios**, zero browser exceptions; actual-entry substitution PASS (3 requests / 0 module-load secret reads); **49/49 static/general Health and 21/21 onboarding Health PASS**, including all 24 H10-003 regressions. npm ci, npm ls --depth=0, npm ls --all, security:deps, typecheck, lint, build and Repo Health PASS. Fresh npm audit JSON: 0 Critical / 0 High / 2 existing Moderate / 0 Low (native audit exit 1 for Moderate findings, High-threshold security guard PASS). No dependency/lockfile change; existing router advisory disposition and non-fatal build/config warnings remain. Repository inspection preserves 20 product schemas and 12/12 aligned canonical docs. These checks are local static/synthetic evidence and do not close live GeoNames.

## FETCH/UNKNOWN hosted runtime isolation — same package 008

New user evidence includes failure_stage FETCH and transport_class UNKNOWN from onboarding Test Function. This proves the additive diagnostic contract is present in that invocation. It does not reveal the thrown exception properties or prove the exact deployed Git SHA. No normal search/resolve, fetch policy or classifier code changed in this continuation; no functional cause has been established.

Preflight: local/origin Test were clean at `72f684dda4a9ae45d5a07bfb2481786ae00df1c8`. Fresh origin/main `46f794871f8838085bc71ba96d0b69196d2eb45f` was one merge commit ahead with no independent divergence. Both remote/local Test were fast-forwarded; main is not a write target.

### Existing runtime evidence, inspected read-only

- This checkout has no `.env`, `.env.local` or `base44/.app.jsonc` app pointer. The existing authenticated Base44 CLI 0.1.32 was used without installing a project dependency or creating credentials. The correct target app ID `6ad5190f4845d4e3af03b420` was verified in the current Shinka Builder API configuration. The other open Base44 app was not inspected.
- Logs Explorer `api.function.call` was matched exactly to invocation `c7bb9c401f9b4dd180a43fb4ceaece0a`, function onboarding, status 503. Displayed time is 19 October 2026 21:00:04. Expanded metadata contains only function_name, backend_function_invocation_id and status_code. The timestamp has no datetime/title/offset metadata, so its timezone is UNVERIFIED; no UTC conversion is asserted. Builder's selected branch is Main, which does not itself identify preview/prod execution.
- CLI `logs` was called explicitly with `--app-id 6ad5190f4845d4e3af03b420 --function onboarding --since 2026-10-19T17:45:00Z --until 2026-10-19T21:15:00Z --env preview --limit 100 --json`, then separately with `--env prod`. Both succeeded with zero rows. One fallback per environment omitted only the function filter to check legacy unstamped logs, again with zero rows. The explicit UTC search window is a query scope, not a verified conversion of the displayed event time. No invocation/exception could be correlated in console/runtime logs. Empty logs do not establish a healthy function; a caught, unlogged exception may leave no runtime log record. Logs Explorer's API event is not a console exception.
- Classifier inspection confirms bounded traversal of four error/cause objects; explicit code/name maps, two exact redirect messages and one bounded Deno DNS signature. Generic/unrecognized TypeError, unsupported error shapes, inaccessible properties, conflicting signatures or deeper causes can remain UNKNOWN. Without the underlying runtime exception, none can be selected as the actual reason here. Broadening the mapping by guess would not diagnose this event.

### Historical v1 comparison — superseded by the redirect-policy v2 handoff below

Use existing function **internalHealth**, after the user merges Test to main and completes Base44 sync/publish. Run as a signed-in internal admin in the intended environment, once, with exactly:

```json
{"action":"geoNamesTransportProbe"}
```

No additional payload fields are accepted. Test Function and published-app invocations must be recorded separately; the response deliberately does not guess deployment environment. If Test Function provides no authenticated admin context, expect AUTH_REQUIRED/FORBIDDEN_INTERNAL_TOOLING; use the existing authenticated SDK path to internalHealth, never bypass its guard. No new UI button or automatic Full Health request was added. The next call returns all selected samples in one JSON response; there is no need to paste a token or secret.

| Sample | Single changed variable / fixed contract | What it can establish |
|---|---|---|
| A1/A2/A3/A4 | Baseline or repeat: URL object, one captured detached fetch, signal + redirect:error, normal search parameters with fixed public Istanbul query | Whether the current fetch call can obtain a response in this hosted internalHealth invocation |
| B1/B2 | INPUT_FORM only: same URL as a string | A repeatable input-form-associated difference if B obtains responses while interleaved A samples do not |
| C1/C2 | CALL_RECEIVER only: same captured function, invoked with globalThis receiver | A repeatable receiver-associated difference if C obtains responses while interleaved A samples do not |
| D1/D2 | OMIT_CREDENTIAL only: exact baseline URL with username removed | Credential-bearing URL versus credential-free transport difference; never proof that the credential is valid/invalid |
| E1 | DESTINATION only: same credential-free call policy, fixed https://example.com/ URL | Another HTTPS destination was reachable in this session; failure at both destinations does not identify DNS/TLS or prove a platform-wide outage |
| F1 | REDIRECT_POLICY only: D's exact credential-free URL with redirect:manual | A visible 3xx or opaque-redirect response without following it; no Location/body is inspected |

Plan: if A1 reaches HTTP, repeat A only. Otherwise run B1/A2; a positive B also gets B2. If B and A2 fail, run C1/A3; a positive C also gets C2. If all fail, run D1; a positive D gets A4/D2. Only when D fails are E1/F1 needed. Thus the next single invocation distinguishes input/receiver association, credential-bearing URL behavior, target reachability and visible redirects without running every test indiscriminately. Recovered baselines or inconsistent repeats indicate temporal variability; no successful variant alone is declared the root cause. Unselected rows are intentionally absent, not passed.

Output has probe_version `geonames-runtime-isolation-v1`, execution_surface internalHealth, scope TRANSPORT_ONLY_NOT_PROVIDER_SUCCESS, request_count, total elapsed_ms, limits, stop_reason and results. Each result contains only fixed probe_id/comparison_to/changed_variable, http_response_received, numeric http_status or null, redirect_observed, safe failure_stage/transport_class, elapsed_ms and cleanup_confirmed. HTTP 200/401/etc. proves a response, not provider-authorized search: bodies are never read. A status-less opaque redirect is represented by redirect_observed true with http_status null. Timeout/cancellation during unread-body cleanup retains the already observed HTTP status and marks RESPONSE_CLEANUP. All raw exception fields remain internal to the existing classifier and are discarded.

Safety/limits: authenticated admin only; exact action payload; no entity reads/writes, secrets in output, response body/header reads, arbitrary targets, TLS bypass, HTTP fallback, redirect following or automatic retry. At most 8 sequential requests, 3 seconds each, 30 seconds total with 250 ms cancellation grace reserved from remaining budget. Normal onboarding still has its existing 8-second timeout; the shorter uniform diagnostic deadline must be considered when interpreting timeout-only results. All samples cancel unused bodies and abort their signal. Caller cancellation stops the plan. A still-unsettled operation yields CANCELLATION_UNCONFIRMED and blocks further work on that worker until settlement. The explicit worker gate permits one session at a time and imposes a 60-second post-session cooldown (429 GEONAMES_PROBE_BUSY). It is not distributed coordination across independent serverless workers; no unsupported native lock/DB write was introduced. The platform must honor AbortSignal to prove network cancellation; no background waitUntil task is scheduled.

The existing Base44 runtime documentation states each function has its own bundled shared-code copy. These comparisons execute in the same app's chosen hosted environment but in internalHealth, not inside the earlier onboarding invocation. Local browser/Node tests, including CLI exec if used later, are not hosted egress evidence. No probe was deployed or executed live by this task. Removal condition: after a proven correction and real normal application search → selection → save pass, remove the temporary action, entry callback and runtime runner; retain the relevant correction regressions. No 009 package, product source rule, entity or field was added. Remaining external requirements are user merge/publish, one hosted probe response and normal GeoNames closure. Repository status: REPO_PROBE_READY_PENDING_USER_DEPLOYMENT. Live GeoNames: OPEN_PENDING_MANUAL_VERIFICATION.

Final measured checks: **264/264 canonical PASS / 0 FAIL**, **8/8 routing/Preview scenarios**, **49/49 static/general Health and 21/21 onboarding Health PASS**, zero browser exceptions; H10-003 ran all 32 selected regressions. Actual onboarding entry substitution remains PASS; internalHealth entry substitution PASS (3 denied/invalid requests, 2 authorized requests, no secret reads before authorization, one worker-scoped factory). npm ci, npm ls --depth=0, npm ls --all, security:deps, typecheck, lint, build and Repo Health PASS. Fresh audit JSON: 0 Critical / 0 High / 2 existing Moderate / 0 Low; native audit exits 1 for Moderate while the High-threshold security guard passes. Existing advisory dispositions and non-fatal build/config warnings remain; no dependency/lockfile changes. All 12 canonical docs remain aligned, 20 product schemas unchanged. Synthetic results establish the prepared probe contract only; hosted comparison and normal GeoNames closure are still required.


## GeoNames redirect-policy compatibility continuation — same package 008

This section is the current handoff and supersedes the earlier v1 probe instructions. Buildmarker-008 / HC-007.0 remain unchanged under the existing same-package continuation rule: H10-003 retains its structured-provider boundary intent and H10-004 remains external. No new product SOURCE GAP or schema change. Relevant SRC-01/02/04/05 greenfield passages were reread; SRC-05 remains the data-model authority. Optional structured birthplace, read-only search, owner validation and server selected-ID resolution remain intact.

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

### Current manual handoff — after user merge/sync/publish

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
