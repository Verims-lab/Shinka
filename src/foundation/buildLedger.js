// BUILD LEDGER — append-only history/evidence. NOT a BuildMarker authority.
// Storage type: SOURCE (versioned with code). Never rewrite old entries; append one entry per package.
export const BUILD_LEDGER = Object.freeze([
  Object.freeze({
    build_marker: "Buildmarker-001",
    package_name: "Greenfield Foundation / Governance",
    package_type: "FOUNDATION",
    short_summary:
      "Source-of-truth framework, canonical BuildMarker, incremental build governance, Health Center, regression architecture, canonical docs, code/UI standards, internal Build & Environment surface.",
    created_at: "2026-10-18",
    health_catalog_version: "HC-001.0",
    full_health_status: "RECORDED_IN_HEALTH_RUN_HISTORY",
    docs_aligned: true,
    source_changed: true,
    tests_changed: true,
    health_changed: true,
    notes:
      "No end-user product package implemented. Expected gate BLOCKED until UI/UX v1.1 source is supplied (OD-001).",
  }),
  Object.freeze({
    build_marker: "Buildmarker-002",
    package_name: "UI/UX v1.1 Split-Source Reconciliation",
    package_type: "FOUNDATION_AMENDMENT",
    short_summary:
      "UI/UX v1.1 exceeded the attachment size limit and was supplied in four transport parts; reconstructed as one logical source. Source inventory (10 logical / 13 physical), design tokens, primitives, navigation/icon contract, localization and UI state standards reconciled; Health split-source model added.",
    created_at: "2026-10-18",
    health_catalog_version: "HC-002.0",
    full_health_status: "RECORDED_IN_HEALTH_RUN_HISTORY",
    docs_aligned: true,
    source_changed: true,
    tests_changed: true,
    health_changed: true,
    notes: "No end-user product package started. No product data imported. OD-001 resolved by source receipt; OD-010 (copy tables not text-extractable) opened.",
  }),
  Object.freeze({
    build_marker: "Buildmarker-003",
    package_name: "Foundation Final Closure",
    package_type: "FOUNDATION_AMENDMENT",
    short_summary:
      "UI/UX v1.1 machine-readable table companion registered as a supporting artifact of SRC-03 (logical sources stay 10); 11 tables mirrored; OD-010 resolved; auth policy recorded and checked; open decisions reclassified; Health HC-003.0 (H02-008, H03-008); tests T46–T48.",
    created_at: "2026-10-18",
    health_catalog_version: "HC-003.0",
    full_health_status: "RECORDED_IN_HEALTH_RUN_HISTORY",
    docs_aligned: true,
    source_changed: true,
    tests_changed: true,
    health_changed: true,
    notes: "No product feature started. OD-003 later resolved by configuration (Google + Apple only).",
  }),
  Object.freeze({
    build_marker: "Buildmarker-004",
    package_name: "Foundation Health Closure",
    package_type: "FOUNDATION_AMENDMENT",
    short_summary:
      "Legacy scanner reads statement-level imports only (fixture text in string literals no longer a false positive); internal-page probe waits for [data-probe-root] with explicit TIMEOUT/ERROR reasons; Health history stores full redacted report as a private file + compact case index (field size limit); tests T49–T51.",
    created_at: "2026-10-18",
    health_catalog_version: "HC-003.0",
    full_health_status: "RECORDED_IN_HEALTH_RUN_HISTORY",
    docs_aligned: true,
    source_changed: true,
    tests_changed: true,
    health_changed: false,
    notes: "No product feature started. Health case definitions unchanged; probe and persistence instrumentation fixed.",
  }),
  Object.freeze({
    build_marker: "Buildmarker-005",
    package_name: "Foundation Repository Corrective & Hardening",
    package_type: "FOUNDATION_AMENDMENT",
    short_summary: "Provider-only auth and safe errors; syntax-aware legacy firewall; build-time static metadata; execution/evidence gate; category completeness; server-admin internal operations; private verified history; canonical browser/CLI regressions; dependency and type corrections.",
    created_at: "2026-10-19",
    health_catalog_version: "HC-004.0",
    full_health_status: "BASE44_FINAL_FULL_HEALTH_REQUIRED",
    docs_aligned: true,
    source_changed: true,
    tests_changed: true,
    health_changed: true,
    notes: "Repository Foundation remains OPEN: unresolved High dependency advisories, no waiver. Final Base44 Full Health, history readback and Authentication panel verification pending. No product features/data or legacy import.",
  }),
]);

export const currentLedgerEntry = () => BUILD_LEDGER[BUILD_LEDGER.length - 1];
