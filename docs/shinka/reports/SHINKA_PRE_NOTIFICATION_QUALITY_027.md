# Bildirim Öncesi Kalite Milestone’u — 027

**Buildmarker-027 / HC-027.0 · Test only · 2026-10-22**

Code/local acceptance: **COMPLETE — REPO_CLOSED_PENDING_BASE44_VERIFICATION**. Hosted and physical-device acceptance: **MANUAL_USER_VALIDATION_PENDING**. No notification implementation, live mutation/import, live Full Health, main merge/publish, new identity/database/service or store submission occurred.

Starting checkout was clean Test `1cd93e1`. Fetched main was two commits ahead (026 merge and Base44 dependency update); Test was fast-forwarded and pushed before implementation. Measured baseline is **`860c2d74e48e399e30d0448a998b637a3644314f`**, including its exact lockfile. Delivery source commit: recorded in the final receipt below; the receipt-only follow-up does not change runtime code.

## Findings, fixes and evidence

| Finding / impact | Reproduction and proven cause | Implemented fix | Evidence |
|---|---|---|---|
| Q01 — repeated navigation wait | Production HTTP trace: Home was outside ProtectedRoute while other product destinations were children; crossing that tree remounted Onboarding and added `hydrate` before destination reads. | Same guarded ProductRoute/Onboarding tree across all product and public entry routes; retain only its existing owner-bound lifetime snapshot. No auth cache, persistent personal cache, backend prefetch or write prefetch. | 60 transitions before + 60 after; actual-App reload/back/forward/rapid navigation/privacy/account switch/logout tests in both engines. |
| Q02 — duplicate authentication work | Public onboarding dispatcher and its private normal operation each called fresh auth.me, duplicating native identity/lifecycle reads in the same request. | Pass the freshly minted, non-serializable principal within that request. Owner validation, privacy/reset and per-write admission remain. A new request authenticates again. | QM01 verifies one call, no mutation and denial after removing identity between requests; P/native reset/consent regressions retained. No cross-worker guarantee inferred. |
| Q03 — two Moderate dependency findings | Fresh npm audit on baseline react-router/react-router-dom 6.30.6; vulnerable advisory ranges remain. | Reviewed update to 7.18.4 (2026-09-15 publication, seven-day rule satisfied). Declarative BrowserRouter/React 18 retained. | Clean lockfile install, type/lint/build, real App and two-engine regressions, fresh audit zero findings. |
| Q04 — initial bundle budget regression from update | First measured update: 502,050 raw / 166,711 gzip, above unchanged 500,000 / 165,000 limits. | Lazy-load auth/onboarding forms only when their state is needed. Returning product entry does not load them. | Before/final byte receipt; existing lazy-load failure/reload retry; initial test/internal-module exclusion. No budget increase. |
| Q05 — Health report lifetime and indefinite waiting | List/report invocations had no client deadline. `window.open` ran only after async signing and had no unmount/session cancellation; a late result could open after departure. Browser popup throttling was a risk, not established as the user's live failure. | Existing 30-second store deadline on list/report; reserve blank window during gesture, sever opener/referrer, validate HTTPS with no credentials; close pending window on failure/disposal/privacy/session end. A blocked/throwing opener yields explicit failure. | QM02/03 with delayed result, blocked window, invalid target, cancellation and retry; actual Health UI save failure → same-report retry → one listed row → synthetic private report opens, both engines. Already-opened/downloaded artifacts are not recalled. |
| Q06 — false-positive negative assertion | `rejects(fn)` compared two undefined codes; successful no-op could pass when no expected code was given. | Require an actual caught rejection; if a code is supplied it must also match. | QM04 proves successful work and wrong-code errors fail. S04 now calls actual native Calendar/Onboarding/You and checks all A/B persisted tables and mutation count unchanged. |
| Q07 — unreachable generated auth flow | Route, import and emitted graph inspection found no registration/callsite for OAuthConsent; AuthLayout was used only by that template. | Removed both and stale comment. Approved Apple/Google SignIn/return-path helper preserved; QM05 tests external/backslash redirects and bootstrap-token stripping with injected synthetic URLs. | No runtime byte savings attributed to unreachable JS removal; source/graph/type checks and active auth tests. No second auth flow introduced. |

