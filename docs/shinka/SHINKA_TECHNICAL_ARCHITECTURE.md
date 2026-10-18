# SHINKA — Technical Architecture

**Document:** SHINKA_TECHNICAL_ARCHITECTURE.md
**Status:** ACTIVE — foundation architecture
**Current BuildMarker:** Buildmarker-003
**Last Updated:** 2026-10-18
**Authoritative Source References:** SRC-04 Teknik Analiz v1.1, SRC-05 DB v1.2
**Purpose:** Define responsibilities and boundaries on Base44.
**Scope:** Client, backend, data, integrations, internal tooling, Health framework.
**Implemented:** Governance modules, Health framework, internal routes, `validateContentArtifacts` backend function, `InternalHealthRun` internal storage, UI contract (`src/foundation/uiContract.js`), localization infra (`src/foundation/i18n/strings.js`), logical/physical source integrity (`src/foundation/inspection/sourceIntegrity.js`).
**Not Implemented:** All product engines.
**External Verification Required:** Every item marked UNVERIFIED_PLATFORM_CAPABILITY.

## Responsibilities
- **Client (React):** presentation, local UX validation only, device IANA timezone detection. No business engine in JSX.
- **Backend (Base44 functions):** all calculation engines, validation, ownership from authenticated context (never from client-supplied ids), idempotency.
- **Data (Base44 entities):** 20 domain entities (not yet created) + Internal* tooling storage.

## Boundaries
| Boundary | Location (planned) | Notes |
|---|---|---|
| Auth | Base44 auth; provider config per OD-003 | Backend age check. |
| GeoNames | backend proxy function + secret | Debounce, result limit, no free text. |
| Astronomy Engine | backend function + scheduled rolling job | ≥2 years UTC lookup, [start,end). |
| Scheduler / jobs | Base44 workflows (scheduled) | 06:00 local generation, retries. |
| Content engine | single backend module | Pair selection + snapshot. |
| Cycle engine | single backend module | Atomic recompute. |
| Notification | backend + external push provider | Delivery idempotency. |
| Internal tooling | `src/foundation/**`, `src/services/internal/**`, `/internal/*`, `Internal*` entities | Admin-only. |

## Health framework
`src/foundation/health/` — constants (catalog version), suites, cases (h01…h16 + future), runner (bounded timeouts, META cases last), aggregate (summary + gate), integrity (self-tests), report (schema + redaction), context (memoized evidence loaders). See SHINKA_RELEASE_HEALTH_CHECK.md.

## Error / logging
Machine codes in `src/foundation/errors.js` (AUTH_REQUIRED, FORBIDDEN, NOT_FOUND, TIMEOUT, NETWORK, BACKEND_FAILED, UNEXPECTED) with safe copy. Backend returns `error_code` only. Future system_error_log dedupes retries; no health data, message bodies or keys in logs.

## Base44 capability register
Canonical list: `src/foundation/capabilityRegister.js` (20 items). Counts at Buildmarker-001: VERIFIED 1 (backend function execution), PARTIALLY_VERIFIED 4 (field types, auth providers, RLS, admin role), UNVERIFIED 15, UNSUPPORTED 0. Items: field types, UNIQUE, compound UNIQUE, indexes, FK, transaction/rollback, conditional update, concurrency, auth providers, row/owner security, admin role, backend execution, scheduler, secrets, GeoNames proxy, Astronomy library, push, backup, restore, deployment rollback.

## Future package boundaries
H06 Auth → H07 Onboarding → H04 entity creation + H12 enforcement → H09 content import/engine → H08 cycle → H10 Pattern/astronomy/GeoNames → H11 consent/account → H14 notifications → H15 resilience.