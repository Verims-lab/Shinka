# SHINKA — Build History

**Document:** SHINKA_BUILD_HISTORY.md
**Status:** ACTIVE — append-only
**Current BuildMarker:** Buildmarker-008
**Last Updated:** 2026-10-20
**Authoritative Source References:** src/foundation/buildMarker.js (authority), src/foundation/buildLedger.js (ledger)
**Purpose:** Human-readable build history. Never rewrite old entries.
**Scope:** All packages.

## Buildmarker-001 — Greenfield Foundation / Governance (2026-10-18)
Scope: source-of-truth framework · BuildMarker · incremental build governance · Health Center · regression architecture · canonical documentation · code/UI standards · internal Build & Environment surface.
Health catalog: HC-001.0. Expected gate: BLOCKED (H02-004, H13-006 — UI/UX v1.1 not received).
No end-user product package implemented. No GitHub work. No AI.

## Buildmarker-002 — UI/UX v1.1 Split-Source Reconciliation (2026-10-18)
- The original UI/UX v1.1 DOCX exceeded the Base44 attachment size limit; it was supplied as four transport parts (Part 1–4 of 4).
- Parts read in order; continuity verified; reconstructed as ONE logical source (SRC-03). Logical sources 10, physical attachments 13.
- Source inventory corrected (logical vs physical model); OD-001 resolved by source receipt; OD-010/OD-011 recorded.
- Visual standards reconciled: v1.1 colors, typography, spacing, radii, card/button/input, 200 ms motion, light-only; navigation + Lucide icon contract; centralized UI states and EN/TR localization infrastructure.
- Health catalog HC-002.0: split-source integrity (H02-007) and UI/UX contract cases (H13-006…011); tests T26–T45.
- No end-user product package started. No product data imported. No GitHub work.

## Buildmarker-003 — Foundation Final Closure (2026-10-18)
- UI/UX v1.1 machine-readable table companion added as a supporting physical artifact of SRC-03 (not a new source; logical sources stay 10, physical artifacts 14).
- All 11 tables mirrored verbatim (`src/foundation/uiuxTables.js`); no conflict with the written split source; OD-010 resolved.
- Auth policy recorded (`src/foundation/authPolicy.js`); platform still exposes email/password, Microsoft, Facebook → OD-003 FOUNDATION_BLOCKING (dashboard change required).
- Open decisions reclassified: OD-002/OD-004/OD-009 FUTURE_PACKAGE.
- Health HC-003.0 (81 cases: +H02-008, +H03-008); tests T46–T48 (48 total).
- Tests and Full Health: executed only by an admin from Health Center; results recorded in run history.

## Buildmarker-004 — Foundation Health Closure (2026-10-18)
- H03-001/T21: false positive — scanner matched import text inside a test string literal; now statement-level only. No real legacy import existed.
- T41/H13-004: probe waited for `[data-health-root]`, which only Health Center renders; now `[data-probe-root]` on every internal page, explicit TIMEOUT/ERROR reasons.
- History: report_json exceeded the entity field size limit; full redacted report now a private file + compact case index; error code HEALTH_HISTORY_PERSIST_FAILED.
- Tests T49–T51 (51 total). Health catalog HC-003.0 unchanged (81 cases).

## Buildmarker-005 — Foundation Repository Corrective & Hardening (2026-10-19)
- Provider-only repository auth, localized safe errors, fixed 20px page padding and ≥52px auth controls; OD-003 repository policy implemented. Historical auth configuration evidence preserved; final live sign-in not claimed.
- Syntax-aware canonical legacy scanner (static/dynamic imports; strings/comments/templates handled); personal-email fixture uses reserved example domain without exempting test files.
- Safe build-time inspection metadata replaces raw source/document bundling; external source receipt is explicitly distinguished from artifact hash verification.
- Canonical shared execution/evidence gate and missing-category decisions hardened. Admin-guarded backend operations, private full report with bounded summary, safe failure retention and signed readback added.
- Same 74 canonical tests in Health and real-browser CLI; lint scope and type coverage expanded. HC-004.0: 16 suites, 82 cases (55 current, 24 future, 3 external); H03-009 added and H16-003 semantics tightened.
- Repository Foundation OPEN: unresolved High dependency advisories documented in SECURITY_PRIVACY; no waiver. Local checks are not final deployed Base44 Full Health, live history readback or current Authentication configuration proof.
- No product feature/data/legacy import. Git changes target Test only; main is not modified.

