# Buildmarker-020 / HC-020.0 — targeted readiness and removal closure

Date: 2026-10-21 (Europe/Istanbul). Baseline: `41a5fd2`, main's merge of 019. Main was one commit ahead; Test was clean and was fast-forwarded/synced before implementation. Scope is the two reported issues, not a repeat of the general audit. Status: **MANUAL_USER_VALIDATION_PENDING** after Test delivery. No main merge/publish, live Full Health, new deletion, resume, reset, purge, import, schema or retention change was performed.

## 1. Health type defect — proven and fixed

User-supplied live run `d09503f9-4f78-4088-a4ea-65d592265dd7`: 133 PASS / 4 FAIL / 0 BLOCKED, 4351ms. H04-019/H08-005/H09-004/H12-031 failed; H03-008 passed. That historical result is not rewritten.

The old `nativePrerequisite` ended its conjunction with a nonempty strategy string. Strict `verdict(ok === true)` correctly rejected the non-boolean value with `assertion.evaluated=false`. The defect was in the caller. The new small readiness contract module requires boolean equality for authority `BASE44_NATIVE_V1`, version `native-continuation/2`, all four exact strategies, and a complete unique set of `AdminTestOperation`, `UserCalendarAction`, `InternalHealthRun`, each with `readable === true`. Merely truthy strings/flags do not qualify. Shared verdict remains unchanged.

RG01 calls all four actual case runners with the response from the actual nativeReadiness helper over isolated SDK fixtures. It asserts PASS and evaluated/passed boolean assertions, while hostedMutationVerified and distributedFence remain false. RG02 covers 56 malformed/incorrect responses across the four cases: strategy, authority/version, missing/duplicate/foreign/null schemas, unreadable and non-boolean readable flags. RG03 confirms backend unavailability is BLOCKED and Home content/Moon prerequisites are still mandatory. These are synthetic regressions of real code, not hosted mutation evidence.

## 2. Selected user's actual state — targeted read-only evidence

The requested target ID was supplied only to a private diagnostic script and browser lookup; it is not embedded in source, fixtures or committed evidence. Same authorized app/shared `prod` as the supplied screenshot. This is not an isolated Test database.

| Observation | Measured result / boundary |
|---|---|
| Existing AdminTestOperation | DELETE_USER, COMPLETED / VERIFY; all ten checkpoints, error_code=null. Completed `2026-10-20T21:55:22.406Z` = **21 October 00:55:22 Istanbul**. Read at `2026-10-20T22:06:28.281Z`. |
| Native active User | Privileged SDK exact-ID `User.filter` returned zero; direct `User.get` returned HTTP 404. This is not a UserProfile query or normal-user RLS-filtered empty result. |
| Active operational data | Confirmed exact-owner reads: UserProfile, UserPreferences, UserCycleSettings, UserPeriodRecord, UserCyclePrediction, UserCyclePhaseDay, UserPatternSummary and UserCalendarAction all absent. |
| Current backend lookup/status | Both readonly adminTestTools actions returned COMPLETED / VERIFY and no target. No execute/resume/reset was invoked. |
| User's screenshot | It shows **Data → UserProfile**, not App Users or retained history. Initially the open page had the target row and three rows despite heading “(2)”. After reload the target checkbox/row disappeared and the heading stayed “(2)”. **Stale dashboard list data is proven.** |
| Retained scopes sampled | UserDailyMessage/UserHealthConsent/UserHealthConsentEvent exact-owner reads were empty. This does not prove those scopes had data before removal, nor that retention deleted them. Synthetic RM02 verifies existing histories stay unchanged. |
| Recently deleted | App Users → More actions → Recently deleted was opened read-only. One row was visible, but no record ID was exposed by its visible DOM/links. It cannot be safely bound to the selected ID. No restore/purge action or undocumented trash endpoint was used. |
| Recreation | No current record with this exact native User ID or UserProfile owner ID. Re-registration under a different ID/email is not established by this selected-ID investigation. |

The UI screenshot contradiction is explained by stale dashboard data; the in-app old-target-card merge is a separately source-proven defect. **Active-store removal is verified for this target; physical permanent erasure and exact Recently deleted membership are not.** [Sanitized live projection](closure-020/live-diagnostic.json).

