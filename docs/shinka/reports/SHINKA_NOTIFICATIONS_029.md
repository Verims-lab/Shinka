# Shinka Notifications 029–030 — local delivery and platform blockers

## 034 — support evidence addendum (2026-10-26)

The owner relayed **Dmytro / Base44 Support** confirming the field names `user_id`, `title`, `content`, `action_label`, `action_url`. This adds technical-support provenance to the earlier Base44 AI relay; it is not an independently retrieved ticket or hosted validation. Unknown/misnamed fields can be silently discarded with a success response. Generic success proves neither intended processing of every field nor notification display, and supplies no concrete acceptance indicator.

Only the names are confirmed. The historical input table below records retained local/AI-reported types, requiredness, nullability and limits; those properties, native User.id mapping and success/error/no-device JSON are still unverified. Workflow secret registration/reference/header transport, native eligibility/permission, idempotency and logout/account-switch rebinding also remain open. The actual entry remains `enabled:false`; the provider still returns UNKNOWN for fulfilled promises and errors, never automatic SENT/ACCEPTED.

NC06 already asserts exact outgoing `{user_id,title,content}` and rejection of an extra `message` key; NC07 already covers generic success staying UNKNOWN without blind retry. Source inspection found no coverage gap for this note, so assertions and tests are unchanged, with no new execution claimed. Only source comments, evidence/descriptions and same-package records change. H14-901 description is updated; H14-901/H16-901 stay external and open. All earlier results/failures below remain historical. [034 report](SHINKA_STABILIZATION_034.md) retains BLOCKED/NOT_RUN gates; no install, browser, audit or quality check is restarted for this addendum.

## 033 — new support and accepted scheduler secret

[Scheduler Authorization 033](SHINKA_SCHEDULER_AUTHORIZATION_033.md) supersedes keyless/admin-session-only assumptions for automatic calls. A scoped shared secret is accepted; local comparison/machine separation is prepared, but real registration and workflow transport remain unbound. Support says success is acceptance, not display; exact push wire contracts remain unknown. All historical evidence below is retained. 032 remains the native setup/device plan; physical acceptance is still NOT_RUN.


## 032 — native setup and device acceptance preparation

[Native Notification Readiness 032](SHINKA_NATIVE_NOTIFICATION_READINESS_032.md) is the current setup inventory and owner runbook, with two-stage physical acceptance marked NOT_RUN. No notification/UI runtime change, native bridge, credential or real sending is added. H14-901/H16-901 descriptions are clarified without closing them. Earlier package evidence below stays historical; it is not a 032 execution result.


## Current 031 performance continuation

[Notification Performance 031](SHINKA_NOTIFICATION_PERFORMANCE_031.md) records matched SDK counts, freshness controls and new local results. Entity reads 84→69 / 119→104 / 61→46, writes/sends unchanged. Production sending/scheduling remains disabled. This supersedes the current performance status only; 029/030 contracts and all historical evidence below are retained.

031 final local execution: Chromium/WebKit **624/624 each**, separate 8 server + 9 entry fixtures, Health 136 PASS/13 prerequisite BLOCKED; mandatory gates pass and audit zero. H14-003 updated, no Health ID added/deleted, active history 027–031. Live bindings and H14-901/H16-901 remain open. See the focused report for exact source, retained failures and measurement scope.

## Historical continuation — Buildmarker-030 / HC-030.0 (2026-10-22)

**LOCAL_VALIDATION_PASS / LIVE_BINDING_BLOCKED.** Continue completed 029 (`a51cdd4`) and its clarification (`758d6af`); no rewrite of the daily engine or UI. Clean local/origin Test was `758d6af7bc14aa6c07855915c5dd223a15960c79`, ahead of main `060ba76` by those two commits; no divergence or user edits. The tested 030 executable/config inputs are identified by the [495-file manifest](notifications-030/source-manifest.json), aggregate `2921c430f579d596bf2f5af44049b895e8d8f755022474c248b8b839d1939c27`. Generated ledger/prose are finalized separately. Frontend and notification entry SDK remain 0.8.57, other native entries retain 0.8.54; plugin 1.0.47, Playwright 1.64.0 and Vite 8.2.4 remain locked. No dependency, schema or content-source change in 030. Internal Build retains **026–030**.

