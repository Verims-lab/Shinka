# SHINKA — Code Standards

**Document:** SHINKA_CODE_STANDARDS.md
**Status:** ACTIVE — enforceable
**Current BuildMarker:** Buildmarker-011
**Last Updated:** 2026-10-20
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
- **R. Validation commands:** `npm ci`, `npm ls --all`, `npm audit --json`, `npm run security:deps`, `npm run typecheck`, `npm run test:foundation`, `npm run lint`, `npm run build`. Type checking remains enabled; Foundation, application entry, services and imported shared modules are checked. Lint includes Foundation, auth/internal code, backend JS/TS and scripts (generic generated UI is excluded).
- **S. Security closure:** Critical/High advisories have no waiver. An unresolved High keeps repository Foundation OPEN even if regression and browser Health pass. Moderate/Low disposition must identify affected paths and actual application exposure.

- **T. CSS pipeline:** native Tailwind 4 through `@tailwindcss/vite` in both application and canonical test harness. Theme mappings live in `src/styles/theme.css`; explicit content sources and class-only dark variant live in `src/index.css`. Keep Shinka tokens exact and test computed styles, dimensions and small-screen overflow when changing CSS. No duplicate PostCSS pipeline or legacy JS config.
- **U. Dependency guard:** `npm run security:deps` invokes `npm audit --audit-level=high --include=dev`; use native npm failure semantics, no suppression or arbitrary override. A registry/audit failure is not a clean result. Document each remaining Moderate/Low advisory with exposure and fix path.

- **V. Domain authority:** new worker code must reuse `domainSchemas`, `domainValidation`, `domainSecurity`, `domainAtomic` and `domainAudit`. Do not accept body user_id/role/process as authority. Never add a direct service-role CRUD endpoint or relax RLS to bypass ACTIVE/consent/audit checks.
- **W. Capability honesty:** schema text is not live enforcement. Do not add ignored unique_fields/index/FK declarations, simulate transactions with check-then-insert, or label a local mutex as distributed atomicity. Missing production primitives fail closed. Add exact source-field and negative-access regressions to the existing test runner and H04/H12.
- **X. Repository data health:** run `npm run health:repo` along with existing required checks. Preserve exactly 20 product entities, one logical/physical mapping, only explicitly allowlisted guarded content-import writers and no duplicate timestamp fields. Synthetic fixtures must remain isolated and must not write live product rows.

## Onboarding boundaries and regression

Keep copy in the canonical onboarding catalog; do not invent translations or an algorithm for unresolved source rules. Keep transient name only in the bounded session helper and health form state only in memory. No URL/analytics/log payload may contain name, DOB, place query or cycle data. Never infer owner from a client field. Use the same backend validation, route resolver, shared guards and domainAtomic adapter contract rather than parallel rules or generic service-role CRUD.

`AUTH_TESTS`, `ONBOARDING_TESTS` and `ONBOARDING_UI_TESTS` join the existing canonical Foundation runner. The UI fixture injects fake provider and persistence adapters and a private in-memory name store; Health execution cannot initiate real OAuth or write product rows. Static inspection rejects duplicated approved onboarding validation copy and frontend GeoNames credential/host/geolocation use. Missing live dependencies are Health BLOCKED/external states, never green by fixture substitution.

## ON-04 selection regression contract

The explicit 2026-10-20 product decision is recorded in SOURCE_OF_TRUTH; its new selector/help/status copy is centralized in onboardingCopy.js. Preserve the earlier exact-copy receipt. Keep provider hierarchy validation in the existing backend adapter and transient UI races in birthplaceSelection.js. Do not persist the path, infer a country, autoselect a result, accept an administrative record as a settlement, assume childrenJSON pagination, silently truncate lists or add a new UI dependency. B01…B18 and U09…U12 run through the existing canonical runner and H10-003; fixtures remain synthetic and cannot close H10-004. Native keyboard/device observations must be recorded separately from programmatic selectOption tests.

## Maintenance regression boundaries

Internal Build/Health and probe implementations load through lazy routes after existing access guards. The exact probe route constant and lightweight AdminGate stay eager; tests/catalogs/measurement code must not enter the normal entry closure. H03-010 inspects actual static import/re-export edges, cycles and forbidden backend→frontend imports; the production measurement checks emitted bytes. Tests exercise injected bad edges as well as the real graph.

`node scripts/measureMaintenance.mjs /tmp/shinka-measure` enforces new measured regression budgets: initial production JS ≤500,000 raw / 165,000 gzip bytes; CSS ≤90,000 raw / 16,000 gzip bytes; no initial test modules, static cycles or page exceptions. These allow modest headroom over the measured fix and are not LCP/INP targets. Keep field performance separate. Preserve the shared 44px touch minimum; test Chromium and WebKit after form/layout changes. See [mobile evidence](reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md).

Prefer cohesive forms, resource-list presentation and controllers; no artificial line-count cap or compressed long-line application code. Generated data and fixtures are assessed separately. List labels use one linear count pass for duplicate context, not repeated nested scans. Cache public place lists per picker only: 16 entries, 1 MiB serialized values, 60 seconds, language/parent/page scoped; clear on Clear/dispose; explicit Retry bypasses cache. Never cache owner profiles or writes. Ignore late SDK completions; do not claim invoke cancellation that its API cannot provide. User-started completed Health runs retain audit persistence after navigation, with duplicate starts and stale UI updates prevented.

Active build history obeys the permanent five-package rule in DEVELOPMENT_RULES. Run `recordBuild.mjs --check`; source and generated output must agree. H01-006 and M01…M05 cover this policy. No security or evidence check may be removed solely to make the result green.

## Consent business-clock regression

Never equate native row creation with user consent time. Preserve validated persisted UTC granted_at and reuse it for immutable history. Tests must include zone-less/missing/invalid native metadata, invalid business instants, post-write lost responses, partial recovery, conflicting rows, independent-worker limitations, consent/account/deletion changes, NULL durations and no-write Skip. Coalescing is explicit, bounded and worker-local, never described as durable atomicity. SDK mutations remain in the adapter; reconciliation and grant validation are separate responsibilities.

## Admin navigation regression boundary

Keep destination inventory/localization, role decision, menu interaction and panel presentation separate. Do not repeat `role === admin` authorization in navigation components; AuthContext exposes the derived decision while backend guards remain authoritative for operations. Never add profile-related product writes to navigation handlers. Keep the panel lazy and the single-link profile entry small; its route and lightweight entry must not eagerly load Health/tests. AN01…AN08 join the canonical runner and H12/H13; `checkAdminNavigation.mjs` exercises the real App with CLI-only SDK substitution, TR/EN, keyboard/Escape/focus, 360/1280 layout, both tools and return, denied direct routes and zero product writes. The ordinary disabled icon is intentional until the full You workflow is authorized.


## Daily implementation boundaries

Keep source manifest/backend astronomy out of the initial frontend graph. Import planning, SDK batches, phase calculation, selection, persistence and UI have separate modules. The write-surface tripwire adds exactly one upsert call in base44ContentLibrary and one in moonImport, both reachable only through strict admin apply dispatch; arbitrary writers remain rejected. Dry-run and Home must never trigger import. No native atomicity can be inferred from SDK method naming, synthetic concurrency or a local lock. Tests must assert production refusal until a verified adapter is explicitly added. Preserve actual selected category, immutable bilingual snapshots, bounded history and distinction between source/technical failures and UNKNOWN.
