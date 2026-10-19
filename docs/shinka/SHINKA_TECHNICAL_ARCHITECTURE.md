# SHINKA — Technical Architecture

**Document:** SHINKA_TECHNICAL_ARCHITECTURE.md
**Status:** ACTIVE — foundation architecture
**Current BuildMarker:** Buildmarker-008
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
- **Data (Base44 entities):** 20 physical repository domain schemas (deployed verification pending) + Internal* tooling storage.

## Boundaries
| Boundary | Location (planned) | Notes |
|---|---|---|
| Auth | Base44 auth; provider config per OD-003 | Backend age check. |
| GeoNames | backend searchPlaces action + request-scoped secret | Explicit search button (no typeahead/debounce), result limit, no free-text persistence. |
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
Canonical list: `src/foundation/capabilityRegister.js` (24 items after Buildmarker-007). Historical counts at Buildmarker-001: VERIFIED 1 (backend function execution), PARTIALLY_VERIFIED 4 (field types, auth providers, RLS, admin role), UNVERIFIED 15, UNSUPPORTED 0. Items: field types, UNIQUE, compound UNIQUE, indexes, FK, transaction/rollback, conditional update, concurrency, auth providers, row/owner security, admin role, backend execution, scheduler, secrets, GeoNames proxy, Astronomy library, push, backup, restore, deployment rollback.

## Future package boundaries
H04/H12 foundation and H06/H07 onboarding contracts are present; GeoNames and onboarding consent are scoped current work. Remaining sequence: H09 content import/engine, H08 cycle, H10 Pattern/astronomy, H11 withdrawal/account, H14 notifications, H15 resilience. Live verification remains separate.

## Repository hardening boundaries
- `scripts/staticEvidence.mjs` reads repository files only during Vite build/dev on the host. The virtual module exports safe findings, counts, paths and SHA-256 hashes. Raw source and canonical document bodies are not imported with `?raw` or shipped as a source/document registry. H01/H02/H03/H04/H13 declare build-time inspection, not live server inspection.
- Canonical gate/evidence/constants, report privacy/history validation and internal authorization live in `base44/shared/`; frontend Foundation modules re-export shared contracts. H05 and tests call the same content validator/decision helpers.
- Both internal backend entries create the SDK client from the incoming request and call `auth.me()` before operations. Anonymous → 401; non-admin (including forged body roles) → 403. Only the authenticated admin operation can access `asServiceRole`.
- `internalHealth` owns list/save/report/probe operations. Direct entity create/update/delete is denied by RLS; read is admin-only. Product entity probes return presence metadata only. Artifact validation remains read-only.
- Health save recomputes summary/gate, redacts the report, uploads a private JSON artifact, then stores a bounded compact index. Report readback selects the URI from the stored record and issues a 300-second signed link. Synthetic tests prove repository behavior; deployed RLS/functions/private-file enforcement requires live two-user verification.
- The CLI builds an isolated temporary harness using actual internal/auth components and canonical tests. Only its test configuration substitutes the SDK; network requests outside loopback are blocked. This is not the Base44 deployment or an authenticated live session.

## CSS architecture — Buildmarker-006
Tailwind 3.4.19/PostCSS migrated to Tailwind 4.3.3 and `@tailwindcss/vite` 4.3.3. Application and isolated CLI builds use the same Vite plugin. `src/index.css` imports Tailwind with automatic scanning disabled, explicitly scans `src/` and root `index.html`, and imports native `@theme` mappings from `src/styles/theme.css`. CSS files now participate in static source hashes. `designTokens.js` remains the design authority; runtime RGB variables remain unchanged.

The used `tailwindcss-animate` 1.0.7 plugin is retained via supported `@plugin` and moved to devDependencies; its peer range accepts Tailwind 4. No `@config` bridge or second pipeline remains. Removed root `postcss.config.js`, `tailwind.config.js`, direct PostCSS/Autoprefixer and the obsolete direct Chokidar 4 optional-peer workaround. PostCSS can remain transitively required by Vite.

Ported custom colors/fonts/radii/typography/shadow/keyframes exactly. Used neutral/status palette values and fixed inherited standard line heights are explicit to avoid new defaults changing existing components. Utility changes preserve old shadow/outline behavior and replace CSS-variable shorthand, gradient and shrink aliases. Explicit desktop PageHeader line height preserves 40px. Generic dark variants require an explicit `.dark` ancestor; OS dark preference does not activate them.