## Buildmarker-006 — Foundation Dependency Security Closure (2026-10-19)
- Fresh graph/advisory audit confirmed the Tailwind 3.4.19 → braces High chain, with no patched braces or supported 3.x parent fix. Controlled migration to Tailwind 4.3.3 / `@tailwindcss/vite` removed all five High affected packages and two Moderate affected packages.
- Native CSS theme/source/plugin integration replaces obsolete Tailwind/PostCSS configs; direct Autoprefixer/PostCSS/Chokidar removed, animation plugin retained as dev-only. No override or forced audit fix.
- Preserved canonical Shinka tokens, light-only mode and measured mobile/desktop Foundation layouts; original 74 tests plus six CSS regressions in the same runner. Native `security:deps` blocks Critical/High.
- HC-004.0 unchanged (16 suites / 82 cases); BuildMarker incremented exactly once. Canonical document headers aligned.
- REPO_CLOSED_PENDING_BASE44_VERIFICATION: 0 Critical / 0 High / 2 Moderate / 0 Low; remaining router advisories have documented exposure/fix reasons. Final live Full Health, history readback and Authentication configuration proof still required.
- Test synchronized from main before work; final package targets only Test. No product features, product data or legacy source imported.

## Buildmarker-007 — Data Model & Security Foundation (2026-10-19)
- 20 physical source-aligned product schema files; explicit logical/PascalCase mapping and independent workbook field receipt. Built-in User and InternalHealthRun remain separate; no extra product entity or data import.
- Common authenticated owner/admin guards, active/consent checks, backend-only reads, deny-direct RLS and protected snapshot/event/audit/job policies. Minimal audit/system-error metadata helpers reject sensitive content.
- Canonical uniqueness keys, idempotent create, revision-based update and readback contracts fail closed without a proven durable atomic adapter. Native UNIQUE is unsupported; native FK/index/transaction/rollback remain unverified.
- OD-004 and OD-009 partially verified; no duplicate timestamp fields and no synthetic-to-live evidence promotion. H04/H12 activated/expanded in HC-005.0; 46 new canonical data/security tests; BuildMarker incremented exactly once.
- Baseline live read-only inventory found 0/20 product schemas. Repository now represents 20/20; deployed Full Health/enforcement remain required. Package targets only Test, main unchanged; no user-facing product package or seed.

## Buildmarker-008 — Authentication & Onboarding (2026-10-19)

- Apple/Google-only auth, independent pre-auth 18+, ON-01…05, finite ON-06 and owner-safe production SDK persistence with verified readback.
- Same-package continuations: actual SDK adapter added, then approved fixed tropical Sun, exact EN/TR product copy/helpers, health-consent-v1.0 and derived durable onboarding rule integrated. Missing birth_time stays NULL, no 00:00 Sun fallback. Existing product schemas unchanged.
- Actual owner user_daily_message is the final durable completion marker. Skip may safely resume ON-05 before that record exists. No generated daily content or new completion field.
- Initial final closure retained HC-006.0 (16 suites / 126 cases). Existing H06/H07/H11 cases now have clean repository evidence; live cases remain external. 215/215 tests; Critical/High 0; all native checks PASS.
- CLOSED_PENDING_BASE44_VERIFICATION. Four source gaps RESOLVED_BY_PRODUCT_DECISION; internal blockers 0. First Shinka is an explicit next-package dependency. Native storage/enforcement and deployed Full Health/auth/GeoNames remain unverified. Test only; main unchanged. Existing ledger entry updated, not duplicated.

