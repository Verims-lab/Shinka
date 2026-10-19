# SHINKA — Security & Privacy

**Document:** SHINKA_SECURITY_PRIVACY.md
**Status:** ACTIVE — repository guards and synthetic tests; live certification pending
**Current BuildMarker:** Buildmarker-008
**Auth policy (OD-003):** RESOLVED_BY_REPOSITORY_POLICY: Apple/Google-only shell and safe localized error mapping implemented. Recorded platform snapshot 2026-10-18 23:11 lists Google/Apple; current dashboard and live Apple/Google proof remain unverified (EXTERNAL_RELEASE).
**Last Updated:** 2026-10-19
**Authoritative Source References:** SRC-01 §8/§13, SRC-04 §3.2/§9/§13/§14, SRC-05 §15
**Purpose:** Separate PRODUCT REQUIREMENT from BASE44 VERIFIED CAPABILITY.
**Scope:** Auth, ownership, admin, health data, logs, secrets, restore.
**External Verification Required:** All rows marked UNVERIFIED.

| Topic | PRODUCT REQUIREMENT | BASE44 VERIFIED CAPABILITY |
|---|---|---|
| OAuth ownership | Provider identity → one account; no duplicates | UNVERIFIED (Apple unknown, OD-003) |
| User row isolation | User sees only own rows; owner from auth context | REPOSITORY + SYNTHETIC verified; 20 direct SDK deny policies and backend owner scoping; live pending |
| Admin boundary | Platform role; audited; no email-based authority | REPOSITORY_IMPLEMENTED / SYNTHETIC_TESTED; deployed two-user enforcement unverified |
| Sensitive health access | Only with explicit valid consent | Shared backend consent/open-job checks; live pending |
| Consent | Versioned, timestamped, event history | UNVERIFIED |
| Health-data deletion | Immediate stop, verified deletion, retries, no re-consent mid-job | UNVERIFIED |
| Protected immutable records | Admin cannot UPDATE/DELETE snapshots/events/audit (OD-009) | Repository deny rules + shared guards + negative tests; PARTIALLY_VERIFIED |
| Audit metadata minimization | No health content in audit log | Validated allowlist helper + negative tests |
| Log redaction | No tokens, health data, message bodies | Health reports redacted (`redact()`), T17 test |
| Secrets | Server-side only | GEONAMES_USERNAME key present in masked dashboard / user-confirmed; value never read by tooling. Request-scoped runtime adapter implemented; deployed resolution/provider success still requires manual evidence. |
| INACTIVE account | No login, generation, push | UNVERIFIED |
| Restore protection | Deleted health data never reappears; INACTIVE stays INACTIVE | UNVERIFIED |

Internal route gates are UX only. Both `validateContentArtifacts` and `internalHealth` use request-derived SDK identity and server `auth.me()` before any operation: anonymous 401, ordinary/forged-role user 403, admin allowed. InternalHealthRun RLS allows admin read and denies client create/update/delete; guarded backend writes use service role. T68/H03-009 exercise this boundary synthetically. Live two-user/direct-invocation/RLS enforcement remains required.

Reports are diagnostic counts/IDs/status/evidence, not product health records. Server save validates structure/summary/gate and strips extra top-level fields; canonical recursive redaction removes credential, email, health-record/symptom, birth/profile and message-body keys and token/email value patterns. Compact JSON is bounded and never truncated. Private file creation plus record-based, admin-only signed readback is tested synthetically (T69–T72); no final live persistence is claimed. Auth UI never renders/logs provider payloads; only AUTH_CANCELLED, AUTH_PROVIDER_FAILED, AUTH_SESSION_FAILED or AUTH_UNSUPPORTED_METHOD may cross its boundary.

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

## Buildmarker-007 canonical access boundary
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
user_daily_message: own read, only future DAILY_MESSAGE grant create, no update/delete even by that grant. user_health_consent_event and admin_audit_log: append-only. data_protection_event: no human update/delete; backend status progression remains closed until a verified transition workflow is supplied. health_data_deletion_job: only DELETION grant progresses approved states, never deletes history or changes owner/event/request metadata. COMPLETED requires a module-issued proof bound to the job/user after all four health collections have zero remaining records; request booleans cannot substitute. Terminal jobs cannot regress. Future worker must couple deletion verification and state publication with proven atomicity; a proof object alone is not a platform transaction.

