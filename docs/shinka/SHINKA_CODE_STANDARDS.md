# SHINKA — Code Standards

**Document:** SHINKA_CODE_STANDARDS.md
**Status:** ACTIVE — enforceable
**Current BuildMarker:** Buildmarker-005
**Last Updated:** 2026-10-19
**Authoritative Source References:** SRC-04 §14, SRC-05 §2
**Purpose:** Engineering rules every package must satisfy.
**Scope:** All source (client, backend, internal tooling).

- **A. Single authority:** one implementation per engine (date, cycle, content, consent). Shared backend logic lives in `base44/shared/`. No forks.
- **B. Backend authority:** client input is not trusted for ownership/security; owner = authenticated user.
- **C. UI separation:** no business logic in JSX/pages; UI calls services/hooks (H03-006 enforces for internal UI).
- **D. Validation:** server-side mandatory; client validation is UX only.
- **E. Idempotency:** retryable create/update needs deterministic keys (user+local day, message+type).
- **F. Error taxonomy:** machine codes internally (`src/foundation/errors.js`), safe localized copy externally, no raw provider errors.
- **G. Secrets:** none in client code or logs; no hardcoded credentials; no personal-email privilege (H03-003/004).
- **H. Time:** Date, UTC DateTime, local Time and IANA timezone stay distinct types.
- **I. Optional values:** never persist a calculation default as user input (birth_time NULL, 5/28 calculation-only).
- **J. Localization:** TR/EN strings centralized; business enums locale-independent.
- **K. Maintainability:** remove obsolete code, no hidden mutable globals, small focused modules, no copy/paste engines.
- **L. Tests:** contract-changing code requires tests; Health is not a substitute for tests.
- **M. Legacy firewall:** no legacy Shinka import (H03-001). The canonical Acorn/JSX syntax scanner reads static imports/re-exports and literal dynamic `import()` (including constant templates); comments/string/template fixture text is data, not an import. Synthetic legacy fixtures are passed to `findLegacyImports` as isolated in-memory modules; no path or specifier is whitelisted.
- **N. Internal-page probe:** every internal page renders through `PageContainer` (`[data-probe-root]`) on first paint; optional data loads afterward. Probe result: MEASURED | TIMEOUT (`PROBE_ROOT_NOT_RENDERED`, landedPath) | ERROR (`FRAME_INACCESSIBLE`); unmeasured results carry `scrollWidth: null` and never PASS.
- **O. Health history:** `buildHistoryRecord` maps a completed run; full redacted report → private file (`report_file_uri`), `report_json` = compact case index. Persistence failure → `HEALTH_HISTORY_PERSIST_FAILED`; the completed result stays displayed.

- **P. Execution integrity:** current PASS requires attempted=true, executed=true and complete valid evidence. Never derive READY from the status label alone. H16-003 and T56–T60 enforce the same contract.
- **Q. Static evidence:** do not import raw source/docs into frontend assets. Build-time metadata must state its scope and external source provenance honestly.
- **R. Validation commands:** `npm ci`, `npm ls --all`, `npm audit --json`, `npm run typecheck`, `npm run test:foundation`, `npm run lint`, `npm run build`. Type checking remains enabled; Foundation, application entry, services and imported shared modules are checked. Lint includes Foundation, auth/internal code, backend JS/TS and scripts (generic generated UI is excluded).
- **S. Security closure:** Critical/High advisories have no waiver. An unresolved High keeps repository Foundation OPEN even if regression and browser Health pass. Moderate/Low disposition must identify affected paths and actual application exposure.
