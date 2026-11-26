# Account deletion reauthentication — 084

The supplied recording shows Welcome and the Google account chooser, then Account & Privacy asks for sign-in again. The recording shows the redirect symptom. It does not establish the affected native ID, the saved deletion stage or a provider error. Apple return is covered by a separate synthetic replay.

## Cause and correction

Self-service `accountPrivacy` starts by persisting a `UserPrivacyRequest` with `kind=DELETE_ACCOUNT` and `status=IN_PROGRESS`. Its worker marks an existing profile INACTIVE, removes scoped active data in bounded passes, sets `NATIVE_REMOVAL_PENDING`, and deletes the native User last. Fresh verification of native User and active-scope absence yields `PLATFORM_PENDING`. A timeout may leave any preceding state committed. A missing User with unverified active cleanup yields `PLATFORM_REVIEW_REQUIRED` in the response.

`applicationSession` correctly refuses product admission through the lifecycle wrapper. AuthContext preserves that refusal. The old privacy view treated it like an anonymous visitor, so a successful native sign-in could lead back to the same sign-in card without reading the request. ON-02 or a Terms callback intent does not lift the server-side fence. Database Design and Entity Relationships v1.2 distinguish User from UserProfile and describe the earlier INACTIVE-only policy. The approved 023 owner-erasure amendment supersedes that policy. The 060 read-only receipt and provider-return rules still apply.

The restricted privacy view now checks the native owner's existing request through the separate `accountPrivacy` endpoint. Only an owner-scoped in-progress result permits explicit continuation. The existing backend admits the current owner, persists a bounded read-only recovery receipt before cleanup, and reuses the same deletion request. The UI distinguishes unverified outcomes from verified active removal. It can recover a lost native-removal response with a read-only receipt. Neither product admission nor a new privacy request is opened through this view.

## Authorized operator procedure

1. Confirm the intended Base44 app/environment and obtain the exact native `User.id` from the authorized owner through a private channel. A known operation ID can supplement the native ID. Do not select a user by email matching or from the recording.
2. In authorized Base44 administration, use exact-ID, read-only inspection. Record native User presence, missing/ACTIVE/INACTIVE profile, `UserPrivacyRequest.kind/status`, and any `AdminTestOperation.operation/status/stage`. Check related active-record counts and open `HealthDataDeletionJob` status only where necessary. Verify an existing admin job with Test Tools **Status** by target ID and operation ID. Test Tools **Lookup** can show names and email and may refuse a pending owner erasure. Keep those fields, raw rows, health values and recovery secrets out of evidence. A read failure, ambiguity or missing profile cannot establish User absence.
3. If native User exists with an owner `DELETE_ACCOUNT` request, the supported continuation is the same account's existing provider login, **Check status**, and explicit **Continue** after the pending request is verified on a matching build. An existing admin `DELETE_USER` uses separate checkpoints and protections. Only the same current initiating admin can resume its existing operation in the authorized Test environment. A self-service request must not be replaced by an admin deletion. An open health cleanup job or legacy reset receipt must be resolved under its own workflow.
4. If User is absent, verify active-scope absence or escalate residuals for platform review. Active removal and permanent platform/provider erasure are separate. Base44 app-owner review of the exact native trash row and any remaining copies requires separate approval. The system has no approved in-app cancellation, rollback, reactivation or profile reconstruction for a partial erasure. Native trash restore does not reverse app cleanup or clear a lifecycle record.

For admin deletion, RUNNING, RETRY_REQUIRED and AUDIT_PENDING can all preserve a partial state. COMPLETED remains a product-admission tombstone and still requires fresh absence verification for a current success result. Status reads preserve the existing operation. A new preview or admin deletion cannot take ownership of an open self-service request.

No affected account was identified, queried or changed. No publish, real OAuth acceptance or hosted Full Health was performed.

## Local verification

The focused privacy suite passed 37 scenarios in Chromium and WebKit with no page errors, including runs with the locked dependencies. The targeted privacy/session/onboarding Foundation cases and the Chromium Terms/provider suite passed. The browser fixture injects failure before native User removal and replays the callback through the real App and lifecycle guard. The Apple replay also loses the acknowledgement after native removal and reconciles by reading status. The first WebKit run exposed an immediate DOM assertion after Escape; the harness now waits for dialog removal. Repository Health and the five-package history check pass. The Windows checkout had converted the generated history to CRLF; the generated file now has a scoped LF attribute.

The existing gzip size gate still fails on the locked build. Initial JS is 166,780 bytes against 165,000, and CSS is 16,194 bytes against 16,000. Both raw limits and the lazy-asset retry pass. The 083 report already recorded both gzip overruns. The thresholds are unchanged.

Both broader Foundation runs logged 820 passing cases with no failed cases before their remaining browser checks stopped producing a final result. Those runs were stopped and are incomplete. The locked install succeeded in a temporary directory after Windows held a binary open in the workspace. The lockfile audit reported zero vulnerabilities.
