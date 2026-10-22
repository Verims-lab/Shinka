# SHINKA — Code Standards

**Document:** SHINKA_CODE_STANDARDS.md
**Status:** ACTIVE — enforceable
**Current BuildMarker:** Buildmarker-031
**Last Updated:** 2026-10-22
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
- **W. Capability honesty:** schema text is not live enforcement. Do not add ignored unique_fields/index/FK declarations, simulate transactions with check-then-insert, or label a local mutex as distributed atomicity. Unsupported guarantees must not be claimed; use the explicitly approved native reconciliation/retry contract. Add exact source-field and negative-access regressions to the existing test runner and H04/H12.
- **X. Repository data health:** run `npm run health:repo` along with existing required checks. Preserve exactly 20 product entities, one logical/physical mapping, only explicitly allowlisted guarded content-import writers and no duplicate timestamp fields. Synthetic fixtures must remain isolated and must not write live product rows.

## 030 — narrow integration contracts and fresh caller admission

Use the existing shared native-admin guard, repeated at protected work boundaries; no scheduler-specific role shortcut. Authenticate before lifecycle service-role construction. Keep ReportedPushInput and Promise<unknown> in the backend provider boundary; do not augment the whole SDK or add project-wide any. Runtime validation precedes narrow nullable-field casts. Unknown provider results/errors never establish sent/no-send semantics. Test adapters may establish explicit synthetic acceptance; evidence must identify that substitution.

## 029 — notification boundaries

Keep time policy, owner admission, delivery state and bounded traversal in small shared modules. Platform-specific SendPushNotification encoding/decoding/eligibility and scheduler verification require authoritative contracts and backend-only bindings. Health must use a fake provider/clock; production wiring never auto-enables a workflow. New optional model fields are explicit authorized extensions to the immutable original source receipt. No distributed-lock/idempotency promise from worker memory or readback.

## 027 — measured quality closure

Use production assets plus the real SDK with synthetic HTTP interception for comparable route timing (`scripts/measureTransitions.mjs`); block external traffic and label results laboratory-only, never field INP or hosted proof. Keep cold/first destination and revisit separate; report feedback, visible, usable, call counts/bytes and long tasks with sample count. Keep the existing byte budgets. The canonical `rejects` helper must prove a rejection actually occurred even when no error code is specified; no-op success cannot pass a negative assertion. QM04 protects this rule. Heavy performance and actual-App navigation checks stay local; normal Health uses bounded synthetic helpers.

## Mobile regression and delivery — 026

Use one system theme owner, semantic text/surface/on-primary/control colors and computed contrast checks. Do not add an independent theme state, global touchmove prevention, zoom lock or a retained private exit tree. Shared picker presentation must not fork business rules. A modal history entry is limited to the lifetime of its layer; no root back trap. Keep controls/text accessible with document scrolling and 200% text.

Refresh must coalesce, retain confirmed data/drafts on ordinary failure and invalidate on known privacy/session changes. Unknown writes retain one intent and cannot be silently replaced by a new action. Use controlled promises and observed DOM in new tests, not sleeps or inflated Health budgets. Run the new mobile experience matrix in both existing engines, alongside all retained regressions. H13-012 remains LOCAL_BROWSER, H13-013 remains external/manual; neither becomes a synthetic device PASS. Exclude only the verified-unused generated sidebar CSS source; adding a sidebar importer requires restoring its CSS source. Existing 500000/165000 JS and 90000/16000 CSS limits remain.


## Synthetic helper timing rule — 025

Keep controlled time fixture-local: inject scheduler dependencies, never patch production global timers. Production adapter defaults and provider policy stay unchanged. A test deadline must exercise the real abort/cleanup path; an arbitrary sleep is not evidence that cleanup occurred. Observe DOM mutations with a bounded, abortable waiter; remove observers, timers, listeners and roots on completion/abort. Fixture ownership is registered through `context.cleanup`; all registered disposers are attempted synchronously, and cleanup failure cannot cache success.

