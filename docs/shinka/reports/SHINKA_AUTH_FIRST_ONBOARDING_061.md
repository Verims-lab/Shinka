# 061 — Authenticate before personal onboarding

Buildmarker-061 / HC-060.0. Scope: focused onboarding order and regression closure. Main's Base44 package/MFA templates are preserved together with Test 059/060. No live account mutation, reset, erasure, import, Full Health, security scan, main merge or publish.

## Confirmed source cause and change

The intro selected UNAUTHENTICATED_NAME before sign-in; a versioned sessionStorage name was shared across the same tab without an owner binding. Current order: intro (1) → Apple/Google/18+ (2) → verified applicationSession/hydrate → authenticated optional name (3) → profile (4) → cycle (5) → preparation → Home. No new schema, auth provider or dependency.

Backend resolver distinguishes no profile from an existing profile with a NULL name. Actual persisted profile/preferences, verified daily rows and reset/lifecycle stages decide resumption. Failed/malformed reads show Retry, never a new account; restricted deletion/consent states use existing privacy routing. Provider names are not copied into Shinka. Back is local and preserves session/drafts. A same-owner fresh admission invalidates and reloads the server snapshot even when React batches the auth state transitions.

Name remains an unsaved owner-scoped in-memory draft until the existing saveProfile operation verifies both name and birth details. Reload before that boundary may ask the unsaved name again. Saved NULL is a completed choice, not a missing-name error. Old anonymous storage values are ignored and the unused helper is removed. No authority is taken from localStorage, email or provider-name availability.

## Health and verification

Health +0 / updated 5 / removed 0: H06-006, H07-002, H07-004, H13-012, H05-009. O02's obsolete anonymous-storage expectation is replaced by server/NULL-name/unauthenticated-write assertions. O34 and OU09–OU11 add reset, privacy, read-failure and late-owner hydration tests. Existing provider/cancel/owner/age/consent/readback/late-response assertions remain. Scope metadata matches executable/local coverage. H06-007 real OAuth and physical/native acceptance remain external.

Final local results: Chromium **804/804**, WebKit **804/804**, plus focused **19/19** and final retired-storage/build checks **4/4** per engine. Each engine passes 16 auth-first App scenarios (TR/EN, 360/390px, 200% text), 8 prior onboarding correction scenarios and the existing presentation/back/scroll, startup, session, privacy and native-entry suites. Zero browser page errors. Local synthetic Health is **147 PASS / 13 prerequisite BLOCKED / 0 FAIL**, with save/retry/list/open verified; this is not a hosted Full Health result. Required typecheck/lint/build/repo/last-five/dependency gates pass; npm advisories **0**. Performance budgets pass: initial JS 491,760 bytes / 164,055 gzip (limits 500,000 / 165,000), CSS 79,853 / 14,654 (limits 90,000 / 16,000), zero cycles and no initial test/Health bundle; field p75/INP and physical OAuth remain NOT_RUN/NOT_MEASURED.

Exact engine/matrix/server results are recorded in [execution.json](auth-first-061/execution.json). Historical failures and intermediate attempts are preserved there. Base44 main's imported MFA boilerplate exposed JS type-inference errors; narrowly typed existing props/tuples/request options and explicit URLSearchParams serialization repair the merged quality gate without connecting MFA to Shinka's auth flow. Its generic password/SSO/Microsoft/Facebook controls contradicted unchanged T54/H03-008 policy; they and the now-unused password helper were removed, while the template's MFA mechanics remain. The provider helper now rejects non-Apple/Google inputs before platform IO. No assertion or scanner allowlist was weakened.

## Publication

1. Owner merges the delivered Test version to main and synchronizes Base44.
2. Publish onboarding with the matching shared resolver and native entry graph, plus applicationSession/internalHealth shared dependencies, then the matching frontend. No entity/schema/import operation is needed. Keep backend/frontend rollout together: old/new screen-state vocabulary is not a mixed-version acceptance contract.
3. Owner verifies actual Apple and Google on fresh, completed (including NULL name), partial and reset test accounts: no pre-auth name; completed goes Home; pending session/progress stays neutral/Retry. Validate cancellation and provider callback once, reopen/back/account switch and existing privacy restriction routing. Do not reset/delete live accounts merely to demonstrate routing.

Local browser synthetic admission is not real provider/native/device evidence. Previous visual/physical open items and disabled notification/scheduler remain unchanged.
