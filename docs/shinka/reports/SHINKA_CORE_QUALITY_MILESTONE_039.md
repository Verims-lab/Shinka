# Shinka core quality milestone — 039

**Status:** LOCAL_MILESTONE_VERIFIED / HOSTED_ACCEPTANCE_PENDING

**Scope:** Buildmarker-039 / HC-039.0, Test only, 2026-10-27. Existing Base44 identity/data authority; 036–038 decisions retained. No hosted call, Health, platform scan, user mutation, import, deployment, scheduler or native build. Main/publish remain owner actions. This report does not certify physical Android/iOS, real OAuth/GeoNames, original ON-05/First Shinka incidents or the currently published source.

## Baseline and evidence boundaries

Clean local Test and origin/Test started at `0fb6b5e9aed0c312956d50c52a0804444ccf8ef6`. Fetch found main `6ec07a4f9cb5a7c63a5a6baf9f19cb0da38dd6d1` one merge commit ahead, with **identical file trees**. Authorized fast-forward and Test push completed before edits; no user changes overwritten. One package increment; active ledger 035–039. Skills refreshed in a temporary directory; repository skill/configuration changes were not installed over user files.

Delivery fetch found a later Base44 bot commit `cf523b68c8efc00de008092bd22315e01a7711b5`: only `fast-deep-equal` 3.1.3 lock metadata changed from `devOptional` to `dev`; version/resolved/integrity stayed identical. It was fast-forwarded into local/Test without overwriting edits. Clean install and tree comparison confirmed the same 1,503 installed dependency paths/versions. Final full runs were renewed on this base; the earlier passing snapshots are retained as `pre-main-sync-*` and `pre-home-retry-*`, not substituted for final execution.

The production App/SDK transition baseline was measured before product edits. Entity/auth/byte comparison uses the identical instrument on an archived 6ec07a4 source tree and final source; only ordinary SDK transport/reference IO is synthetic. No fabricated locks, transactions, CAS or rollback. Fresh final source manifest, exits, full outputs and per-case evidence are in [core-quality-039](core-quality-039/verification.json). Earlier 038 results are baseline inventory only, never counted as 039 execution.

## Findings, fixes and residual limits

| Finding | Proven cause and correction | Standard / regression / Health | Residual boundary |
|---|---|---|---|
| CQ-F01: silent incomplete generic list | `filter(...,100)` returned no completeness marker. `domainReadPage` requests declared fields and 101 rows, checks shape/unique IDs/all owners, returns ≤100 plus `truncated`. Exact 100 is complete; leaked sentinel owner rejects. No guard removed. | DATA_MODEL bounded views; CODE_STANDARDS 039; CQ01/02 → new H12-042 | Not an export/pagination feature; dedicated feature readers retain their own traversal. No hosted performance claim. |
| CQ-F02: uncertain preference intent lost | Edit/load/new-section actions could replace an unknown save; failed verify changed unknown to ordinary error. Controller and real Edit button now lock, retain original payload/revision, and keep failed read-only verification uncertain. | BUSINESS_FLOW / UI_UX_STANDARDS 039; CQ03/04/08 → H12-038, local H13-018 | Reopen rereads durable state; no durable client intent/rollback guarantee added. Actual SDK work may continue after timeout. |
| CQ-F03: stale Home after denied access | Hook cleared only a subset of auth/consent errors; lifecycle/profile/owner errors could retain the previous card, and Home could still use hydrated name. Closed access-code classification clears cards; the name requires a retained/verified daily value, so clearing the error during pending Retry cannot restore the old name. | SECURITY_PRIVACY / BUSINESS_FLOW 039; CQ06/10 → local H07-013 | Ordinary network/content failures deliberately retain verified content. No claim of instantaneous remote revocation. |
| CQ-F04: Home work restarts after logout | Session event invalidated pending result but did not stop subsequent focus/day/manual reload for that hook lifetime. Ended-session state now suppresses further requests and rejects late results. | TECHNICAL_ARCHITECTURE 039; CQ07 → local H07-013 | Fresh authenticated mount can load; dispatched SDK call is not claimed cancelled. |
| CQ-F05: duplicate Health subgroup defense missing | Full local runner rejected duplicates, but an individual in-app helper group lacked that check. Probe now rejects duplicates before execution; empty/failing group stays FAIL and never enters completed cache. | CODE_STANDARDS / RELEASE_HEALTH_CHECK; CQ09 → H16-007 | Static inspection never certifies live enforcement; external evidence stays pending. |
| CQ-A01: admin A on synthetic B | Actual native reset/deletion, interrupted deletion and same-operation resume preserve fresh A identity/role and unrelated users; normal-user tool request rejects. No product defect found. | SECURITY_PRIVACY; CQ05 → H12-029 | Hosted/platform role and token behavior remain external. |
| CQ-D01: stale current documentation | Source authority still described ON-04 no-Back under a “current” 035 heading; CSS standard mentioned removed dark variant; initial 034 NOT_RUN was presented as current; Pattern hidden/offline clearing conflicted with 038. Current sections corrected, dated failures/decisions retained. | SOURCE_OF_TRUTH / CODE_STANDARDS / SECURITY_PRIVACY / DEVELOPMENT_RULES | Historical receipts unchanged; no old FAIL rewritten. |