- Measured Base44 Health continuation retains the same 008 entry and advances HC-006.0 → HC-007.0 with 126 cases unchanged. T74 now measures the real unauthenticated shell on an explicit isolated route; live `/login?probe=1` had hydrated the admin profile instead. H05-009 replaces obsolete schema absence with exact live zero counts before the content package; future 009 requires approved imported-content validation. All three live content tables measured 0 in the Base44 admin Data panel; no import, write or deletion. New deployed Full Health remains required.
- Final Health closure checks: 231/231 canonical tests and 3/3 production-route scenarios, H06 6/6, H07 12/12, H10 contract, H11 onboarding 2/2 and H12 20/20 preserved; Critical/High 0; clean install/tree, security guard, typecheck, lint, build and Repo Health PASS. Status remains CLOSED_PENDING_BASE44_VERIFICATION.

- GeoNames same-package correction: HTTPS provider host changed to secure.geonames.org after credential-free TLS mismatch reproduction; exact server secret binding and complete UI/service/provider/persistence regression coverage added. Test-only delivery; new deployed provider success remains external. BuildMarker 008 / HC-007.0 unchanged.

- Configured-secret live follow-up retains 008/HC-007.0: request-scoped Base44 runtime secret access, safe provider/HTTP/network/timeout diagnostics and read-only lookup regressions. Secure host retained; generic live failure does not establish a missing-secret cause. Manual runtime verification remains external; Test only.

- Fetch-failure continuation retains 008/HC-007.0: user supplied the same pre-response GEONAMES_NETWORK_ERROR in application and Test Function. Repository matches the supplied source. Existing diagnostics now expose allowlisted failure stage and transport class, with bounded transient cause classification and G09–G12 regression coverage in H10-003. No functional cause is proven; URL input/binding/redirect policy unchanged. Repository diagnostics complete; live GeoNames remains OPEN_PENDING_MANUAL_VERIFICATION, superseding any interpretation of earlier FIXED wording as live closure. No deployment or main write.

- FETCH/UNKNOWN isolation continuation: matched the supplied invocation ID in the correct app's Logs Explorer. Authenticated CLI preview/prod runtime queries returned no rows; event metadata contains no exception or timezone. Normal adapter/classifier unchanged. Added a strictly admin-only, manually invoked comparison on existing internalHealth, with adaptive/repeated URL/receiver/credential controls, fixed credential-free HTTPS/redirect controls, bounded requests/deadlines and safe output. G13–G20 extend existing H10-003 synthetic coverage; no catalog-semantic/marker increment. REPO_PROBE_READY_PENDING_USER_DEPLOYMENT; live GeoNames remains OPEN_PENDING_MANUAL_VERIFICATION. User retains Test → main merge and Base44 sync/publish.

- Redirect-policy compatibility continuation: user-supplied v1 preview/internalHealth F1 reached HTTP 401 without credentials; D1/F1 source differs only in redirect policy. Hypothesis supported, no definitive root cause or live product success. Shared normal adapter uses manual with pre-parse 3xx/opaque rejection and bounded unused/late-body cleanup. Existing admin probe narrowed to four credentialed error/manual/error/manual samples, version geonames-redirect-policy-v2; guards/limits unchanged. G21–G24 extend H10-003; 008/HC-007.0 retained. REPO_FIX_READY_PENDING_USER_DEPLOYMENT; H10/live GeoNames OPEN_PENDING_MANUAL_VERIFICATION. Test-only delivery; user controls merge/sync/publish.

- 2026-10-20 ON-04 continuation, same 008 entry / HC-007.0: explicit user decision replaces text search with country → available administrative levels → populated-settlement selection. Added authenticated read-only country/hierarchy/filtered-page actions, bounded payloads/pages, parent/child validation, race-safe transient selection, clear/retry/saved-place behavior and central TR/EN copy. Five persisted fields and all product schemas stay unchanged. Old Preview search HTTP 200/eight places is user-reported live evidence; new hosted cascade/resolve/save/readback remains open. B01…B18 plus U12 extend canonical/H10 coverage; device popup keyboard check remains pending. Test-only delivery; no deployment or main write.
- ON-04 final local evidence: 287/287 canonical tests, 8/8 routing/Preview, 49/49 general Health, 21/21 onboarding Health, H10-003 55 regressions PASS; required install/tree/security/type/lint/build/repo checks PASS. Critical/High 0; two existing Moderate findings. 12/12 canonical docs aligned, 20 schemas unchanged. New hosted selection/save and native device keyboard evidence remain open.
