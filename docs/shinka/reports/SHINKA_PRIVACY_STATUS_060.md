# Account & Privacy confirmation and status — 060

Date: 2026-11-09. Buildmarker-060 / HC-059.0. Scope: targeted fix; Test only. Active packages 056–060. No schema delta or new dependency.

## Evidence and cause boundary

- Baseline clean Test/origin Test 20978bd; main 9b5da80 is one commit behind. Existing work preserved.
- Screenshot confirms long technical removal copy. Gizem16 video viewed at ~12s (saved local request, unknown result, login card) and ~16s (Checking status), total ~18s. It ends before the existing 20s client deadline. No backend request failure or hang is established by this video.
- Targeted published `/account-privacy?lang=en` read succeeded in the existing admin session; deletion remained disabled by admin protection. This is not the incident account. No recovery secret, incident response/log or live operation was obtained; no live mutation/resume/cleanup/Health/scan occurred.
- Proven source defects: privacyService collapsed HTTP/auth/network/timeout distinctions; UI rendered the same unknown text and described a locally persisted intent as a saved server request. Status busy state awaited provider logout. Disposal discarded results but did not release the service deadline. Repeated calls dispatched once but did not share the completion promise. A synchronous injected request failure also exposed an already-settled in-flight slot during correction; this is now covered.
- Reauthentication boundary: product applicationSession intentionally denies pending-deletion access. accountPrivacy already uses the raw native session for owner privacy actions. Expired receipt reads now admit that existing native owner at this boundary and require the original receipt's exact request/owner, without renewing TTL or bypassing lifecycle/admin checks. Anonymous expired, wrong hash, wrong request and other-owner queries remain denied. Original incident cause (key expiry, platform auth, timeout, provider/service failure) remains unproven.

## Change and truthful copy

The requested retention sentence contradicted ACCOUNT_CLEANUP + native User removal. User explicitly approved the alternative in this chat: “Your account and personal information will be removed from the app, and you will no longer be able to access Shinka. Permanent deletion will remain pending until it is verified.” Exact TR equivalent and requested title/buttons live in the central catalog. The backend erasure scope, last-user ordering and permanent-erasure limitation are unchanged.

Status remains a read. Existing receipt/request IDs and 24-hour anonymous authority remain unchanged; no automatic begin, resume, renewal or cleanup. A completed status read is independent of provider logout. Local wait is bounded to 20s and abortable on unmount/session invalidation; already sent SDK IO cannot be recalled. Duplicate checks share one promise. Validated backend state alone permits active-removal display. Transient failures, timeout, sign-in requirement, pending and verified active removal are distinct, without claiming permanent deletion or completed provider logout. Saved local intent suppresses the unrelated new-deletion login card; expired recovery supplies existing-provider sign-in with privacy/locale return path.

## Regression and Health

PR21–PR27 add controlled-clock transport, real handler recovery/authority, double-confirm, no-write shared status, request binding, delayed logout and cancellation/late-response coverage. Existing PR01–PR20 retained, with specific invalid-response/read-unavailable expectations strengthened. PV05/PV06 add mounted TR/EN status and account-isolation coverage; PV01–PV04 and actual-App modal/cancel/recovery flow updated to approved buttons/copy. Synthetic HTTP harness now preserves actual error status instead of converting all server replies into HTTP success.

Health +0 / ~4 / -0: H11-003, H12-039, H13-019, H05-009 (same content policy for current build). H11-008 remains external. Canonical Security/Privacy, Business Flow, UI/UX, Release Health, Development Notes/Rules and Source of Truth updated; generated last-five metadata retained.

Chromium 156.0.8078.4 and WebKit 27.2: **800/800 PASS each**; final boundary rerun **34/34 each**, 35 privacy browser scenarios per engine (20 confirmation viewport/locale/text cells, 3 existing real-App flows, 8 transient/retry cells and 4 expired-authority cells), zero page errors. Local synthetic Health **147 PASS / 13 expected hosted prerequisites BLOCKED / 0 FAIL**, save/list/open verified. Typecheck, lint, build, repo, generated five-package history and performance gates PASS; dependency scan **0 vulnerabilities**. Final boundary rerun covers the malformed-key message and anonymous partial-result sign-in link after the full-run snapshot.

See [execution.json](privacy-status-060/execution.json) for actual final gates. Initial attempts remain recorded: sandbox loopback EPERM; PR24 fixture incorrectly spread Proxy entities (fixed by narrow proxy interception); typecheck annotations fixed without weakening assertions or exclusions; T44 caught the initially stale shared HC constant (799/800), corrected and rerun to 800/800; independent matrix-cell recovery reset corrected without changing within-operation persistence.

## Publication and remaining verification

Owner merges Test, syncs accountPrivacy and all matching shared code (including privacyRepository/Operation and Health scope metadata), then matching frontend; no schema deployment is required. Owner can use the existing saved request's Check status after publication. It must only read, retain the same operation and show the verified state or explicit retry/sign-in state; do not create a new account/request to demonstrate closure. Existing-provider authentication must return to Account & Privacy, not require onboarding. If the native identity is already removed and the receipt expired, a new identity cannot recover the old request; operator/platform review remains separate.

Physical iOS/Android/wrapper and real provider-return/incident recovery are NOT_RUN. No claim that the historical request is now complete, no new live erasure, and no permanent-platform erasure acceptance.
