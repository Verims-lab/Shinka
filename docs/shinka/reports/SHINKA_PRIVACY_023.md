# Owner privacy — Buildmarker-023 / HC-023.0

Status: **REPO_CLOSED_PENDING_OWNER_PUBLICATION_AND_HOSTED_PLATFORM_ACCEPTANCE**. Development is on Test only. Initial clean local/origin Test `31b1989` was behind main by three commits; fast-forwarded and pushed to `ec2f8d3` before work. No live privacy action, reset/resume, Full Health, remote schema push, main merge/publish, new service or dependency upgrade was performed. Upstream OAuth/AuthLayout templates remain, with narrow type corrections needed by the mandatory typecheck.

## Implemented behavior and authority

You → Account & Privacy presents distinct withdrawal and account-erasure actions. A single scope confirmation is the only destructive trigger. Cancel, Escape, opening, reload and status checks do not mutate. The public `/delete-account` route uses existing Apple/Google sign-in and remains reachable without completed onboarding, daily content or a profile. It forwards no target ID or credentials in a URL. Canonical Privacy Policy/Terms of Service remain unpublished per the earlier decision.

The closed `accountPrivacy` function accepts read/begin/resume/status only. SDK authentication plus a fresh native User read derive the owner; caller ID/role/status fields are rejected. Its deliberately raw service client is confined to this owner-authorized lifecycle path so it can finish after a target product fence. Normal immutable restrictions and admin Test Tools self/last-admin/other-target rules stay intact. Current native admins are all protected from self-erasure (including non-final admins): the available role does not independently prove builder ownership, so the implementation conservatively refuses admin accounts and explains this. Normal owners require no admin.

Before cleanup, a persisted UserPrivacyRequest fences target product writes and relevant health processing. Account removal also marks an existing profile INACTIVE, but that status is never completion. Withdrawal records server UTC once, preserves the original granted_at/version, persists WITHDRAWN plus one matching event and reuses DataProtectionEvent/HealthDataDeletionJob. Unrelated open jobs fail closed. Retrying never invents a new consent time. Regrant requires completed cleanup, no residual health scope and new explicit consent through Calendar; old data is never restored.

Home new calculation, Calendar/onboarding health paths and domain health reads enforce the current fence/consent. Historical daily snapshots and Pattern themes remain available under their historical-data contract after withdrawal; they do not derive fresh cycle calculations from retained history. Account deletion stops all product admission. Fresh checks before responses and mutations, frontend generation invalidation, session changes, focus/visibility and a visible-session 60-second refresh discard observed stale state. Same-browser invalidation carries only a nonce. Already-started remote writes and unobserved other-device changes cannot be instantly recalled.

## Full data disposition matrix

“Remove” means scoped active-store delete plus successful absence read, **not physical/platform erasure**. Other owners and shared sources are untouched. No legal retention ground or duration is invented.

| Type / copy | Withdraw health consent | Owner account erasure | Verification / reason |
|---|---|---|---|
| Native User, OAuth identity | Keep | Remove User last | Fresh exact-ID absence; provider authorization/recovery copies remain separate |
| UserProfile | Keep | Remove | Owner absence; INACTIVE is only an access fence |
| UserPreferences | Keep | Remove | Owner absence, including notification preference |
| UserCycleSettings | Remove | Remove | First-page cleanup then fresh zero-row read |
| UserPeriodRecord | Remove | Remove | Incoming prediction/phase owner checks; zero rows |
| UserCyclePrediction | Remove | Remove | Includes obsolete physical derived rows |
| UserCyclePhaseDay | Remove | Remove | Includes physical phase cache |
| UserCalendarAction | Remove | Remove | Health-bearing desired dates/operation data, not exempt receipts |
| UserHealthConsent | Preserve WITHDRAWN and original grant | Remove | Current read and exact event/time match for withdrawal |
| UserHealthConsentEvent | Preserve approved history, append withdrawal | Remove | Immutable during ordinary operations; narrow owner-erasure exception |
| UserDailyMessage | Keep immutable historical assignment/snapshots | Remove | All candidates and daily personal content; foreign notification edges stop |
| UserPatternSummary | Keep historical physical rows; current reader ignores them | Remove | Current Pattern calculation only uses retained assigned daily categories |
| NotificationDelivery | Keep history; no delivery worker exists | Remove | All owner rows regardless of status; future workers must use the same admission fence |
| DataProtectionEvent | Keep minimal protection history | Remove | Deletion jobs removed before parent; foreign jobs stop |
| HealthDataDeletionJob | Keep current/retry/completion history | Remove | Withdrawal validates same request/time, all five health scopes |
| AdminAuditLog | Keep | Remove if actor or target is owner | Explicit owner-erasure exception; admin-test retention is not copied |
| AdminTestOperation | Keep | Remove if actor or target is owner | An active conflicting admin operation prevents entry; no general admin permission change |
| UserPrivacyRequest | Keep withdrawal control/history | Remove retired requests; keep current erasure request pending platform disposition | Minimal owner/kind/status/time, no health payload; not a legal retention exemption |
| PrivacyRecoveryReceipt | Not created for withdrawal | Remove retired-request receipts; current request-bound hashes expire for use after 24h | Minimal read-only capability; expiry is not physical deletion or a retention policy |
| CyclePhaseLookup | Keep | Keep | Shared reference, no owner copy |
| MessageCategoryLookup | Keep | Keep | Six approved categories unchanged |
| MessageCategoryMapping | Keep | Keep | 240 approved mappings unchanged |
| MessagePair | Keep | Keep | 260 approved bilingual pairs unchanged |
| MoonPhaseLookup | Keep | Keep | Shared reference coverage unchanged |
| SystemErrorLog | Keep | Keep | Closed schema has no user/profile/content fields; only non-personal correlation/error metadata permitted |
| InternalHealthRun and private Health artifacts | Keep | Keep | Redacted diagnostics, no user/health/token payload permitted; runner histories not erased to hide failures |
| Browser state/query cache | Invalidate health views/in-flight generations | Clear personal state and sign out after verified active absence | Session-bound pending capability retains no health/profile payload; sign-out return can read minimum status |
| Base44 created_by/created_by_id, trash, logs/backups, uploaded files, provider grants | No invented erasure claim | Platform review pending | Native creation metadata can be personal even on minimal request rows; no speculative global delete of shared references by creator |