Changes stay in current controller/service/reader responsibilities. No broad cosmetic refactor, new state framework, dependency upgrade or shared authority cache. OAuthConsent/AuthLayout and reserved auth template slots were examined: they are not registered in the App/router/import graph. Reserved password-template slots already forward to approved onboarding; retained Base44-generated scaffolding is not a reachable product security finding. No byte saving is attributed to unreachable code.

## Executed flow matrix

Final status/engine counts are linked in the verification section; these are local actual-component/router and ordinary SDK-fixture tests, not hosted E2E certification. The full canonical runner substitutes transport, not business validation, authorization or calculations.

| Screen / risk | Actual execution and assertions | Health / separate limit |
|---|---|---|
| Auth/session | AuthProvider, ProtectedRoute, AdminGate and App routes: A01–09, SS01/02/06–10, AN02–07; `checkProductNavigation`/productionRouting cover direct route, back/forward/reopen, coalesced identity, transient/invalid session, account/logout late reply. QM05 rejects unsafe return paths/bootstrap injection. | H06, H12-025; real provider/device callback remains H06-007/H16-902. |
| Onboarding | O/P/C/OA/OF/OU/OV/U/FX groups plus `checkOnboardingClosure`: ordered five screens/unnumbered preparation, Back/name Skip, device/saved locale, adult DOB-only with NULL time/place/no provider, HH:mm and modal Set/Cancel/Clear, A/P search/paging/select/clear, consent/Skip/no fake 5/28, readback and preparation retry. | H07, H10-003, H11-004/005; original ON-05 H11-006 and First Shinka stay external. |
| Home | DM/NA/DU and `checkDailyFlow`, `checkMobileExperience`: immutable candidate/reopen, response loss/races, locale/profile, pull/error retry; CQ06/07/10 now exercise denial clearing, stop-after-logout and text escaping in actual hook/Home. | H09/H07-013; hosted first creation/two clients H09-901. |
| Calendar | CA/CR/CF/RC + NA08–13, CU/FX02 and `checkCalendarFlow`: past/today/future, ≥15-day and OD-012, edit/delete/cancel, pending receipt and lost reply, original action ID recovery, conflict/independent clients, requested month, withdrawn state and late task isolation. | H08/H12-027/local H13-015; native concurrency limits unchanged, hosted H08-901. |
| Pattern | PT/PF/PU and `checkPatternFlow`: assigned category tie/order, no visible count, current phase/strict next FULL/IANA date, empty/partial/gaps, section error/retry, controlled 120s/300s refresh and return/online coalescing without clearing cards. | H10-001/H12-037/H15-004/local H13-017; no physical/device proof. |
| You | YT/YU/`checkYouFlow` plus CQ03/04/08: actual save/cancel/clearing, preference readback/locale, error/draft/focus, unknown result/check failure/same intent, reopen and role/logout. | H11-007/H12-038/local H13-018. |
| Privacy | PR/PV, `checkPrivacyFlow`, native fault tests: withdrawal/regrant, no health without consent, cancel, same request/recovery, partial/native removal pending, residual denial, no false success, old-session invalidation. | H11-001/002/003/H12-039; platform purge/restore/provider erasure external H11-008/H16-903. |
| Admin | AT/AU/TP/NA + CQ05, `checkAdminNavigation`/`checkAdminTestTools`: current admin/normal rejection, target preview/cancel, interrupted operation/status-only recovery, same receipt, actor/target isolation and progress budget. | H12-028–036/local H13-016; hosted disposable target H12-902. |
| Health/Build | T/CL/E/QM/HT/CQ09, `checkInAppHealth` and `checkHealthTiming`: actual run/cancel/timeout/progress, no stale cache, same runId save retry/list/private open, current admin, closed plan, duplicate IDs, evidence/summary integrity and retained five packages. | H01/H16; hosted Full Health owner-run, not substituted by local backend fixture. |
| Mobile/accessibility | Both engines: TR/EN, 320/360/390/430 and landscape/reduced-height surfaces, 200% text, 44px targets, labels/focus/keyboard/dialog/history, reduced motion, light tokens under dark OS. | Local H13 matrix; physical H13-013 remains NOT_RUN. |

