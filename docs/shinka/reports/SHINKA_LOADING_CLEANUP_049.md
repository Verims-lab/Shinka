# 049 — Opening stability and 045 cleanup continuation

Buildmarker-049 / HC-048.0. Narrow continuation; preserves 048 manual theme, imagery, onboarding and ID-only daily assignments. Test only. Main was one merge commit ahead (`ecf0e9e`); clean Test fast-forwarded without changing its 048 tree. Final commit/push is recorded in the delivery.

## Observed hosted evidence (048, not 049 acceptance)

- Shinka Builder URL identifies app `6ad5190f4845d4e3af03b420`; published app is `https://shinka-rhythm-flow.base44.app/`. Internal Build showed **PUBLISHED / Buildmarker-048 / HC-047.0**. Existing 048 Health history was read, not rerun.
- Existing web session reached Admin Panel. Builder Code → `applicationSession/entry.ts` → Test Function `{}` returned 200, native User `6ad519134845d4e3af03b423`, role `admin`, authority `BASE44_NATIVE_V1`. No email/token/private revision is retained here.
- Home was rendered initially, after an independent new-tab opening, and after a captured normal reload. Network showed `applicationSession` 200 / 732ms, `onboarding` 200 / 1320ms, `dailyMessage` 200 / 1370ms in that reload. Pattern → Home returned the same daily ID. This is current successful reopening evidence, not first creation or proof the intermittent incident is resolved.
- Console inspection returned three warnings without an allowlisted application error/status. Targeted dailyMessage Logs returned no entries twice, with a completed normal request between observations. Empty logs do not prove absence of earlier failure or identify its cause.
- Browser control initially detached from old tabs; fresh task tabs restored access after the owner re-enabled the connection. No credentials were extracted, CLI login requested or published code edited.
- The app uses the authorized existing shared target; Git Test/Preview is not a separate DB. The web Test Function offered no data-env selector. Full deployed dependency hash/schema comparison and old-writer drain are still prerequisites before actual cleanup, not inferred from the frontend marker.

## Proven defects and narrow fixes

1. **SS13 failed before the fix:** a never-settling applicationSession/public-settings SDK promise kept startup loading and the session coalescer occupied indefinitely. AuthProvider now bounds each parallel read to 15 seconds, with the whole session retry sequence (including existing 700/1400ms waits) inside that one budget. Existing real invalid-session handling is unchanged; transient failure is unverified/retry, not logout. Account/logout/unmount invalidate old results and clear local timers/listeners. SDK work itself may still finish remotely.
2. **DU06 failed before the fix:** after a Home failure, same-day/same-zone foreground return did not invoke a new attempt because checkDay only considered changed date/zone. A visible failed Home now requests one fresh attempt; simultaneous focus/visibility remains coalesced. Normal successful cards are retained. Kept inactive tabs do not request; day/zone and access-loss rules remain.
3. The existing daily/onboarding deadlines remain **20s/15s**. No timeout increase, alternate content assignment or security relaxation. A retry executes the normal server path: inspect durable day, resolve existing pair, otherwise preserve the existing guarded create/readback and candidate reconciliation. Lost acknowledgement can therefore reuse the persisted assignment. This does not claim cancellation, distributed uniqueness, transaction or rollback while another backend invocation is still running.
4. Safe request-local diagnostics add session/hydrate/daily stage, UUID, duration and closed transport class. Daily distinguishes profile/existing/reference/selection/persistence/readback. Synthetic reference IO 429/503 remains distinguishable from explicit missing/invalid pair; no raw error/body/header/text is logged or exposed. Home copy remains simple. Session logging no longer prints arbitrary SDK codes.

The relationship between these local defects and the owner's historical intermittent incident is **unproven**. No captured hosted failed request, physical-device/background-throttling proof or first-creation trace was obtained. Owner publication and a subsequent failing/successful trace remain necessary.

## 045 actual cleanup result

| Item | Result |
|---|---|
| Migration rows inspected | **0** |
| Legacy fields/rows cleaned | **0** |
| Remaining | **UNKNOWN** |
| Full paginated verify | **NOT_RUN** |
| Final schema removal | **NOT_READY — compatibility fields retained** |

The web path was actually attempted: Code → `base44/functions/internalHealth/entry.ts` → **Test Function**, payload `{"action":"dailyReferenceMigration","request":{"action":"dryRun"}}`. Result: **400 INVALID_INTERNAL_ACTION**, stage OPERATION, duration 439ms, request ID `42e3dcc6-40c6-411a-992f-2a59145714b4`. The existing admin guard admitted the request, but the deployed operation dispatcher has no migration action. The UI executes JSON against deployed functions; it did not expose an arbitrary privileged script runner. Adding/editing remote source would violate owner publication control.

Test therefore prepares only a closed `internalHealth` action that calls the existing 045 module. It checks the fixed Shinka app ID, fresh native admin, ACTIVE actor profile, target privacy/lifecycle, review digest and literal ID. Only `dryRun`, `applyBatch`, `verify` are accepted, with no table/patch/owner authority or credentials supplied by the browser. No extra endpoint/UI/service is added; automatic Health never dispatches maintenance.