`withAdminAudit` records successful/failed privileged VIEW/UPDATE/DELETE attempts with actor, target, action, outcome, time and safe code. It prevents returning privileged data if audit persistence fails. No normal user action is written to admin_audit_log. No admin UI or generic admin mutation route exists. `createAdminAuditEntry` and `createSystemErrorEntry` accept only declared metadata, bounded identifiers and machine codes; unknown/nested fields, credentials, health data and message snapshots are rejected. Existing recursive Health redaction is preserved. Email alert delivery and error retry/dedup workers are future scope.

OD-009 = PARTIALLY_VERIFIED. Repository policy and synthetic negative tests are implemented, including the HTTP/service boundary; direct SDK RLS deployment and multi-identity enforcement must still be measured. H12-901 is LIVE_ENFORCEMENT_REQUIRED, not a synthetic PASS. Verify anonymous, owner A, owner B and app admin direct reads/writes plus service-role entry points after deployment. Never modify real immutable history for a test; use disposable mutable fixtures and deny attempts without successful protected writes.

### Buildmarker-007 dependency and evidence status
Dependencies and Tailwind 4.3.3 remain unchanged. Fresh final audit must retain 0 Critical / 0 High; two Moderate router findings above remain visible. Product content, Cycle and Moon lookup seeds: NONE. Repository closure does not mean live enforcement is certified.

