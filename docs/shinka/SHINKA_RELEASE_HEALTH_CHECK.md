# SHINKA — Release Health Check

**Document:** SHINKA_RELEASE_HEALTH_CHECK.md
**Status:** ACTIVE
**Current BuildMarker:** Buildmarker-001
**Last Updated:** 2026-10-18
**Authoritative Source References:** This governance set; SRC-04 §15
**Purpose:** Define the executable regression framework and gate.
**Scope:** Health catalog HC-001.0.

## Catalog (HC-001.0) — 16 suites, 73 cases
Active: H01 Environment & Build (6), H02 Source & Documentation Integrity (6), H03 Architecture & Code Quality (7), H04 Data Model Contract (6), H05 Content Artifact Integrity (9), H13 UI/UX/Accessibility (6), H16 Release Gate (6 + 3 external).
Future (FUTURE_PACKAGE → NOT_APPLICABLE): H06 (2), H07 (3), H08 (3), H09 (3), H10 (3), H11 (3), H12 (3), H14 (2), H15 (2).
Expected counts: 46 applicable, 24 future, 3 external.

## Case schema
`{ id, suiteId, title, description, severity, blocker, runnerType, applicability, status, attempted, executed, durationMs, evidence }`; evidence `{ classification, source, actual, expected, reason, timestamp }`.

## Evidence classifications
STATIC · SYNTHETIC_RUNTIME · LIVE_RUNTIME · LIVE_ENFORCEMENT · DEVICE · RECORDED_DECISION · BLOCKED_EXTERNAL. Classification ≠ status. Synthetic evidence is never described as live; static is never described as runtime.

## Statuses
PASS (evidence satisfies expected) · FAIL · WARNING · BLOCKED (current check cannot complete) · NOT_RUN · NOT_APPLICABLE (future/external). PASS without evidence is converted to FAIL.

## Gate
READY only if all applicable blocker cases have 0 FAIL, 0 WARNING, 0 BLOCKED, all applicable cases executed, and catalog integrity (H16-001…004) passes. Otherwise NOT_READY (fail/warning/integrity), BLOCKED, or INCOMPLETE. Single-suite runs yield SCOPE_PASS at best. Future/external cases never affect the gate.

## Runner
Sequential; META (H16) cases run last over collected results; every case bounded (20 s default, 60 s tests); timeout ⇒ BLOCKED, never PASS.

## Report JSON (`shinka.health.report/1`)
schemaVersion, runId, appName, buildMarker, healthCatalogVersion, sourceSetVersion, environment, scope, startedAt, completedAt, durationMs, suites, cases, summary, gate, externalRequirements, futureRequirements, openDecisions. Redacted before copy/export/storage.

## History
Each run is saved to `InternalHealthRun` (admin-only). BuildMarker in every report comes from the canonical module.

## External / device proof policy
H16-901/902/903 (device push, device sign-in, restore) remain EXTERNAL_RELEASE until real evidence exists; never PASS by assumption.

## Expected Buildmarker-001 gate
BLOCKED by H02-004 and H13-006 (UI/UX v1.1 not received).