The same module now includes stable assignment fingerprints and full bounded pagination of linked NotificationDelivery IDs/owners/daily IDs. Digests/counts are compared before/after each literal four-field unset. Changed links block or leave an unconfirmed outcome; they are never repaired silently. Native `updated_date` may advance; `generated_at` and all assignment/link identities must remain unchanged. Existing optional schema/generator/inspector/D23 remain `OPTIONAL_LEGACY_FIELDS_CLEANUP_PENDING` / `cleanupVerified:false`.

## Exact owner publication and authorized web continuation

1. Merge reviewed Test → main through the existing flow; wait for complete Base44 GitHub sync. Verify matching **applicationSession, onboarding, dailyMessage, internalHealth and all shared modules** before publishing matching 049 frontend. No schema push, content import, secret setup or notification enablement is needed.
2. Notify the agent after sync/publish, keeping the current admin web session open. This is the only owner-only intervention; cleanup permission is already granted. The agent must recheck app/current environment/native admin, the complete compatible schema/code and old-writer drain before writes. Stop any old compatible-predecessor writer and finish its in-flight work; do not claim a browser close canceled backend work.
3. In the same **internalHealth → Test Function** use the above dryRun payload. Traverse every page with `request.cursor=nextCursor` until `hasMore:false`; retain every ID/status/legacy count/assignmentDigest/linksDigest/linkCount. Any invalid reference/assignment/link or unconfirmed inventory stays open.
4. Review each ≤25-ID batch, then send `{"action":"dailyReferenceMigration","request":{"action":"applyBatch","ids":["EXACT_REVIEWED_IDS"],"reviewed_digest":"EXACT_PAGE_DIGEST"}}` sequentially. Only the four authorized `_snapshot` fields are removed. Do not edit Data rows or replace/delete a daily/pair/user. Mixed new/old writers invalidate this review.
5. On timeout/lost/partial result, **read the same IDs first** with `request:{"action":"dryRun","ids":[...]}`. Inspect durable field absence and unchanged fingerprints; use a new reviewed digest for that same ID set. Never infer success from a network acknowledgement or rerun arbitrary writes.
6. Verify from the beginning with `request:{"action":"verify"}`, traverse all pages, compare all IDs and fingerprints to the complete initial inventory. Full success requires zero legacy fields, zero broken/pending references, unchanged assignments and NotificationDelivery links. A missing/new/unreviewed ID or changing link must be reconciled explicitly; `clean:true` is page-local.
7. **Only after that actual proof**, update final checked-in schema/generator/inspector/D23 together, generate/compare the complete final schema stage, and deliver that change in Test for owner schema publication. This package intentionally does not claim this step is complete.

## Tests, Health and limitations

Health: **0 added / 6 updated / 0 removed**, unchanged 179-case inventory. H12-025 → SS13; H07-013 → DU06; H09-003 → ID12; H09-007 → ID10/11; H05-009 → explicit 049 staged policy; H12-026 → strict DM22 safe envelope. Existing assertions and external H09-901/native/workflow/device requirements remain. New helpers augment existing suites; no static-PASS case.

`loading-cleanup-049/verification.json` and engine/gate receipts contain final actual results. Initial SS13/DU06 failures and the intermediate TS/native-entry harness import errors are retained separately. No live Full Health, Security scan, reset/deletion/profile/consent/cycle mutation, push/scheduler, main merge or publish was run. The twelve deferred backend findings remain deferred.

### Final local execution

- Chromium **156.0.8078.4** and WebKit **27.2**: **734/734 PASS each**, identical unique IDs, **0 failures / 0 page errors**. Actual App startup-order/account/logout checks, foreground recovery, existing-reference 429/503 and the retained timeout/lost-response controls passed. [Chromium receipt](loading-cleanup-049/chromium.json), [WebKit receipt](loading-cleanup-049/webkit.json).
- Local in-app Health per engine: **140 PASS / 13 BLOCKED / 0 FAIL**, saved, retry-saved, listed and opened. The 13 hosted-prerequisite blocks are H04-019, H05-001–009, H08-005, H09-004 and H12-031; no hosted run was performed. Full synthetic timing checks also passed with zero external requests.
- Node admission **8/8** and session **9/9** passed. Actual native-entry harness: **10 session / 5 routes / 2 artifact / 7 deletion checks** passed, with zero login-secret reads. Installed SDK loopback and disabled-notification entry checks passed; provider and hosted acceptance remain separate.
- Install, dependency tree, npm audit (**0 vulnerabilities**), dependency security threshold, typecheck, lint, production build, Repo Health and generated five-package history passed. Existing lazy-chunk/dynamic-import and npm configuration warnings remain advisory; no limit was raised. [Quality receipt](loading-cleanup-049/quality-gates.json).
- Original performance budgets passed: initial JS **474918 raw / 157886 gzip bytes** (limits 500000/165000), CSS **78478 / 14447** (limits 90000/16000), zero module cycles. Nine routes × three local cold samples and lazy-asset failure/reload retry passed. These are synthetic local measurements, not field/physical-device performance. [Performance receipt](loading-cleanup-049/performance.json).

Only documentation and generated ledger status were finalized after the full behavioral runs; no product/test logic changed afterward. The generated ledger and repository consistency were checked again. Prior failed runs remain in [before-fix evidence](loading-cleanup-049/before-fix.json); nothing here closes the unobserved live incident or pending cleanup.
