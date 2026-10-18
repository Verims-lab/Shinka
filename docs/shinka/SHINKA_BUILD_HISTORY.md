# SHINKA — Build History

**Document:** SHINKA_BUILD_HISTORY.md
**Status:** ACTIVE — append-only
**Current BuildMarker:** Buildmarker-003
**Last Updated:** 2026-10-18
**Authoritative Source References:** src/foundation/buildMarker.js (authority), src/foundation/buildLedger.js (ledger)
**Purpose:** Human-readable build history. Never rewrite old entries.
**Scope:** All packages.

## Buildmarker-001 — Greenfield Foundation / Governance (2026-10-18)
Scope: source-of-truth framework · BuildMarker · incremental build governance · Health Center · regression architecture · canonical documentation · code/UI standards · internal Build & Environment surface.
Health catalog: HC-001.0. Expected gate: BLOCKED (H02-004, H13-006 — UI/UX v1.1 not received).
No end-user product package implemented. No GitHub work. No AI.

## Buildmarker-002 — UI/UX v1.1 Split-Source Reconciliation (2026-10-18)
- The original UI/UX v1.1 DOCX exceeded the Base44 attachment size limit; it was supplied as four transport parts (Part 1–4 of 4).
- Parts read in order; continuity verified; reconstructed as ONE logical source (SRC-03). Logical sources 10, physical attachments 13.
- Source inventory corrected (logical vs physical model); OD-001 resolved by source receipt; OD-010/OD-011 recorded.
- Visual standards reconciled: v1.1 colors, typography, spacing, radii, card/button/input, 200 ms motion, light-only; navigation + Lucide icon contract; centralized UI states and EN/TR localization infrastructure.
- Health catalog HC-002.0: split-source integrity (H02-007) and UI/UX contract cases (H13-006…011); tests T26–T45.
- No end-user product package started. No product data imported. No GitHub work.

## Buildmarker-003 — Foundation Final Closure (2026-10-18)
- UI/UX v1.1 machine-readable table companion added as a supporting physical artifact of SRC-03 (not a new source; logical sources stay 10, physical artifacts 14).
- All 11 tables mirrored verbatim (`src/foundation/uiuxTables.js`); no conflict with the written split source; OD-010 resolved.
- Auth policy recorded (`src/foundation/authPolicy.js`); platform still exposes email/password, Microsoft, Facebook → OD-003 FOUNDATION_BLOCKING (dashboard change required).
- Open decisions reclassified: OD-002/OD-004/OD-009 FUTURE_PACKAGE.
- Health HC-003.0 (81 cases: +H02-008, +H03-008); tests T46–T48 (48 total).
- Tests and Full Health: executed only by an admin from Health Center; results recorded in run history.