This covers all 20 product schemas, five operational schemas and native User. There is no current product upload/chat/export path or background notification delivery implementation. If legacy uploads/conversations or PII in forbidden diagnostic fields exist, their owner mapping and supported removal need platform review; local schema inspection does not prove live absence. The pending erasure request/receipt and native creator metadata need an approved final disposition and supported purge process. No indefinite legal retention claim is made.

## Recovery, limits and truthful completion

Each pass deletes from a first page of 20, at most 40 records and starts an eight-second cleanup deadline at its first deletion and checks it before each subsequent delete; this budget is shared with retired privacy requests/receipts. A transmitted SDK call may exceed that deadline. Client timeout is 20 seconds. There is no background/unbounded polling or destructive auto-resume; users Check then Continue the same request. Status re-reads required scopes. Request history has a 50-row integrity bound; over-limit/duplicates fail closed and need reviewed operational resolution, not a truncated success.

Warm-worker coalescing and stable request keys prevent ordinary double submission. Independent-worker duplicate observations are explicit conflicts; Base44 supplies no demonstrated UNIQUE/CAS/transaction/distributed lock or exactly-once guarantee. No rollback is claimed. Partial records remain recoverable rather than being erased to start over. Account deletion supersedes a pending withdrawal; both fresh admission paths stop the other after observing the account request. A preexisting unrelated cleanup job is not silently adopted.

A 256-bit browser-generated secret is stored before dispatch; only SHA-256 is stored server-side, with 24-hour access validity and at most five receipts. It grants minimum read-only status for that one deletion, never a mutation, arbitrary ID lookup or target details. Native User absence plus all required active scopes absent yields PLATFORM_PENDING, permanentDeletionVerified=false. A lost User-delete response can be reconciled after auth is gone. If late records exist after User removal, status becomes PLATFORM_REVIEW_REQUIRED; no unusable authenticated Continue or success is shown. Receipt expiry/loss needs platform review, never a recreated account as a recovery shortcut.

## Official platform review — 2026-10-21

