# SHINKA — Code Standards

**Document:** SHINKA_CODE_STANDARDS.md
**Status:** ACTIVE — enforceable
**Current BuildMarker:** Buildmarker-061
**Last Updated:** 2026-11-01
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

- **T. CSS pipeline:** native Tailwind 4 through `@tailwindcss/vite` in both application and canonical test harness. Theme mappings live in `src/styles/theme.css`; explicit content sources and the light-only scheme live in `src/index.css`. Keep Shinka tokens exact and test computed styles, dimensions and small-screen overflow when changing CSS. No duplicate PostCSS pipeline or legacy JS config.
- **U. Dependency guard:** `npm run security:deps` invokes `npm audit --audit-level=high --include=dev`; use native npm failure semantics, no suppression or arbitrary override. A registry/audit failure is not a clean result. Document each remaining Moderate/Low advisory with exposure and fix path.

- **V. Domain authority:** new worker code must reuse `domainSchemas`, `domainValidation`, `domainSecurity`, `domainAtomic` and `domainAudit`. Do not accept body user_id/role/process as authority. Never add a direct service-role CRUD endpoint or relax RLS to bypass ACTIVE/consent/audit checks.
- **W. Capability honesty:** schema text is not live enforcement. Do not add ignored unique_fields/index/FK declarations, simulate transactions with check-then-insert, or label a local mutex as distributed atomicity. Unsupported guarantees must not be claimed; use the explicitly approved native reconciliation/retry contract. Add exact source-field and negative-access regressions to the existing test runner and H04/H12.
- **X. Repository data health:** run `npm run health:repo` along with existing required checks. Preserve exactly 20 product entities, one logical/physical mapping, only explicitly allowlisted guarded content-import writers and no duplicate timestamp fields. Synthetic fixtures must remain isolated and must not write live product rows.



## 058 — Narrow core closure (2026-11-01)

Read-only Moon evidence uses a closed projection of non-sensitive counts, canonical UTC instants and known versions/phases. Distinguish actual coverage/current phase from the monthly expected tail. Do not copy conflicts/records/digests into Health, claim attempted import as durable success, or infer complete deployed graph parity from editor/marker labels. Preserve strict conflict validation, bounded reviewed import and independent full verification. Serialized scope-transfer descriptions must be updated alongside case descriptions (058 fixes H07/H12 drift). See [058](reports/SHINKA_CORE_CLOSURE_058.md).


## 057 — Shared navigation and reopen recovery (2026-11-01)

Reuse productTransport for local deadlines/cancellation, explicitly set readOnly:false for daily today, and never turn a timeout into success or remote cancellation. Retain safe nested diagnostics; typed status must override a misleading transient body on authorization failure. Explicit new admission seals old consumers rather than emitting a signal that reloads the previous owner. Inject clocks for timeout/Retry-After regressions and use condition-based React waits. Navigation dimensions are measured on the shared component; env inset and synthetic 0/34px are separate from physical evidence.

## 056 — Focused Calendar corrections (2026-11-01)

Keep recovery inspection separate from native writes. A read status must not mutate a receipt, accept counts alone, or infer an operation's success from another intent. Preserve original payload and caller generation; stale account/read results cannot settle a new session. Read reconciliation and explicit continuation share one bounded budget. Synthetic tests must exercise real native handler/guards, failures before/after period writes, PENDING/APPLIED, and actual SDK HTTP envelopes. Native date fixes are selector-scoped, never global outline/border removal or overflow hiding.


## 053 — Shared GeoNames credits and endpoint classification (2026-10-30)

For this quota only, the current official Base44 single-ID conditional-update contract and installed SDK transport support ID/revision reservation with exact updated acknowledgement. This is not blanket transaction/CAS certification for existing product workflows; historical "never describe updateMany as CAS" advice must not obscure the scoped documented primitive or turn local fixtures into hosted proof. Do not create/upsert a singleton on the request path, infer missing counters as zero, retry unknown writes, weaken policies or bypass failure via cache authority. Test two independent workers against shared conditional state and actual TS entry negatives; normal Health uses isolated counters only.