## Data access review

Reviewed repository entity policies/schema/field receipts plus native client/guards, onboarding persistence/consent, daily candidate reconciliation, Calendar reader/receipts, Pattern reader, You repository, admin repository/cleanup, privacy requests/recovery, content/Moon planner/verifier, Health store/history and disabled notification path. Owner-scoped queries are paired with post-read checks; service role never establishes caller identity. Singleton reads use limit 2 and reject duplicates; feature histories use bounded pages/sentinels and explicit overflow/conflict rather than invented totals. Daily and Calendar preserve evidence on partial failure; admin/privacy cleanup restarts bounded pages and verifies absence before completion. Readbacks/receipts cannot establish cross-worker serializability. No live inventory or repair was performed; no live data-repair need was proven.

The only new bounded-list defect was CQ-F01. No authorization query was removed to reduce costs. Content import remains exact source hash/reviewed digest/closed fields and controlled batches; Moon coverage is date-driven, not a fixed count. Source content, manifests, consent business instants, optional NULL semantics, derived Calendar and ranking fields are unchanged. Local corrupt/missing/duplicate/reference/residual/race tests remain in D/DM/CA/NA/PT/PR/AT/AUDIT019/CLOSURE020 groups.

## Matched measurements

`measureTransitions.mjs`: real production App and pinned SDK with synthetic HTTP, five independent cold contexts; 12 route transitions each (60), mobile 390×844, fixed API 200ms/assets 40ms, 4× CPU, external fonts blocked, bandwidth uncapped. It measures first lazy destinations and revisits after initial Home readiness; initial document timing is measured separately below. The same script/profile is used before/after. No field INP/live latency/credit inference. See [measurement summary](core-quality-039/measurement-summary.json) and [before](core-quality-039/before-transitions.json)/[after](core-quality-039/after-transitions.json) for request names, response bytes and per-sample timing.

