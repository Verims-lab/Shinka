# SHINKA — Build History

**Document:** SHINKA_BUILD_HISTORY.md
**Status:** ACTIVE — append-only
**Current BuildMarker:** Buildmarker-006
**Last Updated:** 2026-10-19
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

## Buildmarker-004 — Foundation Health Closure (2026-10-18)
- H03-001/T21: false positive — scanner matched import text inside a test string literal; now statement-level only. No real legacy import existed.
- T41/H13-004: probe waited for `[data-health-root]`, which only Health Center renders; now `[data-probe-root]` on every internal page, explicit TIMEOUT/ERROR reasons.
- History: report_json exceeded the entity field size limit; full redacted report now a private file + compact case index; error code HEALTH_HISTORY_PERSIST_FAILED.
- Tests T49–T51 (51 total). Health catalog HC-003.0 unchanged (81 cases).

## Buildmarker-005 — Foundation Repository Corrective & Hardening (2026-10-19)
- Provider-only repository auth, localized safe errors, fixed 20px page padding and ≥52px auth controls; OD-003 repository policy implemented. Historical auth configuration evidence preserved; final live sign-in not claimed.
- Syntax-aware canonical legacy scanner (static/dynamic imports; strings/comments/templates handled); personal-email fixture uses reserved example domain without exempting test files.
- Safe build-time inspection metadata replaces raw source/document bundling; external source receipt is explicitly distinguished from artifact hash verification.
- Canonical shared execution/evidence gate and missing-category decisions hardened. Admin-guarded backend operations, private full report with bounded summary, safe failure retention and signed readback added.
- Same 74 canonical tests in Health and real-browser CLI; lint scope and type coverage expanded. HC-004.0: 16 suites, 82 cases (55 current, 24 future, 3 external); H03-009 added and H16-003 semantics tightened.
- Repository Foundation OPEN: unresolved High dependency advisories documented in SECURITY_PRIVACY; no waiver. Local checks are not final deployed Base44 Full Health, live history readback or current Authentication configuration proof.
- No product feature/data/legacy import. Git changes target Test only; main is not modified.

## Buildmarker-006 — Foundation Dependency Security Closure (2026-10-19)
- Fresh graph/advisory audit confirmed the Tailwind 3.4.19 → braces High chain, with no patched braces or supported 3.x parent fix. Controlled migration to Tailwind 4.3.3 / `@tailwindcss/vite` removed all five High affected packages and two Moderate affected packages.
- Native CSS theme/source/plugin integration replaces obsolete Tailwind/PostCSS configs; direct Autoprefixer/PostCSS/Chokidar removed, animation plugin retained as dev-only. No override or forced audit fix.
- Preserved canonical Shinka tokens, light-only mode and measured mobile/desktop Foundation layouts; original 74 tests plus six CSS regressions in the same runner. Native `security:deps` blocks Critical/High.
- HC-004.0 unchanged (16 suites / 82 cases); BuildMarker incremented exactly once. Canonical document headers aligned.
- REPO_CLOSED_PENDING_BASE44_VERIFICATION: 0 Critical / 0 High / 2 Moderate / 0 Low; remaining router advisories have documented exposure/fix reasons. Final live Full Health, history readback and Authentication configuration proof still required.
- Test synchronized from main before work; final package targets only Test. No product features, product data or legacy source imported.
