# SHINKA — Release Health Check

**Document:** SHINKA_RELEASE_HEALTH_CHECK.md
**Status:** ACTIVE
**Current BuildMarker:** Buildmarker-008
**Last Updated:** 2026-10-19
**Authoritative Source References:** This governance set; SRC-04 §15
**Purpose:** Define the executable regression framework and gate.
**Scope:** Health catalog HC-006.0; repository, synthetic and external evidence separated.

## Catalog (HC-006.0) — 16 suites, 126 cases

Registry-derived totals: 104 current, 15 future, 7 external. H06 has 6 current + 1 external; H07 has 12 current; H10 has 1 current GeoNames + 2 future Pattern/Moon + 1 external; H11 has 2 current onboarding-consent + 3 future withdrawal/account cases. H08 remains entirely future. Existing H01…H05/H12/H13/H16 scopes are preserved.

H06's six current cases exercise the real auth/identity helpers with synthetic providers/principals. H07 has eight executable contract cases plus four explicit BLOCKED capabilities (Sun resolver, approved TR copy, production atomic adapter, durable skipped-step resume). H10-003 measures the structured GeoNames adapter contract; H10-004 requires live provider evidence. H11-004 exercises grant/history/immutability/retry contracts; H11-005 remains BLOCKED for approved consent text/version. No future withdrawal/deletion/Moon/cycle engine behavior is promoted to PASS.

CLI output separates executable regression PASS/FAIL from onboarding Health BLOCKED findings. Required repository tests must all pass, while the package gate remains OPEN/BLOCKED on the named capability gaps. No arbitrary failing case is waived: CLI rejects onboarding Health FAIL or any status other than PASS/BLOCKED; named gaps are visible in the complete output. Final live Full Health remains required after merge/deploy.

## Logical vs physical source model
H02-003 counts LOGICAL sources (must be 10). H02-004 requires every logical source and every physical part READ. H02-007 verifies the split UI/UX source: 4 parts, expected names, order 1→2→3→4, no gap/duplicate, continuity recorded, sole UI/UX authority, machine-readable companion present as supporting artifact (not a logical source), and documentation in SHINKA_SOURCE_OF_TRUTH.md. Artifacts are validated by role, never by a fixed physical total. H02-008 verifies all 11 UI/UX tables (design = tokens, icons = nav contract, 5 copy groups, QA checklist) and OD-010 closed. H03-008 verifies repository auth syntax plus the recorded Apple/Google policy; H03-009 exercises the actual server-admin request guard with injected anonymous/user/admin principals. Neither is LIVE_ENFORCEMENT.

## UI/UX contract cases (H13)
001 token module · 002 44×44 rendered · 003 font families rendered · 004 no overflow at 360 (Health + Build pages) · 005 accessible names · 006 rendered CSS colors = v1.1 · 007 Medium headings / Inter-500 labels · 008 nav + Lucide icons · 009 primary ≥52 rendered · 010 light-only · 011 centralized EN/TR localization.

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

## Gate history
- Buildmarker-001: BLOCKED by H02-004 and H13-006 (UI/UX v1.1 not received).
- Buildmarker-003: measured Full Health 51 PASS / 2 FAIL (H03-001, H03-007) / 1 BLOCKED (H13-004) / 27 N/A → NOT_READY; history save failed (report_json exceeded field size limit).
- Buildmarker-004: fixes — legacy scanner statement-level imports; probe waits for `[data-probe-root]` (Build & Environment had no Health root marker); history stores full report as private file. Latest user-supplied baseline: 81 total, 54 planned/attempted/executed, 53 PASS, 1 FAIL (H03-004), 27 N/A; NOT_READY. This is prior-marker evidence.
- Buildmarker-002: expected READY for applicable Foundation cases once an admin Full Health run records it; future suites NOT_APPLICABLE.

## Corrective package evidence boundary — Buildmarker-005
Buildmarker-005 / HC-004.0: 74 canonical tests (T01–T74) run from Health Center or `npm run test:foundation`. CLI uses a real local Chromium for DOM probes and synthetic backend principals; it does not contact live Base44. H03-004 fixture now uses a reserved example domain; T53 still detects an injected personal-email shape in app/config/test paths. H03-001/T21/T52 preserve real static/dynamic import detection without excluding tests.

H16-003 now verifies execution as well as evidence. T56–T60 cover unexecuted/unattempted PASS, complete PASS, future/external isolation and invalid evidence. H05 category propagation is tested with actual case runners.

