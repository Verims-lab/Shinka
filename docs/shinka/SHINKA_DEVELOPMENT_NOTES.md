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
