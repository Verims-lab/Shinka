# SHINKA — Development Notes

**Document:** SHINKA_DEVELOPMENT_NOTES.md
**Status:** ACTIVE — working notes (does not override sources)
**Current BuildMarker:** Buildmarker-005
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
- High dependency advisories remain a repository closure blocker; see SECURITY_PRIVACY.
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

## Local verification record (2026-10-19)
- Clean `npm ci`: PASS. `npm ls --all`: PASS (no invalid/missing dependency).
- `npm run typecheck`: PASS, 0 errors (baseline 80 errors / 22 files). `npm run lint`: PASS.
- `npm run test:foundation`: 74/74 PASS, 0 FAIL, no browser exceptions. H03-001/H03-004/H03-008 STATIC and H03-009 SYNTHETIC_RUNTIME PASS locally; not deployed Full Health.
- `npm run build`: PASS. This local checkout has no VITE_BASE44_APP_ID / VITE_BASE44_APP_BASE_URL, so compilation does not demonstrate working live API connections. Existing large-chunk/mixed import warnings remain non-blocking.
- Bundle inspection: no complete canonical Markdown bodies/headings, sampled raw source module bodies or CLI-only SDK replacement in production assets. Static manifest contains 12 doc records and hashes/findings; no raw glob registry.
- `npm audit --json`: exit 1, 0 Critical / 5 High / 4 Moderate / 0 Low. Foundation remains OPEN; exact advisory paths/dispositions are in SECURITY_PRIVACY.