| Destination / visit | Samples per revision | Usable median ms before→after | Usable p95 ms before→after | SDK requests per revision |
|---|---:|---:|---:|---:|
| Home revisit | 15 | 247.0→246.6 | 280.0→247.9 | 15 |
| Calendar first | 5 | 323.4→327.4 | 351.9→331.2 | 5 |
| Calendar revisit | 10 | 247.0→247.1 | 249.0→248.1 | 10 |
| Pattern first | 5 | 295.9→295.9 | 296.3→296.8 | 10 |
| Pattern revisit | 10 | 246.8→246.9 | 247.5→248.4 | 20 |
| You first | 5 | 296.1→295.7 | 297.5→296.6 | 5 |
| You revisit | 10 | 247.2→246.8 | 248.2→248.6 | 10 |

No transition page errors or observed long tasks in either run. First-route JS bytes: Calendar 78,333→78,333, Pattern 12,057→12,057, You 20,740→20,903; revisits load zero new JS. Differences at this sample size are not a proven speedup/regression; no performance budget was widened.

`measureMaintenance.mjs` separately ran against the archived baseline and final source: nine actual App routes × three fresh contexts each, 360×740, loopback, no CPU/network throttling, synthetic SDK client, external fonts blocked. These timings must not be compared to the throttled transition table. Median cold DCL/LCP ms for existing Home: 17.7/52→17.0/48; Calendar: 16.8/64→18.1/68; Pattern: 16.7/52→17.1/52; You: 17.0/64→17.2/64. Full [before](core-quality-039/before-performance.json)/[after](core-quality-039/after-performance.json) include all routes, DOM size, CLS and SDK call counts. Both lazy-asset-failure/reload retries pass. This is local paint evidence, not field p75/INP or physical mobile acceptance.

Production initial JS raw/gzip: **483,391/160,916→484,085/161,028 bytes**, below unchanged 500,000/165,000 limits. CSS remains **77,728/14,239**, below 90,000/16,000. No eager internal/test/content-import module or static import cycle. Additional bytes implement the access/uncertainty guards; no bundle saving is claimed.

`measureCoreData.mjs`: one deterministic sample per scenario, fixed 2026-10-20 clock; one synthetic profile/preferences/consent/event, zero periods, first daily then same-day reopen. Six approved category codes/names, 240 synthetic mappings, 260 synthetic text pairs, eight synthetic Moon intervals; library IO substituted. Fresh client per operation, no authorization cache. Zero provider calls. Domain stress rows include a deliberate 2KiB undeclared field to expose projection behavior; these are not observed production row sizes.

| Scenario | Entity reads before→after | Writes | auth.me | SDK JSON bytes before→after |
|---|---:|---:|---:|---:|
| Domain periods, exactly 100 | 21→21 | 0 | 1 | 224211→13211 |
| Domain periods, 101 | 21→21 | 0 | 1 | 224211→13319 |
| Domain mapping view, 240 | 13→13 | 0 | 1 | 223015→6871 |
| First Home | 60→60 | 1 | 11 | 4216→4216 |
| Same-day Home reopen | 17→17 | 0 | 4 | 1301→1301 |
| Calendar read | 39→39 | 0 | 2 | 3390→3390 |
| Pattern themes | 18→18 | 0 | 2 | 2130→2130 |
| Pattern lunar | 16→16 | 0 | 2 | 1891→1891 |
| You read | 21→21 | 0 | 3 | 2185→2185 |

Domain response remains ≤100; new `truncated` is false at 100, true at 101/240. Measurements are completed-response JSON lengths at the isolated SDK boundary, not on-wire hosted transfer sizes. Trace files retain only entity/method/limit/field/count/byte metadata. The dedicated feature guard cost is retained deliberately; this package makes no query-count speedup claim.

## Security assessment and primary sources

All sources accessed **2026-10-27**; the following are applied review criteria, not third-party certification of Shinka. Pinned installed SDK contracts and executed source remain authoritative for this implementation.