At Buildmarker-005, unresolved High dependencies kept repository status OPEN. Local test or Health PASS could not override that blocker. Deployed Full Health, live private history save/list/open, current Authentication panel and real non-admin/direct invocation enforcement were not verified.

## Historical package evidence boundary — Buildmarker-006
HC-004.0 remains unchanged: no case definition, applicability, gate or evidence semantics changed. H03-007 runs the expanded canonical 80-test suite (original T01–T74 plus CSS T75–T80) in Health Center and CLI. BuildMarker, design tokens, responsive internal routes, auth policy, legacy firewall and source integrity remain covered; static source hashes now include CSS.

Repository Foundation status: **REPO_CLOSED_PENDING_BASE44_VERIFICATION**. Fresh audit: 0 Critical / 0 High / 2 Moderate / 0 Low. Native `npm run security:deps` must pass alongside clean install/tree, zero-error typecheck, all 80 tests, lint and build. Moderate router dispositions are recorded in SECURITY_PRIVACY; no Critical/High waiver exists.

BASE44_FINAL_FULL_HEALTH_REQUIRED, BASE44_HISTORY_READBACK_REQUIRED and BASE44_AUTH_CONFIG_VERIFICATION_REQUIRED remain YES. Run deployed current-marker Full Health and save/list/open its private history report, then verify current providers and real user/admin boundaries. Repository/local results do not establish FULLY_CLOSED.

## Current package evidence boundary — Buildmarker-007
HC-005.0 changes H04 from documented-only/absent-expected to source-aligned physical repository schema validation. H04-006 is now an explicit external deployed-presence requirement; it must find all 20 after deployment. H04-007…015 cover source fields, types/ranges/nulls, references, uniqueness, atomicity protocol, timestamp honesty and complete deny/access policy. There are 15 H04 cases: 14 current checks plus one external requirement.

H12 is active. Stable IDs 001/002/003 now execute row-isolation, protected-admin denial and internal-tooling denial contracts; 004…020 cover authentication, forged authority, shared lookups, account/consent, worker grants, jobs, audit and logging. All 20 current H12 checks are SYNTHETIC_RUNTIME, exercising real shared backend functions with injected identities/stores. H12-901 separately records LIVE_ENFORCEMENT_REQUIRED. It never turns green because the synthetic cases pass.

Canonical test registry: existing 80 Foundation/CSS regressions retained; D01…D22 add 22 data-model tests; S01…S24 add 24 security tests; total 126. The same definitions run in the existing in-app/CLI runner. No second framework or product data is introduced. H03-007 runs the complete canonical set. CLI additionally runs selected H03 checks plus all 14 current H04 and 20 current H12 checks against build-time/synthetic evidence. No deployed Full Health result is inferred from that local subset.

`npm run health:repo` is read-only: exact 20 schemas/no extras, native User/internal separation, independent source-field receipt, complete access matrix/direct deny rules, seed/import write-call tripwire, marker/ledger/catalog/doc consistency, legacy/credential checks. The write-call check allows only the audited metadata writer and InternalHealthRun persistence; adversarial injection is tested. It does not claim a live database row-count audit.

Evidence required after Test push: BASE44_FULL_HEALTH_REQUIRED=YES, BASE44_LIVE_ENFORCEMENT_REQUIRED=YES. Deploy the Test revision through the approved Git/Builder workflow, then run Full Health and save/list/open its private report. Measure direct SDK anonymous/user A/user B/admin denials and backend access separately. Record native timestamp UTC/update/protected-history semantics, required/optional/null/enum/range behavior and backend-only writes. Avoid successful writes to real immutable history during tests. Native UNIQUE/compound UNIQUE are documented unsupported; prove an atomic production equivalent before enabling any dependent writer. FK/index/conditional-update/transaction/rollback remain unverified. Device/provider/restore evidence remains release scope.

A regular Full Health run marks external cases NOT_APPLICABLE and lists the requirements; invoking the external checks directly without sufficient proof yields BLOCKED. Do not hide those external requirements or call the package FULLY_CLOSED. Current repository package status after all mandatory checks: CLOSED_PENDING_BASE44_VERIFICATION. OD-004 and OD-009 remain PARTIALLY_VERIFIED, OD-002 OPEN. No product flow/import/seed.

