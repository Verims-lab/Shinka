# SHINKA — Release Health Check

**Document:** SHINKA_RELEASE_HEALTH_CHECK.md
**Status:** ACTIVE
**Current BuildMarker:** Buildmarker-010
**Last Updated:** 2026-10-20
**Authoritative Source References:** This governance set; SRC-04 §15
**Purpose:** Define the executable regression framework and gate.
**Scope:** Health catalog HC-010.0; repository, synthetic and external evidence separated.

## Catalog (HC-010.0) — 16 suites, 132 cases

Registry-derived totals: 108 current, 15 future, 9 external. H06 has 6 current + 1 external; H07 has 12 current; H10 has 1 current GeoNames + 2 future Pattern/Moon + 1 external; H11 has 2 current onboarding-consent + 3 future withdrawal/account cases + 1 external ON-05 recovery case. H08 remains entirely future. Existing H01…H05/H12/H13/H16 scopes are preserved.

H06's six current cases exercise the real auth/identity helpers with synthetic providers/principals. H07 has 12 executable current cases, including approved Sun/TR decisions, the production persistence adapter and durable resume semantics. H10-003 measures the structured GeoNames adapter contract; H10-004 requires live provider evidence. H11-004 exercises grant/history/immutability/retry contracts; H11-005 verifies the approved consent text/version and persistence contract. No future withdrawal/deletion/Moon/cycle engine behavior is promoted to PASS.

CLI output includes executable regression and current onboarding Health evidence. Every test and current onboarding Health case must PASS; BLOCKED/FAIL or another non-PASS status exits non-zero. The four approved product decisions close the earlier source gaps. Final live Full Health remains required after merge/deploy.

## Logical vs physical source model
H02-003 counts LOGICAL sources (must be 10). H02-004 requires every logical source and every physical part READ. H02-007 verifies the split UI/UX source: 4 parts, expected names, order 1→2→3→4, no gap/duplicate, continuity recorded, sole UI/UX authority, machine-readable companion present as supporting artifact (not a logical source), and documentation in SHINKA_SOURCE_OF_TRUTH.md. Artifacts are validated by role, never by a fixed physical total. H02-008 verifies all 11 UI/UX tables (design = tokens, icons = nav contract, 5 copy groups, QA checklist) and OD-010 closed. H03-008 verifies repository auth syntax plus the recorded Apple/Google policy; H03-009 exercises the actual server-admin request guard with injected anonymous/user/admin principals. Neither is LIVE_ENFORCEMENT.

## UI/UX contract cases (H13)
001 token module · 002 44×44 rendered · 003 font families rendered · 004 no overflow at 360 (Health + Build pages) · 005 accessible names · 006 rendered CSS colors = v1.1 · 007 Medium headings / Inter-500 labels · 008 nav + Lucide icons · 009 primary ≥52 rendered · 010 light-only · 011 centralized EN/TR localization · 012 mobile form/long-list regression · 013 physical Android/iOS external acceptance · 014 admin navigation/localized inventory.

## Case schema
`{ id, suiteId, title, description, severity, blocker, runnerType, applicability, status, attempted, executed, durationMs, evidence }`; evidence `{ classification, source, actual, expected, reason, timestamp }`.

## Evidence classifications
STATIC · SYNTHETIC_RUNTIME · LIVE_RUNTIME · LIVE_ENFORCEMENT · DEVICE · RECORDED_DECISION · BLOCKED_EXTERNAL. Classification ≠ status. Synthetic evidence is never described as live; static is never described as runtime.

## Statuses
PASS (evidence satisfies expected) · FAIL · WARNING · BLOCKED (current check cannot complete) · NOT_RUN · NOT_APPLICABLE (future/external). PASS without complete valid evidence or with explicit unexecuted/unattempted state is converted to FAIL; gate independently requires both execution flags to be true.

## Gate
READY only if all applicable blocker cases have 0 FAIL, 0 WARNING, 0 BLOCKED, all applicable cases attempted and executed, every PASS has valid classification/source/actual/expected/reason/timestamp evidence, and catalog integrity (H16-001…004) passes. Otherwise NOT_READY (fail/warning/integrity), BLOCKED, or INCOMPLETE. Single-suite runs yield SCOPE_PASS at best. Future/external cases never affect the gate.

## Runner
Sequential; META (H16) cases run last over collected results; every case bounded (20 s default, 90 s tests); timeout ⇒ BLOCKED, never PASS.

## Report JSON (`shinka.health.report/1`)
schemaVersion, runId, appName, buildMarker, healthCatalogVersion, sourceSetVersion, environment, scope, startedAt, completedAt, durationMs, suites, cases, summary, gate, externalRequirements, futureRequirements, openDecisions. Redacted before copy/export/storage.

## History
Completed measurements remain displayed even when persistence fails (`HEALTH_HISTORY_PERSIST_FAILED`). Admin-guarded `internalHealth.save` verifies counts/gate and uploads a private redacted full report; `report_json` is valid compact JSON bounded to 15,000 UTF-8 bytes without truncation. `list` and stored-record `report` provide admin readback; signed links expire after 300 seconds. BuildMarker comes from the canonical module. Live persistence/readback for this package has not been measured.

## External / device proof policy
H16-901/902/903 (device push, device sign-in, restore) remain EXTERNAL_RELEASE until real evidence exists; never PASS by assumption.

