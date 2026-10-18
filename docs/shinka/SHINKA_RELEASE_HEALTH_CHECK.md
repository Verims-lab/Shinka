# SHINKA — Release Health Check

**Document:** SHINKA_RELEASE_HEALTH_CHECK.md
**Status:** ACTIVE
**Current BuildMarker:** Buildmarker-005
**Last Updated:** 2026-10-19
**Authoritative Source References:** This governance set; SRC-04 §15
**Purpose:** Define the executable regression framework and gate.
**Scope:** Health catalog HC-004.0.

## Catalog (HC-004.0) — 16 suites, 82 cases
Active: H01 Environment & Build (6), H02 Source & Documentation Integrity (8), H03 Architecture & Code Quality (9), H04 Data Model Contract (6), H05 Content Artifact Integrity (9), H13 UI/UX/Accessibility (11), H16 Release Gate (6 + 3 external).
Future (FUTURE_PACKAGE → NOT_APPLICABLE): H06 (2), H07 (3), H08 (3), H09 (3), H10 (3), H11 (3), H12 (3), H14 (2), H15 (2).
Expected counts: 55 applicable, 24 future, 3 external.

## Logical vs physical source model
H02-003 counts LOGICAL sources (must be 10). H02-004 requires every logical source and every physical part READ. H02-007 verifies the split UI/UX source: 4 parts, expected names, order 1→2→3→4, no gap/duplicate, continuity recorded, sole UI/UX authority, machine-readable companion present as supporting artifact (not a logical source), and documentation in SHINKA_SOURCE_OF_TRUTH.md. Artifacts are validated by role, never by a fixed physical total. H02-008 verifies all 11 UI/UX tables (design = tokens, icons = nav contract, 5 copy groups, QA checklist) and OD-010 closed. H03-008 verifies repository auth syntax plus the recorded Apple/Google policy; H03-009 exercises the actual server-admin request guard with injected anonymous/user/admin principals. Neither is LIVE_ENFORCEMENT.

## UI/UX contract cases (H13)
001 token module · 002 44×44 rendered · 003 font families rendered · 004 no overflow at 360 (Health + Build pages) · 005 accessible names · 006 rendered CSS colors = v1.1 · 007 Medium headings / Inter-500 labels · 008 nav + Lucide icons · 009 primary ≥52 rendered · 010 light-only · 011 centralized EN/TR localization.

## Case schema
`{ id, suiteId, title, description, severity, blocker, runnerType, applicability, status, attempted, executed, durationMs, evidence }`; evidence `{ classification, source, actual, expected, reason, timestamp }`.

## Evidence classifications
STATIC · SYNTHETIC_RUNTIME · LIVE_RUNTIME · LIVE_ENFORCEMENT · DEVICE · RECORDED_DECISION · BLOCKED_EXTERNAL. Classification ≠ status. Synthetic evidence is never described as live; static is never described as runtime.

## Statuses
PASS (evidence satisfies expected) · FAIL · WARNING · BLOCKED (current check cannot complete) · NOT_RUN · NOT_APPLICABLE (future/external). PASS without complete valid evidence or with explicit unexecuted/unattempted state is converted to FAIL; gate independently requires both execution flags to be true.

## Gate
READY only if all applicable blocker cases have 0 FAIL, 0 WARNING, 0 BLOCKED, all applicable cases attempted and executed, every PASS has valid classification/source/actual/expected/reason/timestamp evidence, and catalog integrity (H16-001…004) passes. Otherwise NOT_READY (fail/warning/integrity), BLOCKED, or INCOMPLETE. Single-suite runs yield SCOPE_PASS at best. Future/external cases never affect the gate.

## Runner
Sequential; META (H16) cases run last over collected results; every case bounded (20 s default, 90 s tests); timeout ⇒ BLOCKED, never PASS.

## Report JSON (`shinka.health.report/1`)
schemaVersion, runId, appName, buildMarker, healthCatalogVersion, sourceSetVersion, environment, scope, startedAt, completedAt, durationMs, suites, cases, summary, gate, externalRequirements, futureRequirements, openDecisions. Redacted before copy/export/storage.

## History
Completed measurements remain displayed even when persistence fails (`HEALTH_HISTORY_PERSIST_FAILED`). Admin-guarded `internalHealth.save` verifies counts/gate and uploads a private redacted full report; `report_json` is valid compact JSON bounded to 15,000 UTF-8 bytes without truncation. `list` and stored-record `report` provide admin readback; signed links expire after 300 seconds. BuildMarker comes from the canonical module. Live persistence/readback for this package has not been measured.

## External / device proof policy
H16-901/902/903 (device push, device sign-in, restore) remain EXTERNAL_RELEASE until real evidence exists; never PASS by assumption.

## Gate history
- Buildmarker-001: BLOCKED by H02-004 and H13-006 (UI/UX v1.1 not received).
- Buildmarker-003: measured Full Health 51 PASS / 2 FAIL (H03-001, H03-007) / 1 BLOCKED (H13-004) / 27 N/A → NOT_READY; history save failed (report_json exceeded field size limit).
- Buildmarker-004: fixes — legacy scanner statement-level imports; probe waits for `[data-probe-root]` (Build & Environment had no Health root marker); history stores full report as private file. Latest user-supplied baseline: 81 total, 54 planned/attempted/executed, 53 PASS, 1 FAIL (H03-004), 27 N/A; NOT_READY. This is prior-marker evidence.
- Buildmarker-002: expected READY for applicable Foundation cases once an admin Full Health run records it; future suites NOT_APPLICABLE.

## Current package evidence boundary
Buildmarker-005 / HC-004.0: 74 canonical tests (T01–T74) run from Health Center or `npm run test:foundation`. CLI uses a real local Chromium for DOM probes and synthetic backend principals; it does not contact live Base44. H03-004 fixture now uses a reserved example domain; T53 still detects an injected personal-email shape in app/config/test paths. H03-001/T21/T52 preserve real static/dynamic import detection without excluding tests.

H16-003 now verifies execution as well as evidence. T56–T60 cover unexecuted/unattempted PASS, complete PASS, future/external isolation and invalid evidence. H05 category propagation is tested with actual case runners.

Final deployed Full Health on this marker, live private history save/list/open, current Authentication panel and real non-admin/direct invocation enforcement remain required. Repository status is OPEN because unresolved High dependency advisories remain; a local test or Health PASS cannot override that security blocker.