A helper's 5s bound is capped by the remaining 20s case budget; both check monotonic elapsed time so delayed timer delivery cannot accept an over-budget result. Stop dispatch on timeout/abort, close progress publication and exclude all unfinished/late work from the run cache. Only completed successful helpers are reused; a new Health context starts empty. Keep safe partial progress (IDs, closed stage codes, durations), not exceptions, request bodies, credentials or fixture data. Local scheduler fault injection does not establish background-tab behavior or provider failure. The complete local Chromium/WebKit gates must continue to assert the existing behavior.

## Targeted Health evidence rule — 024

Never collapse SDK/query/service/read errors into a claim that a schema or content is absent. Use `healthReadDiagnostics` at the server and invocation boundaries; never pass raw exceptions into Health evidence. Require array/ID shape before a readiness success and an exact nonnegative safe integer before measured count. Preserve current PASS predicates and per-run memoization. Download/parse unavailability is different from successfully evaluated content inconsistency. An 18s invocation deadline preserves evidence before the 20s Health case deadline; no automatic retry or cancellation guarantee.

## Privacy implementation standards — 023

Use the explicit owner-erasure scope and closed endpoint, not a new general system delete grant. Keep ordinary immutable/admin rules unchanged. Share delete/readback logic with admin cleanup; every mutation and indirect reference is scoped. Keep confirmation separate from opening/reading, persistent request separate from UI busy state, and native identity removal separate from post-removal status capability. Recovery is bounded and never blindly starts a new request. A failed verification does not certify absence or permanent erasure. Local fixture tests must include positive cleanup, partial failure, native-removal response loss, current guards, other owners and meaningful UI assertions. Future platform/device/provider evidence stays separate from active Health. No auth/health values in diagnostics.


## You implementation rules — 022

Keep shared profile input/Sun/GeoNames validation in one authority; do not unlock onboarding's ready-profile mutation guard for You. Use a purpose-specific closed update endpoint and filtered owner/previous values plus exact count/readback. Never describe native updateMany as CAS. Separate confirmed values, draft, pending intent and outcome; a timeout is unknown and late UI results must not restore a prior user. Verify same desired state before retrying a write; observable conflict needs explicit reopen/review. Keep errors/localization central and personal fields out of diagnostics and storage.

Actual YT handler/ordinary-SDK tests and YU components cover positive/negative/retry paths; current Health references those executable assertions. Shared Birthplace components live in features/profile; tests retain the same selection/cache behavior. No source-copy or security check is weakened for a green result. Physical device and deployed acceptance stay separate from Chromium/WebKit and local synthetic evidence.

## Pattern implementation rules — 021

One shared candidate comparator for Home/Pattern; one calculation module for window/rank/timeline. Keep SDK bounds and projection validation in the reader, auth/dispatch in handler, deadline/response in service, stale completion in controller and display in components. A limit sentinel/invalid row produces an error, never partial EMPTY. Never persist a summary merely from opening a read-only screen, interpret current mappings as old assignments or claim native uniqueness/transaction isolation. PT/PU and actual-App tests execute actual modules, not source-string-only behavioral assertions; published and physical acceptance stays separate.

## 019 corrective rules

Retain narrow responsibilities: diagnostics → safe metadata/counters; repository → SDK paging/ownership; executor → durable stage and result; hook → user interaction/recovery. Keep specific safe errors and stages through catch boundaries. Missing-row idempotency requires an actual successful absence read; permissions/network errors are not missing data. Page a shrinking deletion collection from offset zero and cap writes; never advance an offset through concurrently removed rows. Reconcile old checkpoints, avoid rewriting unchanged checkpoints, and never cache authorization to reduce request counts.

