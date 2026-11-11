# 065 — Shared branded screen background

Buildmarker-065 / HC-064.0. A clean local `AydanTest` checkout fast-forwarded from `c10fcdd` to `992315b` after `main` advanced during verification. The two additional commits updated the 064 maintenance documentation. Application code, tests and the PNG match the `fcaed31`-based validation copy byte for byte. The 064 build entry, historical receipts and Health evidence are preserved. [064 admin retirement package](SHINKA_ADMIN_RESET_RETIREMENT_064.md)

The owner PNG, `src/assets/shinka-background.png`, is 942 × 1670 and 1,691,146 bytes. Its SHA-256 is `fddb6423ad197f498d278013d01b6d61a02a6e966ac757c3fd3ae6a264e9ed6f`. The bundle serves the same bytes under a local asset URL.

`AppBackdrop` lives beside the route-motion tree. The single decorative layer includes startup, all onboarding stages and preparation, Apple/Google entry, Home, Calendar, Pattern, You and its preferences, Account & Privacy, the public deletion entry, and user-facing retry/error states. The existing route table sends unregistered paths such as `/register` to the same branded not-found surface. Internal admin screens and the diagnostic auth probe keep their existing surfaces.

The original proportions fit the fixed large viewport with a bottom anchor. Cream fills unused space and a narrow edge fade blends into it. The translucent navigation shows the layer through its existing safe-area padding. The localized cream wash improves contrast where the embedded logo overlaps headings, and dark mode uses the existing account-controlled dark veil. The image file, existing wordmarks, cards, layout and behavior are preserved. The logo appears twice wherever the existing Shinka header and the decorative wordmark are both visible.

## Regression coverage

H13-020 checks the shared paint rules and internal surface. H13-012 includes the real-App backdrop matrix and the existing onboarding, keyboard, theme and navigation coverage. H05-009 includes 065 under the existing content-verification policy. The integrated catalog keeps 185 Health IDs and retains the 064 retirement of H12-030.

`checkAppBackdrop` checks the bundled PNG's decoded dimensions, fixed geometry, layer identity across navigation, 34px synthetic inset, translucent navigation, and no horizontal document overflow. It covers 320/360/390/430px portrait, 768px tablet, 1280px desktop and 844px landscape in both app themes. Onboarding layers, navigation insets, text enlargement and keyboard/reduced viewport checks also run in the existing Foundation suite. Browser evidence uses the real App with synthetic SDK transport.

The first visual inspection exposed overlap between the dark wordmark and light-mode headings. Bottom alignment and the localized wash address readability while retaining the PNG's composition. Initial browser checks exposed an empty anonymous privacy container used as a visible locator, a host-locale assumption in the English-copy fixtures, and Calendar and cold re-admission assertions that could run before WebKit committed the expected DOM. The checks now use the privacy heading, an explicit fixture locale and the corresponding committed states. Windows path separators are normalized for repository evidence and performance measurement.

[Initial overlap](app-background-064/home-initial-overlap.png) and [corrected Home](app-background-064/home-390-light.png) show the same local Chromium fixture at 390px. [Dark Pattern](app-background-064/pattern-390-dark.png) shows WebKit at 390px. These captures use the loaded PNG and local fallback fonts.

In the standalone backdrop worktree, production build output matched the input PNG's hash. The maintenance gate passed with 490,793 raw / 163,930 gzip bytes of initial JS and 83,219 raw / 15,988 gzip bytes of CSS. The PNG is a separate static asset. The measured graph had zero cycles and lazy-load retry passed. The preceding CSS measurement exceeded the gzip limit by five bytes. Keeping the same dark 404 surface in the shared CSS removed redundant utility output.

## Standalone backdrop checks at c10fcdd

- Chromium 156.0.8078.4 completed the full local Foundation suite with **805/805** assertions and zero page errors, including 100 onboarding layer checks and 89 theme checks. Chromium synthetic Health gave **147 PASS / 13 hosted-prerequisite BLOCKED / 0 FAIL**. H13-020, save retry, list and open all passed.
- The delivery backdrop matrix passed **67/67 per engine** in Chromium and WebKit 27.2. WebKit also passed **14/14** selected assertions and a **6/6** Calendar and backdrop recheck, including CU04 after waiting for the rendered Calendar controls.
- The final T81/T82 checks, including the H13-020 probe, passed in both engines.
- The last full WebKit attempt recorded 804/805 Foundation assertions before a Calendar Health helper timed out. CU04 was the one failed assertion in that attempt and passed the separate recheck. A separate WebKit synthetic Health run also timed out waiting for the report-save state. Full WebKit Health acceptance remains open.
- Lockfile installation, dependency tree, audit, typecheck, lint, build, repository Health and generated history checks passed. npm audit reported zero advisories. The final build retained the original PNG hash and measured 15,963 gzip bytes of CSS.

Keyboard and safe-area measurements are local simulations. Physical-device acceptance and published Full Health remain separate.

## Integrated local verification

- Chromium 156.0.8078.4 completed the full Foundation suite with 803/803 assertions and zero page errors. The backdrop matrix passed 67/67, Test Tools passed 4/4 real-App scenarios with zero product writes, and Calendar corrections passed 40/40.
- Chromium's synthetic in-app Health returned 146 PASS, 13 expected hosted-prerequisite BLOCKED and 0 FAIL. Save retry, history listing and opening the private report passed. The catalog has 185 cases.
- WebKit 27.2 completed 803/803 base assertions. The full run stopped in Calendar Health with TEST_TIMEOUT. A separate Calendar correction run timed out waiting for the pull-to-refresh read. Full WebKit Health and that Calendar scenario remain open.
- In a separate WebKit run, the backdrop passed 67/67, Test Tools passed 4/4 real-App scenarios with zero product writes, all three synthetic admin Health cases passed, and T81, T82, AT18, NA18, NA19 and AU04 passed. The Test Tools screen scenarios used a fresh browser context after the AU04 fixture populated session storage in an earlier diagnostic run.
- The first npm installation stopped with a Windows EPERM error. The retry with npm 11.21.2 completed using the lockfile. Dependency tree, audit, typecheck, lint, build, generated history and all 19 repository Health checks passed. The audit found zero vulnerabilities. The production PNG SHA-256 matched the backup.
- The maintenance gate passed on nine routes. Initial JavaScript measured 490,793 raw and 163,932 gzip bytes. CSS measured 83,219 raw and 15,988 gzip bytes. The static graph had zero cycles.
- The first untraced browser runs were stopped before completion. Local browser validation ran on the code-identical fcaed31-based checkout. The repository Health check also ran on the final 992315b-based checkout. Browser and Health evidence used synthetic fixtures. Hosted Full Health and physical-device acceptance remain open.
