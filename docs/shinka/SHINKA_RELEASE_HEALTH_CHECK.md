# SHINKA — Release Health Check

**Document:** SHINKA_RELEASE_HEALTH_CHECK.md
**Status:** ACTIVE
**Current BuildMarker:** Buildmarker-003
**Last Updated:** 2026-10-18
**Authoritative Source References:** This governance set; SRC-04 §15
**Purpose:** Define the executable regression framework and gate.
**Scope:** Health catalog HC-003.0.

## Catalog (HC-003.0) — 16 suites, 81 cases
Active: H01 Environment & Build (6), H02 Source & Documentation Integrity (8), H03 Architecture & Code Quality (8), H04 Data Model Contract (6), H05 Content Artifact Integrity (9), H13 UI/UX/Accessibility (11), H16 Release Gate (6 + 3 external).
Future (FUTURE_PACKAGE → NOT_APPLICABLE): H06 (2), H07 (3), H08 (3), H09 (3), H10 (3), H11 (3), H12 (3), H14 (2), H15 (2).
Expected counts: 54 applicable, 24 future, 3 external.

## Logical vs physical source model
H02-003 counts LOGICAL sources (must be 10). H02-004 requires every logical source and every physical part READ. H02-007 verifies the split UI/UX source: 4 parts, expected names, order 1→2→3→4, no gap/duplicate, continuity recorded, sole UI/UX authority, machine-readable companion present as supporting artifact (not a logical source), and documentation in SHINKA_SOURCE_OF_TRUTH.md. Artifacts are validated by role, never by a fixed physical total. H02-008 verifies all 11 UI/UX tables (design = tokens, icons = nav contract, 5 copy groups, QA checklist) and OD-010 closed. H03-008 verifies the recorded login-method configuration exposes only Apple/Google (configuration policy, not live auth).

## UI/UX contract cases (H13)
001 token module · 002 44×44 rendered · 003 font families rendered · 004 no overflow at 360 (Health + Build pages) · 005 accessible names · 006 rendered CSS colors = v1.1 · 007 Medium headings / Inter-500 labels · 008 nav + Lucide icons · 009 primary ≥52 rendered · 010 light-only · 011 centralized EN/TR localization.

## Case schema
`{ id, suiteId, title, description, severity, blocker, runnerType, applicability, status, attempted, executed, durationMs, evidence }`; evidence `{ classification, source, actual, expected, reason, timestamp }`.

## Evidence classifications
STATIC · SYNTHETIC_RUNTIME · LIVE_RUNTIME · LIVE_ENFORCEMENT · DEVICE · RECORDED_DECISION · BLOCKED_EXTERNAL. Classification ≠ status. Synthetic evidence is never described as live; static is never described as runtime.

## Statuses
PASS (evidence satisfies expected) · FAIL · WARNING · BLOCKED (current check cannot complete) · NOT_RUN · NOT_APPLICABLE (future/external). PASS without evidence is converted to FAIL.

## Gate
READY only if all applicable blocker cases have 0 FAIL, 0 WARNING, 0 BLOCKED, all applicable cases executed, and catalog integrity (H16-001…004) passes. Otherwise NOT_READY (fail/warning/integrity), BLOCKED, or INCOMPLETE. Single-suite runs yield SCOPE_PASS at best. Future/external cases never affect the gate.

## Runner
Sequential; META (H16) cases run last over collected results; every case bounded (20 s default, 90 s tests); timeout ⇒ BLOCKED, never PASS.

## Report JSON (`shinka.health.report/1`)
schemaVersion, runId, appName, buildMarker, healthCatalogVersion, sourceSetVersion, environment, scope, startedAt, completedAt, durationMs, suites, cases, summary, gate, externalRequirements, futureRequirements, openDecisions. Redacted before copy/export/storage.

## History
Each run is saved to `InternalHealthRun` (admin-only). BuildMarker in every report comes from the canonical module.

## External / device proof policy
H16-901/902/903 (device push, device sign-in, restore) remain EXTERNAL_RELEASE until real evidence exists; never PASS by assumption.

## Gate history
- Buildmarker-001: BLOCKED by H02-004 and H13-006 (UI/UX v1.1 not received).
- Buildmarker-003: H03-008 FAILs (NOT_READY) until email/password, Microsoft and Facebook are disabled and the snapshot re-recorded.
- Buildmarker-002: expected READY for applicable Foundation cases once an admin Full Health run records it; future suites NOT_APPLICABLE.