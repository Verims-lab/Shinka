# You/Profile and preferences — Buildmarker-022 / HC-022.0

Status: **REPO_CLOSED_PENDING_MANUAL_USER_VALIDATION**. Pattern 021 is preserved. Work began from clean local/origin Test `d5906b7`, one commit ahead of main `c602061`. No main merge/publish, hosted function/Full Health/user mutation, schema push, reference import or external service was performed.

## Implemented and verified locally

You opens from the top-right profile icon for completed owners. Home · Calendar · Pattern remain bottom navigation. Incomplete onboarding retains its existing resolver and verified-admin tools. You shows My Profile, App Preferences, Account & Privacy and current native-admin access; a pending/stale role grants no admin link.

Profile uses the shared DOB/18+/name/time/Sun validation and existing GeoNames selector, relocated intact to `features/profile`. Name is optional/trimmed/max 50 Unicode characters; blank time remains NULL. Saved place needs no hierarchy reconstruction or provider request for an unrelated edit. Changed ID resolves on the backend; explicit Clear writes five NULLs. Sun is read-only and recalculated by the approved server rule. Cancel discards an unsent draft; field errors keep it and move focus. Verified save returns focus to Edit; reopening reads persisted values.

The closed `you` function allows only read/readPreferences/saveProfile/verifyProfile/savePreferences/verifyPreferences. Owner derives from native session. ACTIVE, native User, reset/deletion lifecycle, completed profile/daily admission and update-time open health-job checks remain. Existing singleton rows are updated, never recreated. Profile patch cannot set status, owner, role or consent. Field revision, exact previous-value predicates, one-row result and readback detect observable conflicts; they do **not** establish native CAS, transaction, rollback or distributed isolation. Direct SDK policies stay closed.

Unknown write locks the draft and offers read-only Check or explicit same-intent Retry. Exact desired state confirms without another write; an observed different revision refuses overwrite. Profile/preference outcomes stay separate. A failed result check cannot make a lost write response definitive. Logout/session replacement clears personal state and discards late responses; old-owner hydration is not rendered.

TR/EN and notification preference persist on UserPreferences. Fixed local 06:00 and automatic IANA/last-valid fallback remain. Header language controls also persist and display only verified language; a stale locale URL cannot override the saved preference. Home greeting reflects the saved name, including NULL clearing; existing daily pair/snapshots, Pattern categories, consent/events and cycle data remain unchanged. The UI explicitly states that notifications are preference-only and delivery is unavailable. No push provider, permission prompt or scheduler was added.

Consent status is read-only GRANTED/WITHDRAWN/NOT_GIVEN; opening or saving profile grants/withdraws nothing. No approved legal destination/body was found, so Privacy Policy and untranslated Terms of Service show unpublished status without invented content/URLs. Withdrawal/deactivation have no placeholder action; existing admin tools stay separate.

## Checks and Health

- Chromium 156.0.8078.4: **526/526**, zero page exceptions.
- WebKit 27.2: **526/526**, zero page exceptions. This is not a physical iPhone test.
- Each engine: **24 You flows**, 22 Pattern flows, 87 existing mobile checks, 19 admin navigation, 5 Home, 8 Calendar, 4 Test Tools flows. You includes 320/360/390/430px, 844px landscape, TR/EN, 100/200% text, real keyboard/focus, saved name/locale across routes and logout.
- npm ci, direct/full tree, typecheck, lint, production build, 17 repository Health checks, generated last-five history and security:deps pass. Fresh audit: **0 Critical / 0 High / 2 Moderate**; existing React Router major-upgrade disposition remains, with no dependency change/suppression.
- Final initial JS: **467,644 raw / 155,412 gzip** bytes (limits 500,000 / 165,000). CSS: **86,583 / 14,929** (limits 90,000 / 16,000). No static cycles; lazy failure/full-reload retry passes. Field p75/INP is **NOT_MEASURED**; local LCP/CLS is not production acceptance.
- Local real Health UI with synthetic transport: **128 PASS / 13 BLOCKED**, saved state verified in the lab. Blocked: H04-019, H05-001…009, H08-005, H09-004, H12-031; hosted prerequisites are unavailable locally. This is not a hosted Health run/history-storage claim.

HC-022.0 adds H11-007 (profile/preferences), H12-038 (owner/recovery) and local H13-018 (You components/routes). H06-004 and H10-003 incorporate actual You identity/place tests. H13-012's obsolete completed-user menu expectation becomes You keyboard/heading navigation; incomplete-admin menu/Escape tests remain. No failed Health case is removed or forced N/A. Registered: 166; executable in-app: 141; separate: 9 local, 12 external, 4 future. Withdrawal/deactivation/notification requirements remain outside PASS scope.

Source → runner/assertion → evidence/environment: [full case audit](you-022/case-audit.md), [machine verification](you-022/verification.json), [performance](you-022/performance.json), [dependency receipt](you-022/dependency-audit.json). Canonical source, flow, data, security, UX, architecture, continuation, standards, development/release notes and five-package history were reconciled. Previous Health/audit/Git evidence remains.

## Owner publish and acceptance

Schema delta **none**. In the existing owner Git→Base44 flow merge Test when ready, wait for sync, confirm new `you/entry.ts` and **all shared/native entry code** including `profileInput`, onboarding and applicationSession are synced, then publish the matching frontend. No partial entities folder/push or frontend-only publish is needed. This task did not update main.

After publish, at most five in-app acceptance steps:

1. With a completed normal test account, open top-right Profile. Edit/cancel/save/reopen name, adult date, empty time, existing/changed/cleared birthplace; verify Sun and NULL behavior. A list outage must preserve the previous saved place.
2. Save TR/EN and notification preference, reopen and navigate Home → Calendar → Pattern → You. Confirm fixed 06:00, no delivery claim, updated/cleared Home name and the same current-day message/suggestion.
3. Exercise a save with a lost/offline response. Keep the draft; use Check then explicit same-save Retry when needed. Do not recreate the account. A competing change must require review rather than silent overwrite.
4. Compare normal/admin profile entry, including pending/revoked admin access and incomplete-admin tools. Sign out and switch accounts; previous personal values must not return.
5. Run published Full Health, save, list and open its report. Separately perform physical Android/iOS keyboard, screen-reader, browser bars/safe-area and OS text-size checks; desktop WebKit/Chromium does not close them.

Ready for owner sync/publish; hosted acceptance is open. Approved legal destinations/content remain missing. Actual notification delivery, withdrawal and self-service deactivation are separate packages. Original ON-05 same-account normal saveCycle/readback remains independent and is not closed by this delivery.
