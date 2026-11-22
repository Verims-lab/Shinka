# 077 — Accessible onboarding heading focus

Buildmarker-077 / HC-076.0. AydanTest fast-forwarded from a56c95f to main e6dd8b4 before editing. Both commits have the same tree.

The unlayered global focus-visible rule wins over the heading's layered outline utility. The existing shinka-unframed-title class was conditional on steps 1 and 4, so Welcome and other announced headings received the global rectangular outline. All OnboardingScreen titles now receive that class, with its CSS scoped to h1. The existing tabindex -1 and focus calls continue to announce entry. Interactive focus uses the existing control and outer-field indicators.

checkOnboardingFocus joins the mandatory presentation gate. Its real App fixture signs out from the authenticated name step on /login, checks automatic Welcome focus and keyboard traversal through age, Terms, both legal links and both providers. The name input's outer indicator is also checked. It compares heading geometry and typography as focus moves. The matrix uses TR/EN and 320/360/390/430px. U18 extends the existing unframed-title assertion to all five steps and preparation.

H13-012 and H05-009 are updated. HC-076.0 retains 188 cases and the existing content verification rules.

## Execution

Before the correction, the new Chromium logout regression failed with actual outline solid and expected none on Welcome.

- Chromium and WebKit each passed 8/8 logout/focus scenarios, 8/8 presentation scenarios, 192/192 layer checks and all four selected U16–U19 regressions. Completed runs reported zero page errors.
- Keyboard Tab traverses the name input, age/Terms controls and provider buttons with their visible indicators. Chromium also traverses both policy links with Tab. The local WebKit runner skips links during Tab traversal, so its links are focused after keyboard input and checked for tabindex eligibility, active focus and a visible indicator. The first WebKit attempt retained the stricter Tab-to-link expectation and failed. A local isolated probe confirmed the runner behavior before this test correction.
- Computed heading checks require active h1 focus, tabindex -1, outline none, border zero and shadow none. Heading geometry and font family, size, weight and line-height match after focus moves to the controls. Representative local TR/EN captures show Welcome after logout.
- Typecheck, lint, production build, Repo Health and generated history passed. Buildmarker-077 retains 073–077 and HC-076.0 retains 188 cases.

The focused local tests use the existing isolated SDK transport. Physical screen-reader/device acceptance and publication follow the owner workflow. The earlier release-wide execution and byte-budget findings are retained in the [076 report](SHINKA_UNIFIED_AUTHENTICATION_076.md).
