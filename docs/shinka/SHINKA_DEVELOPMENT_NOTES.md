# SHINKA — Development Notes

**Document:** SHINKA_DEVELOPMENT_NOTES.md
**Status:** ACTIVE — working notes (does not override sources)
**Current BuildMarker:** Buildmarker-001
**Last Updated:** 2026-10-18
**Authoritative Source References:** SHINKA_SOURCE_OF_TRUTH.md
**Purpose:** Current state, findings, constraints, debt.
**Scope:** Implementation notes only.

## Current state
Foundation only. Routes: `/` (neutral shell, no business data), `/internal/build`, `/internal/health` (admin-only). Platform auth routes (`/login`, `/register`, `/forgot-password`, `/reset-password`) exist as platform requirement (see OD-003).

## Base44 findings (measured 2026-10-18)
- Backend function execution works; Deno `DecompressionStream` used to parse XLSX without dependencies.
- Unknown entity → HTTP 404 "Entity schema … not found" (used by the entity probe).
- Uploaded workbooks use namespaced XML (`<x:row>`); reader supports prefixes.

## Known constraints
- Foundation tests run in-app (no CLI test runner installed); results appear in Health Center and H03-007.
- Health Full run must be triggered by an admin in the browser; the builder agent cannot execute the browser runner itself.

## Technical debt
- Add a CLI test runner (e.g. vitest) for CI-style execution.
- Tokens provisional until UI/UX v1.1.
- Email/password login still enabled (OD-003).

## Future package notes
Next likely package: UI/UX v1.1 reconciliation (closes OD-001), then Auth & Identity.