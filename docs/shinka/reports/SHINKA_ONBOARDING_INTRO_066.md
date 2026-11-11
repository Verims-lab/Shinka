# 066 — Compact first onboarding screen

Buildmarker-066 / HC-065.0. Clean `AydanTest` fast-forwarded from `8e062e5` to `15d83fc` before editing. The supplied PNG, bundled source and production build output share SHA-256 `fddb6423ad197f498d278013d01b6d61a02a6e966ac757c3fd3ae6a264e9ed6f`.

ON-01 anchors the same fixed PNG at the top-left safe area and suppresses the contrast wash for that screen. The separate Shinka wordmark and the empty 240px slot are removed. The title, original TR/EN intro, three icon rows and Begin stay together. The default row title and description sizes change from 24px and 16px to 20px and 13.6px. At 200% text, rows can grow and the document can scroll.

H13-012 maps first-viewport visibility, logo position, line fit and text enlargement measurements on the real App with a synthetic SDK. H13-020 and T82 cover the single bitmap. U16/U18 cover the intro structure and transitions. H05-009 includes 066 under the existing content-verification policy. The catalog retains 185 cases.

## Local verification

- Chromium 156.0.8078.4 and WebKit 27.2 passed 8 presentation scenarios and 100 onboarding layer checks per engine, including 20 ON-01 combinations and the 47px top / 34px bottom simulated inset. At default text size, both TR/EN versions fit without scrolling at all four portrait sizes. The 200% text checks passed with wrapping and scrolling allowed.
- The separate shared-backdrop matrix passed 67/67 in both engines with zero page errors. It covers the other user-facing routes, both app themes and fixed background behavior during navigation and scrolling.
- With Inter loaded, Chromium fit all three TR/EN descriptions on one line at 320×568, 360×640, 390×844, 430×932, 768×1024 and 1280×900. At 320×568 the heading starts at 128px, Begin ends at 519px and each row is about 55px tall. The document opens at the top with the full CTA visible in all 12 measurements.
- The Chromium synthetic Health run recorded 146 PASS, 13 hosted-prerequisite BLOCKED and 0 FAIL. Report save retry, history list and private report open passed.
- Lockfile install, dependency tree, typecheck, lint, build, 19 repository Health checks and the generated five-package history passed. Dependency audit reported zero vulnerabilities. Maintenance passed on nine routes with zero static cycles. Initial JS measured 491,600 raw / 164,145 gzip bytes and CSS measured 83,112 raw / 15,987 gzip bytes.
- The first maintenance run exposed a 124-byte CSS overage. The final rules fit the existing limit. The first Foundation attempts reached 803/803 base assertions in each engine before the layer test removed the authored description font size. Its reset now restores the original inline size after text enlargement.
- In the subsequent full Chromium run, 803/803 base assertions and the onboarding matrices passed. The process was stopped after it stopped progressing in Pattern. The subsequent full WebKit run recorded 801/803 base assertions and exited when the browser closed during onboarding corrections. U07 and U12 passed on the pre-change `15d83fc` baseline and in separate final-code diagnostics. The focused final WebKit presentation run completed with zero page errors. Full-run acceptance remains open in both engines.

Browser and Health measurements use the local App with synthetic SDK transport. Hosted Full Health and physical-device acceptance remain pending.