### Corrected contract and implemented code

The owner's 2026-10-22 continuation relays Base44 support, rather than an independently retrieved support ticket. It says workflow `auth.me()` identity, creator downgrade/deletion behavior, workflow signatures/headers/run-ID verification and workflow-only access are undocumented. The previous Base44 AI “creator admin” assertion is **UNVERIFIED**, not an accepted contract. This does not establish platform non-support. [Beta Workflow APIs](https://docs.base44.com/developers/references/apps-api/sections/workflows) are not an incoming-caller authentication contract. No secure workflow credential transport was demonstrated; `secrets.get` alone would not prove it. No guessed header, shared-secret workaround, custom signing service or SHINKA_WRITE_MODE was added.

Manual admin starts are now explicitly acceptable. `handleNotificationSchedule` authenticates before constructing the lifecycle service-role repository, then uses the common `requireAdmin` with fresh native User/lifecycle and unchanged-principal checks. Anonymous/auth-error calls touch no service-role object. Normal, demoted and removed accounts cannot read job data, mutate work or construct/call the provider. Admission repeats at work/write/send boundaries. Enabled local fixtures prove direct admin execution and revocation after IN_FLIGHT stopping send/further writes. The **actual entry remains `enabled:false`**: a current admin receives `DISABLED / processed:0`; others are rejected. This replaces the historical 029 unconditional 503 placeholder. A service-role client never proves workflow authority.

The isolated `base44PushProvider` and JSDoc type module implement the **platform input schema as relayed by the owner, not live verified**:

| Field | Reported contract / implemented handling |
|---|---|
| user_id | Required string; server-derived owner. Exact native User.id mapping remains unverified. |
| title / content | Required strings, maximum 100 / 500 characters; central neutral TR/EN copy. Local validation counts Unicode code points. |
| action_label | Optional string/null, maximum 50 characters; omitted by daily adapter. |
| action_url | Optional string/null; omitted for documented default app opening. App-level validator admits only `/` or null if supplied internally. |

