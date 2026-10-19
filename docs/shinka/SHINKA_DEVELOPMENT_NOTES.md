# SHINKA — Development Notes

**Document:** SHINKA_DEVELOPMENT_NOTES.md
**Status:** ACTIVE — working notes (does not override sources)
**Current BuildMarker:** Buildmarker-008
**Last Updated:** 2026-10-19
**Authoritative Source References:** SHINKA_SOURCE_OF_TRUTH.md
**Purpose:** Current state, findings, constraints, debt.
**Scope:** Implementation notes only.

## Current state
Routes `/` and `/onboarding` resolve the canonical onboarding/account state; `/login` starts at provider sign-in and resolves authenticated users. `/internal/build` and `/internal/health` remain admin-only. Home business behavior is unchanged. Current authentication/onboarding package is OPEN due to explicit source/adapter gaps.

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

Branch preflight started clean at local/origin Test fde7979b007947ed59e43aec3045dffb23ea9924. origin/main 16182593062fea8eead3b2616a170d89cf1c1ef5 was two commits ahead with no divergence; origin/Test was safely fast-forwarded and local Test synchronized before edits. Main was not modified. Baseline marker 007 / HC-005.0 and all 126 existing tests were verified before implementation.

Implemented ON-01…05 UI and guarded backend contracts, Apple/Google-only pre-auth 18+, date-only adult DOB, optional name/time/GeoNames/cycle, explicit consent, finite ON-06 and canonical routing. The initial delivery lacked a production persistence adapter. The technical continuation below closes that implementation gap with the actual SDK, without claiming native transactions or deployed success. User confirmed no extra approved Sun/TR sources. Consent grant text/version also absent. These source/product gaps keep package OPEN; exact skipped-step cross-session resume remains a model gap. No deployment/live login/provider test was performed.

## Final repository verification — Buildmarker-008 (2026-10-19)

Executed after clean `npm ci`: `npm ls --depth=0`, `security:deps`, `typecheck`, canonical `test:foundation`, `lint`, `build`, and `health:repo` all exited 0. Audit: **0 Critical / 0 High / 2 Moderate / 0 Low**; the two previously documented React Router package findings remain. No dependency version/lockfile change was introduced. Build retains non-fatal shared-test chunk/dynamic-import size warnings; these are not live performance evidence.

Canonical regressions after technical continuation: **192 PASS / 0 FAIL**, zero browser exceptions. Foundation 80 + Data 22 + Security 24 + Auth 9 + Onboarding 31 preserved; production adapter 20 and rendered UI 6. Initial 008 delivery had 171 tests; none removed. One existing provider-boundary test updated for the mandatory declaration argument; none removed. Actual screen captures and DOM probes covered 360px and 430px; input font/focus issues found during implementation were corrected. External fonts and physical keyboards/providers are not certified by the isolated harness.

Registry: **HC-006.0 / 16 suites / 126 cases / 104 current / 15 future / 7 external**. Current H06 **6 PASS / 0 FAIL / 0 BLOCKED** (plus one external case); H07 **9 PASS / 0 FAIL / 3 BLOCKED**. H10-003 GeoNames contract PASS; H10-004 live availability external. H11-004 onboarding consent contract PASS; H11-005 approved consent text/version BLOCKED. Other future cases remain inactive/NOT_APPLICABLE. The four named current source/product blocks are not converted into test failures or successful live verification; **package OPEN**.

Repository health confirms 20 physical product schemas, no extras, unchanged source fields/direct SDK deny rules, complete access matrix, copy/proxy policy, no seed/legacy/credential findings, one existing 008 ledger entry (no new marker/catalog increment) and all 12 aligned document headers. Evidence is REPOSITORY / STATIC / SYNTHETIC_RUNTIME only. BASE44_FULL_HEALTH_REQUIRED, BASE44_LIVE_AUTH_REQUIRED, BASE44_LIVE_GEONAMES_REQUIRED and BASE44_LIVE_ENFORCEMENT_REQUIRED remain pending after merge/deploy. FIRST_SHINKA_ENGINE_REQUIRED is explicitly next-package work.

## Technical continuation of the same Buildmarker-008 package

Preflight: clean local/origin Test 929213577361ed234c4cc33306b26d3ed681c3cc; main 8118f376d149250c94b4d52f229ff04c79aebd0c was one merge commit ahead. Test and local were fast-forwarded to main before edits; main was not written. Buildmarker-008 / HC-006.0 and the single 008 ledger entry are retained.

IMPLEMENTATION BLOCKERS: none for the requested repository adapter. Production Profile/Preferences Persistence: implemented with server identity, keyed upsert/conditional updates and field-by-field readback. Production Cycle/Consent Persistence: code implemented but intentionally source-gated; no production fixture consent. Idempotency uses the installed SDK natural keys and durable reads, not an in-memory lock or fake transaction. Generic 007 atomic contracts and all previous tests remain. H06/H07/H11 evidence is updated; H10 and the catalog inventory are unchanged.

SOURCE/PRODUCT BLOCKERS: SUN_SIGN_CALCULATION_RULE_SOURCE_GAP, TR_ONBOARDING_COPY_SOURCE_GAP, HEALTH_CONSENT_VERSION_SOURCE_GAP and ONBOARDING_DURABLE_COMPLETION_MARKER_SOURCE_GAP remain OPEN. FIRST_SHINKA_ENGINE_REQUIRED remains future-package work. Package Status: OPEN.

EXTERNAL/LIVE BLOCKERS: deployed Full Health and Apple/Google/GeoNames/owner enforcement; cross-instance keyed upsert uniqueness, same-row conditional predicates, native explicit NULL clearing, timezone-qualified consent creation timestamps and immutable native event metadata. No native transaction/rollback guarantee. The new adapter was exercised with an isolated SDK-shaped transport, not deployed writes. Storage failures may leave durable partial state; UI advances only after verified reads, and retry reconciles those records.