An evaluated boolean predicate, nonempty measured result and matching case/build/catalog/source identity are required for PASS. Empty helper sets, absent runners/no-op returns and incomplete results fail. Keep the server plan aligned with the executable catalog via H16; future/local/external requirements remain visible but undispatched. Isolated fixtures must drive actual implementation helpers, inject failure/race/loss and assert results. Native platform guarantees cannot be invented from fixtures. Use meaningful mobile text-resize/focus and performance measurements; no fixed-success Web Vitals evidence.

## 018 runtime/regression and recovery boundaries

This supersedes the 017 normal-Health JSON measurement workflow. Local tests retain the real viewport contract; no import UI or hosted measurement script remains. Shared executeTest passes a child AbortSignal, safe ID/stage and deadline; onboarding fixture waits/delays observe it, unmount and remove their frame on abort/finally. syntheticProbe propagates cancellation and memoizes helpers within one run. Do not dispatch new tests after cancellation.

Use a single deletion verification helper for executor and read-only lookup/status. Completed checkpoint/audit metadata is not rewritten on every resume, but every cleanup scope is reread for late residuals. Do not cache role/target authorization. Stage passes yield after bounded elapsed work; an in-flight SDK call is not physically aborted. Internal request errors preserve sanitized code/stage/request ID; a client timeout remains unknown. Unknown responses never trigger automatic destructive retry; only acknowledged partial progress permits bounded continuation of the same operation under 019. Normal Health report reads/writes retain immutable runId/digest behavior.

## Current probe/history/deletion standard — 017

This section supersedes old N/O and maintenance deletion wording below. Use one browser measurement contract with actual top-level viewport, exact build/source/environment and freshness binding. Unmeasured => BLOCKED, never PASS/N/A. Do not weaken frame security or raise timeouts to hide failures. Close measurement pages in finally; abort runners at deadlines/navigation and reject stale UI completions.

Keep Health persistence separate from dispatch: validate, lookup existing run, reuse signed uploaded artifact on retry, create once where observed absent, read back exact fields/digest. No silent catch-all loss of stage/request ID, no raw provider logs, no rewrite of historical reports. Native uniqueness/upload atomicity are not inferred.

Delete target admission is distinct from actor admin admission. Keep cleanup bounded and resumable, preserve signed target/scope binding and retention, and verify actual absence after reconciling old checkpoints. Do not reintroduce mandatory operator/window/global-pause UX. Existing code-path auth/consent/ACTIVE/open-job guards stay; future background target writers must use the same lifecycle boundary before activation.

## Native persistence standards — 016

Keep mutation responsibility in narrow native modules and reuse existing validation/calculation. Ordinary Entity create/update/updateMany are not transaction/UNIQUE/CAS evidence. For immutable daily snapshots use insert and deterministic reconciliation, never upsert. For date mutation bind receipt/owner/intent, compare revision, verify affected counts and reread actual state. Persist business consent time once; preserve it on retry. No fallback clock/naive-Z patch.

Normal write/readback must precede reset progress. The historical 016 operator-maintenance contract is superseded by the 017 target-scoped confirmation/lifecycle contract; pre/post admission is not distributed fencing. Tests exercise actual native handlers with ordinary SDK-shaped CRUD, faults and independent reconstructed clients; label those synthetic, separate hosted evidence. Existing historical atomic protocol fixtures do not enable production behavior. No SQL tooling/driver/CI requirement. [Current contract](SHINKA_BASE44_CONTINUATION.md).

## Onboarding boundaries and regression

Keep copy in the canonical onboarding catalog; do not invent translations or an algorithm for unresolved source rules. Keep transient name only in the bounded session helper and health form state only in memory. No URL/analytics/log payload may contain name, DOB, place query or cycle data. Never infer owner from a client field. Use the same backend validation, route resolver, shared guards and domainAtomic adapter contract rather than parallel rules or generic service-role CRUD.

`AUTH_TESTS`, `ONBOARDING_TESTS` and `ONBOARDING_UI_TESTS` join the existing canonical Foundation runner. The UI fixture injects fake provider and persistence adapters and a private in-memory name store; Health execution cannot initiate real OAuth or write product rows. Static inspection rejects duplicated approved onboarding validation copy and frontend GeoNames credential/host/geolocation use. Missing live dependencies are Health BLOCKED/external states, never green by fixture substitution.

