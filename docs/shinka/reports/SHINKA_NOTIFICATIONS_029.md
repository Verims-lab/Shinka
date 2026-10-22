# Shinka Notifications 029 — local delivery and platform blockers

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

Before activation, obtain authoritative, key-free contract examples for: (1) named send payload/result and definite vs ambiguous failures, (2) trusted recipient/device eligibility and permission/session lifecycle, (3) workflow-to-function caller authentication. Implement those bindings and their negative tests, connect a request-bound provider client, then repeat relevant local gates. **CAP-13 and CAP-17 are PARTIALLY_VERIFIED**, not hosted/device verified. H14-901 tracks this unfinished engineering acceptance.

## Execution evidence

All 029 results are fresh. Real desktop engines ran the pinned canonical runner; external network was blocked and SDK/provider inputs were synthetic. Server entry tests are counted separately. [Chromium](notifications-029/chromium.json), [WebKit](notifications-029/webkit.json), [quality receipts](notifications-029/quality-gates.json), [source manifest](notifications-029/source-manifest.json).

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

First finish the three platform bindings above; the current entry cannot be enabled just by adding credentials. Then sync the optional delivery fields, new closed operational schema, complete shared/backend graph and matching frontend through the usual owner-controlled merge/publish workflow. Configure one **inactive Workflows** schedule; do not create function.jsonc automations. Verify its real caller authorization before deliberate activation.

[Official store setup](https://docs.base44.com/documentation/building-your-app/uploading-to-app-stores):

- **iOS:** Publish → Mobile app → Build Stores Files / Add push notifications. Supply the **APNs .p8 key and Key ID** through Base44's trusted UI. This is separate from an App Store Connect API key.
- **Android:** supply **google-services.json and Firebase service-account JSON** from the same Firebase project and package name shown by Base44. Existing native builds need newly generated store files/build installation. Keep credentials out of chat and Git. No account creation, plan change or store submission was performed.

After binding and setup: **complete mobile setup → verify one selected test account receives the neutral notification → tap it and verify guarded Home/current daily content plus in-app Health**. Include OS denial, account switch/logout and old notification behavior on actual Android/iOS in that device check. Provider acceptance, physical display and Health are separate evidence; retain any failure. Main merge, publish, activation and all live/device acceptance remain with the owner.
