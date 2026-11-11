# 069 — Welcome authentication and published verification

Buildmarker-069 / HC-068.0. Clean `AydanTest` fast-forwarded from `4b97106` to `6504ced` before editing. Both commits have the same tree.

## Observed screen and published build

The supplied Base44 Preview image shows **Devam et** under **Hoş geldin** at 2/5. In `OnboardingScreen.jsx`, that button belongs to the authenticated Welcome branch and resumes the user's form. Both variants share the step number. The `authenticated` flag selects Continue or `SignIn.jsx`, which renders the unchecked 18+ declaration, Apple and Google. The screenshot establishes which branch rendered in Preview. The device session and the Preview build identifier remain unverified.

On 2026-11-11 the published Shinka origin served Buildmarker-068. The public `InternalNav-D17CrMt9.js` module supplied that marker to Build & Environment. The live onboarding chunk contained the two provider handlers and the 068 flexible artwork slot.

Fresh anonymous sessions at the actual published origin opened 1/5 and reached anonymous 2/5 after Begin in Chromium and WebKit. At 320×568, 360×640, 390×844 and 430×932, all three controls were within the viewport and received hit testing. At 320×568 the last button ended at y=520 with zero document scroll. The public settings read returned 200 and the empty anonymous session read returned 401. The browser blocked other writes and telemetry. [Published Shinka](https://shinka-rhythm-flow.base44.app/)

## Regression and release gate

The mandatory auth-first Foundation check drives both App variants. It checks the exact anonymous step, visible controls, zero OAuth calls before the declaration, correct Apple and Google SDK dispatch, and the existing Continue route. Held and reloaded verified sessions are observed from document start for a transient anonymous prompt. The mobile layer checks also measure visual viewport bounds and whether each control receives pointer input.

The onboarding shell exposes the canonical Buildmarker. The separate published smoke uses the same visibility assertions and requires the release checkout's marker. It uses fresh anonymous browser contexts and only public assets, app settings and the empty session read. The owner verifies real provider callbacks and the installed device under H06-007. Base44 synchronizes the connected `main` branch to the editor, then owner publication changes what users receive. [Base44 GitHub synchronization](https://docs.base44.com/developers/app-code/local-development/github#sync-local-changes-to-base44)

## Execution

- The new auth-first gate passed 16/16 scenarios per engine in Chromium and WebKit. In each engine, four fresh flows exercised both SDK provider dispatches and authenticated Continue. Twelve held and reloaded sessions verified that the anonymous controls never mounted.
- The new published smoke passed visibility in all eight TR/EN viewport cases per engine. Its exit code was 1 against the current 068 deployment because the release checkout expects the new 069 marker.
- Dependency tree, npm audit, typecheck, lint, build, repository Health and the generated five-package ledger passed. npm audit reported zero vulnerabilities.
- The maintenance gate passed on nine routes. Initial JavaScript measured 491,600 raw / 164,142 gzip bytes and CSS measured 83,134 raw / 15,989 gzip bytes. The production background hash matched the source PNG.
- Chromium passed 803/803 base assertions and the 120-case onboarding layer matrix. The full run later stopped on the admin panel readiness timeout also recorded in 068.
- WebKit passed the 120-case onboarding layer matrix and recorded 784/803 base assertions. The full run later stopped with `TEST_TIMEOUT` in Calendar Health. A separate run passed all ten selected onboarding and authentication cases, including U03, U07, SS06 and SS08.
- The isolated Chromium Health run gave 146 PASS, 13 hosted-prerequisite BLOCKED and 0 FAIL. H06-001, H06-002 and H06-006 passed. Report save, retry, history listing and opening also passed.

The published site was observed at 068. The 069 marker and release gate require owner sync and publication. Full-suite acceptance and readback on the user's installed device remain open.