## ON-04 selection regression contract

The explicit 2026-10-20 product decision is recorded in SOURCE_OF_TRUTH; its new selector/help/status copy is centralized in onboardingCopy.js. Preserve the earlier exact-copy receipt. Keep provider hierarchy validation in the existing backend adapter and transient UI races in birthplaceSelection.js. Do not persist the path, infer a country, autoselect a result, accept an administrative record as a settlement, assume childrenJSON pagination, silently truncate lists or add a new UI dependency. B01…B18 and U09…U12 run through the local canonical runner; H10-003 retains only pure helper checks in 018. Fixtures remain synthetic and cannot close H10-004. Native keyboard/device observations must be recorded separately from programmatic selectOption tests.

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

> Historical contract (superseded by the current 016 native contract above):
> Keep source manifest/backend astronomy out of the initial frontend graph. Import planning, SDK batches, phase calculation, selection, persistence and UI have separate modules. The write-surface tripwire adds exactly one upsert call in base44ContentLibrary and one in moonImport, both reachable only through strict admin apply dispatch; arbitrary writers remain rejected. Dry-run and Home must never trigger import. No native atomicity can be inferred from SDK method naming, synthetic concurrency or a local lock. Tests must assert production refusal until a verified adapter is explicitly added. Preserve actual selected category, immutable bilingual snapshots, bounded history and distinction between source/technical failures and UNKNOWN.


## Historical checkpoint — Calendar engineering requirements — Buildmarker-012

Keep date selection, editing identity, validation, cycle calculation, authorized snapshot reading and transaction publication separate. Reuse the shared Home cycle engine. Dates remain YYYY-MM-DD; UTC arithmetic is only integer calendar-day arithmetic, never conversion of an entered local day. A production mutation must never be enabled merely because a method named transaction/upsert exists: verify cross-worker owner serialization, crash recovery, receipts, guards and atomic publication to every authoritative reader.

Canonical CA/CU tests cover actual lifecycle, both neighbors, 14/15, local dates/DST, full pagination, NULLs/source examples, lost response, independent workers, no-consent/regrant/deletion, stale UI, unchanged Home and live-capability refusal. H08/H11/H12/H13 execute the same isolated contracts. Native evidence remains separate. Strict typecheck/lint remain enabled; no exclusions were added for Calendar or unused auth templates.

## Historical checkpoint — Test Tools implementation rules — 013

Keep UI/catalog/authorization/preview/persistence/execution separate. Only the two declared actions reach the executor. Server-controlled persistence scans target-filtered pages with explicit metadata fields, rejects malformed/duplicate pagination and foreign indirect references, and fails rather than truncates above the bounded 20,000-row safety ceiling. Cleanup snapshots IDs before deleting so offset pagination cannot skip shrinking pages. No unbounded parallel deletes.

> Historical contract (superseded by the current 016 native contract above):
> A coordinator interface is not a production guarantee. Do not enable delete/reset with an environment flag, SDK upsert, local mutex or schema assertion. Prove shared writer/roster fencing, durable job uniqueness/receipts and crash recovery before supplying a production coordinator. No persistent job stores normal profile/cycle request bodies. Fixture-only transactions remain under the canonical test tree. Hosted function entry wiring, current-User admission, reset override, protected-history scope and both browsers are part of regression coverage.


## Historical checkpoint — OD-012 and release tooling — 014

Filter supported observations only after fixing the last-three window. Preserve valid dates and distinguish no observations from all unsupported observations; never catch general technical/access failures as UNKNOWN. Keep unavailable calculation copy central. Release scripts must produce reviewable metadata/artifacts, never automatically deploy, import, reset or delete. Entity-only full sync requires complete inventory comparison; a directory with only the new schema is unsafe. Read-only CLI evidence must omit records, credentials and raw exceptions.