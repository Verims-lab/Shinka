# SHINKA — Security & Privacy

**Document:** SHINKA_SECURITY_PRIVACY.md
**Status:** ACTIVE — repository guards and synthetic tests; live certification pending
**Current BuildMarker:** Buildmarker-068
**Auth policy (OD-003):** RESOLVED_BY_REPOSITORY_POLICY: Apple/Google-only shell and safe localized error mapping implemented. Recorded platform snapshot 2026-10-18 23:11 lists Google/Apple; read-only dashboard inspection on 2026-10-22 also observed both enabled, with default Base44 Google OAuth. Live/native sign-in proof remains unverified (EXTERNAL_RELEASE).
**Last Updated:** 2026-11-11
**Authoritative Source References:** SRC-01 §8/§13, SRC-04 §3.2/§9/§13/§14, SRC-05 §15
**Purpose:** Separate PRODUCT REQUIREMENT from BASE44 VERIFIED CAPABILITY.
**Scope:** Auth, ownership, admin, health data, logs, secrets, restore.
**External Verification Required:** All rows marked UNVERIFIED.

## 064 — Admin reset retirement and selected-user removal (2026-11-11)

Authenticated current-admin admission still precedes Test Tools request processing. RESET_ONBOARDING preview/execute and reset-receipt resume return TEST_RESET_RETIRED (410) before any job, audit or product write; foreign/unauthenticated callers retain existing denial. The shared executor independently refuses reset before journal.begin. Historical lookup/status are read-only and return resume_enabled:false. Self/last-admin, owner/reference, ACTIVE/privacy/open-job guards, deletion checkpoints and retained consent/daily/audit scope are unchanged.

The live removal preflights for the two authorized test IDs both returned TEST_TARGET_BUSY. Neither was bypassed. Existing RESET_ACTIVE owner continuation retains its normal identity/lifecycle/consent checks and saved fingerprint; no admin impersonation or broader recovery authority is added. Native User absence, active operational cleanup and Base44 Recently deleted/permanent erasure remain separate evidence requirements. No live mutation or purge ran.

[064 delivery and execution](reports/SHINKA_ADMIN_RESET_RETIREMENT_064.md).


## 061 — Authentication before personal onboarding (2026-11-09)

Authentication and server progress verification precede name/personal forms. No anonymous personal write, provider-name overwrite or email/local-flag completion inference. Existing stored NULL name is a valid choice. The removed pendingName sessionStorage helper no longer restores unowned data; old same-tab values are ignored. Drafts live only in the current owner component until existing saveProfile readback and are discarded on account change/unmount.

ACCOUNT_DELETION_IN_PROGRESS admission denial and HEALTH_DELETION_PENDING / CONSENT_REGRANT_WORKFLOW_REQUIRED onboarding refusal route to existing Account & Privacy. The route transition grants no extra status/recovery authority and performs no cleanup/resume. INACTIVE, owner, admin, consent and reset guards remain unchanged. Generic MFA boilerplate is constrained to approved providers, remains unrouted, and does not introduce password sign-in. No real OAuth or physical-device acceptance is inferred from fixtures.

[061 implementation and execution](reports/SHINKA_AUTH_FIRST_ONBOARDING_061.md).

## 060 — Owner status recovery without erasure changes

The owner rejected indefinite retention and approved concise copy describing removal of active account/personal app data with permanent deletion still pending verification. ACCOUNT_CLEANUP, native User-last ordering, fresh absence verification, protected admins, lifecycle/ownership/consent and shared-data rules are unchanged.

`status` remains read-only: no begin/resume/receipt renewal or cleanup. A valid 24-hour hashed receipt reads only its exact request after native logout. An expired receipt alone is refused. After existing-provider sign-in, accountPrivacy may independently admit the fresh native identity/User/lifecycle/admin boundary (product applicationSession intentionally fences pending deletion); that owner must match the original receipt-bound request. Missing, mismatched or ambiguous receipts cannot select another request. TTL, hash and request ID are unchanged. This is existing owner read authority, not extended anonymous recovery. New provider identity does not regain old history.

The frontend preserves one recovery intent, coalesces in-flight calls, bounds local waiting to 20 seconds, clears timers/listeners on disposal and ignores obsolete generations. SDK work already sent is not physically recalled. Successful HTTP is insufficient: only validated backend absence proof renders active removal; permanent deletion remains pending. Transient/timeout and sign-in states are distinct; no raw exceptions, tokens or records are logged. [060 evidence](reports/SHINKA_PRIVACY_STATUS_060.md).


## 059 — Existing dependency High resolved (2026-11-09)

Fresh mandatory `security:deps` and clean `npm ci` report **0 vulnerabilities**. Compatible transitive follow-redirects 1.16.1→1.16.2 is now beyond the unchanged seven-day cooldown; no direct dependency, Base44 version, registry/TLS policy or override changes. npm normalized bundled optional WASM lock entries. Initial current audit (1 High) and previous 057/058 failures remain in evidence. Application owner/ACTIVE/lifecycle, privacy invalidation and closed notification/scheduler contracts are unchanged. No live Security scan or user writes. [059 evidence](reports/SHINKA_PATTERN_NAVIGATION_059.md).


## 058 — Narrow core closure (2026-11-01)

User Security OK is preserved separately from dependency audit. Existing Base44 scan UI shows one Low applicationSession and twelve already acknowledged; this task did not scan, fix or acknowledge them. Current npm result remains 0 Critical / 1 High / 8 Moderate, with the compatible follow-redirects patch still subject to the unchanged seven-day floor. No protected account/profile/consent/health writes or owner impersonation; the two Calendar owners must resume their own IDs. Private report-file URLs remain only in 0600 Git-ignored manifests. See [058 evidence](reports/SHINKA_CORE_CLOSURE_058.md).


## 055 — Diagnostic isolation and dependency gate

Quota failure classification adds no authorization: authenticated/ACTIVE/lifecycle checks remain ahead of quota/provider IO; no automatic singleton creation, counter zeroing, uncertain-write retry or provider bypass. Safe diagnostic fields are allowlisted code, response/upstream HTTP status, provider class/status, stage, transport class, request UUID and bounded nonnegative duration. No queries, birth details, user records, credentials, raw exceptions or headers are retained in delivery evidence. User videos remain outside the repository; committed screenshots use synthetic profiles.

Fresh 2026-11-01 audit of the unchanged lockfile reports 0 Critical / 1 High / 8 Moderate affected packages. High GHSA-mrwp-f3q8-3g9p is `@base44/sdk@0.8.57 → axios@1.20.0 → follow-redirects@1.16.1`; the vendor fixes it in 1.16.2. Registry publication is 2026-10-25T21:32:25.963Z, so the seven-day release-age floor is reached at 2026-11-01T21:32:25.963Z. At this delivery's check time it is not yet eligible. No cooldown override, unsafe downgrade (Axios requires ^1.16.0), audit suppression or High waiver. Required security:deps remains FAILED and repository security closure remains OPEN; onboarding results are separate.

Moderate GHSA-g3hv-75wg-m249 affects minimatch and seven ESLint dependents. The path is local development lint/file glob processing, not user-supplied runtime patterns. The vendor fix is minimatch >=11.0.1; npm's proposed plugin downgrade/major substitution is not a supported narrow fix, and forced transitive major overrides are not applied. Developer use of untrusted file globs remains an exposure; retain the finding pending a compatible upstream update. [Current audit receipt and vendor links](reports/SHINKA_ONBOARDING_FIX_055.md#dependency-gate).


## 053 — Shared GeoNames credits and endpoint classification (2026-10-30)