Official platform evidence (read 2026-10-19): [entity schemas](https://docs.base44.com/developers/backend/resources/entities/entity-schemas), [RLS and service-role semantics](https://docs.base44.com/developers/backend/resources/entities/security). Native simple/compound uniqueness is unsupported; undocumented FK/index/transaction/conditional guarantees are not claimed.

## Onboarding security and capability boundary — current package

Existing 20-schema direct SDK deny rules, common principal branding, owner/admin guards, protected-record policy and immutable consent event restrictions are preserved. The generic domainAccess endpoint still offers no product CRUD. The specific onboarding endpoint derives identity from auth.me(), rejects forged role/owner and unknown fields, denies INACTIVE recreation, validates adult DOB on server clock, resolves GeoNames independently and never accepts client consent_status/account_status/Sun sign.

Pending name is a minimal versioned same-tab session item with 30-minute expiry; it is cleared on confirmed profile persistence. No health form values enter storage, URLs, analytics or error logs. Unexpected backend/provider exceptions become allowlisted codes; query/results are bounded and credentials stay in server environment. No client geolocation is used. UI/provider callbacks do not create Base44 identities manually.

Consent is independent of age/auth. Health writes require explicit true consent, approved text/version, active owner and no open deletion job; withdrawn consent requires a future regrant workflow. The production adapter rechecks these predicates around sequential writes and confirms readback, without claiming an owner transaction or rollback. Profile/preferences persistence is enabled in repository code. The approved version health-consent-v1.0 and exact EN/TR checkbox text are integrated; valid explicit consent enables production cycle persistence. Default-version adapter tests use an isolated SDK transport. Retained fixture-version tests deliberately prove that partial durable consent/settings survive a later failure without UI advancement. No-cycle Skip writes neither current consent nor an event. No client-supplied version, owner, status or admin flag is trusted. Event domain fields form its complete immutable upsert key; generic event update/delete remains denied. Native metadata immutability, cross-instance uniqueness, conditional predicates and concurrent status transitions still require deployed enforcement evidence.

Dependency versions are unchanged in this package. The required fresh audit retains the previously documented router Moderate findings; final execution totals are recorded in Development Notes. Real Apple/Google, deployed ownership/authorization and GeoNames availability remain EXTERNAL/DEVICE REQUIRED.

Final clean-install audit for Buildmarker-008: 0 Critical, 0 High, 2 Moderate, 0 Low; `security:deps` exited 0. All 24 existing security tests and new authenticated-owner/consent/idempotency refusal tests pass. No live enforcement claim.


## GeoNames live diagnostic boundary — same package 008

Only the hosted onboarding entry imports `secrets` from `base44:runtime`; `secrets.get('GEONAMES_USERNAME')` runs inside its default request handler. Backend values are never bundled, copied into test fixtures, printed or read through frontend code. The entry-wiring test substitutes the platform module and verifies zero module-load reads plus fresh reads across missing/configured/rotated synthetic values. Build-time inspection exports a boolean only, never backend source or an environment value.

Errors retain no original exception, URL, username, provider message/body or query. The HTTP boundary constructs an explicit diagnostic allowlist: code, http_status (100–599 or null), documented provider_status (or null), provider_class (AUTHORIZATION/QUOTA/SERVICE/REQUEST/NOT_FOUND or null). Forged diagnostic objects are ignored. Frontend still renders only canonical copy. No GeoNames console logging, trace output or product-record diagnostics were added. The fixed provider host/path cannot be supplied or overridden by request data; redirects are rejected.

Fetch-failure diagnostics additionally allow only failure_stage and transport_class enums documented in Technical Architecture. Classification may inspect the thrown exception and up to three nested causes in memory, with cycle protection. Only explicit code/name mappings, exact redirect signatures and the bounded Deno DNS-message signature are recognized; arbitrary names/codes and generic TypeError remain undisclosed. The original exception/cause/message/stack is never attached to GeoNamesError, returned, logged or persisted. No elapsed timing or raw exception field was needed. G12 injects synthetic username/query/credential-URL canaries into message, stack, cause and unrecognized names/codes, and asserts safe HTTP projection, zero console calls and unchanged product entities. G11 verifies deadline cleanup and no unhandled rejection after transport failure/timeout. HTTPS/TLS verification, redirect rejection, fixed destination, authentication and owner guards remain intact.

Authenticated searchPlaces is read-only, including with no preferences, and never invokes initialize/saveProfile/saveCycle. Regressions snapshot every product entity and assert that all SDK calls during successful/empty/error lookup are reads. Owner/auth checks and unknown-field rejection continue to protect the multiplexed endpoint. Selected-ID persistence, optional empty continuation and coherent five-field NULL clearing are unchanged. A provider authorization response is not proof that the Base44 secret is absent; live cause is established only by the new safe runtime diagnostics.

The temporary `internalHealth` action geoNamesTransportProbe uses the existing branded server-admin guard; anonymous/user/forged-role requests cannot read the secret or trigger outbound traffic. Its payload accepts only the action key. Caller-supplied URL, host, query, username, headers, variant, timeout and signal are rejected. It never accesses asServiceRole/entities or writes Health/product data. Runtime secret reads occur only inside the authorized callback, not at module load. Only A/B/C send the configured credential, exclusively to the fixed GeoNames HTTPS host; D/F omit it, and E sends no app/user/credential data to the fixed HTTPS example.com control. The query is a server-owned public test constant, not user input.

All results are explicit technical projections: no response body, Location, URL, secret or raw error/name/code/message/stack/cause. The existing classifier is reused without new speculative mappings. Response bodies are cancelled unread; redirect:manual is diagnostic-only and never follows a Location. Limits are 8 sequential requests, 3-second sample deadlines, 30-second session budget, bounded cancellation cleanup and a 60-second warm-worker cooldown. No cross-instance lock is claimed; admin access and per-session bounds are the enforceable serverless boundary without DB writes. If a transport ignores abort, the plan stops with CANCELLATION_UNCONFIRMED and that worker rejects further probes until settlement, rather than starting overlapping traffic. No waitUntil, automatic normal-search trigger, TLS bypass or HTTP fallback is added. G13–G20 and the actual-entry substitution test cover authorization, fixed targets, single-variable comparisons, timeout/cleanup, concurrency and disclosure. Remove the temporary runtime action/wiring after normal hosted GeoNames search/selection/save closure.