Initial rejected measurements/failures are retained in [initial-findings.json](quality-027/initial-findings.json). The first timing tool accidentally retained React development mode from fixture SSR initialization. Those results are **excluded**: the corrected tool sets NODE_ENV=production first, and remeasures the exact baseline archive with its own npm-ci lockfile and current code. The synthetic credential-URL test initially triggered the personal-email tripwire; its domain was corrected to reserved example.invalid, without weakening the scanner.

## Comparable production navigation measurements

**Five independent browser contexts per transition**; 12 transitions/context, 60 each build. Chromium 156, 390×844, 4× CPU slowdown, 200 ms fixed synthetic API latency and 40 ms first asset latency; no bandwidth cap. Real minified production app and real Base44 SDK; only HTTP responses are synthetic, prepared from actual native operations over isolated fixture rows. All external traffic, including Google Fonts, is blocked in both runs. Every context starts fresh; first destination and revisit are separate. Readiness is the real destination's usable-content selector observed at animation frames, not DOMContentLoaded. No p95, field INP or hosted/cellular performance claim.

| Transition | Destination visit | Click → feedback ms | Click → destination ms | Click → usable ms | SDK calls |
|---|---|---:|---:|---:|---:|
| home → calendar | first | 36 → 19 | 278 → 80 | 505 → 321 | 2 → 1 |
| calendar → pattern | first | 13 → 13 | 63 → 72 | 280 → 297 | 2 → 2 |
| pattern → you | first | 12 → 69 | 62 → 69 | 278 → 296 | 1 → 1 |
| you → home | revisit | 13 → 28 | 214 → 28 | 447 → 247 | 2 → 1 |
| home → pattern | revisit | 14 → 14 | 214 → 30 | 447 → 248 | 3 → 2 |
| pattern → calendar | revisit | 13 → 30 | 13 → 30 | 231 → 246 | 1 → 1 |
| calendar → home | revisit | 14 → 13 | 214 → 30 | 446 → 247 | 2 → 1 |
| home → you | revisit | 14 → 14 | 214 → 31 | 446 → 249 | 2 → 1 |
| you → calendar | revisit | 13 → 31 | 13 → 31 | 232 → 247 | 1 → 1 |
| calendar → you | revisit | 14 → 13 | 14 → 30 | 231 → 246 | 1 → 1 |
| you → pattern | revisit | 13 → 31 | 13 → 31 | 231 → 247 | 2 → 2 |
| pattern → home | revisit | 14 → 30 | 214 → 30 | 447 → 246 | 2 → 1 |

Home return response bodies drop from 1,222 to 535 synthetic JSON bytes (687-byte hydrate removed); Home→Calendar 1,196→509; Home→Pattern 1,876→1,189; Home→You 1,264→577. Revisits download zero new JS. First Calendar assets are 76,690→77,324 bytes, including lazy motion; observed transition long-task total has a zero median in both runs. These fixture payload sizes are not hosted traffic volume.

Medians above; exact min/max, safe action timing, bytes, downloaded JS and long tasks are in [comparison](quality-027/transition-comparison.json), [before](quality-027/transitions-before.json) and [after](quality-027/transitions-after.json). Home crossings remove one full hydration roundtrip: roughly 200 ms / 44–45% on revisits; first Home→Calendar improves about 36%. The already-preserved Calendar/Pattern/You crossings gain no request reduction and some are 15–19 ms slower in these samples; first Pattern→You feedback is also later. The patch includes Router scheduling/chunk changes, so these differences are not attributed to one proven cause. They are retained, not hidden by an overall average. No further timing/cache shortcut is justified by five samples.