## 052 — Calendar and Pattern read recovery (2026-10-30)

Use productReadTransport for the two affected read boundaries; preserve service response validation and controller ownership. Only allowlisted safe diagnostic metadata reaches state. Controlled clock tests must cover suspended deadline/late response, listener/timer cleanup, read pressure and mutation non-retry. Browser/server fixture success is not physical APK or deployed-source acceptance.

[Findings, execution and APK acceptance](reports/SHINKA_CALENDAR_PATTERN_052.md).


## 051 continuation — verified maintenance and measured performance

The owner accepts published 051 / HC-050.0 functional and Full Health evidence (159 PASS, zero FAIL/BLOCKED). Preserve that acceptance and historical failures. This continuation retains Buildmarker-051 and active packages 047–051; HC-050.1 identifies changed assertions without creating a new product package. Live Full Health/Security scan and main/publish were not run. Detailed dated receipts and separate hosted/local limits: [051 continuation](reports/SHINKA_CORE_RELIABILITY_051.md#051-continuation).

D23 now enforces absence of all four legacy physical fields after the separate full hosted cleanup receipt; do not restore the optional compatibility overlay. Keep original source provenance and migration absence checks. For overlapping reads, first mint the authenticated principal through auth.me and pass admission before scheduling health reads; wait for all fixture work in cleanup. Controlled IO ordering is a regression assertion, not a hosted duration claim.

## 051 — Core Reliability & Performance

051 separates Health retention policy/inventory/guarded apply from dispatch. Maintenance output contains safe IDs/counts/reasons/digests, never full reports or private file URIs. Queries select required fields; keyset loops reject repeated or unordered IDs and explicit overflow. Timing evidence distinguishes retained paint, fresh IO settlement and actual content readiness; RPC roundtrip bounds are not browser render metrics. No assertion relaxation, fake PASS or silent timer fallback.

051 supersedes the old sidebar CSS exclusion rule: the unused sidebar and its sole hook are removed, so the exclusion is removed too. New usage would require an explicit component implementation/review. Retention treats INCOMPLETE+completed_at as protected; report time/ID ambiguity is protected and native timezone ambiguity is never repaired with Z. Do not replace the matched lab result with a speed-up claim: no meaningful core-screen latency improvement was measured.

## 050 — Sheet and feedback regression scope

Keep sheet navigation local until explicit option activation. Radio keyboard behavior, selected semantics and modal focus/history must be exercised in real browsers. Do not clear unrelated parent drafts on dismissal. Derive Calendar feedback from actual operation state; selected is not persisted and local timeout is not rollback. checkPreferenceSheets/checkCalendarContinuity and CU08 are executable checks; they cannot certify physical back, keyboard or native safe areas.

## 049 — Bounded waits and maintenance evidence

One total session deadline covers the existing retry sequence; do not multiply the startup budget per attempt. Dispose local timers/listeners and invalidate stale results without claiming physical SDK cancellation. Use deterministic fixture clocks, retain before-fix failures and test real React providers plus native Request/Response handlers. Safe diagnostics use the existing closed healthReadDiagnostic vocabulary; never log arbitrary SDK error.code/message/body/headers. The daily transport diagnostic is not a user-facing technical label. Maintenance stays the fixed 045 four-field operation: bounded ID pages, reviewed digest, fresh guards, sequential literal-ID update/readback and assignment/link receipts; no generic CRUD endpoint or direct browser service role.

## 048 — Theme verification integrity

Use the existing appTheme resolver, not a second theme source or OS listener. Its explicit transient accepted-input inspection state supports Health without reading `.dark` as the expected answer. Verify both themes and deliberately corrupt class/scheme to prove failure; restore prior resolver input in fixture cleanup. Auth/session invalidation must clear theme even outside product routes. Preserve unknown-save intent and late-response cancellation. Dark CSS tokens must outrank base defaults, with text/non-text contrast measured without weakening thresholds. Hosted cleanup completion requires real full-page evidence, never fixture success.

## 045 — Assignment immutability and text projections

Do not write daily text copies or introduce a replacement version/cache store. Validate native IDs/owner and all assignment fields, resolve current Pair text through bounded projected ID batches, fail closed on broken links, and preserve Pattern/history projections. Response `_snapshot` names are a transitional DTO contract only. The four physical-only optional legacy fields were the migration bridge; 051 full hosted verification now permits their removal from Test. D23 requires their absence and unchanged required fields/RLS, while D01 still compares the full generated schema. No new text writes or blanket mismatch whitelist. Use request-local reuse only. Old source receipt remains an original artifact; explicit removed-field decisions are separate. Maintenance is an offline reviewed tool, no generic update endpoint. Test legacy rows, text edits, inactive eligibility, partial/lost-response unset, exact IDs and ownership with real domain functions; synthetic SDK fixtures are not hosted enforcement. Original immutable-text instructions are superseded only for the 045 approved behavior.


## 044 — Functional notification settings evidence

Use centralized scoped TR/EN notification copy, real forms and existing save controller; do not add diagnostic jargon, permission mocks as product facts or a second save/delivery route. A synthetic device prop can exercise denied/unknown rendering; production default must remain UNKNOWN without a verified bridge. Success requires backend VERIFIED, and unknown retry/check must retain the original revision/payload. Controlled wait injection tests auth retry timing and actual cleanup without reducing timeout/assertions. DOM tests wait for committed state, not merely an invoked callback. No live SDK/provider traffic in these tests.


## 042 — request admission and supported notification boundary

Keep principal reuse inside the same request's first admission; the two-check Home reopen/You read measurement is not a write budget. Revalidate identity, ACTIVE, consent and lifecycle at subsequent protected boundaries. A normal first-daily operation must stop if reset begins during SDK IO; only the coordinated reset path may continue. Test actual App routes while parallel startup reads are pending or rejected, as well as provider state. Global helper IDs must be unique; readiness SS10 remains and startup uses SS11.

The user-relayed Fode/Base44 Support contract supersedes the historical 033 machine/secret preparation below. Use the shared current-native-admin guard; never manufacture platform owner fallback. Remove unsupported machine transport code. Inspect the installed SDK's actual response envelope, accept only the reported sent envelope with both channel fields, and treat channel internals as opaque. Preserve UNKNOWN/intent readback after malformed, timeout or 502 outcomes; no fallback resend. A local wait deadline does not cancel SDK work. No unsupported eligibility query or fabricated permission is allowed. Entry remains disabled; local checks cannot certify workflow/native delivery. [042 contract and evidence](reports/SHINKA_CORE_AUDIT_042.md).

## 040 — deletion regression integrity

Exercise actual component → service → Request/Response handler → native operation/repository/journal/readback with ordinary SDK IO substituted, not a serialized fake transaction. Preserve deterministic before-fix failures and distinguish fixture scheduling corrections from product defects. Scope pass metrics to safe IDs/counts/stages/durations; report data writes and journal overhead separately. Completed metadata never replaces fresh absence checks. Failed/unknown outcomes must not become automatic destructive retries. Keep Heavy UI LOCAL_BROWSER and all normal Health deletion checks synthetic. [040 execution evidence](reports/SHINKA_TEST_DELETION_STABILIZATION_040.md).

## 039 — audit and result integrity

Bounded generic lists must expose truncation via an extra sentinel or reject overflow; never infer completeness from exactly one full page. Project requested fields, validate all returned owners (including sentinel) and reject malformed/duplicate IDs. Feature pagination and pre/post authorization cannot be removed to improve counts.

Unknown writes keep their exact intent across UI actions and failed read-only checks. Privacy/lifecycle rejection clears old rendered values and profile fallback; logout stops that component's future work as well as late completions. Test helpers must be unique within each in-app group, not only in the full local registry. Evidence joins include real canonical outcomes/source locations; static checks claim only source properties. [039 regression and measurement contract](reports/SHINKA_CORE_QUALITY_MILESTONE_039.md).

## Historical 037 — light policy superseded by 048; date validation retained

The historical 037 decision replaced the earlier system-theme requirement; 048 now permits verified manual light/dark. Bootstrap still defaults light, with no OS listener or screen-local palette. Date validation must precede recovery/replay shortcuts as well as fresh writes; partial receipts cannot bypass current server day. Preserve unknown-outcome and normal explicit repair behavior. Synthetic native CRUD tests are evidence of code paths, not distributed atomicity.

## 036 — field/modal and diagnostic boundaries

Keep one parent-owned time value and a disposable selection draft; portal dialog forms outside profile forms and stop submit bubbling. Editable modal controls participate in focus traversal; consume layer history before closing/reopening. Keep original daily deadline and generation checks; safe error codes only. Test device locale via browser context or pure resolver inputs, never invisible language buttons. No live cause inferred from generic error copy.

## Current onboarding engineering contract — 035

Use existing OnboardingScreen form state and backend resolver; generation/session checks guard async UI completion. No new large screen/state framework. Reuse FieldError across fields without circular imports. A/P combobox replaces the historical cascade standard below; query is ≥3 characters, matching is displayed-name literal substring, and only explicit provider ID selection can save. Worker public-data guards remain; no browser hierarchy cache, fuzzy match or complete-world claim. Actual handler/component regressions and registry/Health execution are required. [035 audit, execution and evidence](reports/SHINKA_ONBOARDING_AUDIT_035.md).

## 034 — session generations and paced continuation

Keep coalescing inside a session generation; reset invalidates both in-flight ownership and the last success. Actual AuthProvider/route tests are separate from pure helpers. Controlled scheduler/wait/clock dependencies preserve production defaults; no global timer patch or longer test timeout. Recheck generation and between-request budget after every pacing wait; unknown writes reconcile by status only. Native readiness requires exact named rows and valid sample counts. The initial 034 browser attempt was NOT_RUN under its installation blocker; the resumed 034 report separately records 649/649 on both engines. Those results are historical, not 039 evidence.

## Historical 033 — machine credential scope (superseded by 042)

The scheduler-only server callback is separate from authenticated User/admin principals. Only trusted backend composition may provide it; request roles, owner IDs or workflow flags cannot choose authority. No fallback from failed machine admission to a user session. Validate before client/work/provider construction; retain fresh recipient lifecycle/preference/consent and write/send checks.

Use the platform-supported node:crypto timingSafeEqual on the fixed public 64-lowercase-hex credential format; never implement a comparison loop/crypto primitive. Each admission reads current configuration within the request; no global credential/auth cache or value logging. The real entry leaves the prepared verifier unbound. [033 scope](reports/SHINKA_SCHEDULER_AUTHORIZATION_033.md).

## 032 — native evidence and credential boundary

Native permission/registration must use a documented Base44 wrapper contract; browser Notification.permission, user-agent and PWA behavior cannot substitute. Do not invent bridges or token stores. OS permission, persisted app preference, platform recipient/device eligibility and sending activation are independent claims. Source/credential presence cannot produce native PASS. No new dependency or runtime permission UI is needed for preparation; keep unverified state honest. [032 inventory and owner plan](reports/SHINKA_NATIVE_NOTIFICATION_READINESS_032.md).

## 030 — narrow integration contracts and fresh caller admission

**Historical 033 scope amendment (superseded by 042):** the following 030 description remains the manual/unbound-entry baseline; its keyless/session-only assumption is superseded for the prepared scheduler machine path by §033. General admin guards are unchanged.

Use the existing shared native-admin guard, repeated at protected work boundaries; no scheduler-specific role shortcut. Authenticate before lifecycle service-role construction. Keep ReportedPushInput and Promise<unknown> in the backend provider boundary; do not augment the whole SDK or add project-wide any. Runtime validation precedes narrow nullable-field casts. Unknown provider results/errors never establish sent/no-send semantics. Test adapters may establish explicit synthetic acceptance; evidence must identify that substitution.

## 029 — notification boundaries

Keep time policy, owner admission, delivery state and bounded traversal in small shared modules. Platform-specific SendPushNotification encoding/decoding/eligibility and scheduler verification require authoritative contracts and backend-only bindings. Health must use a fake provider/clock; production wiring never auto-enables a workflow. New optional model fields are explicit authorized extensions to the immutable original source receipt. No distributed-lock/idempotency promise from worker memory or readback.

## 027 — measured quality closure

Use production assets plus the real SDK with synthetic HTTP interception for comparable route timing (`scripts/measureTransitions.mjs`); block external traffic and label results laboratory-only, never field INP or hosted proof. Keep cold/first destination and revisit separate; report feedback, visible, usable, call counts/bytes and long tasks with sample count. Keep the existing byte budgets. The canonical `rejects` helper must prove a rejection actually occurred even when no error code is specified; no-op success cannot pass a negative assertion. QM04 protects this rule. Heavy performance and actual-App navigation checks stay local; normal Health uses bounded synthetic helpers.

## Mobile regression and delivery — 026

Use the 037 light-only policy (superseding the original 026 system owner), semantic text/surface/on-primary/control colors and computed contrast checks. Do not add an independent theme state, global touchmove prevention, zoom lock or a retained private exit tree. Shared picker presentation must not fork business rules. A modal history entry is limited to the lifetime of its layer; no root back trap. Keep controls/text accessible with document scrolling and 200% text.

Refresh must coalesce, retain confirmed data/drafts on ordinary failure and invalidate on known privacy/session changes. Unknown writes retain one intent and cannot be silently replaced by a new action. Use controlled promises and observed DOM in new tests, not sleeps or inflated Health budgets. Run the new mobile experience matrix in both existing engines, alongside all retained regressions. H13-012 remains LOCAL_BROWSER, H13-013 remains external/manual; neither becomes a synthetic device PASS. Exclude only the verified-unused generated sidebar CSS source; adding a sidebar importer requires restoring its CSS source. Existing 500000/165000 JS and 90000/16000 CSS limits remain.


## Synthetic helper timing rule — 025

Keep controlled time fixture-local: inject scheduler dependencies, never patch production global timers. Production adapter defaults and provider policy stay unchanged. A test deadline must exercise the real abort/cleanup path; an arbitrary sleep is not evidence that cleanup occurred. Observe DOM mutations with a bounded, abortable waiter; remove observers, timers, listeners and roots on completion/abort. Fixture ownership is registered through `context.cleanup`; all registered disposers are attempted synchronously, and cleanup failure cannot cache success.

A helper's 5s bound is capped by the remaining 20s case budget; both check monotonic elapsed time so delayed timer delivery cannot accept an over-budget result. Stop dispatch on timeout/abort, close progress publication and exclude all unfinished/late work from the run cache. Only completed successful helpers are reused; a new Health context starts empty. Keep safe partial progress (IDs, closed stage codes, durations), not exceptions, request bodies, credentials or fixture data. Local scheduler fault injection does not establish background-tab behavior or provider failure. The complete local Chromium/WebKit gates must continue to assert the existing behavior.

## Targeted Health evidence rule — 024

Never collapse SDK/query/service/read errors into a claim that a schema or content is absent. Use `healthReadDiagnostics` at the server and invocation boundaries; never pass raw exceptions into Health evidence. Require array/ID shape before a readiness success and an exact nonnegative safe integer before measured count. Preserve current PASS predicates and per-run memoization. Download/parse unavailability is different from successfully evaluated content inconsistency. An 18s total invocation deadline, further bounded by remaining case time with a 250ms evidence reserve, preserves diagnostics before the 20s case deadline. HC-050.2 permits one shared readonly HTTP429 retry after a completed rejection, respecting Retry-After and reserving at least 1s for the retry. No mutation/auth/shape/timeout retry or remote cancellation guarantee.

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

Keep mutation responsibility in narrow native modules and reuse existing validation/calculation. Ordinary Entity create/update/updateMany are not transaction/UNIQUE/CAS evidence. For immutable daily assignments use insert and deterministic reconciliation, never upsert. For date mutation bind receipt/owner/intent, compare revision, verify affected counts and reread actual state. Persist business consent time once; preserve it on retry. No fallback clock/naive-Z patch.

Normal write/readback must precede reset progress. The historical 016 operator-maintenance contract is superseded by the 017 target-scoped confirmation/lifecycle contract; pre/post admission is not distributed fencing. Tests exercise actual native handlers with ordinary SDK-shaped CRUD, faults and independent reconstructed clients; label those synthetic, separate hosted evidence. Existing historical atomic protocol fixtures do not enable production behavior. No SQL tooling/driver/CI requirement. [Current contract](SHINKA_BASE44_CONTINUATION.md).

## Onboarding boundaries and regression

Keep copy in the canonical onboarding catalog; do not invent translations or an algorithm for unresolved source rules. Keep transient name only in the bounded session helper and health form state only in memory. No URL/analytics/log payload may contain name, DOB, place query or cycle data. Never infer owner from a client field. Use the same backend validation, route resolver, shared guards and domainAtomic adapter contract rather than parallel rules or generic service-role CRUD.

`AUTH_TESTS`, `ONBOARDING_TESTS` and `ONBOARDING_UI_TESTS` join the existing canonical Foundation runner. The UI fixture injects fake provider and persistence adapters and a private in-memory name store; Health execution cannot initiate real OAuth or write product rows. Static inspection rejects duplicated approved onboarding validation copy and frontend GeoNames credential/host/geolocation use. Missing live dependencies are Health BLOCKED/external states, never green by fixture substitution.

## Historical ON-04 cascade regression — superseded by 035

The explicit 2026-10-20 product decision is recorded in SOURCE_OF_TRUTH; its new selector/help/status copy is centralized in onboardingCopy.js. Preserve the earlier exact-copy receipt. Keep provider hierarchy validation in the existing backend adapter and transient UI races in birthplaceSelection.js. Do not persist the path, infer a country, autoselect a result, accept an administrative record as a settlement, assume childrenJSON pagination, silently truncate lists or add a new UI dependency. B01…B18 and U09…U12 run through the local canonical runner; H10-003 retains only pure helper checks in 018. Fixtures remain synthetic and cannot close H10-004. Native keyboard/device observations must be recorded separately from programmatic selectOption tests.

## Maintenance regression boundaries

Internal Build/Health and probe implementations load through lazy routes after existing access guards. The exact probe route constant and lightweight AdminGate stay eager; tests/catalogs/measurement code must not enter the normal entry closure. H03-010 inspects actual static import/re-export edges, cycles and forbidden backend→frontend imports; the production measurement checks emitted bytes. Tests exercise injected bad edges as well as the real graph.

`node scripts/measureMaintenance.mjs /tmp/shinka-measure` enforces new measured regression budgets: initial production JS ≤500,000 raw / 165,000 gzip bytes; CSS ≤90,000 raw / 16,000 gzip bytes; no initial test modules, static cycles or page exceptions. These allow modest headroom over the measured fix and are not LCP/INP targets. Keep field performance separate. Preserve the shared 44px touch minimum; test Chromium and WebKit after form/layout changes. See [mobile evidence](reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md).

Prefer cohesive forms, resource-list presentation and controllers; no artificial line-count cap or compressed long-line application code. Generated data and fixtures are assessed separately. List labels use one linear count pass for duplicate context, not repeated nested scans. The historical hierarchy cache (16 entries/1 MiB/60 seconds) was removed in the Base44 combobox change; birthplaceSearch retains only transient results and no cross-picker cache. Never cache owner profiles or writes. Ignore late SDK completions; do not claim invoke cancellation that its API cannot provide. User-started completed Health runs retain audit persistence after navigation, with duplicate starts and stale UI updates prevented.

Active build history obeys the permanent five-package rule in DEVELOPMENT_RULES. Run `recordBuild.mjs --check`; source and generated output must agree. H01-006 and M01…M05 cover this policy. No security or evidence check may be removed solely to make the result green.

## Consent business-clock regression

Never equate native row creation with user consent time. Preserve validated persisted UTC granted_at and reuse it for immutable history. Tests must include zone-less/missing/invalid native metadata, invalid business instants, post-write lost responses, partial recovery, conflicting rows, independent-worker limitations, consent/account/deletion changes, NULL durations and no-write Skip. Coalescing is explicit, bounded and worker-local, never described as durable atomicity. SDK mutations remain in the adapter; reconciliation and grant validation are separate responsibilities.

## Admin navigation regression boundary

Keep destination inventory/localization, role decision, menu interaction and panel presentation separate. Do not repeat `role === admin` authorization in navigation components; AuthContext exposes the derived decision while backend guards remain authoritative for operations. Never add profile-related product writes to navigation handlers. Keep the panel lazy and the single-link profile entry small; its route and lightweight entry must not eagerly load Health/tests. AN01…AN08 join the canonical runner and H12/H13; `checkAdminNavigation.mjs` exercises the real App with CLI-only SDK substitution, TR/EN, keyboard/Escape/focus, 360/1280 layout, both tools and return, denied direct routes and zero product writes. The ordinary disabled icon is intentional until the full You workflow is authorized.


## Daily implementation boundaries

> Historical contract (superseded by the current 016 native contract above):
> Keep source manifest/backend astronomy out of the initial frontend graph. Import planning, SDK batches, phase calculation, selection, persistence and UI have separate modules. The write-surface tripwire adds exactly one upsert call in base44ContentLibrary and one in moonImport, both reachable only through strict admin apply dispatch; arbitrary writers remain rejected. Dry-run and Home must never trigger import. No native atomicity can be inferred from SDK method naming, synthetic concurrency or a local lock. Tests must assert production refusal until a verified adapter is explicitly added. Preserve actual selected category, immutable daily assignment and current bilingual text, bounded history and distinction between source/technical failures and UNKNOWN.


## Historical checkpoint — Calendar engineering requirements — Buildmarker-012

Keep date selection, editing identity, validation, cycle calculation, authorized snapshot reading and transaction publication separate. Reuse the shared Home cycle engine. Dates remain YYYY-MM-DD; UTC arithmetic is only integer calendar-day arithmetic, never conversion of an entered local day. A production mutation must never be enabled merely because a method named transaction/upsert exists: verify cross-worker owner serialization, crash recovery, receipts, guards and atomic publication to every authoritative reader.

Canonical CA/CU tests cover actual lifecycle, both neighbors, 14/15, local dates/DST, full pagination, NULLs/source examples, lost response, independent workers, no-consent/regrant/deletion, stale UI, unchanged Home and live-capability refusal. H08/H11/H12/H13 execute the same isolated contracts. Native evidence remains separate. Strict typecheck/lint remain enabled; no exclusions were added for Calendar or unused auth templates.

## Historical checkpoint — Test Tools implementation rules — 013

Keep UI/catalog/authorization/preview/persistence/execution separate. Only the two declared actions reach the executor. Server-controlled persistence scans target-filtered pages with explicit metadata fields, rejects malformed/duplicate pagination and foreign indirect references, and fails rather than truncates above the bounded 20,000-row safety ceiling. Cleanup snapshots IDs before deleting so offset pagination cannot skip shrinking pages. No unbounded parallel deletes.

> Historical contract (superseded by the current 016 native contract above):
> A coordinator interface is not a production guarantee. Do not enable delete/reset with an environment flag, SDK upsert, local mutex or schema assertion. Prove shared writer/roster fencing, durable job uniqueness/receipts and crash recovery before supplying a production coordinator. No persistent job stores normal profile/cycle request bodies. Fixture-only transactions remain under the canonical test tree. Hosted function entry wiring, current-User admission, reset override, protected-history scope and both browsers are part of regression coverage.


## Historical checkpoint — OD-012 and release tooling — 014

Filter supported observations only after fixing the last-three window. Preserve valid dates and distinguish no observations from all unsupported observations; never catch general technical/access failures as UNKNOWN. Keep unavailable calculation copy central. Release scripts must produce reviewable metadata/artifacts, never automatically deploy, import, reset or delete. Entity-only full sync requires complete inventory comparison; a directory with only the new schema is unsafe. Read-only CLI evidence must omit records, credentials and raw exceptions.