## Package 009 case reconciliation

| Change | Case | Reason / covered behavior |
|---|---|---|
| Update | H01-006 | Bounded unique consecutive source including current and exact generated history; M01…M05 cover fewer/exact/more than five, sorting, replacement, missing/future current and drift. |
| Add | H03-010 | Initial import closure excludes tooling/tests; no static cycle or backend→frontend edge. Node negative fixtures detect injected violations; production measurement guards actual byte sizes. |
| Update | H05-009 | 009 is expressly maintenance-only: still require live zero counts/no import; At that package 010+ remained unapproved; the explicit 010 admin decision below extends only 010, leaving 011+ blocked. HC08/HC12 cover both. |
| Update | H10-003 | Existing GeoNames security/redirect/selection coverage retained; M06…M08 add bounded cache, scoped revisits and one-profile-read/no-preferences with inactive/anonymous denial. |
| Add | H13-012 | U12…U14: selects ≥44px, 320px/landscape/reduced viewport, 200% text, focus/date/time/submit reachability, long Turkish homonyms and bounded list DOM. Synthetic DOM evidence only. |
| Add | H13-013 | DEVICE / EXTERNAL_RELEASE, no runner. Real OS keyboard, native sheets, zoom, insets, background return and callbacks require physical Android/iOS evidence. |

No suite or case deleted, no existing applicability downgraded, no failed case disabled. H13-002 remains the same touch-size contract and now passes WebKit after the shared control fix. HC-008.0 increments once because definitions changed. H03-007 continues to execute every canonical test; M09 also checks Health double-run/stale-history/unmount behavior. Its 90-second deadline is unchanged.

Final local results and exact environment are recorded in [Development Notes](SHINKA_DEVELOPMENT_NOTES.md) and [Android/iOS report](reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md). Baseline Chromium: 287/287; baseline WebKit: 285/287 (T80, U12). New canonical registry: 298 tests, all prior 287 retained. Current local static/general subset contains 52 cases; onboarding contains 21. These subsets are not deployed Full Health. The five extra mobile scenarios and eight routing/Preview scenarios are reported separately from canonical tests.

## Required external closure

Run the deployed **current** marker/catalog Full Health and save/list/open its private report. Verify both function bundles, live Apple/Google callbacks, new GeoNames country/region/settlement/resolve/save, owner A/B/admin/anonymous boundaries, explicit NULLs, native timestamp offsets, keyed uniqueness/conditional updates and protected-history behavior. H04-006, H06-007, H10-004, H12-901, H13-013 and H16-901/902/903 plus H11-006 remain nine explicit external requirements. First Shinka and future engines remain unimplemented.

The 2026-10-19 live zero counts, historical readiness and transport evidence are retained once in [prior evidence](reports/SHINKA_PRE_009_EVIDENCE.md). They do not certify package 009. Package retention only bounds Internal Build; it does not prune necessary Health evidence or security records. External cases remain listed N/A in normal runs and cannot be promoted to PASS by local fixtures.

## HC-009.0 ON-05 corrective coverage

H07-007 adds production partial-write/reload evidence. H07-011 automatically includes P21…P32; H11-004 explicitly checks business-clock authority, ambiguous native metadata, preserved grants, event/period failures, conflicts, consent withdrawal/account/deletion guards and worker-local versus independent-worker concurrency. P17's former synthetic native-clock convergence claim is replaced with bounded worker coalescing. P18's expectation to block valid consent because native metadata lacks timezone is invalid under the corrected business contract; it now requires safe recovery with unchanged granted_at. No test/Health case was deleted.

H11-006 is a new LIVE_RUNTIME external requirement: deploy current repository code, retry the same partial account, confirm saveCycle success and read current consent/event/period/settings back. Missing evidence remains NOT_APPLICABLE (EXTERNAL_RELEASE) with an explicit external requirement under existing catalog policy; it does not mean the incident passed. ON-05 closure remains OPEN_PENDING_LIVE_SAVE_AND_READBACK regardless of the synthetic gate. This semantic change requires HC-009.0, while the same maintenance package retains Buildmarker-009.

## HC-010.0 admin navigation reconciliation

Add H12-025 (real AuthContext/ProtectedRoute/AdminGate with injected identities: pending/anonymous/user, role loss, logout failure, obsolete responses) and H13-014 (fixed two-tool inventory, exact TR/EN copy and panel/tool/app navigation). Retain H12-003/S08, T68/H03-009 server guard coverage and H13-008's three-item bottom navigation contract. No case is removed or downgraded. H05-009/HC08/HC12 now explicitly cover pre-content package 010; 011+ is still blocked pending an approved content validation policy.

AN01…AN08 are canonical synthetic tests. CLI additionally drives actual App routes with a test-only SDK replacement, 360/1280 viewports, TR/EN, keyboard menu/Escape/focus restoration, incomplete onboarding and existing Home entry, shared returns, no product writes and pending/revoked access. Screenshot evidence is local, not live identity/device proof. Run both browser engines plus existing Preview/mobile, repository, dependency/security, type/lint/build, history and production budget checks. Deployed current marker/catalog, admin/user/anonymous direct routes, backend denials and Full Health report readback remain manual release evidence. ON-05 retains its separate same-account live requirement.