Pattern already issues independent themes/lunar requests together. Its reader projects bounded owner/date fields, rejects a limit sentinel and validates six categories. Calendar/daily readback and repeated lifecycle/consent checks are part of the native safety protocol; these were not removed for speed. RouteMotion still animates one existing node for 0.2 s, without a retained exit tree, keyed remount or waiting for animation before data fetch. Listener/timer cleanup and 025 controlled clocks/abort/progress/cache tests remain.

| Emitted entry budgets (bytes) | Fresh baseline | Final | Unchanged limit |
|---|---:|---:|---:|
| Initial JS raw / gzip | 487,786 / 162,039 | 478,548 / 159,686 | 500,000 / 165,000 |
| CSS raw / gzip | 77,545 / 14,261 | 76,710 / 14,158 | 90,000 / 16,000 |

[Baseline emitted-asset hashes](quality-027/baseline-bundle.json) and [final graph/cold-route check](quality-027/bundle-and-cold-routes.json). Cold-route DCL/LCP/CLS samples are secondary loopback evidence, not field vitals. The known Pattern lunar loading expansion can still produce ~0.1484 laboratory CLS; it was observed before this package and is not an animation or functional failure. No field CLS acceptance is claimed.

## Actual coverage and environment

All mutation tests used isolated memory/SDK fixtures. No shared prod data was touched. `nativeFixture` uses ordinary CRUD without simulated native transactions; older atomic protocol fixtures are separately labelled models. Actual-App browser tests substitute the SDK transport; production performance tests keep the SDK and intercept HTTP. Neither is hosted E2E evidence.

| Scope | Actual executable coverage |
|---|---|
| Auth/entry/onboarding | A/O/P/C/U/AN/QM suites, actual App protected/public routes and auth probe; Apple/Google invocation boundary, age/date/optional/null fields, ON04 hierarchy/selection/provider fault/abort, ON05 durable business clock and partial recovery, Skip no writes, ON06 verified first daily. Real OAuth/provider completion remains manual. |
| Home | D/DU/native tests and five browser flows: saved immutable daily, retries, language preserves pair, same-day reopen, refresh/late results and native duplicate reconciliation. |
| Calendar | CA/CU/native + eight App flows and 026 mobile checks: add/edit/delete/cancel, reread persisted state, unknown lost response/same action, no optimistic success, current grant/deletion fences, last-date cleanup, >60-day source rule. |
| Pattern | PT/PU + 22 browser flows: exact category names, history windows/ranking, Moon timeline, independent section errors/retry and privacy/unmount invalidation. No reference import or content modification. |
| You/privacy | YT/YU/PR/PV + 24 You and 23 privacy browser flows: edit/cancel/save/reopen, all-five place clear, preference/language readback, lost reply, withdrawal/regrant/partial cleanup, self/admin/owner limits, native removal/recovery and preserved unrelated rows. Synthetic erasure is not permanent platform erasure proof. |
| Admin/build | AT/AU/native + 19 navigation and four Test Tools flows: current role, denied ordinary/anonymous paths, preview/cancel/target change, reset/delete interruption/recovery, last/self admin, bounded progress and verification. Build retains exactly 023–027. |
| Health | Existing backend digest/upload-receipt/immutable-runId tests; actual UI injected save failure and retry, one row listed, signed synthetic report opened; QM02–04; original HT01–09 and H10-003/H13-014 timing tests. Hosted prerequisites remain separate. |
| Navigation/mobile | Both engines: 150 mobile + 87 retained mobile checks, TR/EN, light/dark, 320–430 widths, landscape, 200% text, keyboard/focus/dialog/Back, read-refresh retention, visibility/session restoration. New no-prefetch/back/forward/reload/late result/account switch/logout-back path. |