## Final repository verification — Buildmarker-007
2026-10-19: `npm ci`, `npm ls --all`, `security:deps`, typecheck, lint, build and `health:repo` PASS. Fresh npm audit: 0 Critical / 0 High / 2 Moderate / 0 Low (native JSON audit exit 1 for Moderate, High-threshold guard exit 0). No dependency versions/lockfile changed; Tailwind remains 4.3.3. Existing npm configuration and build chunk/mixed-import warnings remain non-blocking.

Canonical CLI: **126 PASS / 0 FAIL**, no browser exceptions; existing 80 preserved, 22 data-model + 24 security tests added, none removed. Local H04: 14 PASS / 0 FAIL / 0 BLOCKED current cases; H12: 20 PASS / 0 FAIL / 0 BLOCKED current cases. H04-006 and H12-901 are external requirements, excluded from those current counts and not certified. Registry: **HC-005.0 / 16 suites / 109 cases / 83 current / 21 future / 5 external**. Repository health confirms 20/20 schemas, zero extras, complete policy matrix and no unexpected seed/import call.

REPOSITORY VERIFIED and SYNTHETIC_RUNTIME VERIFIED. LIVE_RUNTIME evidence covers only the read-only baseline inventory and tooling timestamp availability. LIVE_ENFORCEMENT remains REQUIRED. Internal package blockers: 0. Package: **CLOSED_PENDING_BASE44_VERIFICATION**. Final deployed Full Health, live enforcement and the capability dependencies above remain external; no product flows or imported/seeded data.

## Authentication/onboarding evidence boundary

Repository checks prove source/catalog/docs alignment and no unexpected product schemas or seed/import calls. STATIC evidence covers the auth surface and copy/proxy scanner. SYNTHETIC_RUNTIME covers shared validators, server guards, injected atomic action protocol and real rendered screen interactions. Fixtures use isolated in-memory records/name state and fake providers; no live OAuth, GeoNames or product mutation occurs. LIVE_RUNTIME and LIVE_ENFORCEMENT are not claimed. Physical mobile keyboard and provider callbacks remain EXTERNAL/DEVICE REQUIRED.

The package is OPEN despite passing deterministic tests because required implementation/source capabilities remain unavailable. ON-06's FIRST_SHINKA_ENGINE_REQUIRED is an additional expected next-package dependency; UC-06 is not implemented.

## Final repository verification — Buildmarker-008 (2026-10-19)

Executed after clean `npm ci`: `npm ls --depth=0`, `security:deps`, `typecheck`, canonical `test:foundation`, `lint`, `build`, and `health:repo` all exited 0. Audit: **0 Critical / 0 High / 2 Moderate / 0 Low**; the two previously documented React Router package findings remain. No dependency version/lockfile change was introduced. Build retains non-fatal shared-test chunk/dynamic-import size warnings; these are not live performance evidence.

Canonical regressions: **171 PASS / 0 FAIL**, zero browser exceptions. Existing Foundation 80 + Data 22 + Security 24 preserved; added Auth 9 + Onboarding 31 + rendered UI 5. One existing provider-boundary test updated for the mandatory declaration argument; none removed. Actual screen captures and DOM probes covered 360px and 430px; input font/focus issues found during implementation were corrected. External fonts and physical keyboards/providers are not certified by the isolated harness.

Registry: **HC-006.0 / 16 suites / 126 cases / 104 current / 15 future / 7 external**. Current H06 **6 PASS / 0 FAIL / 0 BLOCKED** (plus one external case); H07 **8 PASS / 0 FAIL / 4 BLOCKED**. H10-003 GeoNames contract PASS; H10-004 live availability external. H11-004 onboarding consent contract PASS; H11-005 approved consent text/version BLOCKED. Other future cases remain inactive/NOT_APPLICABLE. The five named current capability blocks are not converted into test failures or successful live verification; **package OPEN**.

Repository health confirms 20 physical product schemas, no extras, unchanged source fields/direct SDK deny rules, complete access matrix, copy/proxy policy, no seed/legacy/credential findings, one marker/ledger transition and all 12 aligned document headers. Evidence is REPOSITORY / STATIC / SYNTHETIC_RUNTIME only. BASE44_FULL_HEALTH_REQUIRED, BASE44_LIVE_AUTH_REQUIRED, BASE44_LIVE_GEONAMES_REQUIRED and BASE44_LIVE_ENFORCEMENT_REQUIRED remain pending after merge/deploy. FIRST_SHINKA_ENGINE_REQUIRED is explicitly next-package work.
