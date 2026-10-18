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
]);

export const currentLedgerEntry = () => BUILD_LEDGER[BUILD_LEDGER.length - 1];