The migration follows the [official Vite integration](https://tailwindcss.com/docs/installation/using-vite) and [upgrade guide](https://tailwindcss.com/docs/upgrade-guide). Tailwind 4 targets Safari 16.4+, Chrome 111+ and Firefox 128+; supported device/browser proof, real hosted font loading and Base44 deployment remain external verification. No product/browser support beyond those targets is claimed.

## Data/security foundation — Buildmarker-007
`domainSchemas.js` owns the 20 field contracts and emits the equivalent JSONC structures checked by `scripts/domainEvidence.mjs`. PascalCase filenames match physical names. `domainSourceReceipt.js` is an independent field-name extraction from the primary workbook, not generated from schemas. `domainValidation.js` owns wire/null/time/enum/range checks; `domainSecurity.js` owns the full access matrix and worker grants; `domainAtomic.js` owns canonical unique keys, create-if-absent/CAS protocol, safe readback and reference prechecks. Native unsupported uniqueness is never declared as a fake schema constraint.

`domainAccess` creates the SDK from its incoming request, authenticates through the common guard, then performs only scoped reads or audited admin reads. Private reads are capped at 100, admin reads require an exact id. Generic product mutation workflows remain disabled; the specific onboarding endpoint now uses its request-scoped production SDK adapter and confirmed readback. A future paginated product read API must retain owner predicates and active/consent checks for every page.

There is no production atomic adapter and no implied transaction rollback. Future adapters must atomically check reference ownership, active account/consent/deletion predicates and unique keys across instances, use compare-and-set revisions and prove crash/retry behavior. Completing deletion cannot rely on a user-supplied status or unverified count. Schema-only null adaptation and timestamp aliases remain capability evidence boundaries, detailed in DATA_MODEL.

`npm run health:repo` checks physical schemas, access policies, docs/marker/ledger and safe source findings. H04/H12 execute the same pure/backend contracts as the canonical browser runner; no second test framework or live test seed is introduced. All new shared backend modules are imported by typechecked tests. Current capability counts are derived from capabilityRegister.js (24 entries); detailed statuses in DATA_MODEL/RELEASE_HEALTH_CHECK.

## Authentication/onboarding architecture — current package

`src/pages/Onboarding.jsx` coordinates existing AuthContext hydration, preferences initialization and state presentation. `onboardingRoute.js` is the canonical eight-state resolver; private backend state is authoritative. `OnboardingScreen` uses shared primitives, centralized copy and bounded services. `authService.beginProviderAuth` checks an explicit true 18+ flag before any provider call; provider initiation is not successful authentication. AuthContext still hydrates the canonical Base44 user.

The `onboarding` backend entry creates a request-scoped SDK client, uses shared authenticated ownership guards and a closed action/field allowlist. Hydration uses owner-filtered queries, singleton duplicate detection and normalized projections. `onboardingValidation.js` shares date-only, age, time, name and cycle validation with UX; server date is calculated from server clock in persisted IANA timezone. The backend revalidates DOB even when client validation is bypassed.

GeoNames uses the server-owned `https://secure.geonames.org/searchJSON` and `/getJSON` endpoints. The onboarding default handler reads `secrets.get('GEONAMES_USERNAME')` from `base44:runtime` inside each request. It no longer captures `Deno.env.get()` at module load. This follows the [current Base44 runtime contract](https://docs.base44.com/developers/backend/resources/backend-functions/overview#read-secrets); a configured secret and a reachable provider are separate facts. The runtime value is trimmed, and missing/blank values fail explicitly before outbound fetch. No Node/Vite environment or credential fallback is used.

`OnboardingScreen.search` explicitly calls `onboardingRequest('searchPlaces', {query, language_code})`; its production SDK client sends JSON POST `/api/apps/<app-id>/functions/onboarding`. DevTools shows the last path segment, onboarding. This is an intentional multiplexed endpoint: `onboardingOperation` dispatches searchPlaces before any save/commit operation. Search authenticates the owner and reads profile/preferences but does not initialize or mutate any product entity. Only explicit `saveProfile` after selection sends the numeric selected ID for server-side re-resolution and persistence.

Provider requests normalize/encode 2–80-character queries, limit results to 8, select lang en/tr, style FULL and featureClass P, and set the username server-side. An 8-second deadline covers fetch and body read, aborts the fetch and rejects even a stalled transport; redirects are rejected. Response JSON is bounded to 100,000 UTF-8 bytes and projected to five approved birthplace fields. Editing/clearing invalidates selection and stale results; empty save clears all five fields. No credential, raw query/history, arbitrary provider payload or geolocation reaches persistent product data.

`geonamesDiagnostics.js` separates missing secret, deadline, network failure, HTTP failure, provider rejection and invalid response. The public error_code remains GEONAMES_UNAVAILABLE, with only an allowlisted diagnostic code, numeric HTTP/provider status and provider class. Provider JSON status is examined even on non-2xx HTTP. Code 10 is AUTHORIZATION, 18/19/20 QUOTA, and service statuses stay distinguishable; no raw message is forwarded. Successful empty arrays and successful search status 15 return `{places:[]}`, while status 15 for a selected-ID lookup is rejected. Frontend copy remains the approved generic retry/empty state. [GeoNames status reference](https://www.geonames.org/export/webservice-exception.html). Actual account-authorized success remains pending manual deployment verification; synthetic tests cannot close H10-004.

The fetch-failure continuation adds only `failure_stage` and `transport_class` to this existing diagnostic. Stages are CONFIGURATION, FETCH, RESPONSE_BODY, RESPONSE_VALIDATION or UNKNOWN. A network exception is classified as DNS, TLS_CERTIFICATE, CONNECTION, REDIRECT_REJECTION, INVOCATION_INPUT, TIMEOUT or UNKNOWN from explicit allowlisted runtime codes/names or narrowly recognized Deno/Undici messages. Non-transport failures use null. At most four error/cause nodes are inspected transiently; ambiguous/conflicting evidence stays UNKNOWN. Generic TypeError is not a DNS/TLS diagnosis. An adapter deadline retains GEONAMES_REQUEST_TIMEOUT/504; a runtime timeout before that deadline retains GEONAMES_NETWORK_ERROR/503 with transport_class TIMEOUT. No exception fields are exported. URL-object input, detached fetch call, HTTPS host and redirect:error policy are unchanged; standard Deno accepts this call contract. This diagnostic improvement does not establish a functional fix for the observed live failure.

`base44OnboardingAdapter.js` is the production persistence path. It reuses branded authentication, owner, ACTIVE and protected-record grants from 007. The installed `@base44/sdk` 0.8.54 `entities.types.d.ts` and `entities.js` expose `upsert(records, { key })`, `updateMany(query, { $set })` and filtered reads. Singleton inserts use `user_id`; existing profile/preferences updates include owner/id/native updated-date predicates, and profile updates also require ACTIVE. Explicit NULLs clear the complete optional birthplace group. Create relies on the schema ACTIVE default; no upsert sends account_status to reactivate an existing row. Every write is followed by owner-filtered, field-by-field readback. Duplicate or mismatched state fails closed. This is the strongest SDK-keyed equivalent implemented here, not a native UNIQUE or transaction guarantee.

The canonical `resolveSunSign(birth_date)` uses the approved fixed tropical table. No time/place/fallback is passed. Profile readiness validates existing domain data, adult DOB and the derived sign; incomplete profiles return to ON-04. Approved profile persistence progresses to ON-05 with `completionReady: false` until an actual daily record exists. Skip writes no health data and reaches the finite First Shinka dependency screen. Reload deterministically inspects persisted profile/preferences/consent/period/daily state; no durable skip marker was invented.

The production consent version is exactly `health-consent-v1.0`; the previous missing-source blocker is resolved. The default production adapter path is tested with this exact version against an isolated SDK transport, separately from retained synthetic missing-source negative tests. It verifies current consent, immutable event payload, optional settings, then writes the period last as completion evidence. The stable event key contains every approved domain field (owner/type/version/time); its timestamp is the first consent row's timezone-qualified native created timestamp. Ambiguous timestamps fail `NATIVE_CONSENT_TIMESTAMP_REQUIRED`. Retries reuse durable rows. No event update/delete API exists; identical upsert races may affect native system updated timestamps, which must be verified live before release. A timezone-less native timestamp still fails closed; this is an external capability requirement, not a missing consent source.

Partial failures can leave earlier writes durable; errors never claim rollback or final completion. Retry reads and reconciles confirmed state. Cross-instance keyed uniqueness, conditional update enforcement, explicit NULL clearing, native metadata and concurrent account/consent/deletion changes remain live verification obligations. The generic `domainAtomic.commitOwnerAction` transaction/receipt contract is unchanged and remains unavailable in production; its original synthetic tests are retained separately.
