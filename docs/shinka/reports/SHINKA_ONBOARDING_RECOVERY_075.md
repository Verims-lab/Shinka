# Shinka — onboarding legal readiness and recovery (075)

2026-11-20 · Buildmarker-075 / HC-074.0 · delivery: Test only.

## Evidence and cause

Starting source: origin/main = origin/Test = local Test c97a62d5bb3b732b579de98fcd2c929b6d789bb2. User App Store artifacts remain untracked and untouched; GizemTest/AydanTest are outside this task.

The attached 32.799-second video was sampled locally with AVFoundation. It shows a legal-admission gate, checked age/Terms, status checks and external document navigation. The recording alone does not prove an SDK or worker failure. On 2026-11-20T14:43:05Z, the official SDK public `termsAcceptance {action:policy}` returned HTTP 200, CONFIGURATION_REQUIRED, version null and the canonical Terms/Privacy URLs. The public deployed TermsGate chunk imports Buildmarker-074. Safe receipts: [public read](onboarding-recovery-075/public-read.json), [published marker](onboarding-recovery-075/published-terms.json).

**Proven live blocker:** effective server policy is missing/invalid and cannot accept any version. The source uses `secrets.get('SHINKA_TERMS_VERSION')`; CONFIGURATION_REQUIRED is intentional fail-closed behavior. Exact stored configuration (absent, invalid or not visible to the deployed worker), full deployed backend/shared commit and installed APK version are not independently verified. A working public page is not legal readiness or user acceptance.

## Owner decision and configuration boundary

The owner's 2026-11-20 reply approves the current https://shinkadaily.com/terms/ text as **terms-v1.0**. This is product-owner approval only; no independent legal review or effective date is claimed. No production fallback/version literal was added to code or environment files. Each user must still explicitly accept; existing acceptance history is preserved.

The owner authorized adding the setting if missing, and required inspection before replacing another value. No connected browser-control tool is available in this session; official CLI `whoami` returned `Not logged in`. No login was initiated/requested, secret inventory/value was obtained, server setting was written, acceptance record was created, or user data was changed. Configuration remains **BLOCKED: management access unavailable**; the public policy read does not prove that the secret field itself is absent.

## Fix and regression

The pre-fix Chromium regression failed: `checking declarations must not erase the configuration blocker` (actual 0 alert nodes; expected 1). The configuration error was cleared by checkbox handlers despite no available acceptance action. Other concrete source defects addressed: checked drafts survived a version change before the first write; status errors lost their type; anonymous policy fetch could not recover without remount; gate had no targeted external-return read; successful acceptance forced an App reset that could repeatedly remount the gate if session evidence lagged.

Changes preserve the server gate: checkbox edits clear only their own validation error; newly available/changed versions require renewed review. Status and document-return checks remain reads, with local coalescing. A verified saved acceptance uses the existing session verifier without App reset; contradictory session evidence remains gated with a check-again message. Unknown writes retain the same intent and cannot be retried until a successful absent read. Safe error categories distinguish configuration, unauthorized/forbidden, throttling, service, timeout and malformed response. Abort cleans UI waits/listeners and ignores stale replies; it does not cancel a committed server write or claim rollback. There is no automatic retry of acceptance.

Public policy retry on anonymous Welcome is read-only and preserves the independent returning-user sign-in path. Birth date/18+, optional name/time/place/cycle, health consent, source-of-progress, lifecycle/privacy restrictions and the retired reset policy remain unchanged. No schema or dependency added.

## Execution

Current execution receipts: [execution.json](onboarding-recovery-075/execution.json).