Representative screenshots were **visually inspected**, not merely generated: Chromium Home dark 320/200%, Calendar light 320/200%, ON04 dark; WebKit You dark 320/200%, long settlement sheet, Calendar dialog, ON05 dark and Pattern landscape EN/200%; Health narrow/light header. Long resized content remains scrollable; no observed clipped horizontal content, overlap blocking a control, empty screen or unreadable theme text. The measurement matrix separately checks text bounds, contrast and 44px controls. Software keyboard, physical safe areas, native Back and OS provider behavior remain unverified.

## Security review (scoped OWASP ASVS)

This is source plus actual-handler negative testing, **not ASVS certification or live penetration testing**.

| Control area | Reviewed path / evidence | Result and residual boundary |
|---|---|---|
| Authentication/session | applicationSession, nativeClient, withUserLifecycle, AuthContext, ProtectedRoute/ProductRoute, A/AN/PR/QM01 | Fresh native User role and identity; stale/missing/native removed identities denied. Focus/background/session generation checks retained. Actual provider/MFA/cookie/token-storage policy is Base44-owned and requires hosted review. |
| Authorization/ownership | Every native entry's handler; domainAccess, onboarding, daily, calendar, pattern, you, privacy and internal tooling; S01–24/P/YT/PT/native/PR | Client owner/role/status rejected; own-ID filters/readback assertions; current admin from server; A→B denied **and unchanged data** in S04. Frontend route visibility is never authority. |
| Service-role/direct entities | native write checks, domain/privacy guards, admin policy and import/audit dispatcher; Repo Health schema checks | All 20 product + 5 operational schemas deny direct client CRUD. Built-in User is separately platform-governed. Service role bypasses RLS, so explicit owner/admin checks are retained. Deployed policy enforcement not independently tested here. |
| Consent/reset/deletion | Native per-write admission; original consent business time, event verification, lifecycle/privacy fences, reset fingerprints and late residual rereads | No health write without valid current grant/open-job clearance; conflicts refuse overwrite, unknown outcomes retry/reconcile. Ordinary native APIs still lack documented cross-worker transaction/UNIQUE/CAS/fencing; no absolute uniqueness or rollback claim. |
| Input/output/SSRF/XSS/redirect | Closed field/action/size/date/type guards, bounded pagination, fixed HTTPS GeoNames/artifact targets, redirect/manual and stream abort; safe React text; QM05 and report opener | No caller-provided provider URL or service-role process. No active product raw HTML path found. Fixed/same-origin return targets reject foreign/backslash and strip bootstrap tokens. Pending report URL never navigates after invalidation; valid signed artifact lifetime remains 300 seconds and already-opened files cannot be recalled. |
| Secrets/logs/storage | Static credential/email scan, S20–22/HD tests, report redaction, request envelope, privacy recovery store | No key/token/private row values in committed evidence. Transient privacy receipt in session storage is an intentional scoped recovery capability, not user-data cache. Browser and provider token mechanics are external; no TLS/permission bypass. |
| Resource/abuse controls | Body caps, reader projections/sentinels, batch/deadline/coalescing tests | Requests and cleanup passes bounded; provider/platform account-wide throttling, internet abuse capacity and restore/trash retention are not proven by local fixtures. No destructive/rate attack run. |

Dependency scan: **0 Critical / 0 High / 0 Moderate / 0 Low** after update; no audit suppression or TLS bypass. [Before](quality-027/dependency-audit-before.json), [after](quality-027/dependency-audit-after.json). GHSA-wrjc-x8rr-h8h6 affects untrusted Link/navigation destinations; Shinka uses fixed internal/sanitized return targets. GHSA-337j-9hxr-rhxg targets SSR hydration and is not reachable through current declarative-only client routing. Both vulnerable packages are nevertheless replaced. Upgrade review: Node 26 ≥20, React/ReactDOM 18.2 ≥18; no multi-segment splat relative links, Data Router loaders/actions/fetchers or manual SSR hydration. All lazy declarations remain outside components; direct links, guards, back/forward and layers run in both engines.