The repository uses backend SDK **0.8.54**, including `asServiceRole.entities.User.filter` and `User.delete(id)`. Installed `entities.js` implements delete as one DELETE to the entity/id endpoint, with no separate purge parameter. The [SDK reference](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities#delete) describes generic delete as permanent; the [platform data-deletion guide](https://docs.base44.com/Community-and-support/Deleting-user-data) separately distinguishes App Users removal, Recently deleted and permanent deletion, custom Data records and retained locations. These statements do not turn an empty active query into independent proof of all physical erasure. No assumption that every SDK delete is the dashboard trash action is made either. The UI now claims only what its supported reads verify.

## Code and behavior changes

- `nativeAdminTestOperation` has one response builder calling `testOperationOutcome` after execute/resume and for status/lookup. Current native User, operational rows, receipts or pending notifications prevent a success projection; read errors remain errors/unknown. Persisted COMPLETED alone cannot bypass it. No cross-worker lock or atomic-snapshot guarantee is added; later requests recheck later changes.
- Existing owner, active admin, self/last-admin, open deletion and target lifecycle controls are preserved. Same-operation recovery and bounded continuation remain; no extra admin confirmation or technical step is added.
- `useTestTools.accept` replaces the displayed response instead of merging stale identity; a missing target cannot preserve a prior user card. An uncertain read also clears stale identity. AU10 includes an execute response deliberately omitting target, plus a remount/reopen of the same operation without writes.
- Central TR/EN copy uses “Kullanıcıyı uygulamadan kaldır” / “Remove user from app”, explains preserved history and unverified permanent erasure. Unsupported irreversible wording is removed. Unrelated approved copy is untouched.

RM01 injects an active User or profile after terminal status persistence: execute/resume must report PARTIAL, then status/lookup must agree using reads only. RM02 verifies retained history and same-operation reopening; RM03 rejects denied/failed/malformed/wrong-owner native User reads. [Before-fix proof](closure-020/before-fix.json) substitutes original 019 code in the isolated current harness: RG01/RM01/AU10 all fail, then pass after the fix.

## Health and documentation changes

| IDs | Action / evidence |
|---|---|
| H04-019, H08-005, H09-004, H12-031 | Fix shared predicate; strict successful and invalid backend response paths RG01–03. Read-only prerequisite claims retained. |
| H16-007 | Extend existing integrity regressions with RG01–03; no new suite. |
| H12-036 | Extend with RM01–03 for all-action completion, retained history and failed reads. |
| H13-016 | Existing local acceptance gains AU10 TR/EN card clearing and same-operation reopening. |
| H12-029/031 | Remove stale maintenance-window wording from case descriptions; target lifecycle behavior unchanged. |
| Removed/hidden failures | None. Counts unchanged: 161 registered / 137 in-app / 24 separate acceptance. |

DATA_MODEL, SECURITY_PRIVACY, UI_UX_STANDARDS and RELEASE_HEALTH_CHECK define the corrected contracts; SOURCE_OF_TRUTH, BASE44_CONTINUATION, DEVELOPMENT_RULES/NOTES and BUILD_HISTORY record authority, evidence and delivery. CONTENT_MODEL records the unchanged approved import policy carried into package 020; its explicit allowlist advances accordingly. The legacy integrity fixture stays pinned to HC-018 with a version-independent replacement. Initial full runs caught package-transition fixture/allowlist omissions (AI04, HC08, DM23, HC12); they are retained in verification evidence. Other canonical headers advance to 020 without unrelated rewrites. Internal Build retains 016–020; older Git/Health/audit evidence remains.

## Executed validation and limits

[Verification](closure-020/verification.json): **Chromium and WebKit each 483/483 canonical regressions, 87/87 mobile checks, zero page errors**. Local in-app Health: **124 PASS / 13 BLOCKED / 0 FAIL**. Clean install, dependency trees/audit, typecheck, lint, build, Repo Health and last-five checks passed. [Production/lab budgets](closure-020/performance.json) passed: initial JS 453,045 raw / 149,978 gzip bytes; CSS 86,467 / 14,914 bytes, no static import cycles. INP and field p75 remain NOT_MEASURED. Local in-app transport cannot access hosted prerequisites and preserves those BLOCKED results. Successful readiness responses are independently exercised by RG01, closing the blind spot in the previous local-only BLOCKED path. No current live Health or physical-device result is claimed. Existing two Moderate router findings remain under the documented disposition; no dependency changes.

## Owner's publication and in-app acceptance

Use the existing main merge → Base44 sync workflow. Publish matching frontend **and native adminTestTools/shared code**; keep internalHealth/catalog version aligned. No schema push or new credential is required.

1. Health Center: confirm 020 / HC-020.0, run Full Health, verify the four reported IDs and H03-008, then save/list/open that run. No JSON upload.
2. Test Tools: fetch the same selected ID and use **Check operation status**, not a new deletion. Expect the existing operation, no active-user card and the precise removal message; refresh and verify the same operation.
3. Refresh Base44 Data → UserProfile and separately inspect App Users/Recently deleted if needed. A retained history row or trash item is not an active User; do not purge/recreate data to make the display match. If a fresh active row or unknown result appears, report the safe code/stage/operation ID.
