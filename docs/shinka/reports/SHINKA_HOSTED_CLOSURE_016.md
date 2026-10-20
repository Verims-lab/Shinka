# Shinka 016 — hosted closure and operator handoff

**Current BuildMarker:** Buildmarker-016
**Health catalog:** HC-016.1 (local correction; recorded hosted run is HC-016.0)
**Date:** 2026-10-20
**Status:** References and selected-admin owner flows verified; hosted Health/session/device acceptance remains open.

## Target and authorization

Existing application: `6ad5190f4845d4e3af03b420`, published [Shinka](https://shinka-rhythm-flow.base44.app), data environment `prod`. The user explicitly approved this existing shared target for approved references and synthetic tests after isolation could not be established. It is **not an isolated Test database**. Git Test, Base44 main and Preview are code/display contexts. Only main appears in the Base44 branch inventory. Native identity/OAuth remain unchanged.

The user-selected normal account was verified ACTIVE with role `user`; the separately selected current CLI caller is ACTIVE/admin. Target IDs and credentials are not included in versioned evidence. The initial browser/account attribution was contradicted by Admin Panel visibility and unchanged normal-user record counts. The user then explicitly clarified that Chrome is the selected **admin** account and authorized both selected accounts as disposable synthetic test accounts. Owner-flow evidence below therefore identifies the admin identity; it is not normal-user authorization evidence. A separate normal-user session was requested for that boundary.

A separate explicit approval covers three persistent backend settings: `ADMIN_TEST_TOOLS_APP_ID`, `ADMIN_TEST_TOOLS_ENVIRONMENT=TEST`, and a random server-only `ADMIN_TEST_TOOLS_PREVIEW_KEY`. All three were set; lookup independently confirms authorized=true, label=TEST and no mutation blocker. These permit guarded admin reset operations; they neither prove isolation nor open the separate deletion maintenance gate.

Git preflight found main one merge commit ahead (`c6eca26`, PR #19), with identical files. Test was fast-forwarded/pushed as required. This agent did not merge/publish main. Public frontend catalog contains Buildmarker-016; native applicationSession and nativeReadiness execute successfully. Public asset hashes are in `base44-016/hosted-closure/published-frontend.json`; no published Git SHA is exposed by that evidence.

## Full schema comparison and safe publication order

The existing script regenerated a fresh complete 24-schema package at `/private/tmp/shinka-016-closure-schema`. Its manifest equals the delivered `base44-016/schema-stage.json`, including the original reviewed baseline and patch digest. This path is disposable; reproduce it with a new path when needed:

```bash
cd /Users/verimsari/Documents/Shinka
node scripts/prepareSchemaStage.mjs /private/tmp/shinka-016-schema-review-NEW c9a0fc3c2a975ff0843174fb811de7577f1fc37e
```

The original baseline is deliberate: current main already includes 016, so a main-relative patch alone would be empty. The package is a full snapshot, not just changed schemas.

Authenticated `sandbox ls base44/entities` returned 24 files, `truncated:false`; `sandbox read` read all 24 without truncation. All JSON objects match the local schemas (formatting/final newline differences are ignored only after parsing). Full name/hash inventory: `base44-016/hosted-closure/schema-comparison.json`.

| Reviewed item | Current remote source | Required source change |
|---|---|---|
| UserCalendarAction | Present; full schema matches; all four direct CRUD rules false | None |
| AdminTestOperation.step_fingerprints | Present, optional object, hashes only | None |
| InternalHealthRun | read/create/update/delete false | None |
| Other 21 schema files | Exact JSON match; no extra/missing source schema | None |

This is the **remote schema source inventory**, not an exported active database-policy inventory. Admin readiness confirms the three operational stores can be read through the guarded backend. Empty direct-admin query results cannot prove denial versus an empty store. Active database policies and any schema outside the managed source inventory still need the authenticated Builder Data/Security inventory check before a full entities push. No entities push was run, and no source difference justifies one at this checkpoint.

Owner publication steps (keep existing Git/Builder flow):

1. Merge the delivered Test commit into main using the existing GitHub PR flow. The initial 016 main merge is already present; the HC-016.1 correction and closure record are the new pending delta. Wait for Base44 GitHub sync to finish. Do not disconnect/reconnect GitHub or use `base44 deploy` to bypass it.
2. **Schema first:** in the existing app's Builder, inspect the full Data entity list and schema/security editor, compare all 24 managed definitions against the manifest, and check for additional remote-only entities before any full sync. At the measured state the three named updates are already present in remote source. If active schemas disagree, resolve those exact differences before backend/frontend activation. Do not push an incomplete directory. A source-files match alone is not authorization to delete remote-only schemas.
3. **Backend second:** in Builder Code, verify `base44/functions` and the entire `base44/shared` tree come from the same reviewed commit. Required function inventory is `adminTestTools`, `applicationSession`, `calendar`, `contentLibrary`, `dailyMessage`, `domainAccess`, `internalHealth`, `onboarding`, `validateContentArtifacts`. Wait until all finish syncing. Check current function inventory with:

   ```bash
   npx base44 --app-id 6ad5190f4845d4e3af03b420 functions list
   ```

   A single `applicationSession` update or old shared bundle is insufficient. Do not use `--force` to prune unrelated remote functions. No applicationAdmin SQL function was listed. CLI `functions deploy` is not required for this Git-linked app; if the owner deliberately uses it as a recovery path, use the full reviewed checkout and all nine functions together, never the schema-only directory, and reconcile Git/Builder afterward. It is not an atomic multi-function switch.
4. **Frontend last:** only after the schema/backend checks, click **Publish** in the app editor. Reload the published URL, then Profile/You → Admin Panel → Internal Build; require Buildmarker-016 / HC-016.1 and packages 012–016. Publishing the frontend does not import references.
5. As authenticated native admin, run `internalHealth` with `{"action":"nativeReadiness"}` through the function test surface or the CLI command below. Require `BASE44_NATIVE_V1`, `native-continuation/1` and all three schema flags true. Preserve `hostedMutationVerified:false` and `distributedFence:false`.

   ```bash
   npx base44 exec --data-env prod --app-id 6ad5190f4845d4e3af03b420 <<'JS'
   const me = await base44.auth.me();
   if (me.role !== 'admin') throw new Error('ADMIN_REQUIRED');
   const { data } = await base44.functions.invoke('internalHealth', { action: 'nativeReadiness' });
   console.log(JSON.stringify(data));
   JS
   ```

This authenticated-admin command does not use `--privileged`. The measured readiness already passes on the hosted 016 backend; rerun after the closure publish. Official references: [GitHub main sync then Publish](https://docs.base44.com/developers/app-code/local-development/github), [CLI commands](https://docs.base44.com/developers/references/cli/commands/introduction). CLI skill's entities-push reference warns that full sync removes omitted entities.

## Approved reference loading and repeatable verification

The three original workbooks were read again with `node scripts/prepareFirstContent.mjs /Users/verimsari/Downloads`; generated source files had **zero diff**. Original SHA receipts, exact SHF-001…260 IDs, category/TR/EN decision and 192+48 mapping relationship are in `base44-016/hosted-closure/source-recheck.json`. Content source hash remains `83ec8ad248483ef31c996b0f0782a2ce419de7d4d186590ce03b47c30cfd9a91`.

Run only one import operator. Each content group used fresh `dryRun`, exact source/count/conflict validation, then serial `applyBatch` calls with that dry-run's `reviewed_digest`, at most 25 missing records per call. An initial group stopped on a 500 in a subsequent dry-run after 6 categories/175 pairs were confirmed; no speculative replay or deletion followed. Fresh inspection confirmed the partial state, and bounded groups of four batches continued from it. A separate earlier Moon dry-run 502 is also retained in evidence. These errors are observations, not a proven rate-limit diagnosis.

Current `verify`: `VERIFIED_IMPORTED`, ready=true, same=6 categories / 260 pairs / 240 mappings, create=0 and conflicts=0. All 260 source IDs map to distinct native pair IDs. Current Moon dry-run: ready=true, create=0, same=103, no conflicts, Astronomy Engine 2.1.19; stored validated coverage 2026-10-03T13:25:33.710Z → 2028-11-02T09:17:57.674Z, beyond required 2028-11-01. **103 is an observed count, never a fixed target.** No content text or category association was edited.

For later repeat/extension, use existing `contentLibrary` actions in the authenticated admin function test screen:

```json
{"action":"dryRun"}
{"action":"applyBatch","reviewed_digest":"COPY_EXACT_DIGEST_FROM_THE_FRESH_REVIEWED_DRY_RUN"}
{"action":"verify"}
{"action":"moonDryRun"}
{"action":"moonApplyBatch","reviewed_digest":"COPY_EXACT_DIGEST_FROM_THE_FRESH_REVIEWED_MOON_DRY_RUN"}
```

Each line is a separate request. Never submit the placeholder; never reuse a digest after a changed plan or lost response. On an error, read dryRun again, stop on conflicts, preserve existing data, and continue only missing rows. Final content verify must check exact counts, sourceHash and 260 unique crosswalk entries; Moon ready must cover the current date and required future horizon. No Home/Health read triggers import. Approved references and their import audits are the only reference-write scope.

## Hosted product and recovery acceptance

Use an explicitly selected synthetic user and real authenticated session. The currently available session is the user-approved synthetic admin. Readback evidence may use privileged **read-only** per-owner bounded queries; this is distinct from owner authorization proof. Report only counts, statuses and hashes, not full health/profile records or tokens. Two tabs share an identity; they are two frontend clients, not proof of independent backend worker processes.

Executed evidence:

- ON-06 retry displayed the first Home message after import. Two Chrome tabs reopened the same content. The identity was subsequently confirmed as the synthetic admin. A bounded owner readback contains one daily row; two concurrent nonprivileged authenticated `dailyMessage.today` requests returned identical full snapshot/ID hashes. No independent-worker uniqueness guarantee is inferred.
- Calendar add returned 500 after a real period and PENDING receipt had been written. `resume` of that receipt completed it without another period. Edit likewise persisted and reached APPLIED despite a later 500; fresh receipt inspection distinguished committed state from response failure. Replaying the older add after the edit returned `CALENDAR_STATE_CHANGED` (409), preserving the newer state. Delete removed only the newly created test period, and a later identical delete request returned confirmed success. Final revision equals the baseline; all three receipts are APPLIED. The original period, consent, event, settings and daily snapshot hashes are unchanged. Transport/read failures are retained; their platform cause is unproven.
- RESET_ONBOARDING preview and preparation succeeded with no blockers. All seven product-table hashes matched before/after preparation. Separate CLI client executions resumed PROFILE → CYCLE → FIRST_SHINKA → DONE: unchanged profile, Skip with persisted=false, then the existing daily snapshot. Final job is COMPLETED/DONE and all original product hashes still match. This proves continuation after client-process interruption between verified steps, **not forced backend-worker termination during a write**.
- New runtime artifacts are three Calendar action receipts, one completed reset operation and normal audit evidence. They are retained, not deleted to make counts look clean. No account was deleted. See `retention-comparison.json`, the owner/Calendar/reset reports and preserved failed attempts.
- An authenticated nonprivileged admin request attempting to select the other owner via `calendar.read.user_id` returned 403 `FORGED_OWNER`. This is owner-payload enforcement, not a normal-user admin-route denial.

The following procedure also defines the remaining acceptance boundaries; a normal-user session, independent backend-worker failure injection and original ON-05 remain unverified.

1. Complete/retry ON-06 after reference readiness. Require first actual daily snapshot, then Home; compare all four text snapshot hashes/category/pair/day after same-day reopen and concurrent two-tab requests. Retain duplicate candidates if observed; do not claim one physical row globally from one successful run.
2. Calendar: record current revision and actual dates; add a synthetic start with valid spacing, edit that new record, delete that same test record. Read back actual dates, receipt state and projections after each. For response loss, distinguish client timeout/reload from confirmed server restart: capture action ID, interrupt only the client response after dispatch, then retry same operation/ID and verify no unintended duplicate. Never inject a real-record edit or claim rollback.
3. Reset: fresh admin lookup/preview of the selected synthetic normal target, review blockers/counts, exact typed target confirmation, RESET_ONBOARDING only. Capture owner-scoped hashes before/after preparation; preparation must not delete product data. Close/reopen the client between validated steps, reuse identical pending input and verify persistent progress/retention. If no owner session or safe interruption point is available, leave that case pending rather than fabricating a backend restart.
4. Role boundary: native admin success, normal-user protected route denial, and an actual normal-user backend 403 are three distinct observations. Do not treat UI concealment or privileged CLI readback as backend denial evidence. Cross-owner enforcement needs two independently authenticated identities, not a role supplied in payload.

Original ON-05 is **separate and still open**: sign in with the original partially saved account; leave both optional duration fields blank (5/28 are placeholders); retain the valid date and explicit consent; press Continue once. If response is lost, reopen/retry the same account. Require successful saveCycle and minimal verified readback: preserved backend `granted_at`, matching GRANTED event, one matching initial period, absent/null optional durations, no withdrawn/conflicting grant silently changed, completion only after verification. Never delete/recreate that account to close the incident.

Deletion remains a separate maintenance acceptance. The user authorized both named synthetic accounts as editable/deletable, but no single deletion target, write pause or measured drain was established, so deletion is not run. The three Test Tools settings do not enable it. Use the continuation document's maintenance runbook only after explicit synthetic deletion selection and real writer drain; do not block Home/Calendar waiting for deletion.

## Full Health, correction and device evidence

Previously persisted hosted FULL report: Buildmarker-016 / HC-016.0, completed 17:54:48.679Z, 136 attempted/executed; 134 PASS, H03-006 FAIL, H09-004 BLOCKED, gate NOT_READY. Its private file was fetched through `internalHealth list → report → signed URL` without exposing the URI. This confirms existing persistence/readability, **not a new run or save in this turn**.

H03-006's real-source failure was reproduced: TestTools imports its reviewed catalog, controller hook and ImpactPreview from a feature folder outside the old whitelist. The fix permits only these exact imports and scans their source too, retaining forbidden direct SDK/business-token checks. HB01 tests actual repository boundaries; HB02 tests forbidden feature/backend imports and direct SDK access in each reviewed module. The real H03-006 case is now part of the local browser Health subset. HC-016.1 records the changed scan semantics; no failing case was removed or downgraded. Historical saved report remains unchanged.

After the owner publishes HC-016.1, admin → Profile/You → Admin Panel → Health Center → **Full Health**. Wait for completion, verify Save succeeds, reload history, open the newly saved matching run and compare marker/catalog/summary/case statuses. Retain any failures; do not modify `hostedMutationVerified` to force PASS. H09-004 must run live against the now-imported references. Local Chromium/WebKit regressions are synthetic browser evidence; physical Android Chrome and iOS Safari/OAuth/reopen remain separate external tests.

New published HC-016.0 Full Health was actually run from the admin browser: 18:31:19.449Z–18:33:25.914Z, 136 attempted/executed, 133 PASS / 2 FAIL / 1 BLOCKED / 19 NA. H09-004 now PASS. H03-006 remains the unpublished correction; H03-007 fails T24/T41/T74/HC01 and H13-004 is BLOCKED because iframe routes time out at `about:blank`. The app's `/auth-shell-probe` response returns `X-Frame-Options: DENY`, consistent with those framing failures. This does not prove a top-level auth or layout failure. No security header was weakened, no case hidden and no result relabeled. Save displayed `HEALTH_HISTORY_PERSIST_FAILED`; a separate history request returned `TEST_LIFECYCLE_UNAVAILABLE` (503). The UI evidence and HTTP header observation are retained separately from successfully saved historical reports. A cause for the persistence/503 failures is not established.

At 18:45:39Z, a fresh authenticated `list → report → private file` read succeeded with 16 history rows; the newest stored 016 run was still 17:54:48Z. This confirms history readability recovered and the new failed-save run is not present. Browser subsequently showed the login screen; no account/session change was inferred or performed by the agent. Normal-user denial and another admin Full Health/save/open require authenticated browser sessions.

Local correction verification: Chromium and WebKit each 439/439 canonical tests and 100/100 local Health checks, zero page errors. Lint, typecheck, build, Repo Health, generated last-five history and unchanged performance budgets pass. Audit: 0 Critical/High, 2 existing Moderate router findings; no dependency changes. Initial JS 453,164 raw / 147,877 gzip and CSS 86,276 / 14,810 bytes; these are local stubbed measurements, not hosted latency or device acceptance.

## Delivery status by requested step

| Step | Actually applied/verified | Ready or unable to execute; concrete next action |
|---|---|---|
| 1 Target | Existing app/main/prod/publication inspected; user explicitly approved shared prod | No isolation claim; no further target decision needed |
| 2 Schema | Full 24-file remote source comparison and reproducible full stage; zero semantic differences | Active database-policy export not obtained; Builder Data/Security inspection is required before any future full entities push. No push needed/performed here |
| 3 Rollout | Exact schema → nine functions/all shared → frontend sequence above | Owner merges Test and publishes HC-016.1 through existing Git/Builder flow |
| 4 Readiness | Real authenticated admin, expected authority/strategy and three readable stores | Rerun after publish; hostedMutationVerified remains false |
| 5 References | Exact content verify and dynamic Moon horizon pass; serial writes, no overwritten conflicts | Later renewal uses fresh Moon dry-run, not fixed count |
| 6 Product | Selected synthetic admin Home/reopen/concurrent reuse, real partial Calendar recovery/CRUD, reset between separate clients, retained data and forged-owner 403 | Normal-user authenticated denial, simultaneous *first creation* from a fresh owner, forced backend-worker interruption and original ON-05 are still unverified |
| 7 Deletion | No deletion performed; Home/Calendar completed independently | Select one disposable target and establish real pause/drain under the existing maintenance runbook before running it |
| 8 Health/devices | New hosted Full Health executed and failed-save evidence retained; earlier history list/private-file read verified; local Chromium/WebKit pass | Owner admin login/publish, resolve hosted iframe-probe compatibility without weakening headers, rerun Full Health and prove new save/list/open. Physical Android/iOS remain unexecuted |