## Health and final gates

No case deletion or downgrade. H06-004 adds QM05 redirect/bootstrapping checks; H06-005 adds QM01 current-request principal checks; H12-001/S04 expands to actual native denied mutations + unchanged rows; H16-007 adds QM02–04; H15-002 local acceptance includes production timing and route lifecycle. Catalog stays 170: 145 in-app / 10 local / 13 external / 2 future. HC increments because evidence semantics changed. Heavy performance stays out of Full Health. 025 timeouts, cancellation, safe partial progress and completed-only cache are unchanged; 026 cases remain.

Final gate receipt: **Chromium 156.0.8078.4 and WebKit 27.2 each 579/579 canonical tests, zero failures/page exceptions; each 150 + 87 mobile checks. Clean npm ci, npm ls --all, npm audit (0 findings), security gate, typecheck, lint, build, Repo Health 17/17, dependency cycles 0, lazy-chunk failure/reload retry, unchanged byte budgets, last-five ledger and git whitespace checks pass.** See [Chromium receipt](quality-027/chromium-verification.json), [WebKit receipt](quality-027/webkit-verification.json) and per-case audits alongside them. Local in-app Health has 132 PASS / 0 FAIL / 13 expected hosted-prerequisite BLOCKED (content/readiness not supplied in local fixture). This does **not** reopen the user's previously passing published content/readiness checks and is not a published Full Health. Historical 024 timeout, 025/026 evidence and this package's failed intermediate checks are preserved.

## Owner publication and outstanding acceptance

No entity delta. After your normal Test→main flow, sync all affected native entry/shared code (including applicationSession/health catalog consumers), then frontend, and publish in your existing Base44 workflow. This agent pushed Test only. Published code/policy, same-account ON05, real Apple/Google, hosted native recovery and physical Android/iOS remain manual. Shared prod/Preview/Test branch was never treated as isolated storage.

At most five app checks after publication:

1. Confirm Buildmarker-027 / HC-027.0; use a test account for sign-in and unfinished ON05. Leave optional durations empty; normal Continue must reopen consistently. Keep the original partial account—no deletion/recreation workaround.
2. Switch Home → Calendar → Pattern → You and back in TR/EN; return Home twice and confirm the same daily text. Check light/dark and enlarged text on Android/iOS.
3. On a test account, add/edit/cancel/delete a Calendar date; reopen and check saved dates and Pattern. On uncertain response use the offered same-operation check/retry.
4. Save/cancel a profile edit and clear optional place; reopen. For privacy/reset/delete acceptance use only a deliberately selected test account; confirm Cancel does nothing and interrupted progress resumes.
5. Run published Full Health yourself; save, find the report in history and open it. If save is uncertain, retry/check the **same** report and share its runId/result.

## Official sources (accessed 2026-10-22)

- [web.dev INP](https://web.dev/articles/inp) and [Optimize INP](https://web.dev/articles/optimize-inp): interaction/paint and long-task discipline; route usable timing is a distinct lab metric.
- [OWASP ASVS](https://github.com/OWASP/ASVS): risk-based verification areas and explicit source/runtime limits.
- [Base44 entity security](https://docs.base44.com/developers/backend/resources/entities/security) and [SDK work with data](https://docs.base44.com/developers/references/sdk/getting-started/work-with-data): direct policies and service-role bypass require server authorization.
- [Pinned v7.18.4 upgrade guide](https://github.com/remix-run/react-router/blob/react-router%407.18.4/docs/upgrading/v6.md): Node/React prerequisites, future behavioral changes, lazy placement and splat review.
- [Router redirect advisory](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), [SSR hydration advisory](https://github.com/advisories/GHSA-337j-9hxr-rhxg): affected/fixed ranges and mode-specific reachability.
