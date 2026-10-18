# SHINKA — Technical Architecture

**Document:** SHINKA_TECHNICAL_ARCHITECTURE.md
**Status:** ACTIVE — foundation architecture
**Current BuildMarker:** Buildmarker-005
**Last Updated:** 2026-10-19
**Authoritative Source References:** SRC-04 Teknik Analiz v1.1, SRC-05 DB v1.2
**Purpose:** Define responsibilities and boundaries on Base44.
**Scope:** Client, backend, data, integrations, internal tooling, Health framework.
**Implemented:** Governance modules, Health framework, internal routes, `validateContentArtifacts` and `internalHealth` backend functions, `InternalHealthRun` internal storage, UI contract (`src/foundation/uiContract.js`), localization infra (`src/foundation/i18n/strings.js`), logical/physical source integrity (`src/foundation/inspection/sourceIntegrity.js`).
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

## Repository hardening boundaries
- `scripts/staticEvidence.mjs` reads repository files only during Vite build/dev on the host. The virtual module exports safe findings, counts, paths and SHA-256 hashes. Raw source and canonical document bodies are not imported with `?raw` or shipped as a source/document registry. H01/H02/H03/H04/H13 declare build-time inspection, not live server inspection.
- Canonical gate/evidence/constants, report privacy/history validation and internal authorization live in `base44/shared/`; frontend Foundation modules re-export shared contracts. H05 and tests call the same content validator/decision helpers.
- Both internal backend entries create the SDK client from the incoming request and call `auth.me()` before operations. Anonymous → 401; non-admin (including forged body roles) → 403. Only the authenticated admin operation can access `asServiceRole`.
- `internalHealth` owns list/save/report/probe operations. Direct entity create/update/delete is denied by RLS; read is admin-only. Product entity probes return presence metadata only. Artifact validation remains read-only.
- Health save recomputes summary/gate, redacts the report, uploads a private JSON artifact, then stores a bounded compact index. Report readback selects the URI from the stored record and issues a 300-second signed link. Synthetic tests prove repository behavior; deployed RLS/functions/private-file enforcement requires live two-user verification.
- The CLI builds an isolated temporary harness using actual internal/auth components and canonical tests. Only its test configuration substitutes the SDK; network requests outside loopback are blocked. This is not the Base44 deployment or an authenticated live session.
