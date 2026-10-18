# SHINKA — Development Notes

**Document:** SHINKA_DEVELOPMENT_NOTES.md
**Status:** ACTIVE — working notes (does not override sources)
**Current BuildMarker:** Buildmarker-003
**Last Updated:** 2026-10-18
**Authoritative Source References:** SHINKA_SOURCE_OF_TRUTH.md
**Purpose:** Current state, findings, constraints, debt.
**Scope:** Implementation notes only.

## Current state
Foundation only. Routes: `/` (neutral shell aligned to the v1.1 navigation contract, no business data), `/internal/build`, `/internal/health` (admin-only). Platform auth routes exist as platform requirement (see OD-003).

## Base44 findings (measured 2026-10-18)
- Backend function execution works; Deno `DecompressionStream` used to parse XLSX without dependencies.
- Unknown entity → HTTP 404 "Entity schema … not found" (used by the entity probe).
- Uploaded workbooks use namespaced XML (`<x:row>`); reader supports prefixes.
- Attachment limit 5 MB: large DOCX sources must be split into transport parts (UI/UX v1.1 → 4 parts).
- Attachment text preview drops DOCX tables; reading the DOCX XML directly exposes them (companion: 13 tables incl. 2 metadata tables, 11 source tables). OD-010 resolved.
- App login methods are not readable from the client at runtime (public settings expose only visibility); auth policy evidence is a recorded platform-state snapshot.

## Known constraints
- Foundation tests run in-app (no CLI test runner); results appear in Health Center and H03-007.
- Full Health must be triggered by an admin in the browser; the builder agent cannot execute the browser runner itself.
- Internal tooling copy stays English diagnostic text; customer-facing Foundation strings go through `src/foundation/i18n/strings.js`.

## Technical debt
- Add a CLI test runner for CI-style execution.
- TR equivalents of approved EN copy are produced per customer-screen package.
- Email/password, Microsoft and Facebook login still enabled in the dashboard (OD-003, FOUNDATION_BLOCKING).
- Base shadcn `.dark` variables remain in `src/index.css` for library components; no dark class is ever applied (light-only).

## Future package notes
Next likely package: Auth & Identity (H06), after OD-003 decision.