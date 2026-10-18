# SHINKA — Development Notes

**Document:** SHINKA_DEVELOPMENT_NOTES.md
**Status:** ACTIVE — working notes (does not override sources)
**Current BuildMarker:** Buildmarker-006
**Last Updated:** 2026-10-19
**Authoritative Source References:** SHINKA_SOURCE_OF_TRUTH.md
**Purpose:** Current state, findings, constraints, debt.
**Scope:** Implementation notes only.

## Current state
Foundation only. Routes: `/` (neutral shell aligned to the v1.1 navigation contract, no business data), `/internal/build`, `/internal/health` (admin-only). `/login` exposes only Apple/Google; password routes have been removed (OD-003 repository policy implemented).

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
Next likely package: Auth & Identity (H06).

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