The exact 13-function classification and local negative evidence are in the [053 report](reports/SHINKA_GEONAMES_QUOTA_053.md#thirteen-functions-code-backed-classification). domainAccess permits guarded owner/shared reads and audited adminRead, but no generic product mutation. accountPrivacy has a limited post-session DELETE_ACCOUNT status capability, reusable within its original 24h TTL; wrong/expired keys fail and keys cannot authorize begin/resume. validateContentArtifacts is dynamically used by Health; notificationSchedule remains a planned native-admin entry with enabled:false. Body fields are rejected, ignored or validated per endpoint, not uniformly ignored. Group A is preserved; current 13 functions do not mean 13 proven vulnerabilities, nor clear the historical 12 OPEN/USER-DEFERRED findings.

Authenticated/onboarding/You admission remains before any quota IO or provider/secret use. The single prepared counter uses conditional ID/revision reservation and exact acknowledgement; no uncertain write retry/refund. Workers retain local burst protection. Direct quota RLS denies all operations, with no public provisioning endpoint. Installed SDK transport is locally verified; deployed atomicity is not. External GeoNames-account consumers and manual counter edits are outside the app accounting.


## 051 — Core Reliability & Performance

Health retention requires fresh native admin, unique ACTIVE profile, lifecycle and fixed app ID. Reviewed digest/≤25 explicit IDs are mandatory. Before apply the operator must stop/drain Health save writers and enumerate every open recovery run in protected_run_ids (including old in-memory retries); writers_drained is an operator assertion, not a platform fence. If this cannot be established, use dryRun only. Incomplete/unknown-report-time or ID rows are protected. Native metadata is not an age or activity authority: the 20-row hosted sample has zone-less created_date and explicit-zone completed_at. Order reports by canonical completed_at; safety depends on explicit writer drain and recovery-ID inventory, never guessed native timezone or report age. Private URIs remain server-side in maintenance output; only counts/fingerprints leave it. The installed SDK has no verified private-file delete method, so filesDeleted=0 and deletion remains NOT_SUPPORTED_BY_VERIFIED_SDK. No filesystem/undocumented endpoint fallback. Shared retained references are never deleted. Existing deferred 12 backend findings remain open.

051 internalHealth uses the server SDK plus fresh native actor lifecycle authorization rather than the generic product-write wrapper. Its closed maintenance modules enforce their own current admin/ACTIVE/app/target predicates; no arbitrary entity/patch is accepted. The sole daily exception permits the four-field unset for a COMPLETED DELETE_USER tombstone only when the native User is absent. Active operations, recreated native identity and privacy restrictions still deny it; ordinary product writes still use nativeClient/withNativeWriteChecks. Rechecks are not an atomic fence. ID13 and actual TS-entry tests cover this boundary.

## 049 — narrow web maintenance and opening diagnostics

The existing internalHealth dispatcher admits only the fixed Shinka app and the existing reviewed daily-reference migration operations. The migration rechecks native admin/ACTIVE, target privacy/lifecycle and reviewed ID/digest before the literal four-field unset; no generic table/patch input, token extraction, policy relaxation or additional credential is permitted. Assignment/link fingerprints are metadata receipts, not content snapshots. This is prepared in Test; hosted execution is blocked by the currently deployed missing action, so full cleanup and final schema remain unverified.

Opening diagnostics use the closed code/stage/status vocabulary plus UUID and duration, never raw exceptions, headers, payloads or message/health text. A local deadline releases UI waits without claiming remote cancellation. Transient verification failure grants no fresh admin authority and does not force logout; account/logout/unmount discard old responses. See reports/SHINKA_LOADING_CLEANUP_049.md.

| Topic | PRODUCT REQUIREMENT | BASE44 VERIFIED CAPABILITY |
|---|---|---|
| OAuth ownership | Provider identity → one account; no duplicates | UNVERIFIED (Apple unknown, OD-003) |
| User row isolation | User sees only own rows; owner from auth context | REPOSITORY + SYNTHETIC verified; 20 direct SDK deny policies and backend owner scoping; live pending |
| Admin boundary | Fresh native User.role and identity; audited; no email authority | LOCAL_NATIVE_SYNTHETIC; hosted two-user enforcement unverified |
| Sensitive health access | Only with explicit valid consent | Shared backend consent/open-job checks; live pending |
| Consent | Versioned, timestamped, event history | 023 isolated grant/withdrawal/retry proof; hosted acceptance pending |
| Health-data deletion | Persisted processing fence, five-scope active removal, explicit same-request retry, no re-consent mid-job | 023 synthetic handler/UI proof; hosted/platform acceptance pending |
| Protected immutable records | Admin cannot UPDATE/DELETE snapshots/events/audit (OD-009) | Repository deny rules + shared guards + negative tests; PARTIALLY_VERIFIED |
| Audit metadata minimization | No health content in audit log | Validated allowlist helper + negative tests |
| Log redaction | No tokens, health data, message bodies | Health reports redacted (`redact()`), T17 test |
| Secrets | Server-side only | GEONAMES_USERNAME key present in masked dashboard / user-confirmed; value never read by tooling. Request-scoped runtime adapter implemented; deployed resolution/provider success still requires manual evidence. |
| INACTIVE account | No login, generation, push | UNVERIFIED |
| Restore protection | Deleted health data never reappears; INACTIVE stays INACTIVE | UNVERIFIED |

Internal route gates are UX only. Both `validateContentArtifacts` and `internalHealth` use request-derived SDK identity and server `auth.me()` before any operation: anonymous 401, ordinary/forged-role user 403, admin allowed. InternalHealthRun RLS denies all direct client CRUD, including read; current-admin backend history operations provide access; guarded backend writes use service role. T68/H03-009 exercise this boundary synthetically. Live two-user/direct-invocation/RLS enforcement remains required.

Reports are diagnostic counts/IDs/status/evidence, not product health records. Server save validates structure/summary/gate and strips extra top-level fields; canonical recursive redaction removes credential, email, health-record/symptom, birth/profile and message-body keys and token/email value patterns. Compact JSON is bounded and never truncated. Private file creation plus record-based, admin-only signed readback is tested synthetically (T69–T72); no final live persistence is claimed. Auth UI never renders/logs provider payloads; only AUTH_CANCELLED, AUTH_PROVIDER_FAILED, AUTH_SESSION_FAILED or AUTH_UNSUPPORTED_METHOD may cross its boundary.



## 045 — Reference ownership and narrow cleanup

Daily assignments remain owner-scoped, ACTIVE/lifecycle/consent guarded and immutable through product routes. Source text RLS stays denied; no ordinary-user MessagePair edit route. Current text responses include no source table dump or fallback legacy copy. NotificationDelivery validates linked daily native IDs with owner and recorded date; malformed/missing/foreign links block sending. Neutral notification content, unknown device permission and disabled scheduler remain unchanged.

Offline operator cleanup is the only new daily-field mutation: freshly verified native admin + ACTIVE profile, actor/target lifecycle/privacy, reviewed digest, exact native ID and original assignment predicate, four-key `$unset`, independent readback. No new persistent audit/snapshot table or retention change. Operator output includes IDs/status/count/digest only; no message/profile/health values, token or SDK raw errors. No live execution in 045. Existing withdrawal/admin-test retention and owner-erasure manifests remain exact; shared reference content survives those actions.


## 044 — Preference and session boundary verification

Notification UI saves retain the existing native identity/owner, ACTIVE, lifecycle and open deletion/reset guards. The preference is not health consent. No profile, consent, period, daily or delivery write is authorized by changing it. Synthetic tests call the real You backend and demonstrate fresh opt-out refusal before provider dispatch; an already-dispatched provider call may finish and retains its truthful acceptance receipt. No remote cancellation promise.

Account/logout invalidation clears the You draft/confirmed state and rejects stale callbacks. The main-043 session retry policy remains two retries at 700/1400ms; pending retry timers now abort on logout, account replacement, membership refusal, unmount and restored-page recheck. Already-dispatched SDK requests are not claimed cancelled. No credentials, user payloads or permission tokens are added to logs/fixtures. No live user action or Security scan in this package.


## 042 — current notification authorization and safety boundary

Owner-relayed Fode/Support resolves workflow identity to native admin creator or platform owner fallback, with no secret/custom-header transport. Remove the unused secret/machine branch; no request flag grants authority and Shinka never manufactures owner identity. Current native admin is revalidated at every existing admission boundary (401 anonymous, 403 ordinary/demoted user, 503 auth outage). Demoting/deleting the creator is not a workflow stop mechanism. Provider remains service-role-only; allowlisted neutral input excludes daily snapshots and optional fields. 403/404 are terminal, 502/malformed/lost/timeout UNKNOWN with no blind resend. Stored SENT is acceptance, not delivery. Unknown device permission is not GRANTED; unsupported eligibility query is not required. Entry remains disabled, native/workflow acceptance external. [Written support provenance/runbook](reports/core-audit-042/support-contract.md). No mutation, live Health/scan or clearance of the 12 USER-DEFERRED backend findings.


## 040 — removal acceptance and protected actor

Scoped live cleanup authority is the current private user request, not a permanent bulk-delete capability. Verify the actual app/data area and the uniquely matched protected native admin/session before freezing explicit targets; exclude its ID at every destructive step. No email-specific application permission or new everyone-delete endpoint. Current native actor role and target/operation binding are rechecked at every mutation; role loss stops later writes, transient transport errors never sign out the actor. A missing target User still requires privacy/health-job checks. App lifecycle guards reject target writes while deletion is open and after the tombstone; in-flight platform work has no proven distributed drain/lock guarantee. Fresh residual reconciliation detects late writes; it does not prove platform-wide serializability.

Read failure (including 404/429/5xx from a query) is not absence. A stale COMPLETED status or active native User never yields success. Retention stays canonical and is distinct from self-service erasure. Official Base44 User removal moves the user to Recently deleted, with a separate platform retention/permanent-erasure lifecycle; this operation verifies active app removal only. Do not claim backup/provider erasure or measured old-token revocation. [Official User SDK contract](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities), accessed 2026-10-27. Per-pass diagnostics allow IDs/stages/counts/durations/codes only, never raw identity, health data, request bodies or credentials.

## 039 — current local security review

New confirmed exposure was stale local Home content/name after an explicit lifecycle/profile/owner denial; CQ06/CQ07/CQ10 now cover clearing, stopped-session requests and late replies. No server owner bypass was observed in the scoped negative matrices. General domain lists now disclose truncation, request declared fields only and reject malformed/duplicate results; CQ01/CQ02 include sentinel owner and withdrawn consent. CQ03/CQ04/CQ08 preserve unconfirmed write intent; CQ05 proves actor A keeps its current native session/role while operating on synthetic B. No runtime RLS/FLS relaxation or service-role identity shortcut.

Official Base44 entity-security and current OWASP authorization/BOLA/mass-assignment/XSS/redirect/resource-limit sources were reviewed on **2026-10-27**, with direct links and control mapping in the [039 milestone security matrix](reports/SHINKA_CORE_QUALITY_MILESTONE_039.md). Repository policy/entry, synthetic negative, dependency-audit and live enforcement evidence remain distinct. At 039, GeoNames had only worker-local limits; 053 adds the shared credit reservation contract above while burst limits remain local and hosted atomicity remains unverified. Production notification entry/scheduler remain disabled. **12 backend findings OPEN / USER-DEFERRED** are not acknowledged or rescanned; original ON-05/First Shinka and hosted/device acceptance remain open.

## 035 — scoped onboarding verification

Completed-owner daily state now closes ordinary onboarding profile/cycle writes independently of profile readiness, including lower adapter write guards; existing guarded reset remains separate. Actual SDK fixtures and both browser engines verify the boundary and stale account/unmount suppression. No native transaction/distributed uniqueness or live enforcement guarantee is added. Birthplace keeps owner/ACTIVE/lifecycle, request-scoped secret, transport and rate-limit controls; A/P ID resolution and five-field readback remain authoritative.

New clean install/tree/runtime peer checks pass on unchanged zod 4.6.7/resolvers 5.9.2 lock. Local audit/security:deps show zero across all severity levels. Chromium/WebKit 657/657 each and existing security/notification regressions pass; 13 local Health hosted/content prerequisites stay BLOCKED. The prior user-reported Base44 zod scan closure remains separate evidence. **12 backend findings OPEN / USER-DEFERRED**, H14-901/H16-901 external, actual entry enabled:false and scheduler unbound are unchanged. No live scan/provider/user/push action. [035 source, failures, results and external acceptance](reports/SHINKA_ONBOARDING_AUDIT_035.md).

## 034 — resumed dependency and stabilization evidence

The owner-reported Base44 zod finding closure remains USER_REPORTED_PLATFORM_EVIDENCE. Independently, the resumed local npm audit --json and security:deps both succeed with **0 Info/Low/Moderate/High/Critical** after clean npm ci on unchanged zod 4.6.7/resolvers 5.9.2 lock. Full peer tree and positive/negative Zod resolver runtime checks pass. Original TLS failures and unknown audit counts are retained as historical evidence, not overwritten. No CA/TLS/registry/lock relaxation. The existing npm min-release-age-exclude warning is recorded; configuration is unchanged.

Native deletion pre/post-write guards remain unchanged. SS01/02/04/06–10, NA34A–C and TP01–04 execute in both full 649/649 browser runs; Node 9/9 separately reruns. Unknown transport is 503/SESSION_UNAVAILABLE and denies access, while proven missing identity is 401/AUTH_REQUIRED; fixture expectations now reflect this, without service-role/job/provider access. All other local quality gates pass; hosted enforcement remains separate. **12 backend findings remain OPEN / USER-DEFERRED**; no live scan, mutation or physical acceptance. [034 results and evidence](reports/SHINKA_STABILIZATION_034.md).

Official push documentation confirms 100/500/50 limits, optional action/link and Home default; support-relayed names/silent discard do not verify full wire types/nullability/Unicode counting, recipient mapping or acceptance/error/no-device semantics. Generic success stays UNKNOWN; entry enabled:false, workflow transport unbound, H14-901/H16-901 open.

## Historical 033 — accepted secret, no general admin authority

The owner accepts a scheduler-only shared secret based on relayed Base44 support. Prepared machine admission returns no User/admin principal and does not change requireAdmin/internal tooling. Manual native-user freshness checks remain. Null auth, service role, body roles/IDs and workflow flags are never credentials. Missing/invalid/unreadable configuration fails closed; fixed-format node:crypto comparison, repeated request-time reads and generic codes expose no secret/raw error.

Real registration and secure workflow transport remain unverified; entry installs no secret reader or machine callback and stays enabled:false. Knowing an old secret survives admin demotion: revoke/rotate it separately. Official docs say deployed backend values update promptly but an editor-published version may retain the old value until republished; in-flight work is not instantaneously cancelled. Stop scheduled activity and verify old-value rejection in each environment before resuming. [033 owner runbook and evidence](reports/SHINKA_SCHEDULER_AUTHORIZATION_033.md). Existing 12 findings remain OPEN / USER-DEFERRED; no live scan or mutation.

## 032 — native preparation and security evidence

Read-only dashboard inspection observed Apple and Google login enabled, with Google using the default Base44 OAuth. This proves settings only, not native sign-in or device-token binding. No secret was opened, copied or saved; blank setup fields do not prove absent keys/accounts. Record application identifiers only when actually confirmed; private keys, service accounts, sessions and device tokens must never enter chat/log/Git. The owner supplies required credentials directly to trusted platform forms; Firebase is push configuration, never a Shinka data migration.

All backend/UI security behavior stays unchanged. The actual entry is enabled:false and unknown native permission/recipient/provider states cannot authorize sending. Secure automatic caller identity is still required, while workflow-only versus equally authorized manual-admin separation is not. H14-901/H16-901 remain external, no transaction/CAS/distributed exactly-once guarantee is added, and the existing 12 findings stay OPEN / USER-DEFERRED. The already-open dashboard displayed an aggregate 13-function warning; it was not rescanned, investigated or acknowledged in this package and does not close/reclassify the retained 12. [032 inventory and external proof](reports/SHINKA_NATIVE_NOTIFICATION_READINESS_032.md).

## 031 — read reduction without cross-phase authorization reuse

The same-phase record handoff is a trusted backend callback result, never a request flag/role or a serialized authorization token. The shared daily engine still normalizes the record, verifies owner identity/ACTIVE state, and runs fresh admission at later return and mutation boundaries. Notification writer pre/post checks, persisted intent/readback, final owner/preference/device gate and consent revalidation remain independent. No change to shared auth/lifecycle/privacy helpers; no worker/global role, consent, deletion or preference cache. Direct lower-level writer/daily calls retain their guards.

NP01–07 add measured budgets, same-request role/owner/account/preference changes after daily read, cross-owner/request isolation, direct writer/daily rejection, revocation during body IO, consent withdrawal before daily persistence, and BUSY-path current-admin admission. NC05 and NT10/11 still cover revocation/preferences/deletion after IN_FLIGHT. Initial NP07 exposed the early BUSY return skipping the moved caller check; the check now precedes BUSY and provider construction. Original failing evidence is retained. No assertion or security predicate is relaxed.

12 backend findings remain OPEN / USER-DEFERRED. Entry enabled:false, H14-901/H16-901 and unknown provider/workflow contracts are unchanged; no live action. [031 results](reports/SHINKA_NOTIFICATION_PERFORMANCE_031.md).

## 030 — notification security and lifecycle

**033 scope amendment:** the following 030 description remains the manual/unbound-entry baseline; its keyless/session-only assumption is superseded for the prepared scheduler machine path by §033. General admin guards are unchanged.

The existing 12 backend findings remain OPEN / USER-DEFERRED. No scan or acknowledgement is performed. notificationSchedule authenticates before constructing a service-role lifecycle repository, then uses the existing shared requireAdmin with fresh native role/lifecycle and stable caller ID. Anonymous/auth-error calls stop before service-role access; normal, demoted and removed identities stop before personal job reads, writes or provider construction. Enabled local tests permit direct verified-admin work and recheck admission at mutation/send boundaries. The actual entry remains enabled:false and returns DISABLED for an admitted admin. No missing-auth system branch exists. A forged header, body role/system/run ID or asServiceRole presence never grants authority. Only {action:"tick"} is accepted; no target/copy/URL/checkpoint input. No secret workaround or SHINKA_WRITE_MODE.

Owner admission retains native existence, ACTIVE/complete profile, deletion/privacy/reset fences, preference, timezone/window and device eligibility checks. Scheduler facade allows only daily create and delivery create/update. Account erasure already covers READY/IN_FLIGHT/UNKNOWN deliveries; withdrawal uses consent-aware shared generation without unauthorized health reads. A final guard cannot recall an already-started provider call or provide distributed fencing.

The narrow adapter uses the user-relayed title/content/user_id schema and neutral TR/EN copy. All unknown resolved responses and 403/502/timeout exceptions remain UNKNOWN, with no automatic retry or invented SENT. No raw provider response/error, personal snapshot or secret is returned/logged. Production eligibility remains UNKNOWN. Credentials belong only in trusted Base44 mobile setup. Native token lifecycle remains external.

2026-10-22 correction: the earlier Base44 AI creator-admin assertion is unverified after user-relayed support clarification. Workflow identity, role downgrade/deletion and verifiable caller mechanism are undocumented; beta Run APIs do not authenticate callers. This is not a claim of platform non-support. [030 results and preserved 029 evidence](reports/SHINKA_NOTIFICATIONS_029.md) separate local NC/NT/NS execution from hosted authentication and H16-901 devices.

## 028 — security closure (ACTIVE)

- **Global write pause removed.** `SHINKA_WRITE_MODE` is no longer read by any code path; it was never stored as an app secret and the 017 decision already removed mandatory deletion maintenance. Every write still requires a server-authenticated principal from the same request, owner match, ACTIVE account, current consent/version, no open health-deletion job, privacy request/tombstone checks and, for admin tools, the current native admin role (re-read per stage). Post-write identity re-check (NA22) still reports an already-started write without inventing rollback.
- **Request bodies.** `base44/shared/boundedJson.js` enforces the byte limit while streaming (rejects oversize `Content-Length` first, cancels the stream at the limit, strict UTF-8, object-only). Used by onboarding (8 000 B), you (4 000), calendar (2 000), dailyMessage (2 000), pattern (1 000), accountPrivacy (1 200), applicationSession (1 000, empty object only), domainAccess (10 000) and admin internal handlers (1 000 000, existing Health report contract). Pre-028 handlers read the full body and then measured it; that was a post-read check, not a memory bound.
- **GeoNames.** `base44/shared/geonamesGuard.js` wraps every provider path used by onboarding and You: search, country/region/settlement lists and profile birthplace resolution. Limits per fixed 60 s window: 30 GeoNames-backed **app requests** per user, 60 **real upstream fetches** per user (one app request may issue several), 300 upstream fetches per worker. 10-minute public-place cache (200 entries) and in-flight de-duplication. Over-limit → 429 `GEONAMES_RATE_LIMITED` with `Retry-After`. The owner comes only from the authenticated principal; the adapter and `GEONAMES_USERNAME` are created/read only at the first real provider call, so auth failures and non-birthplace actions never touch GeoNames configuration. **Scope of the counters:** `onboarding` and `you` each create their own guard, so a user's counters are separate per function and per worker instance; there is no shared onboarding+You user quota. State resets on restart/redeploy. The current implementation therefore does not guarantee an exact, app-wide or cross-worker quota; such a guarantee would need shared state, which 028 does not add.
- **Limit error transport (028 fix).** Only errors created by the guard itself (tracked in a module-private WeakSet) pass through the adapter's catch unchanged as 429 `GEONAMES_RATE_LIMITED` with `retryAfterSeconds`. Previously the adapter re-wrapped user-upstream and worker-upstream limit errors as `GEONAMES_NETWORK_ERROR` → 503 `GEONAMES_UNAVAILABLE` and dropped the retry seconds. Real network/timeout/provider errors, and any same-shaped error not created by the guard, keep the existing safe 503 classification. No provider fetch occurs after a limit decision. Evidence: SC07–SC09 (local).
- **Entry inspection (028).** The onboarding entry rule requires `guard.forOwner` around the adapter; a parseable unguarded entry is rejected (O32 executed and PASS in both local Chromium/WebKit runs). Earlier invalid-syntax fixture did not test this and was replaced.
- **Classification.** validateContentArtifacts usage (H05) is not evidence of endpoint security; domainAccess being in the contract is not a proven false positive. Both: STATIC review only, hosted auth tests pending.
- **Recovery key.** accountPrivacy's same-request recovery key remains read-only status lookup for its 24-hour TTL and may be reused within it; it is not one-time and grants no personal-data read or mutation. Invalid/expired keys return no state (PR15–PR17).
- **Logs/evidence.** No secret, recovery key, token or personal value is logged or stored in Health evidence by the new code; rate-limit responses carry only code, field and seconds.

### 028 local verification receipt

Both complete local engine runs passed 582 Foundation cases, including O32, NA07, NA22, SC06, SC10 and SC11; each command also passed the eight SC01–SC05/SC07–SC09 Node server fixtures. No security assertion was weakened. The missing 028 content-policy registration and H12-040 closed server-plan entry were corrected; exact-source/count/bijection/future-package rejection and server plan equality stay enforced. Initial type/Health failures are retained. Current unchanged-lock npm audit: **0 Critical / 0 High / 0 Moderate / 0 Low**. [028 source and evidence](reports/SHINKA_SECURITY_CLOSURE_028.md).

This is local static/synthetic/browser evidence. Local Health’s 13 hosted-prerequisite BLOCKED results remain blocked; Base44 Security scan, deployed endpoint enforcement (including F6/F7), real provider/load and physical acceptance were not run. SC08’s You evidence is an injected error-envelope test, not a full rate-limited profile-save/provider path. The worker-local quota limit remains unchanged.

## 027 — focused ASVS review and dependency closure

Fresh audit identified the existing React Router advisory chain (react-router/react-router-dom, two Moderate; zero High/Critical). The reviewed update is 7.18.4, published 2026-09-15, compatible with current Node >=20 / React >=18. Declarative BrowserRouter is retained; no loaders/actions, Framework SSR, Supabase Auth or second identity system is introduced. Fixed internal destinations and no server hydration already limited reachability, but the vulnerable package is now removed rather than suppressed. Exact before/after audit, compatibility/regression results and official advisory links are in [027 evidence](reports/SHINKA_PRE_NOTIFICATION_QUALITY_027.md).

Same-request principal reuse never trusts a client role/user ID and is not authorization caching. Native fresh User role, owner/ACTIVE/consent/privacy/reset/deletion checks and deny-all direct entity policies remain. S04 verifies real handler rejection **and** unchanged owner-A/B persisted rows. Report windows sever opener/referrer, validate HTTPS without credentials and discard late signed URLs on disposal or privacy/session invalidation. No secrets or signed URLs are saved in evidence. ASVS review is scoped source/fixture evidence, not certification or independently verified deployed RLS/provider enforcement.

## Read-only Health diagnostics — 024

Admin authentication, fresh native identity/lifecycle, owner privacy fences and deletion guards remain mandatory. Underlying lifecycle read failures carry only a sanitized diagnostic to internal tooling; no auth/role fallback is introduced. The allowlist admits code, HTTP status, stage, bounded duration and UUID request ID only. No exception message/stack, URL/query, header/token, record or workbook body crosses this diagnostic boundary. Unknowns remain UNKNOWN. Ordinary failure codes/statuses and product admission rules are unchanged.

The authorized prod probe used existing read actions only; no onam, reset/resume, deletion, schema write or content import occurred. Successful read-only readiness and synthetic regressions are not consent/deletion/hosted mutation proof. The existing shared prod data environment remains shared.

## Owner privacy authority and erasure exception — 023

`accountPrivacy` is a separate closed backend route. It uses the verified native session plus a fresh native User read; it deliberately bypasses normal product tombstone admission only to continue that owner's already confirmed privacy request. No caller owner/target/role/status/event time is accepted. Begin requires explicit true confirmation; read/status never mutate. Resume needs the current owner's native session. Incomplete profiles are allowed for account erasure. Native admin self-removal remains protected; no ordinary-user access to Admin Test Tools is introduced.

A durable UserPrivacyRequest denies target product activity before destructive work. Health withdrawal separately denies health access/processing from that point, including before a failed consent write. Existing native wrappers, Calendar, onboarding, domain reads and new daily calculation recheck the relevant fence; account deletion is also checked by applicationSession. Bounded periodic/focus auth refresh carries an opaque privacy revision; same-browser signals carry a random invalidation nonce only. Cache generations discard stale responses. This is not instantaneous cross-device push, transaction, CAS, exactly-once, rollback or recall of an already transmitted SDK write.

The server-owned privacy cleanup is a narrow exception to immutable **deletion**, only after authenticated owner confirmation, persisted lifecycle and exact scoped ownership. It does not authorize updates to daily/consent/audit history, arbitrary admin deletion or client CRUD. Other owners/shared references remain protected, including foreign indirect-edge conflicts. Cleanup verifies each deleted ID and each final scope; uncertainty never becomes absence.

After native User removal a 256-bit capability, stored only in the initiating browser session and hashed on the server, permits only minimal read-only status. It expires after 24 hours, is not an operation ID, is never logged or placed in a URL, and cannot resume/delete anything. Normal sign-out clears the pointer; verified erasure preserves it for result recovery. Account switches discard an incompatible pointer. No personal values or tokens enter Health evidence. Normal Health uses isolated fixtures only. Permanent platform/provider erasure and the retention/disposition of pending minimal receipts remain open, without fabricated legal basis or duration; [official-source review](reports/SHINKA_PRIVACY_023.md).


## You security boundary — 022

Native session determines owner; every action uses fresh identity/ACTIVE/lifecycle admission before and after, with completed profile/preferences and actual daily record required. Updates additionally refuse open health deletion and use the existing native write checks. Client user_id/role/status/consent/Sun and extra fields are rejected. Backend updates only the owner profile/preferences singleton; no frontend generic CRUD or direct policy change. Existing onboarding/admin privileges are unaffected.

Readback/conflict errors never imply rollback. A post-write admission/read failure is marked unconfirmed; privacy denial still clears personal UI immediately. Protected history/consent/cycle data is neither written nor logged. Only the current consent's validated status is projected, without grant event/time/body. Personal drafts and observation revisions remain component memory only; logout/session replacement invalidates responses and old-owner hydration. Normal Health runs actual handlers over isolated fixtures only, never current user/profile preferences. No live mutation, legal text generation, consent grant/withdrawal, scheduler or new identity/service.

## Dependency scan — 022

Fresh npm ci, direct/full dependency tree and npm audit completed against the unchanged lock: 0 Critical / 0 High / 2 Moderate / 0 Low. Native security:deps gate exits 0; full audit exits 1 for the existing React Router findings. Same fixed internal navigation and no SSR/untrusted external redirect exposure; no dependency change, suppression or service. [022 audit receipt](reports/you-022/dependency-audit.json). The Moderate vendor-major-upgrade disposition below remains open.

## Dependency scan — 021

Fresh unchanged-lock npm ci/tree/audit completed: 0 Critical / 0 High / 2 Moderate / 0 Low. security:deps exits 0; full audit exits 1 for the existing react-router/react-router-dom advisories documented below. Pattern destinations are fixed internal routes; no untrusted redirect or SSR hydration path was added. No dependency upgrade/suppression or new service. Exact [audit](reports/pattern-021/dependency-audit.json).

## Pattern read boundary — 021

Closed themes/lunar payloads accept only action and timezone. Client owner/role/process/derived data is rejected. createNativeClient rechecks native User and deletion tombstone; guardDomainOwner checks ACTIVE and reset lifecycle at admission and before response. Returned themes belong only to the session owner. Themes read retained assigned categories, not cycle/consent records, so a missing/withdrawn health grant does not authorize health access and does not erase retained history. Existing health-data consent/open-job controls remain unchanged on their relevant operations; Pattern performs none of those operations.

Only minimal daily/category/timezone fields are fetched; no full health/profile/message rows, tokens or raw provider errors are logged or exported. Under 038, UI retains confirmed sections on ordinary hidden/offline refresh and clears data on privacy denial/session replacement/unmount; obsolete requests cannot revive it. There is no persistent personal cache. Normal H10/H12/H15 checks exercise isolated in-memory stores only, including successful and denied actual handler paths; no live mutation or reference import occurs. Hosted owner/RLS proof remains H12-901 and physical proof H13-013.

## 020 removal verification and platform boundary

Current removal responses share one fresh completion projection after normal execute/resume as well as status/lookup. Active native User or operational residual means PARTIAL; authorization/network/malformed/conflicting read means unconfirmed, never removed. Existing owner/current admin/self/last-admin/open-deletion guards and lifecycle tombstones remain. This read sequence is not a transaction or cross-worker atomic snapshot; later changes are rechecked on subsequent requests.

The official generic SDK entities documentation calls delete(id) permanent removal, while the platform user-data guide separately describes App Users removal, Recently deleted restoration/purge, Data trash and other retained locations. The app can verify active query absence using the supported SDK; it cannot independently certify physical erasure across these surfaces. No new purge API, key, credential or permanent-delete action was used. Product-copy promises are limited accordingly. Existing retention policy is unchanged, not silently reclassified as a comprehensive privacy-erasure workflow. Only the selected target was inspected read-only; no live delete/resume/reset/Full Health.

## 019 security audit

Fresh auth configuration observation and regenerated-template provenance are recorded in SOURCE_OF_TRUTH; no provider-login success is inferred. InternalHealthRun direct create/read/update/delete policies all remain false; only current-admin backend operations expose authorized history. Current reports require canonical planned IDs and evaluated, version-bound evidence. This improves diagnostic integrity, not independent attestation of a client-submitted report. Old failures remain immutable.

Deletion logs contain no SDK arguments, target identity/name/email, health rows, tokens or raw exceptions. SDK 401/403, 404, 429 and unavailable failures receive distinct safe codes; an absent-delete response counts as idempotent only after successful scoped absence read. Read failures never establish absence. Fresh actor/target/last-admin/open-job and ownership protections remain; parallel prechecks are awaited, not cached. Acknowledged partial continuation never bypasses those checks; unknown transport outcomes permit only read-only reconciliation. Per-request counters are not cross-worker fencing. Native User removal and related-data verification remain required.

Dependency audit: ten unused direct dependencies removed after source/import inspection; Vite 8.2.0 → 8.2.4 fixes GHSA-698v-4r3x-3vcv (released 2026-10-06, beyond the configured 7-day release-age floor). Existing React Router Moderate exposure/disposition below remains; no Critical/High waiver. Final fresh counts and lock/tree checks are in the 019 report.

## 018 diagnostic and recovery limits

Exactly one successful narrow live diagnostic read was made for the user-selected existing deletion: operation metadata, native User presence and authenticated lookup. No Health run, delete/resume, reset, import or publish. At observation, operation was RUNNING/user_cycle_prediction with no completion timestamp; native User remained present and lookup succeeded. The target ID is omitted from the versioned report. A blocked target login is consistent with its deletion tombstone, not proof of full deletion. Platform termination cause and earlier client lookup failure remain unproven.

Keep current admin/self/last-admin/target lifecycle/retention controls. Neither timeout nor native User absence establishes successful deletion. Fresh read-only completion verification detects residual operational rows; no mutation occurs during lookup/status. Preserve safe error codes, stage and request IDs; no raw exception, account values, tokens or secrets in UI/logs. A session recovery pointer grants no backend authority. Already-transmitted writes, provider re-entry/token revocation and distributed races remain separate acceptance limits. No maintenance/drain prerequisite is reintroduced.

## Active corrective security contract — 017

The user replaces operator maintenance/drain with durable target admission and resumable cleanup. No new runtime deletion secret or app-wide pause is required. Existing Test app binding/signing configuration, fresh admin, target-bound preview, explicit boolean confirmation, self/last-admin/open-job protections remain. Every normal owned SDK write checks target lifecycle before/after; service-role actor admission alone is insufficient. Completed DELETE remains a permanent tombstone. Already-sent SDK writes and privileged dashboard edits cannot be recalled; late residuals are detected and cleaned on retry, never hidden by checkpoints. A newly observed ambiguous operation/owner/reference fails closed. No all-data-erasure/provider deletion or distributed fencing claim.

Selected-target name/email are now returned only in guarded target lookup/preview for explicit confirmation (user request); they are not added to journal/audit/report/log. Historical 013 no-name/email UI wording is superseded. Actor admission reads ID/role only. Product health values remain private. InternalHealthRun CRUD policies all stay false; digest and a report-bound 24h upload capability support retry without exposing credentials. Health failures return only safe code/stage/request ID and, when necessary, the opaque upload-retry capability; frontend never logs or exports it. Failures of current session/lifecycle and history persistence are separate observations.

Official [Entity SDK](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities#built-in-user-entity), checked 2026-10-20, explicitly supports service-role read/update/delete of built-in User. Implementation calls User.delete(id) and confirms absent. [Dashboard removal](https://docs.base44.com/Setting-up-your-app/Managing-access#removing-an-app-user) also documents removal/sign-out; SDK token revocation timing, provider re-entry and hosted deletion are not independently measured here. Source/API support is not live acceptance. No new Authentication-panel evidence, external service, provider deletion or hosted destructive test is claimed.

## Historical security boundary — Base44 016

Native Base44 User.role is the single application-admin source. Verified SDK identity plus current User read defeats caller flags/cached roles; no SQL bootstrap/roster or second identity exists. Native role management controls grants/revocations. UI session refresh and backend checks use the same source; role changes do not roll back already-started external calls. Admin tooling remains reachable before onboarding completion, while product/health operations require owner/ACTIVE/current consent and no open deletion/reset conflict.

All product direct SDK policies remain closed. UserCalendarAction is backend-only health data, owner-bound, never logged/exported; both admin deletion and current 023 withdrawal include it. AdminTestOperation contains safe IDs/status/checkpoints/fingerprint hashes, not profile/health bodies. InternalHealthRun direct CRUD remains false and backend requires current native admin. No secrets in frontend/reports.

Deletion requires explicit Test config, signed preview, exact typed target, same current initiating admin, self/last-admin protections and operator pause/drain/roster freeze. Pre/post-write checks are **not** a distributed fence. Cannot verify drain ⇒ do not delete. Final audit/readback and empty/native-absence verification precede SUCCESS; historical consent/daily/protection/audit retention scope stays. No real reset/delete in this delivery. [Runbook and risk register](SHINKA_BASE44_CONTINUATION.md).

## Dependency security policy
Every package must run `npm run security:deps` (`npm audit --audit-level=high --include=dev`). Native npm exit status blocks Critical/High and audit/registry failures without parsing or hiding findings. Moderate/Low output stays visible and requires a documented path, exposure and fix disposition. Runtime and build dependencies are both included; **no Critical/High exceptions or waivers**. Regenerate lockfiles through npm, validate with `npm ci` and full `npm ls`, preserve release-age controls, and never apply unsupported overrides or blind forced audit fixes.

## Buildmarker-006 audit — 2026-10-19
Fresh starting audit after branch synchronization: **0 Critical / 5 High / 4 Moderate / 0 Low**. Final audit: **0 Critical / 0 High / 2 Moderate / 0 Low**. npm counts affected packages, not independent advisories. Repository status: **REPO_CLOSED_PENDING_BASE44_VERIFICATION**. These results do not certify deployed Base44 behavior.

### Verified High baseline and closure
One root advisory, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), affects braces ≤3.0.3: stack-exhaustion denial of service through deeply nested patterns. Registry/advisory inspection found no patched braces release; latest Tailwind 3.x was already 3.4.19. npm's supported parent fix was Tailwind 4.3.3.

| Affected package/version | Direct/transitive | Complete baseline path from repository | Fix disposition |
|---|---|---|---|
| tailwindcss 3.4.19 | Direct dev declaration; also production animation peer | root → tailwindcss; root → tailwindcss-animate 1.0.7 → peer tailwindcss | Parent replaced with 4.3.3. |
| chokidar 3.6.0 | Transitive | root → tailwindcss 3.4.19 → chokidar 3.6.0 → braces 3.0.3 | Tailwind 3 constrains watcher to 3.x; removed entire path. |
| micromatch 4.0.8 | Transitive | root → tailwindcss 3.4.19 → micromatch 4.0.8 → braces 3.0.3 | Current supported micromatch still uses braces; removed path. |
| fast-glob 3.3.3 | Transitive | root → tailwindcss 3.4.19 → fast-glob 3.3.3 → micromatch 4.0.8 → braces 3.0.3 | Removed parent path. |
| braces 3.0.3 | Transitive | All three terminal paths above (watcher, direct micromatch, fast-glob/micromatch) | No patched version available; eliminated from resolved tree. |

All rows share that root advisory; four are npm propagated package findings. **Baseline production/development classification:** Tailwind was declared dev-only but the production `tailwindcss-animate` peer made the resolved Tailwind/High chain production-reachable in npm's graph (lock entries were not dev-only). Actual usage was build/watch CSS tooling, not browser application code. The second animation-peer entrance applies to every path in the table. Repository patterns are not ordinary user input, but untrusted local/CI patterns could exhaust tooling; this did not justify a waiver. Root Chokidar 4.0.3 was a separate development optional-peer workaround for Nitro and did not fix Tailwind's nested 3.6.0.

Minimum-remediation decision, in order:
1. Tailwind is actively required throughout the app; removing it would remove the visual contract. The obsolete direct Chokidar workaround and CSS pipeline dependencies could be removed after migration.
2. Latest supported Tailwind 3.4.19 and braces 3.0.3 still reproduced the advisory; no patch/minor direct fix existed.
3. Tailwind 3's watcher/glob parent constraints retained braces; updating compatible parent patches could not remove the vulnerable chain.
4. No supported patched braces target existed. Forcing Chokidar 4 into a 3.x contract or overriding with unrelated packages was not semantically valid.
5. Migrate Tailwind 3.4.19 → 4.3.3 and add its native Vite plugin 4.3.3. The final tree contains no braces, micromatch, fast-glob, chokidar, postcss-selector-parser or postcss-nested. No overrides were added.

`tailwindcss-animate` 1.0.7 is still used by generic UI animation classes; it is retained via native `@plugin` as a devDependency (supported peer ≥3 includes 4). Removed direct devDependencies: Autoprefixer, PostCSS and Chokidar. PostCSS remains a valid Vite transitive dependency. Both obsolete root Tailwind/PostCSS configs were deleted. Full CSS migration details and browser targets are in TECHNICAL_ARCHITECTURE.

### Moderate findings resolved
`postcss-selector-parser` 6.1.4 and propagated `postcss-nested` 6.2.0 shared [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), quadratic selector parsing (fixed parser ≥7.1.6). Paths were root → Tailwind 3.4.19 → parser, and root → Tailwind → postcss-nested → parser, with the same production animation-peer entrance. CSS input was repository-controlled build input. Migration removed both packages entirely; no suppression or parser override was used.

### Remaining Moderate findings
Two npm affected packages share the runtime path **root → react-router-dom 6.30.6 (direct production) → react-router 6.30.6 (transitive production)**. React Router has two advisories; react-router-dom inherits both findings. No patched 6.x version was available in the inspected registry; both fixes require React Router ≥7.18.0 (npm proposes react-router-dom 7.18.4).

| Advisory | Application exposure | Why it remains / reassessment trigger |
|---|---|---|
| [GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), backslash open redirect; affected ≥6.0.0 <7.18.0 | Current Router links/routes use fixed internal paths. `src/lib/authReturnTo.js` validates same origin and rejects protocol-relative/backslash output before provider return navigation. No attacker-supplied Link/useNavigate destination was found. This is a source assessment, not a guarantee for future callers. | A separate router major changes routing/auth integration beyond the required CSS security migration; there is no compatible 6.x patch. Reassess and migrate before adding dynamic/untrusted navigation destinations. |
| [GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg), SSR deserializeErrors constructor injection; affected ≥6.4.0 <7.18.0 | App uses declarative BrowserRouter and client createRoot, without SSR/manual hydration. The advisory excludes declarative mode; the vulnerable SSR error path is not used here. | The same separate major upgrade is required. Reassess before enabling SSR, data/framework routing or untrusted serialized error hydration. |

These Moderate findings remain visible in npm audit and are documented non-blocking debt under the requested Foundation policy. They are not described as patched. The guard was verified against the real High baseline (non-zero) and the remediated tree (zero); standalone `npm audit --json` still exits 1 because Moderate findings remain.

## Historical checkpoint — Buildmarker-007 canonical access boundary
Owner identity is always authenticated Base44 User.id. `requireAuthenticatedUser`, `requireAdmin` and the tooling wrapper share one implementation. Only auth.me() can mint an accepted principal; client user_id is verified against it, never used to select a different owner. Client role/admin/process/authority flags are rejected. `assertOwner`, `assertActiveAccount`, `assertHealthConsent` and `assertProtectedRecordMutationAllowed` are shared backend helpers, not JSX rules.

All 20 entities deny direct read/create/update/delete in RLS, including application admins. `domainAccess` exposes bounded backend reads only: active own rows; consent and no unfinished deletion job for health rows; active authenticated shared lookup reads; explicit adminRead by id with mandatory audit. INACTIVE/missing/ambiguous profiles fail closed. Readback rechecks private ownership and removes native creator email/internal properties. Anonymous read/write fails. No public lookup authoring or generic product CRUD flow is enabled. The scoped onboarding profile/preferences write path is documented below.

The platform service role bypasses RLS/FLS (official documented behavior), so every repository entry point must apply guards before using it. Module-owned non-serializable grants name future workers; a JSON process flag cannot create a grant. No HTTP endpoint accepts a system grant. Workspace owners and credential holders can bypass application code at the platform management layer; this package does not claim protection against that platform authority. Access to those credentials remains an operational responsibility.

### Complete current access matrix
Each cell describes the current package. DENY_IN_007 means the corresponding future product/admin workflow has not been implemented; it does not redefine the approved future business operation. BACKEND grant cells require the named trusted worker, validation, references and proven atomic predicates. No worker is scheduled or generic writable product API enabled; the scoped 008 onboarding adapter uses these trusted grants. `CONDITIONAL_PROTECTION` is further blocked pending its approved verified transition workflow. Shared reads use the same ACTIVE backend gate. Health reads additionally require consent and no unfinished deletion job.

| entity | anonymousRead | userOwnRead | userOwnCreate | userOwnUpdate | userOwnDelete | adminRead | adminCreate | adminUpdate | adminDelete | backendCreate | backendUpdate | backendDelete |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| user_profile | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_PROFILE | CONDITIONAL_PROFILE | DENY |
| user_preferences | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_PROFILE | CONDITIONAL_PROFILE | DENY |
| user_health_consent | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_CONSENT | CONDITIONAL_CONSENT | DENY |
| user_health_consent_event | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_PROTECTED | DENY_PROTECTED | GUARDED_CONSENT | DENY_IMMUTABLE | DENY |
| user_cycle_settings | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_CYCLE | CONDITIONAL_CYCLE | VERIFIED_DELETION_WORKER |
| user_period_record | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_CYCLE | CONDITIONAL_CYCLE | VERIFIED_DELETION_WORKER |
| user_cycle_prediction | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_CYCLE | CONDITIONAL_CYCLE | VERIFIED_DELETION_WORKER |
| user_cycle_phase_day | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_CYCLE | CONDITIONAL_CYCLE | VERIFIED_DELETION_WORKER |
| cycle_phase_lookup | DENY | ACTIVE_SHARED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_REFERENCE | CONDITIONAL_REFERENCE | DENY |
| message_category_lookup | DENY | ACTIVE_SHARED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_REFERENCE | CONDITIONAL_REFERENCE | DENY |
| message_category_mapping | DENY | ACTIVE_SHARED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_REFERENCE | CONDITIONAL_REFERENCE | DENY |
| message_pair | DENY | ACTIVE_SHARED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_REFERENCE | CONDITIONAL_REFERENCE | DENY |
| user_daily_message | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_PROTECTED | DENY_PROTECTED | GUARDED_DAILY_MESSAGE | DENY_IMMUTABLE | DENY |
| notification_delivery | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_NOTIFICATION | CONDITIONAL_NOTIFICATION | DENY |
| user_pattern_summary | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_PATTERN | CONDITIONAL_PATTERN | DENY |
| moon_phase_lookup | DENY | ACTIVE_SHARED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_REFERENCE | CONDITIONAL_REFERENCE | DENY |
| admin_audit_log | DENY | DENY | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_PROTECTED | DENY_PROTECTED | GUARDED_AUDIT | DENY_IMMUTABLE | DENY |
| system_error_log | DENY | DENY | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | GUARDED_ERROR | CONDITIONAL_ERROR | DENY |
| health_data_deletion_job | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_PROTECTED | DENY_PROTECTED | GUARDED_DELETION | CONDITIONAL_DELETION | DENY |
| data_protection_event | DENY | ACTIVE_OWNER_BACKEND | DENY_IN_007 | DENY_IN_007 | DENY_IN_007 | AUDITED_BACKEND | DENY_IN_007 | DENY_PROTECTED | DENY_PROTECTED | GUARDED_PROTECTION | CONDITIONAL_PROTECTION | DENY |

### Protected records and admin audit
user_daily_message: own read, only future DAILY_MESSAGE grant create, no update/delete even by that grant. user_health_consent_event and admin_audit_log: append-only. data_protection_event: no human update/delete; backend status progression remains closed until a verified transition workflow is supplied. health_data_deletion_job: only DELETION grant progresses approved states, never deletes history or changes owner/event/request metadata. COMPLETED requires a module-issued proof bound to the job/user after all required health scopes have zero remaining records (the native 023 worker includes UserCalendarAction in addition to the four source collections); request booleans cannot substitute. Terminal jobs cannot regress. Future worker must couple deletion verification and state publication with proven atomicity; a proof object alone is not a platform transaction.

`withAdminAudit` records successful/failed privileged VIEW/UPDATE/DELETE attempts with actor, target, action, outcome, time and safe code. It prevents returning privileged data if audit persistence fails. No normal user action is written to admin_audit_log. No admin UI or generic admin mutation route exists. `createAdminAuditEntry` and `createSystemErrorEntry` accept only declared metadata, bounded identifiers and machine codes; unknown/nested fields, credentials, health data and message snapshots are rejected. Existing recursive Health redaction is preserved. Email alert delivery and error retry/dedup workers are future scope.

OD-009 = PARTIALLY_VERIFIED. Repository policy and synthetic negative tests are implemented, including the HTTP/service boundary; direct SDK RLS deployment and multi-identity enforcement must still be measured. H12-901 is LIVE_ENFORCEMENT_REQUIRED, not a synthetic PASS. Verify anonymous, owner A, owner B and app admin direct reads/writes plus service-role entry points after deployment. Never modify real immutable history for a test; use disposable mutable fixtures and deny attempts without successful protected writes.

### Buildmarker-007 dependency and evidence status
Dependencies and Tailwind 4.3.3 remain unchanged. Fresh final audit must retain 0 Critical / 0 High; two Moderate router findings above remain visible. Product content, Cycle and Moon lookup seeds: NONE. Repository closure does not mean live enforcement is certified.

Official platform evidence (read 2026-10-19): [entity schemas](https://docs.base44.com/developers/backend/resources/entities/entity-schemas), [RLS and service-role semantics](https://docs.base44.com/developers/backend/resources/entities/security). Native simple/compound uniqueness is unsupported; undocumented FK/index/transaction/conditional guarantees are not claimed.

## Onboarding security and capability boundary — current package

Existing 20-schema direct SDK deny rules, common principal branding, owner/admin guards, protected-record policy and immutable consent event restrictions are preserved. The generic domainAccess endpoint still offers no product CRUD. The specific onboarding endpoint derives identity from auth.me(), rejects forged role/owner and unknown fields, denies INACTIVE recreation, validates adult DOB on server clock, resolves GeoNames independently and never accepts client consent_status/account_status/Sun sign.

061 supersedes the historical pre-auth pending-name storage: no personal form renders before verified admission, and the name draft stays only in the current owner component until profile readback. No health form values enter storage, URLs, analytics or error logs. Unexpected backend/provider exceptions become allowlisted codes; query/results are bounded and credentials stay in server environment. No client geolocation is used. UI/provider callbacks do not create Base44 identities manually.

Consent is independent of age/auth. Health writes require explicit true consent, approved text/version, active owner and no open deletion job; withdrawn consent requires a future regrant workflow. The production adapter rechecks these predicates around sequential writes and confirms readback, without claiming an owner transaction or rollback. Profile/preferences persistence is enabled in repository code. The approved version health-consent-v1.0 and exact EN/TR checkbox text are integrated; valid explicit consent enables production cycle persistence. Default-version adapter tests use an isolated SDK transport. Retained fixture-version tests deliberately prove that partial durable consent/settings survive a later failure without UI advancement. No-cycle Skip writes neither current consent nor an event. No client-supplied version, owner, status or admin flag is trusted. Event domain fields form its complete immutable upsert key; generic event update/delete remains denied. Native metadata immutability, cross-instance uniqueness, conditional predicates and concurrent status transitions still require deployed enforcement evidence.

Dependency versions are unchanged in this package. The required fresh audit retains the previously documented router Moderate findings; final execution totals are recorded in Development Notes. Real Apple/Google, deployed ownership/authorization and GeoNames availability remain EXTERNAL/DEVICE REQUIRED.

Final clean-install audit for Buildmarker-008: 0 Critical, 0 High, 2 Moderate, 0 Low; `security:deps` exited 0. All 24 existing security tests and new authenticated-owner/consent/idempotency refusal tests pass. No live enforcement claim.


## GeoNames live diagnostic boundary — same package 008

The hosted onboarding entry imports `secrets` from `base44:runtime`; `secrets.get('GEONAMES_USERNAME')` runs inside its default request handler. Backend values are never bundled, copied into test fixtures, printed or read through frontend code. The entry-wiring test substitutes the platform module and verifies zero module-load reads plus fresh reads across missing/configured/rotated synthetic values. Build-time inspection exports a boolean only, never backend source or an environment value.

Errors retain no original exception, URL, username, provider message/body or query. The HTTP boundary constructs an explicit diagnostic allowlist: code, http_status (100–599 or null), documented provider_status (or null), provider_class (AUTHORIZATION/QUOTA/SERVICE/REQUEST/NOT_FOUND or null). Forged diagnostic objects are ignored. Frontend still renders only canonical copy. No GeoNames console logging, trace output or product-record diagnostics were added. The fixed provider host/path cannot be supplied or overridden by request data; redirects are rejected.

Fetch-failure diagnostics additionally allow only failure_stage and transport_class enums documented in Technical Architecture. Classification may inspect the thrown exception and up to three nested causes in memory, with cycle protection. Only explicit code/name mappings, exact redirect signatures and the bounded Deno DNS-message signature are recognized; arbitrary names/codes and generic TypeError remain undisclosed. The original exception/cause/message/stack is never attached to GeoNamesError, returned, logged or persisted. No elapsed timing or raw exception field was needed. G12 injects synthetic username/query/credential-URL canaries into message, stack, cause and unrecognized names/codes, and asserts safe HTTP projection, zero console calls and unchanged product entities. G11 verifies deadline cleanup and no unhandled rejection after transport failure/timeout. HTTPS/TLS verification, redirect rejection, fixed destination, authentication and owner guards remain intact.

Authenticated searchPlaces is read-only, including with no preferences, and never invokes initialize/saveProfile/saveCycle. Regressions snapshot every product entity and assert that all SDK calls during successful/empty/error lookup are reads. Owner/auth checks and unknown-field rejection continue to protect the multiplexed endpoint. Selected-ID persistence, optional empty continuation and coherent five-field NULL clearing are unchanged. A provider authorization response is not proof that the Base44 secret is absent; live cause is established only by the new safe runtime diagnostics.

The temporary `internalHealth` action geoNamesTransportProbe uses the existing branded server-admin guard; anonymous/user/forged-role requests cannot read the secret or trigger outbound traffic. Its payload accepts only the action key. Caller-supplied URL, host, query, username, headers, variant, timeout and signal are rejected. It never accesses asServiceRole/entities or writes Health/product data. Runtime secret reads occur only inside the authorized callback, not at module load. The narrowed v2 probe sends the same backend credential exclusively to the fixed GeoNames HTTPS host for each error/manual/error/manual sample. Credential-free and third-party controls have been removed. The query is a server-owned public test constant, not user input.

All results are explicit technical projections: no response body, Location, URL, secret or raw error/name/code/message/stack/cause. The existing classifier is reused without new speculative mappings. Probe response bodies are cancelled unread. The normal adapter uses manual; the probe compares error/manual. Neither follows Location. The normal adapter rejects all 3xx/opaque redirects before parsing and cancels unused bodies. Normal redirect failure preserves the six-field diagnostic projection, using GEONAMES_HTTP_ERROR and REDIRECT_REJECTION (opaque HTTP status null). Cleanup errors are swallowed safely; a stalled cleanup uses the existing abort deadline, and a late response is discarded unread. Probe limits retain the ceiling of 8 sequential requests (v2 plans only 4), 3-second sample deadlines, 30-second session budget, bounded cancellation cleanup and a 60-second warm-worker cooldown. No cross-instance lock is claimed; admin access and per-session bounds are the enforceable serverless boundary without DB writes. If a transport ignores abort, the plan stops with CANCELLATION_UNCONFIRMED and that worker rejects further probes until settlement, rather than starting overlapping traffic. No waitUntil, automatic normal-search trigger, TLS bypass or HTTP fallback is added. G13–G20 and the actual-entry substitution test cover authorization, fixed targets, single-variable comparisons, timeout/cleanup, concurrency and disclosure. Remove the temporary runtime action/wiring after normal hosted GeoNames search/selection/save closure.

The redirect-policy compatibility change is supported by user-supplied preview/internalHealth transport evidence only. It does not prove valid credentials, Base44 runtime identity, onboarding or prod success. G21–G24 cover the error-incompatible runtime fixture, manual search/resolve, every 3xx/opaque rejection with one request, unread/late-body cleanup and secret/URL/Location/raw-error non-disclosure. Generic TypeError remains UNKNOWN. Dependency versions and the existing router Moderate-advisory disposition are unchanged; live H10 closure remains open.

## ON-04 country/subdivision list boundary — 2026-10-20

The three list actions reuse request-scoped secrets, authenticated owner/ACTIVE checks and a strict field allowlist; they never write entities. Country must be uppercase ISO-shaped two letters and validated by the provider scope; parent must be a positive safe integer or null, language en/tr, offset a multiple of 100 within 0…5000. Client URL/endpoint/username/filter/page-size/owner overrides are rejected. Parent country/admin hierarchy and returned child code prefixes are validated independently. Only populated records may pass final resolution; client names/coordinates/path never authorize persistence.

All four provider paths use the fixed secure HTTPS host and existing redirect:manual rejection/abort/cleanup contract. Bounded streamed list responses (512 KiB countries, 1 MiB pages) and the 20-second action budget extend rather than remove limits; small detail/hierarchy payloads remain 100,000 bytes. There is no shared location cache, geolocation inference, free-text fallback, analytics/logging of the selected path, provider raw-error disclosure or new UI dependency. B01…B18 exercise malformed/cross-country/parent mismatches, paging limits, same-name types, read-only auth boundaries and cleanup. CAP-14/15 are PARTIALLY_VERIFIED with repository plus user-reported Preview search evidence; neither claims independently verified hosted selection/save success.

## Maintenance security review (2026-10-20)

Lazy loading changes delivery timing only; ProtectedRoute/AdminGate and server authorization remain. Read-only GeoNames list optimization still reads/authenticates the owner profile and refuses inactive accounts before provider access. Selected-ID save re-resolves the provider record. Cache contains only public list projections, never owner profile/consent/credential data; it expires after 60 seconds and is cleared on disposal/Clear. Existing manual redirect rejection, runtime secret read, bounds, timeouts and strict payload guards are unchanged.

No dependencies/lockfile, RLS, schemas, live product data or audit retention changed. Native audit still reports two Moderate React Router findings; their existing exposure/disposition applies. No High/Critical waiver. Package-history pruning cannot delete security/audit or Health evidence. The admin-only temporary transport probe is retained for the documented unresolved hosted validation; normal app/Full Health never runs it automatically.

## ON-05 consent correction — authority and failure safety

Only explicit health_consent=true, authenticated owner, ACTIVE profile and no open deletion job authorize a new backend UTC granted_at. Client timestamps/version/status remain rejected. Existing valid time is never updated by onboarding. Current consent requires GRANTED, approved version, valid canonical UTC business instant and no withdrawn_at. The same consent is re-read before each health mutation and after final readback; detected withdrawal/deactivation/deletion or changed consent fails. No generic event mutation or RLS relaxation was added.

The same-worker bounded in-flight gate reduces duplicate taps, not distributed races. Insert-only consent/settings prevents silent replacement; independent-worker duplicate inserts can still occur and are explicitly rejected on readback. No rollback, deletion/restart fix or repair of conflicting history is offered. Minimal live observation recorded only build context, counts and timestamp presence; no tokens, owner identifiers, full records or health dates are logged. The Data UI formats dates, so live raw timestamp type/offset remains unverified. No live saveCycle mutation was performed by this correction.

## Historical checkpoint — Admin entry and revocation — Buildmarker-010

The profile menu and internal gate consume one derived AuthContext privilege from verified Base44 `auth.me()` identity. URL/localStorage/email/name/body role never grant access. All three internal paths are behind ProtectedRoute and AdminGate: anonymous returns to existing sign-in, ordinary user receives FORBIDDEN. Initial/pending checks expose no interactive admin UI. Refresh conceals and makes an existing tool inert; a completed denied check removes it. Logout clears local identity before invoking the SDK and invalidates old requests, so a failed logout transport or delayed admin response cannot restore local access.

Remote changes are observed on internal navigation, focus/visibility return and visible-admin 60-second polling; a continuously visible tab has this bounded refresh cadence, not immediate server-push revocation. Independently, every server operation still uses request-derived auth and the existing admin guard. No RLS, service-role exposure, domain guard, role model or entity policy changes. An active run may finish its already-authorized server call; no cancellation or rollback is asserted. The fresh response cannot reopen a removed component.

AN02…AN07 exercise loading, direct-route denials, logout failure and stale/revoked identities. Existing S08/T68/H03-009 and H12-901 remain; synthetic UI checks do not replace live backend enforcement. New screenshots use isolated synthetic identities, not customer records.


## Historical checkpoint — Daily generation and controlled imports — Buildmarker-011

`dailyMessage` authenticates first, derives owner, denies inactive/forged authority and only accepts action=today plus optional IANA timezone. Shared domain validation/guards remain canonical. Existing immutable rows require active owner; new calculation reads health rows only after valid current grant, matching consent event and no open deletion job. Missing/withdrawn consent does not read health settings or periods. Technical errors are never converted to UNKNOWN. The durable adapter must enforce account/reference and exact consent-input predicates at commit; none is configured in production, so new writes fail closed. Same-day readback projects only declared daily fields and optional display name, never native creator metadata, tokens or health inputs.

`contentLibrary` is admin-only with strict action/field allowlists. Caller content, URL, entity, source hash replacement or roles cannot authorize arbitrary writes. Dry-run/verify are read-only. Apply requires a freshly computed review digest, at most 25 insert-or-identical reference rows, conflict refusal and full readback. No overwrite/delete/import endpoint exists for daily snapshots. Concurrent import operators are unsupported and may create duplicates at the platform layer; strict verification then fails. No concurrent-exclusion or rollback guarantee is asserted. Apply audit retains only existing allowed entity/action/outcome metadata.

Astronomy Engine 2.1.19 is the only added dependency, pinned to the approved source's library and excluded from the app entry bundle. Required fresh security results are recorded in Development Notes; the two existing Moderate router findings remain separately documented. No live import, live generation, RLS relaxation, external datastore connection or physical device test occurred.


## Historical checkpoint — Calendar security boundary — Buildmarker-012

Authenticated owner is derived from the shared branded principal; client owner/role/phase/prediction/time/version fields are rejected. Every read checks ACTIVE, consent and no open deletion job before health collection access and rechecks afterward. A current grant needs canonical UTC time/version and exactly one matching grant event; historic withdrawn/regranted events are retained. No consent returns no health data and does not query health collections. Settings/start/derived writes remain behind the unavailable transaction boundary; no direct SDK or admin CRUD path is opened.

A future durable adapter must couple account/consent/deletion checks and all writes, including new explicit grant/time/event, to the same transaction. Existing granted_at stays exact. Regrant requires matching withdrawal history, a valid completed deletion job newer than that withdrawal and no remaining health rows. Calendar never deletes settings, consent events or daily history. No product schema or RLS changes.

UI invalidates health and pending responses before focus/visible-tab refresh, offline transition, known health-access-change event or unmount/session replacement. Visible polling is 60 seconds. This is bounded detection of remote revocation, not immediate server push; backend checks remain mandatory. Mutation errors retain prior confirmed state only within the same still-valid UI generation; known privacy errors immediately hide it. No health dates/receipts enter URL, local/session storage, analytics or logs. The transport cannot cancel an already-started invocation; obsolete results are discarded.

The local atomic fixture models one serializable store shared by two workers. It proves protocol behavior only. No live mutation, independent hosted-worker test, native rollback or production-ready claim is made. Existing Moderate router advisory disposition remains applicable because navigation destinations are fixed internal paths.

## Historical checkpoint — Admin test deletion/restart — 013 explicit user authorization

The new endpoint requires authenticated current admin for lookup, preview, execute, resume and status; it rereads the actor's User role before privileged work and again inside the required durable exclusion boundary. Target identity is separate. Payloads are closed; service-role calls stay in shared backend persistence. Preview uses projected row IDs, owner/reference IDs, states and revision metadata only. Profile values, birth/period dates, consent contents/times, email, message text and raw exceptions are neither returned nor logged. Health counts are limited to the exact admin-selected target. No bulk user listing or generic entity mutation console exists.

The delete scope is an explicit exception for seven operational entities plus built-in User; immutable/protection/audit restrictions are unchanged. Current consent metadata stays retained without fabricated withdrawal. PENDING/FAILED notifications become SKIPPED while history stays. Indirect parent/child ownership conflicts stop the workflow. Admin self-delete, last-admin removal and open health-deletion collisions are denied. Reset is allowed for self-admin, never activates INACTIVE and never silently grants/withdraws consent.

HMAC preview tokens bind actor/target/operation/app/scope and expire after five minutes; exact typed target ID is required. They are not authentication or concurrency primitives. Environment is the actual SDK app ID/server plus separately configured server label/allowlist. Test branch/Preview does not isolate data. No secret is supplied from browser input. Production execute/resume unconditionally refuse without a verified coordinator.

Early guards reread User and durable deletion tombstone on every hosted function's authenticated path. This prevents a stale token from recreating profile/data through those paths, but neither instantaneous platform token revocation nor cross-worker exclusion is claimed. Direct SDK product CRUD remains denied. Deployment, existing-token behavior and all-writer fencing require explicit live proof before enabling mutations. New tooling schema must be deployed before lifecycle-aware functions; absence fails closed. Audit/job start must persist before destructive steps. A final audit failure leaves the actual partial/completed deletion state visible as retry/unconfirmed, never success.


## Current dependency and authority evidence — 014 (2026-10-20)

Fresh `npm audit --json` completed on the unchanged lockfile (SHA-256 `98542fb2ec2004ccd54f48ac07eef9ccd40fb50baf69735479e93606f8b52436`): **0 Critical, 0 High, 2 Moderate, 0 Low** affected packages. `npm run security:deps` exits 0 at its native High threshold; standalone JSON audit exits 1 for Moderate findings. This is a new measurement, not the earlier 011 count. Path: root → react-router-dom@6.30.6 → react-router@6.30.6. Advisories GHSA-wrjc-x8rr-h8h6 and GHSA-337j-9hxr-rhxg and the documented fixed-navigation/declarative-no-SSR exposure assessment above remain applicable; npm proposes the breaking 7.18.4 upgrade. No dependency or lockfile changed, no issue is described as patched.

Prior 012/013 scans failed certificate-chain verification. The failure was not reproducible in this run: direct Node TLS to registry.npmjs.org reports authorized=true, TLSv1.2, issuer Google Trust Services; strict-ssl=true, no NODE_TLS_REJECT_UNAUTHORIZED override, no extra CA configured. No trust, TLS or npm configuration was changed. The old connection's chain/root cause was not captured and cannot now be proven; transient network/chain presentation is a hypothesis, not a repaired application defect. Current scan is complete, so the current security-scan status is no longer BLOCKED. Historical blocked results remain recorded as historical.

Live read-only CLI evidence confirms lifecycle schema readability and PRE_IMPORT/Moon missing data only. Privileged inspection does not prove user RLS or mutation safety. The proposed SQL authority/region/identity/admin-roster/migration changes require user approval per [decision 014](reports/SHINKA_PERSISTENCE_DECISION_014.md); no external service, credential, data movement or live account operation occurred. The missing-schema guard remains fail-closed and AT17 verifies no product writes before failure. Live ON-05 save/readback and hosted multi-identity enforcement remain outstanding.

## Dependency scan — Buildmarker-015

Fresh TLS-verified npm audit after `npm ci`: 0 Critical, 0 High, 2 Moderate, 0 Low. Added pinned `postgres` 3.4.9 for server/operator/local database tests; no driver in the frontend graph. `security:deps` passes the native High threshold. Remaining router paths are `react-router-dom@6.30.6 → react-router@6.30.6`: GHSA-wrjc-x8rr-h8h6 (untrusted backslash navigation) and GHSA-337j-9hxr-rhxg (SSR hydration deserialization). Existing mitigation remains static/internal navigation plus validated auth return path; app uses BrowserRouter without SSR hydration. A major migration to fixed v7 is the vendor fix and remains separate scoped work, not suppressed by an override. The audit JSON and exact lock hash are recorded with 015 evidence.

## Historical dependency scan — 016

Clean npm lockfile install after removing Postgres.js: zero Critical/High, two existing Moderate React Router advisories. No forced major-router migration. Existing static internal navigation/no SSR mitigation and remaining limits remain documented above. Exact fresh audit is retained in reports/base44-016/npm-audit.json. No SQL driver or runtime secret dependency remains.
<!-- Latest security measurement; historical package counts below remain unchanged. -->

## 018 dependency scan and diagnostic boundary

Fresh unchanged-lock audit: **0 Critical / 0 High / 3 Moderate / 0 Low** affected packages. High-threshold security check passes; full audit exits 1 for the retained Moderate findings. The existing react-router/react-router-dom paths remain. The additional Vite finding is [GHSA-698v-4r3x-3vcv](https://github.com/vitejs/launch-editor/security/advisories/GHSA-698v-4r3x-3vcv), involving Windows editor launching with attacker-controlled filenames/environment or alternate data streams. No dependency change or blanket safety claim; macOS local testing does not validate Windows exposure. Exact audit is retained in reports/health-018/dependency-audit.json.

## Birthplace search boundary (2026-10-26)
GeoNames access is now two owner-bound guarded paths: `search` and `resolve` (hierarchy list paths retired). Same fixed HTTPS host, redirect:manual rejection, bounded response, worker-local burst guard and 053 shared credit reservation, credential never returned. Free text is never persisted; only an explicitly selected, server-resolved GeoNames ID is saved.
