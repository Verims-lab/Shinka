# 071 — Direct navigation for authenticated onboarding

Buildmarker-071 / HC-070.0. The clean `AydanTest` branch fast-forwarded from `3779e56` to `1f71e0f` before editing.

## Cause and behavior

Fresh admission already obtained the user's current step from the server. Several Back actions could then change the local state to ON-02. That screen used the authenticated Welcome variant and an in-memory resume target, exposing 2/5 again during an active session.

ON-01 and ON-02 now belong to anonymous entry. Begin shows the unchecked 18+ declaration and Apple and Google. A verified session waits for the current progress envelope and opens ON-03, ON-04, ON-05, preparation or Home directly. An invalid or unavailable progress read uses the existing Retry view. Inactive and privacy routing use the existing boundaries.

Back can reopen an unsaved name draft from the same mounted form or the profile from ON-05. Verified saved profiles and preparation cannot return to Welcome. The 070 Sign out action uses the same session boundary from the signed-in steps. A saved NULL name remains a valid choice. Cycle Skip proceeds to preparation for that session. The verified first daily record makes completion durable across reopen. A fresh admission can offer an unsaved name or a session-only cycle Skip again before the existing persistence boundary.

## Regression gate

The mandatory App-level browser gate checks both providers and the age declaration, held and failed progress, retry, direct admission and reload, the optional path through verified Home, and browser and form Back. A document-start observer records onboarding screens, including any transient 1/5 or 2/5. H06-006, H07-012, H13-012 and H13-021 map the local checks. Buildmarker-070 added H13-021 to the executable catalog. The server plan now includes that case, and the local Health smoke verifies it executes. H05-009 recognizes 070 and 071 under the existing content validation policy. Historical execution records remain in their reports.

## Execution

- The real App with isolated SDK transport passed the 32 auth-first scenarios in each engine. Chromium and WebKit also passed all eight onboarding correction scenarios. The current package's isolated Chromium navigation check passed held hydration, Back, reload, privacy invalidation and account switch. Actual back-forward cache restoration was unobserved.
- Chromium passed 803/803 Foundation base tests. Its broader rerun was stopped after an extended period without additional results. WebKit passed 802/803 base tests with an OV05 Escape focus failure. The targeted WebKit rerun passed OV05 and ten other tests. U12 timed out in that rerun and passed in a separate single-case run. Full Foundation acceptance remains incomplete.
- The first isolated in-app Health run exposed the missing H13-021 server-plan entry through H16-005. After alignment, local Chromium Health reported **147 PASS, 13 prerequisite BLOCKED and 0 FAIL**. H06-006, H07-012, H13-021 and H16-005 passed. Report save, retry, history listing and private report opening passed with synthetic transport.
- The locked install, dependency tree, npm audit, typecheck, lint, build, repository Health and generated five-package ledger passed. npm audit reported zero vulnerabilities. The production maintenance gate passed the initial asset budgets and local route checks.

Base44 publication, hosted Full Health and physical-device/provider acceptance remain pending.
