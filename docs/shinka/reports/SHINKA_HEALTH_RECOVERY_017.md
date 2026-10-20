# Shinka 017 — Health recovery and in-app target deletion

**Current BuildMarker:** Buildmarker-017  
**Catalog:** HC-017.0  
**Delivery:** MANUAL_USER_VALIDATION_PENDING — local code delivery to Test; owner merges/publishes  
**Target:** existing approved shared Base44 app/prod; no database isolation/new service

## Changed and verified in source

- Git preflight: local/origin Test `a0ba996`, main two commits ahead at `ac3e7e9`. Test fast-forwarded/pushed before changes. Password templates were added by `base44-builder[bot]` at 18:58:47Z. Earlier removal/re-add history exists at 012/015; no active route/import uses the five templates. Removed ForgotPassword/Register/ResetPassword/OAuthConsent/AuthLayout, keeping the auth scanner, actual Apple/Google/18+ shell, callbacks and safe return validator. Generation trigger is unproven; deletion alone does not guarantee the platform will not regenerate files. Authentication-panel evidence remains the original dated observation, not refreshed.
- T24/T41/T74/HC01 previously depended on hidden frames (up to 75s combined observer deadlines before the rest of the suite). The prior published XFO:DENY observation explains frame incompatibility; no per-test trace proves that every timeout or the full 90s H03-007 blocker had the same cause. Real top-level Playwright pages now measure the current build at 360/1024px with XFO:DENY in the local harness. Shared measurement identity includes source digest, build, environment/origin, viewport, engine/version and time. Missing/wrong/expired measurements block. No CSP/XFO change, timeout increase, case deletion or N/A conversion.
- Health save now identifies session/lifecycle, validation, private upload, row creation and readback separately, with safe code/stage/request ID. Same-run lookup precedes upload/create; full normalized report digest prevents conflicting retry. A 24h, server-signed, report-bound private-upload receipt survives create/readback failure in the open UI; retry saves the same runId without another Health run. A row written before response loss is read back/reused. FAIL/BLOCKED reports remain valid. Existing reports are immutable; historical no-digest records are read-only. New `InternalHealthRun.report_digest` is optional; policies remain all false.
- Delete is target lookup/current identity → reviewed deleted/retained scope → one explicit “Kullanıcıyı sil”. No repeated typed ID, terminal or routine maintenance settings. Durable target journal/start readback precede destructive calls. Actor and service-role target checks are separate; all owned native writes and UserCalendarAction check target lifecycle. Other users remain admitted. Self/last-admin/open health-job controls and signed scope binding remain. At most 100 cleanup writes and an 8s admission budget starting at the first cleanup write per invocation (an already-started SDK call can exceed it); the same operation resumes partial cleanup. Old checkpoints do not skip residual records. Completed jobs reverify absence and can reopen on late residuals. Retention and reset semantics remain.
- Native readiness now reports `native-continuation/2`, deletion `TARGET_LIFECYCLE_RESUMABLE`; authority remains `BASE44_NATIVE_V1`. `distributedFence:false` and `hostedMutationVerified:false` are deliberately unchanged.

## Evidence boundaries and remaining limits

