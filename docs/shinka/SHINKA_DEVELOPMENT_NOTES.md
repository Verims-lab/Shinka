# SHINKA — Development Notes

**Document:** SHINKA_DEVELOPMENT_NOTES.md
**Status:** ACTIVE — working notes (does not override sources)
**Current BuildMarker:** Buildmarker-002
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
- DOCX text extraction drops embedded tables/images (UI/UX §2, §8, §9) → OD-010.

## Known constraints
- Foundation tests run in-app (no CLI test runner); results appear in Health Center and H03-007.
- Full Health must be triggered by an admin in the browser; the builder agent cannot execute the browser runner itself.
- Internal tooling copy stays English diagnostic text; customer-facing Foundation strings go through `src/foundation/i18n/strings.js`.

## Technical debt
- Add a CLI test runner for CI-style execution.
- TR Foundation strings PENDING_COPY_REVIEW until the §8 copy tables are available as text (OD-010).
- Email/password login still enabled (OD-003).
- Base shadcn `.dark` variables remain in `src/index.css` for library components; no dark class is ever applied (light-only).

## Future package notes
Next likely package: Auth & Identity (H06), after OD-003 decision.