[Base44 user-data deletion](https://docs.base44.com/Community-and-support/Deleting-user-data) distinguishes app-user removal, Recently deleted and permanent dashboard removal. The documented platform also has separate logs/backups and upload ownership limitations. This delivery does not assert all copies are erased. Operator follow-up must inspect the app's user/data recovery areas, verify permanent removal using supported controls, and resolve actual platform copies/retention; no hidden purge endpoint is used.

The installed `@base44/sdk` 0.8.54 exposes service-role User/entity filter/delete, but no separately verified purge or Apple-token-revocation method. [SDK entities](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities) and [auth](https://docs.base44.com/developers/references/sdk/docs/interfaces/auth) were checked against installed code. Generic delete wording alone does not prove trash/backups purged. [Entity schema documentation](https://docs.base44.com/developers/backend/resources/entities/entity-schemas) confirms native creator fields and unsupported unique constraints; staged schema acceptance remains hosted verification.

[Apple account-deletion guidance](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion) requires in-app initiation and Sign in with Apple token revocation. The initiation path is implemented; Base44 must provide a supported revocation integration/evidence before that acceptance can close. Do not ask the end user to revoke OAuth as a substitute for the integration.

[Google Play guidance](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en) requires an external web deletion pathway as well as in-app access. `/delete-account` is implemented using the same owner-confirmed workflow. Owner must publish it on the actual app domain, verify provider login/return and register the URL in Play Console. No published URL or store approval is claimed here.

## Verification and Health

- Chromium 156.0.8078.4 and WebKit 27.2: **550/550 tests each**, zero page exceptions. Each also passed 23 privacy, 24 You, 22 Pattern, 87 mobile, 19 admin-navigation, 5 Home, 8 Calendar and 4 Test Tools flows.
- Local real Health UI with synthetic transport: **131 PASS / 13 BLOCKED**, save verified. Blocked hosted prerequisites: H04-019, H05-001…009, H08-005, H09-004, H12-031. Registered 169; in-app 144; separate 10 local/13 external/2 future. No live Full Health ran.
- npm ci, npm ls (full/direct), lint, typecheck, production build, 17 Repo Health checks and generated last-five history pass. Fresh npm audit: **0 Critical / 0 High / 2 Moderate** (existing React Router major-upgrade disposition; no dependency change or suppression).
- Production initial JS **475,923 raw / 158,117 gzip**; CSS **87,430 / 15,054**, within 500,000/165,000 and 90,000/16,000 budgets. No static cycles; lazy asset failure/reload passes. Account Privacy remains lazy. LCP/CLS samples are local; field p75/INP and physical devices remain NOT_MEASURED.
- Visual inspection of 320px/200% Turkish and 844px landscape/200% confirms scrollable scope, readable controls and containment. Focused PR19 also verifies slow preparation cannot starve every cleanup attempt.

Final measurements are written in [verification.json](privacy-023/verification.json), [case audit](privacy-023/case-audit.md), [performance](privacy-023/performance.json) and [dependency audit](privacy-023/dependency-audit.json). Local SDK fixtures run actual handlers and UI; they are not hosted Base44 enforcement or physical Android/iOS evidence.

HC-023.0 activates previously future H11-001 with actual withdrawal and H11-003 with actual erasure, replacing the outdated INACTIVE-only assertion. H12-039 adds authority/recovery coverage; H13-019 is local modal/route/mobile acceptance; H11-008 is explicitly external hosted/platform/provider acceptance. H04-015 now asserts both new schemas' closed CRUD policies; four existing native-readiness cases require all five operational schemas, still without mutation evidence. Normal in-app Health never invokes accountPrivacy against a live user; PR fixtures call the actual handler against in-memory data. Existing failed/blocked reports remain untouched.

Final review found that completed cleanup without a persisted COMPLETED request could clear the UI too early and leave the health fence active. PR20 now requires both verified scope and durable request completion; explicit resume repairs the missing final write without a new event/time.

Initial PR12 found completed-withdrawal duplicate retry incorrectly trying a new grant: fixed same persisted withdrawal reuse. First full Chromium run found CL08's minimal test database ignored the newly required per-ID absence filter; its fixture now respects query fields while preserving the deadline assertion. H12-034 failed through that same fixture. Initial typecheck also caught upstream AuthLayout/OAuthConsent typing plus new callback annotations. These failures are recorded, not hidden by case deletion.

## Owner release and acceptance

Two additions only: `UserPrivacyRequest.jsonc`, `PrivacyRecoveryReceipt.jsonc`; 26-file complete schema inventory. After owner review/merge through the existing Git flow, compare the full Builder Data schema inventory and closed policies with the prepared manifest. Apply schemas first, then synchronize `accountPrivacy`, `applicationSession` and **all** native/shared backend code together, then publish the matching frontend. Do not deploy from a partial entities folder or publish only frontend. A reproducible staged manifest is included with the verification artifacts; no remote comparison or push ran in this task.

After publication, no more than five in-app acceptance steps:

1. Choose separate disposable **normal** accounts A (withdrawal) and B (account deletion). On A open each confirmation, Cancel/Escape, and confirm no changes; exercise TR/EN.
2. On A confirm withdrawal. If interrupted use Check/Continue; verify withdrawn versus cleanup-complete messages, Home/Calendar/Pattern behavior and fresh explicit Calendar regrant only after completion.
3. On B (also try incomplete onboarding), open Account & Privacy or `/delete-account`, confirm once, then Check/Continue if interrupted. Verify sign-out and the truthful platform-pending result; do not recreate B to finish the request.
4. Reopen/switch sessions and try the old session; previous private values must not return, another normal account remains intact, and protected-admin explanation remains visible.
5. Repeat the confirmation/recovery UI on physical Android Chrome/iPhone Safari with 200% text, keyboard/reader and narrow landscape. Platform purge/Apple revocation/Play URL verification remains owner/operator acceptance recorded separately, not a user technical step.

Code/local verification, active-data removal and permanent erasure are separate outcomes. This delivery does not claim live active removal, permanent erasure, store approval, or closure of the original ON-05 same-account incident.
