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
]);

export const currentLedgerEntry = () => BUILD_LEDGER[BUILD_LEDGER.length - 1];