| Check | Actual result |
|---|---|
| npm ci / npm ls --all / npm audit (including dev) | PASS; lockfile unchanged, 0 vulnerabilities |
| Typecheck / lint / production build | PASS |
| Repo Health / generated latest-five history | PASS; 071–075 |
| WebKit full Foundation | 820/820 PASS, 0 page errors; all mandatory route/Health gates PASS |
| Chromium final full Foundation | 820/820 PASS, 0 page errors; all mandatory route/Health gates PASS |
| Legal real-App matrix, each engine | 44 scenarios PASS: 24 responsive layout cells, 18 recovery cells, 2 existing flow matrices |
| Auth-first final E2E, each engine | 32 scenarios PASS, including grant + first-daily error/Retry and Skip alternatives |
| Local synthetic in-app Health (both engines) | 149 PASS / 0 FAIL / 13 expected external-data/platform BLOCKED; save/list/open PASS |
| Production performance/size gate | PASS; JS 493,936 raw / 164,745 gzip; CSS 83,283 raw / 15,985 gzip; unchanged 500k/165k/90k/16k budgets; 9 local routes × 3 cold samples and lazy chunk retry |
| Live configured policy / actual user acceptance / provider callback / physical APK | BLOCKED configuration / NOT_RUN actual acceptance and device/OAuth |

The main E2E journey now begins at the real introduction and carries a matching explicit OAuth declaration through legal append/readback before name. TR/EN × 360/390px branches verify name input and persisted prefer-not-to-say, profile with optional time/place blank, Back without sign-out, health-grant (optional durations omitted) or Skip, held first-daily progress, injected daily failure/Retry and Home. Separate real-entry scenarios hold/reload new/partial/cycle/preparation/complete/NULL-name progress and reject invalid/failed hydration until explicit Retry. Existing mandatory browser matrices cover keyboard/time picker, underage DOB, birthplace error/retry/select/clear, session/reopen/late isolation and privacy routing; isolated backend tests retain the exact 18-year boundary, optional NULL fields, lifecycle and consent checks. These are synthetic SDK/provider tests, not completed real OAuth or physical native acceptance.

Retained attempts: initial Chromium configuration-error regression failed before the fix; an intermediate full Chromium snapshot ran before 075 was added to the unchanged staged-content version allowlist and failed HD11/HD13/HD10/HC08/DM23 (then H05-010's DM23 assertion). The list was aligned without changing any source/hash/count predicate. The first additional grant E2E attempt selected Continue instead of the actual existing Finish submit; the test selector was corrected, not product copy or assertions. Earlier 074 execution, including its WebKit Calendar Health timeout, remains untouched.

Health: 0 added / 4 updated / 0 removed; 188 cases retained. H06-008 → TA17 backend transport; H06-009 → TA15/TA16 service cancellation/diagnostics; H05-009 retains the unchanged staged-content predicates for 075; H13-012 → real-App legal recovery and intro-to-Home acceptance branch. Local scope mapping updated with actual runner IDs. H06-007 real OAuth and physical wrapper/native acceptance remain external.

## Publication order and external acceptance

1. In the existing Shinka app (`6ad5190f4845d4e3af03b420`), Dashboard → Secrets: inspect `SHINKA_TERMS_VERSION`. If absent, set the owner-approved identifier **terms-v1.0**. If another value exists, inspect its document/acceptance usage before changing it; do not blindly overwrite. Do not expose other secrets.
2. Owner merges Test through the existing main/publication workflow. Publish the coherent `termsAcceptance` + `applicationSession` + native entry/shared graph before the matching frontend. No new entity push is required by 075; 074's existing entity/security deployment prerequisites remain.
3. Read public `termsAcceptance {"action":"policy"}`: expect READY, the approved identifier and canonical URLs. This is readiness only, not user acceptance.
4. With the user's own account, check status. If REQUIRED, review and explicitly choose Accept and continue; verify current-version server readback and fresh session routing. Existing current acceptance must resume the saved form/Home without a new event; an older version needs new explicit acceptance. Check return from both external legal links on the installed app and real Apple/Google callback.

No main push, publish, hosted Full Health/Security scan, cleanup/import or notification operation is part of this delivery. Current live blocker is not claimed closed until the server configuration and user-owned acceptance flow are verified.