| Criterion/source | Reviewed implementation and evidence | Outcome / limit |
|---|---|---|
| [Base44 entity security](https://docs.base44.com/developers/backend/resources/entities/security) | Direct RLS closed on product/operational entities; service-role bypass means function must authenticate/authorize. Native entries, current User role, ownership/ACTIVE/consent/lifecycle checks; D/S/SC/NS and repository schema inspection. | Kept closed; repository checks are not deployed RLS/FLS proof. |
| [OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [API BOLA](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/) | Anonymous/user/admin/foreign-ID, forged principal/role, current role revocation, lower-level writes and actor A vs target B negatives. | New CQ05 verifies actor preservation; no new demonstrated server IDOR. Current remote-role/UI removal is not instantaneous cancellation. |
| [OWASP mass assignment](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html) | Closed action/payload fields; caller cannot set owner/role/system timestamp/category/copied content; validation and native readback preserved. Domain field projection strengthened. | CQ01/02 + S/YT/P/CA/PR/SC matrices; no raw body binding into entity writes. |
| [OWASP XSS](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [redirects](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html) | React text interpolation, CQ10 hostile-looking name/content text, QM05 same-origin normalized return, QM02/03 safe private popup target/opener/referrer/cancel. Unused chart CSS HTML helper and OAuthConsent template are outside reachable product graph. | No new reachable HTML/URL injection demonstrated. No blanket claim that React alone secures arbitrary HTML or URLs. |
| [OWASP API resource limits](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/) | Bounded JSON byte reading, query/page limits, GeoNames request/upstream/worker bounds and stream cancellation, per-operation budgets, Health deadlines/cleanup/cache and new sentinel. | Worker-local rate guards are not distributed quotas or guaranteed spending caps; no live provider test. |
| Secret/error/report isolation | Source/dependency/layer checks, safe internal error envelopes, private Health artifacts and allowlisted diagnostics; SC/QM/CL/HT and source manifest. | No secret/body/token log added. Synthetic payloads only in tests; no private rows in evidence. |
| Notifications | NT/NC/NP/NM, actual-entry NS and Node SM; disabled entry, recipient/current-role/consent/lifecycle rechecks and unknown provider acceptance. | No send/workflow enabled. H14-901/H16-901 remain external. |

Existing **12 backend findings remain OPEN / USER-DEFERRED**; they were not rescanned or acknowledged. No unresolved new code defect is moved into that waiver. A dependency audit failure would not be represented as zero. Hosted headers, actual policy enforcement, Base44 erasure and physical/native behavior are not inferred from local tests.

## Health audit and final verification

Baseline registry 175 / 149 in-app / 12 local / 14 external; final registry **176 / 150 / 12 / 14**, all 16 suites retained. Added H12-042; updated H12-038, H12-029, H16-007, H07-013, H13-018, H13-008 and H15-002; none deleted/retired. Ten CQ01–10 canonical tests added. Case count is an outcome of the independent list-completeness risk, not a numerical goal.

Every active registration/predicate was reviewed: H01 build/DOM, H02 source/document receipts, H03 syntax/layer/secret/guards, H04 schema/capability/runtime model, H05 external-source readiness, H06–12 product/identity/native/negative tests, H13 static/current DOM/local geometry, H14 isolated disabled integration, H15 bounded work and H16 evidence/gate integrity. Static source claims remain static; historical atomic adapter fixtures explicitly model contracts and do not enable native transactions. No fixed PASS, empty runtime group or missing active runner is accepted. H13-008's duplicated “Pattern” wording and DU01–DU05 stale inventory were corrected. Runtime subgroup duplicate rejection now matches full-runner integrity.

The complete risk→case→registration/actual helper assertion→environment→evidence→status matrix is generated separately for [Chromium](core-quality-039/chromium-case-audit.md) and [WebKit](core-quality-039/webkit-case-audit.md). It includes actual expected/observed values and helper outcomes. The direct-arrow AST extractor leaves source pointers empty for 21 generated/controlled-clock tuples; their reviewed locations/hashes are in [the source supplement](core-quality-039/helper-source-supplement.json), without altering runtime evidence. External/local cases are tracked as separate acceptance, never fake in-app PASS. Thirteen hosted/content prerequisites remain unavailable locally; unavailable transport cannot stand in for source/reference truth.

| Final gate | Result | Exit |
|---|---|---:|
| Full Chromium 156.0.8078.4 | 693 total / **693 unique**, 693 PASS, 0 FAIL/BLOCKED/NOT_RUN, 0 page errors | 0 |
| Full WebKit 27.2 | Same 693 unique IDs, 693 PASS, 0 FAIL/BLOCKED/NOT_RUN, 0 page errors | 0 |
| In-app Health, each local engine | 150 executed: **137 PASS / 0 FAIL / 13 BLOCKED**; same-run save retry, history list and private report open pass | 0 (expected fixture prerequisites) |
| Separate catalogue entries | 12 local + 14 external are **NOT_RUN_IN_APP**; local execution is mapped to CLI evidence, external acceptance remains NOT_RUN | — |
| Node/session | 9 session checks PASS; actual-entry 7 session + 5 native-route + 2 artifact checks PASS | 0 |
| Server/disabled notifications | 8 server security, 11 actual notification-entry and 7 Node secret-comparison checks PASS | 0 |
| `npm ci`; dependency tree; current `npm audit`; `security:deps` | Install/tree valid; audit **0 advisories** including dev dependencies; lock unchanged | 0 each |
| Typecheck; lint; build | PASS | 0 each |
| Repo Health | 18/18 checks; physical schemas 20 product + 6 internal; no access-matrix mismatch | 0 |
| Production budgets/import graph; source/reference measurements | PASS; no cycles; nine native scenarios with zero provider calls | 0 each |
| Build history + registry/plan/execution integrity | PASS; five active packages 035–039, 16 suites / 176 unique cases | 0 |

Full actual-screen rows **per engine**, separately from canonical test count: onboarding closure 6, Health timing 4, privacy 23, You 24, admin navigation 19, mobile experience 150, mobile matrix 87, daily 5, Pattern 22, Calendar 8, admin tools 4 and production routes 5. Product navigation also asserts one hydration per session, zero backend prefetch, late-response isolation, back/forward/reopen and logout concealment. These overlapping execution layers are not summed into an inflated unique-test total. Screenshots at [Chromium 320px/TR/200%](core-quality-039/chromium-pattern-320-tr-2x.png) and [WebKit 320px/EN/200%](core-quality-039/webkit-pattern-320-en-2x.png) were inspected: enlarged titles wrap, controls/content remain visible without horizontal overflow. No physical-device inference.

The 13 BLOCKED IDs are H04-019, H05-001–009, H08-005, H09-004 and H12-031: hosted readiness/content IO is unavailable in the isolated transport. They are not new live failures and are not marked PASS. The 26 separate entries have no in-app dispatch; their local/external distinction remains intact. Existing original incidents are still open.

Final executable/config/test/script snapshot: **526 files**, [tested-source.json](core-quality-039/tested-source.json), SHA-256 `34de491c443bda67e1456f775d8a5f8b7416252fa8dea84b7422578ad945e7ca`. Captured before both final full runs and rechecked afterwards with zero source changes. Baseline and final-base commits are recorded above; report/evidence-only files are excluded from this source manifest. [Verification](core-quality-039/verification.json), engine outputs, all 693 ID lists and measurement traces are retained alongside it. No 038 run is reused as final verification.

First failures are preserved independently of passing final evidence:

| Initial evidence | Meaning and resolution |
|---|---|
| [CQ01–05 before fixes](core-quality-039/initial-failures/before-regressions.txt) | CQ01–04 reproduced truncation/intent defects. CQ05 expected `ADMIN_REQUIRED` but the actual tool correctly rejects `FORBIDDEN_INTERNAL_TOOLING`; corrected fixture expectation, not authorization. |
| [Initial UI](core-quality-039/initial-failures/before-ui.txt), [refined UI](core-quality-039/initial-failures/before-ui-refined.txt) | CQ06 stale-card defect; CQ07/CQ08 first had fixture mount timing problems, then reproduced restarted transport/enabled Edit. Fixed product and retained evidence of both stages. |
| [Focused attempt 1](core-quality-039/initial-failures/focused-1.txt), [attempt 2](core-quality-039/initial-failures/focused-2.txt), [commit-aware retry](core-quality-039/initial-failures/focused-ui-commit.txt) | CQ08 test attempted click before React commit. Scoped `flushSync` made the real DOM assertion deterministic; full final runs pass. |
| [Home initial](core-quality-039/initial-failures/before-home-name.txt), [refined reproduction](core-quality-039/initial-failures/before-home-name-refined.txt) | Initial fixture effect was not mounted; after fixing setup CQ10 proved stale hydrated name. Product clears it, keeps hostile-looking strings as text. |
| [Home pending Retry](core-quality-039/initial-failures/before-home-retry.txt), [focused closure](core-quality-039/initial-failures/focused-home-retry-final.txt) | Final review found the error was cleared before Retry readback, allowing the old hydrated name to reappear while pending. CQ10 reproduced this in actual Home; name now follows retained/verified value. CQ06/07/10 and final full runs cover the correction. |
| [Typecheck first](core-quality-039/initial-failures/typecheck-initial.txt), [follow-up](core-quality-039/initial-failures/typecheck-final.txt) | New test/instrument tuple and callback inference errors; corrected scoped types, no typecheck suppression. Final typecheck exits 0. |
| [Baseline measurement setup](core-quality-039/initial-failures/before-core-data-stderr.txt), [final-source setup](core-quality-039/initial-failures/after-core-data-stderr.txt) | Synthetic category labels were correctly rejected as `PATTERN_CATEGORY_CONFLICT`; fixtures now use the six approved codes/names. Corrected retry stderr is empty. No production guard weakened. An earlier standalone instrument build also needed the static-evidence plugin; that setup error is not counted as a product failure. |

Non-failing existing warnings remain explicit: this npm version does not recognize `.npmrc` `min-release-age-exclude`; no enforcement is attributed to that key. Test-harness static imports produce lazy-import warnings, whereas the separately measured production graph keeps internal/Health modules out of the initial bundle. Neither warning is concealed as a runtime failure or a passing security control.

## Owner publish and acceptance

1. Review Test, merge through the existing owner workflow and sync the whole native/shared backend graph before publishing matching frontend assets. No 039 entity migration/import or secret step. Keep current Calendar/Pattern response contracts aligned. Confirm UI Buildmarker-039 / HC-039.0; Git Test/Preview is not a separate database.
2. Run published Full Health as current admin, then save, list and reopen the same run. Preserve/report any FAIL/BLOCKED with case/subtest stage and build; do not relabel it from this local report.
3. On disposable accounts, verify Home same-day reopen/refresh, Calendar saved-ID recovery and simplified Pattern; in You reproduce a lost save reply, failed read-only check and successful same-intent reconciliation. Verify admin A keeps its session/role when operating on explicitly selected synthetic B. No real user cleanup is prescribed.
4. Separately, use the **original partial ON-05 account**: sign in, submit normal saveCycle with valid date/explicit consent and optional durations blank; verify saved grant's existing business instant, matching event/period and NULL duration fields before accepting step completion. Do not delete/reset it. Original First Shinka needs published source/function match and a safe actual error/readback after the owner's deferred CLI access is restored.
5. Physical Android Chrome/iOS Safari: keyboard/time modal/native date, safe areas/bars, Back/focus, zoom/background/OAuth. Push/native eligibility/response binding stays closed. Local Chromium/WebKit is not physical evidence.