The installed SDK exposes dynamic Core integration methods, without the named schema. The adapter calls `asServiceRole.integrations.Core.SendPushNotification` with only `{user_id,title,content}` and treats the result as `unknown`. It never interprets `success`, `message_id` or `delivered`, forwards raw output/errors or infers SENT. A resolved object, null/string, 403, 502 and timeout all remain UNKNOWN; they cannot trigger a blind retry. Device eligibility stays UNKNOWN. The actual entry and eligibility gate keep live calls off. [Official integration documentation](https://docs.base44.com/Integrations/built-in-integrations) establishes the method/default opening at documentation level, not recipient/response/device acceptance.

029 behavior is retained: fixed IANA 06:00, current local 06:00–12:00 window, DST/zone changes, shared Home/job daily generation, immutable content, preference/OS/support separation, lifecycle/consent fences, persisted intent/readback, at most three attempts only for a definite synthetic transient rejection, and no automatic retry for UNKNOWN/IN_FLIGHT. There is no native UNIQUE, CAS, distributed lock or exactly-once guarantee. No job runs on the navigation critical path; no new polling or function call chain.

### Actual local results

[Verification](notifications-030/verification.json), [Chromium](notifications-030/chromium.json), [WebKit](notifications-030/webkit.json), [quality receipts](notifications-030/quality-gates.json), [case audit](notifications-030/chromium-case-audit.md).

| Check | Executed result | Limit |
|---|---|---|
| Chromium 156.0.8078.4 | **617 PASS / 0 FAIL**, 0 page errors | Full canonical runner; synthetic SDK/provider, external network blocked |
| WebKit 27.2 | **617 PASS / 0 FAIL**, 0 page errors | Same final source; desktop WebKit, not physical iOS |
| Per command: SC01–05/07–09 | **8/8 PASS** | Node/server fixtures, counted separately |
| Per command: NS01–09 | **9/9 PASS** | Actual TS entry/shared guard, SDK/platform imports substituted; no hosted identity proof |
| Per engine: local in-app Health | **136 PASS / 0 FAIL / 13 BLOCKED** of 149 | Hosted/content prerequisites unavailable; blocked is not PASS |
| Clean install/tree/audit/security:deps/repo/type/lint/build/history | **PASS** | Zero dependency advisories at all levels; no live Security scan |
| Production bytes, graph and lazy retry | **PASS** | Existing budgets unchanged; laboratory evidence only |
| Hosted workflow/push, native permission/token lifecycle, physical display/Home tap | **NOT RUN / BLOCKED** | H14-901 and H16-901 remain external |

Both result lists explicitly contain NT01–23, NU01–03, NC01–09 and retained O32/NA07/NA22/SC06/SC10/SC11; **no missing required ID or zero-test pass**. Each engine also retains 150 mobile interaction, 87 compatibility, 24 You and 23 privacy checks. The 13 blocked Health IDs remain H04-019, H05-001–009, H08-005, H09-004, H12-031.

H14-001/002 retain their existing assertions. H14-003 adds NC01–09 to its real admission/adapter coverage; H14-004 now describes NS01–09 plus retained NU01–03. H14-901 distinguishes implemented manual guard/reported input from unresolved platform contracts. No new or removed Health ID: these behaviors fit the existing cases. Catalog, suite, backend H14 plan and scopes agree: **175 total / 149 in-app / 12 local / 14 external / 0 future**. CAP-13/17 source entries now consistently say PARTIALLY_VERIFIED with documentation/local evidence; they previously still said UNVERIFIED despite the 029 report. Missing documentation is not UNSUPPORTED. The existing **12 backend findings remain OPEN / USER-DEFERRED**.

[Initial failures](notifications-030/initial-failures.json) retain the optional-field typecheck diagnostics and `.d.ts` parser failure. Fixed via validated narrow casts and the existing JSDoc style; no lint rule, assertion or security predicate removed. A development-only checker syntax error occurred before execution and was corrected; it was not a pass. First full 617/617 runs preceded the type-module conversion; the final full runs above use the final source. All 028/029 evidence below and on disk is preserved.

### Performance and remaining acceptance

[Production measurements](notifications-030/performance.json): initial JS **479,543 raw / 160,180 gzip**, CSS **77,521 / 14,262** bytes, within unchanged 500,000/165,000 and 90,000/16,000 limits. No dependency cycle; lazy failure/reload retry passes. Three local You LCP observations are 76/64/76ms, unthrottled synthetic loopback—not field p75 or device speed. No production SDK latency/credits measured.

[Direct NC04 measurement](notifications-030/manual-entity-cost.json) includes the new repeated admin/lifecycle entity lookups: existing-day intent **84 reads / 4 writes**, accepted synthetic dispatch **119 / 4**, settled pass **61 / 2**. It excludes `auth.me`, real provider/SDK latency and credits; historical 029 core-only costs below must not be substituted for the new admin path. Pagination remains ≤25 preferences with a 20-second between-owner budget and saved cursor. A slow active SDK request can exceed that admission budget; this is not cancellation or a hard wall-clock guarantee. Before activation, measure hosted latency/capacity under the [five-minute function ceiling](https://docs.base44.com/developers/backend/resources/backend-functions/overview); do not chain functions to extend it. Existing five-minute cadence intent, two-pass settlement and capacity/credit formulas below remain estimates.

**Still needed from Base44/support:** verified workflow caller identity and creator revocation/deletion behavior or a supported secure credential transport; native recipient-ID mapping; complete push response/error and no-device semantics; accepted versus queued versus delivered meaning; native eligibility/permission/token lifecycle; provider idempotency. Supplied examples must match the installed SDK and documented platform contract. Actual send/schedule stays disabled until these facts support a safe binding.

**Owner actions:** merge/publish and sync all matching 029+030 schemas/shared backend/frontend/HC sources when ready. Configure iOS APNs .p8 + Key ID and Android google-services.json + Firebase service-account JSON in trusted Base44 UI, with matching project/package; generate/install updated native builds. Firebase remains push setup, not application storage. After verified bindings and setup, use one selected test account for controlled push/display → guarded Home/current content → in-app Health and Android/iOS OS-denial/logout/account-switch checks. Physical H16-901 remains open. No agent live Health/scan/push/import/user mutation, workflow activation, main merge or publish occurred.

## Historical 029 delivery — preserved, current boundary superseded above

**Build:** Buildmarker-029 / HC-029.0
**Date:** 2026-10-22
**Status:** LOCAL_VALIDATION_PASS / PRODUCTION_BINDING_BLOCKED
**Delivery:** Test → draft PR; main merge and publish remain owner-owned.

The daily notification core, shared daily engine, preference UI, lifecycle protections and local tests are implemented. **This is not a working production notification integration.** The actual function denies every call before creating an SDK client; no workflow exists. Verified push payload/result/device-eligibility and scheduler caller-authentication contracts still need to be bound in code. APNs/Firebase credentials alone will not resolve that engineering blocker. No hosted push, active workflow, live Full Health, Security scan/acknowledgement, import or real user mutation was performed.

## Source and scope

Started from clean Test at `414b05d4b0994d11a7e84ec17c0c07ca96222deb`. Fetched GitHub and safely fast-forwarded to current main `060ba7678a259db704217026a372b08c45dd5695` (merged 028 plus Base44 package update). No older local source replaced Base44 changes. Package lock resolves frontend SDK **0.8.57**, Vite plugin **1.0.47**, Playwright **1.64.0** and Vite **8.2.4**. No dependency version or lockfile change in 029. The tested 029 source is that base plus the delivered source changes; [493-file SHA-256 manifest](notifications-029/source-manifest.json), aggregate `c20214bf200be2ba383c10ca057449fca505fe9b4c8c73a707d32acb4d9c6233`, identifies executable/config inputs independently of final report/ledger text.

Read the canonical business, architecture, data, UI, privacy, Health, continuation, mobile and 028 closure records. Directly checked original İş Analizi v2.5 §7.4/KK-13/14/24, Use Case v1.4 UC-10/20, UI/UX v1.1 §7.2 and Part 3/4/companion, Teknik Analiz v1.1 §5/notification flow, DB v1.2 §4.2/7.1. These require local 06:00, detected IANA zone, preference/OS separation, stable daily snapshots and same-row retries. Original native atomicity expectations remain superseded by accepted 016 limitations; original deactivation-only deletion was superseded by 023 erasure. The new window/backoff/fields/neutral copy are explicit 029 decisions, not original-source quotations.

User-reported published 028 Health success is historical input. The existing **12 backend findings remain OPEN / USER-DEFERRED**. This package does not close them. Older failure, security, Health and device evidence is retained; Internal Build shows **025–029**.

## Implemented behavior

- `produceDailyForOwner` is the existing daily algorithm extracted for both authenticated Home and separately admitted scheduler use. The scheduler does not fabricate a user auth principal. A valid detected Home IANA zone updates preferences automatically with scoped write/readback; invalid detection retains the stored zone. Existing daily IDs, local dates, zones and text snapshots are preserved.
- Fixed local **06:00** target, no time/zone picker. DST, half/quarter-hour offsets and UTC date rollover are tested. A delayed tick or newly enabled preference may send only during **06:00 ≤ local time < 12:00** for the current local day. No historical catch-up. Preference/device gates follow content production, so off/denied/unknown/unsupported still permits daily content. Home remains the independent recovery path outside that window.
- Existing same-day daily candidates use native reconciliation. Delivery candidates group by owner, type and local day or canonical daily ID. The first intent is persisted and read back, then waits at least one minute and a later pass before dispatch. A terminal/in-flight competing candidate suppresses another attempt; ordinary candidate order and claim readback reduce overlap.
- At most **three provider attempts**, with **5 then 15 minute** earliest retries after definite transient rejection. Retry rechecks current local day/window, owner, lifecycle, preference and device eligibility. Permanent rejection, ineligibility and ambiguous timeout/malformed result are distinct. UNKNOWN/IN_FLIGHT never blindly retries, including accepted-send/lost-save failures. Later same-day re-enabling does not revive a terminal SKIPPED/INELIGIBLE record; an initially off preference with no intent can become eligible before noon.
- `SENT` means verified **provider acceptance**, never OS display. No provider idempotency feature is assumed. The worker map is local; there is no native UNIQUE, transaction, distributed lock or CAS claim. Independent workers can still race after final readback; an already-started provider call cannot be recalled by a later revocation.
- Neutral central copy only: “Günlük Shinka içeriğin hazır” / “Your daily Shinka is ready”, title Shinka. No cycle, phase, birth data or other personal content on the lock screen. Omit the optional destination: documented default app opening uses the existing guarded Home entry. No historic date or caller-supplied title/body/URL/recipient is accepted.
- You shows saved preference, native platform support and OS permission separately. Current production permission/support remain **unknown**. No browser `Notification.permission` inference or invented native request/settings bridge. TR/EN manual device-settings guidance and visible inactive delivery state; save errors retain draft and old confirmed value. Session teardown removes displayed personal state. Native token rebinding/logout/old-account delivery remains external acceptance.

## Storage, authorization and lifecycle

Keep the original 20 product entities. Add only five optional `NotificationDelivery` fields: `shinka_date`, `dispatch_state`, `next_attempt_at`, `claim_id`, `error_stage`. Original `delivery_status` enum remains PENDING/SENT/FAILED/SKIPPED. Source receipts retain original fields separately from these approved extensions; malformed fields still fail validation. Legacy rows without known attempt state are not automatically resent.

Add sixth closed operational schema `NotificationSchedule`: `schedule_key`, opaque preference-ID `cursor`, `last_tick_at`. All direct CRUD denied. Cursor is a traversal position, contains no payload/credential and grants no owner access; it advances/resets after deleted preferences. Existing account erasure already removes all owner delivery rows, including pending/in-flight/unknown. No separate per-owner queued scheduler record survives erasure. Platform/provider copies remain separately pending under the existing privacy contract.

Fresh native User, ACTIVE/complete profile, completed onboarding, privacy request and admin lifecycle checks precede work and writes. Health consent is separate: withdrawn/non-granted consent leads to UNKNOWN cycle and no health-table reads. A final admission follows persisted intent immediately before send. Scheduler facade permits only owner daily create and delivery create/update. The HTTP contract permits only `{action:"tick"}`, limits its body and cannot accept target/copy/authority fields. `SHINKA_WRITE_MODE` is not reintroduced.

## Verified platform facts and unfinished binding

[Built-in integrations](https://docs.base44.com/Integrations/built-in-integrations) documents backend service-role `SendPushNotification` for a single native iOS/Android user, optional link/default app opening and credit charging. Installed SDK 0.8.57 exposes Core methods through a dynamic proxy; it does **not** validate the method's named parameters or returned acceptance schema. The public material inspected supplies no verifiable native eligibility read or permission/token bridge. The adapter therefore requires an explicit backend code binding and currently supplies none; no arbitrary object is represented as a verified push contract.

Read-only CLI confirms this app supports **Workflows**, with no configured workflow. Choose that single path. [Workflows](https://docs.base44.com/Building-your-app/Creating-workflows) and [automation restrictions](https://docs.base44.com/developers/backend/resources/backend-functions/automations) rule out adding parallel `function.jsonc` automations to a workflows app. No scheduler was created, activated or run. Intended cadence is every five UTC minutes, configured inactive first after the binding is complete.

[Client authentication](https://docs.base44.com/developers/references/sdk/getting-started/client) and [backend execution](https://docs.base44.com/developers/backend/resources/backend-functions/overview) distinguish request identity from service-role access. A service-role client is not proof that an HTTP caller is a platform scheduler. A verified workflow caller identity/token validation method was not established. The real `notificationSchedule` entry returns `503 SCHEDULER_AUTH_CONTRACT_UNVERIFIED` for ordinary, body-forged and apparent-service-header requests, with zero SDK creation. Injected verifier tests prove handler policy only. No secret, header name or privileged body flag was invented as a workaround.

The owner's 2026-10-22 clarification confirms that verified examples are not yet available; the owner will request them from Base44 with their sources. Independent daily generation, records, UI, documentation and local validation are complete in `a51cdd4`. The remaining implementation is limited to **two contract bindings**:

| Open contract | Required evidence and remaining implementation |
|---|---|
| Provider connection | Authoritative `SendPushNotification` parameter/response examples, definite versus ambiguous failure semantics, and recipient/device eligibility within that provider contract. Compare the example with the installed SDK and the cited platform version, then bind the request-scoped backend adapter. Device permission/session behavior belongs here, not to a third independent feature. |
| Scheduler caller authorization | Authoritative workflow-to-function caller identity and server-side verification contract. Verify ordinary-user, missing/invalid credential and forged-body/header rejection before binding the real entry. Service-role access alone never establishes caller authorization. |

Do not implement from an example alone: check its origin, SDK/platform compatibility and documented security/error semantics first. If it does not establish those facts, retain the open contract and closed entry rather than guessing. Add relevant positive/negative tests when the verified bindings are supplied. **CAP-13 and CAP-17 remain PARTIALLY_VERIFIED**; H14-901 tracks these two unfinished bindings. H16-901 remains separate external physical-device evidence, not a local implementation task or a local PASS. No real send or schedule is enabled by this clarification.

## Execution evidence

The 029 execution results below belong to the original implementation validation, not a new browser run for this documentation clarification. Its 493 executable/config inputs remain unchanged. Real desktop engines ran the pinned canonical runner; external network was blocked and SDK/provider inputs were synthetic. Server entry tests are counted separately. [Chromium](notifications-029/chromium.json), [WebKit](notifications-029/webkit.json), [quality receipts](notifications-029/quality-gates.json), [source manifest](notifications-029/source-manifest.json). [Clarification checks](notifications-029/boundary-followup.json) separately record repository/history checks and actual closed-entry denial.

| Check | Actual result | Scope / not run |
|---|---|---|
| Chromium 156.0.8078.4 | **608 PASS / 0 FAIL**, 0 page exceptions | All NT01–23, NU01–03 and retained O32/NA07/NA22/SC06/SC10/SC11 individually present; no missing IDs |
| WebKit 27.2 | **608 PASS / 0 FAIL**, 0 page exceptions | Same full coverage; desktop engine, not physical iOS |
| Per canonical command: SC01–05/07–09 | **8/8 PASS** | Local Node/server fixtures, not included in 608 |
| Per canonical command: NS01–03 | **3/3 PASS** | Actual inactive TS entry with platform import substitution; not scheduler authentication proof |
| Local in-app Health, each engine | **136 PASS / 0 FAIL / 13 BLOCKED** of 149 | Synthetic backend/readiness prerequisites; 13 BLOCKED are not PASS |
| Install/tree/audit/security/repo/type/lint/build/history | **PASS** | Fresh lockfile install; audit **0 Critical/High/Moderate/Low**; no live Security scan |
| Production byte/performance gates | **PASS** | Unchanged byte budgets, no cycles, lazy failure/reload retry; lab observations only |
| Hosted scheduler/provider, OS permission/token lifecycle, real push/Home tap | **NOT RUN / BLOCKED** | Binding missing; no physical Android/iOS evidence, H16-901 remains external |

The 13 expected local Health blockers are H04-019, H05-001–009, H08-005, H09-004 and H12-031. They depend on hosted readiness/content unavailable in this harness. Current inventory is **175 cases: 149 in-app, 12 local-only, 14 external, 0 future**. Per-engine case audit is retained. Existing mobile matrix (150 interaction + 87 compatibility checks per engine), 24 You checks, 23 privacy checks and guarded navigation continue to pass.

Health changes: **activate/rewrite H14-001 and H14-002** around tested ordinary-SDK guarantees; **add H14-003** for admission/deletion/traversal/security, **H14-004** for local UI/entry denial, **H14-901** for missing platform binding. Update H04-015 to six closed operational schemas. No Health ID deleted. The two obsolete future registrations moved to the real case module with the same IDs; catalog, suite, backend plan and execution-scope records agree. H16-901 stays physical-only. Normal Health uses fake provider/time and never sends a real push.

Preserved early failures: [typecheck diagnostics](notifications-029/typecheck-initial.txt), [NT16 and initial results](notifications-029/initial-failures.json), [exact diagnostic](notifications-029/paging-diagnostic2.txt), [zero-test sandbox attempt](notifications-029/focused-sandbox-blocked.txt). NT16 expected `p-24` while its fixture creates `p-024`; corrected that exact expectation. Type annotations were corrected. No assertion/security rule was removed or weakened. Loopback EPERM was rerun successfully with permitted local execution, never counted as a pass. Initial 604/604 Chromium run predates the final four tests and is retained separately.

## Performance and cost

[Production measurements](notifications-029/performance.json): initial JS **479,543 raw / 160,179 gzip**, CSS **77,521 / 14,262** bytes. Existing limits stay 500,000/165,000 JS and 90,000/16,000 CSS. You remains lazy (9,642/3,406 bytes). Three cold local You LCP samples 84/80/80ms are unthrottled loopback lab results, not field p75 or device speed. No new frontend polling or push call is added to navigation. Home timezone writes occur only on an actual valid zone change.

[NT23 request counts](notifications-029/notification-cost.json), one synthetic owner including checkpoint overhead: existing-day intent **45 reads/4 writes**, new-day intent **82/5**, accepted dispatch **71/4**, settled pass **31/2**, Home reuse **17/0**. These include repeated safety admission; reference library/provider eligibility fixture costs are not hosted measurements. They must not be treated as cheap/one-call production work. Actual SDK latency, provider-eligibility cost and backend credits remain unmeasured.

Each tick admits ≤25 preferences, sequentially, with a 20-second **between-owner** budget and persisted progress. A slow active request may exceed this budget; no fake cancellation is claimed. At five-minute cadence there are 288 potential ticks/day and 72 during a six-hour local window. For N preferences, a full sweep requires at least `ceil(N/25)` ticks, often more under real latency. Intent plus send requires at least two eligible sweeps; retries need further visits. This bound is not certified production capacity. Choose measured cadence/capacity before activation; do not assume exact 06:00 or five-minute delivery at arbitrary scale. Native cross-worker checkpoint races can defer work until a later sweep.

Estimate monthly push credits as `days × opted-in eligible users/day × mean provider attempts × current credits/attempt`, with attempts ≤3. Documentation describes approximately one credit per call; confirm current account pricing, and add backend/entity/workflow charges separately. No real credit usage was measured. Firebase is used only for native push setup, not application data storage.

## Owner setup and acceptance

First finish the two contract bindings above; the current entry cannot be enabled just by adding credentials. Then sync the optional delivery fields, new closed operational schema, complete shared/backend graph and matching frontend through the usual owner-controlled merge/publish workflow. Configure one **inactive Workflows** schedule; do not create function.jsonc automations. Verify its real caller authorization before deliberate activation.

[Official store setup](https://docs.base44.com/documentation/building-your-app/uploading-to-app-stores):

- **iOS:** Publish → Mobile app → Build Stores Files / Add push notifications. Supply the **APNs .p8 key and Key ID** through Base44's trusted UI. This is separate from an App Store Connect API key.
- **Android:** supply **google-services.json and Firebase service-account JSON** from the same Firebase project and package name shown by Base44. Existing native builds need newly generated store files/build installation. Keep credentials out of chat and Git. No account creation, plan change or store submission was performed.

After binding and setup: **complete mobile setup → verify one selected test account receives the neutral notification → tap it and verify guarded Home/current daily content plus in-app Health**. Include OS denial, account switch/logout and old notification behavior on actual Android/iOS in that device check. Provider acceptance, physical display and Health are separate evidence; retain any failure. Main merge, publish, activation and all live/device acceptance remain with the owner.