No live app/API diagnostic, Full Health, schema push, content/Moon import, reset or deletion was run for 017. Public official Base44 docs were read. SDK [built-in User](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities#built-in-user-entity) explicitly supports service-role deletion; code calls User.delete and verifies absence. This does not certify hosted token revocation timing, provider re-entry, physical-device behavior or deletion of the provider account.

User-supplied published HC-016.1 run `62007d09-7694-423a-8708-2a44d9328270` is preserved: 19:02:56.407Z–19:05:12.956Z on 2026-10-20, 133 PASS /1 FAIL /2 BLOCKED /19 N/A, NOT_READY. H03-006/H09-004 PASS. JSON availability does not prove history persistence. Old HEALTH_HISTORY_PERSIST_FAILED and the separate TEST_LIFECYCLE_UNAVAILABLE remain distinct observations; their exact hosted cause was not proven. Current staged errors make a future targeted diagnosis possible without rerunning Health.

Native Entity/file operations have no documented cross-worker transaction, uniqueness or upload idempotency. Concurrent unseen create races can produce duplicate rows; observed duplicates/conflicts fail closed. If an upload response is entirely lost before its signed receipt reaches the caller, an unreferenced private file can remain; no unsupported file cleanup API or rollback is claimed. Receipt lives only in the open caller; it is not exported/logged. The same persisted run is always checked first on retry. No distributed exclusion of already-transmitted SDK calls or privileged dashboard edits is claimed. Target tombstone remains even after completion, and explicit same-operation recheck handles observed late operational rows. Protected histories are never erased to repair a race.

Added write admission costs owner lifecycle reads before/after each owned mutation, plus an ownership read for ID-based update/delete; there is no cached authorization. Delete repeats role/target/lifecycle checks around destructive writes; input is at most 100 rows per cleanup page, with 100 write/8s bounded passes and batch reference checks, not one query per parent. Hosted latency has not been measured. Local initial JS/CSS byte budgets are checked separately; fixture timing is not hosted throughput.

## Required owner publication and acceptance

1. Merge this Test delivery through your existing main/GitHub flow and wait for Base44 sync. Inspect the synced diff: no generated password templates should return; verify platform Authentication permits Apple/Google only. Do not weaken the scanner if templates reappear; retain the bot commit as evidence and resolve generation with the platform.
2. **Schema → all backend entries/shared code → frontend.** Only new schema field is optional InternalHealthRun.report_digest; no change to other 23 schemas or closed policies. Reproduce full package when needed:

   ```bash
   cd /Users/verimsari/Documents/Shinka
   node scripts/prepareSchemaStage.mjs /private/tmp/shinka-017-schema-review-NEW ac3e7e9
   ```

   Compare the complete 24-file manifest with the current remote Data/schema inventory, including remote-only entities. No fresh remote comparison/push is claimed here. Do not run entities push from an incomplete folder. Use existing Builder sync; verify all nine functions (including applicationSession/internalHealth/adminTestTools) and shared files from this commit before Publish. Existing three Test Tools server settings suffice; no new key/operator/window/drain setting. Internal Build must show 017/HC-017.0 and packages013–017.
3. For viewport evidence, explicitly run the existing local Playwright installation against the published app; sign in as admin in the opened window. This visits four real pages and does **not** start Health or mutate product data:

   ```bash
   node scripts/measureHostedBrowser.mjs https://shinka-rhythm-flow.base44.app /private/tmp/shinka-017-browser.json chromium
   ```

   In Health Center, import that JSON, then run Full Health yourself. Exact build/source/environment and 24h freshness must match. A separate WebKit execution can provide the other engine's evidence. Local bundle evidence cannot be imported as PUBLISHED proof. Report classification remains admin-supplied diagnostic evidence, not trusted remote attestation.
4. Confirm save → history list → open full private report, with identical runId/counts/gate. If save fails, use “Bu raporu yeniden kaydet”; do not run Full Health again. Keep safe stage/code/request ID and export the completed redacted report. Do not copy the upload receipt or tokens. A valid failed/blocked report must save too.
5. In Test Tools use only the specifically approved disposable **other** test account. Verify current ID/name/email and scope, click “Kullanıcıyı sil” once. If partial, lookup/resume the same operation after reload; verify native User absence, operational absence and retained histories. Other users' Home/Calendar should remain available. Test normal-user denial and self/last-admin refusal separately. No original ON-05-account removal/recreation is an acceptable substitute.
6. Original ON-05 remains a separate acceptance: same partial account, valid intended period start, explicit existing consent and optional durations left empty/null → normal Continue/saveCycle. Require successful response and limited owner consent/event/period/settings readback with unchanged valid grant time, no extra event/period and no recorded 5/28 defaults. Keep account intact. Normal-user cross-account enforcement and physical Android/iOS remain separate manual evidence; desktop Chromium/WebKit is not device certification.

## Local verification

Chromium/WebKit each: **454/454 regressions and 101/101 local Health PASS**, zero page errors. Native deletion UI passed in TR/EN, 360/1280px; focus/cancel/double-click and current target identity covered. Slow-preparation cleanup/retry also verified. Clean install/tree, typecheck, lint, build, Repo Health (17/17), history and byte budgets pass. Audit: 0 Critical/High, 2 existing Moderate router findings; no dependency change. See [structured verification](health-recovery-017/verification.json) for completed commands and limitations. No hosted success is inferred. H12-034 adds coverage; H12-033/T49/AP06 and old typed-ID tests are updated for the approved contract, not removed to hide a failure. Source guard allowance moves the one Health metadata create from dispatch to its dedicated persistence module, with unchanged strict operation count; H03-008 scope is unchanged.
