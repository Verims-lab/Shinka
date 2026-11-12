# 073 — Centered artwork across Shinka

Buildmarker-073 / HC-072.0. Clean `AydanTest` fast-forwarded from `287b7a2` to `425ba69` before editing. Both commits have the same tree.

The owner's `Backround.png` is 941 × 1672 and 1,668,246 bytes. The bundled source keeps SHA-256 `b9a3ac496e0b4fff814b10d19273cb3b7027f23577b3fe76d387975709cb2440`.

The shared backdrop contains the original artwork within the safe viewport at the top of the document. Its logo scrolls with its reserved space, so foreground content stays below it. One backdrop serves onboarding, preparation, sign-in, Home, Pattern, Calendar, You and preferences, Privacy and account entry, and user-facing loading, retry and error states. The duplicate standalone header wordmarks are removed. Dark mode uses a reading surface below the logo and retains the original artwork pixels at the top and along visible edges. The artwork header remains part of the pull-to-refresh touch surface.

ON-02–05 place Back and the localized counter in the artwork's open upper-left area. ON-01 retains the 067 spacing, content and Begin. Session-scoped Back follows 071, and preparation remains unnumbered.

H13-012 and H13-020 cover geometry, the single contained PNG, the original palette and the dark reading surface. H05-009 retains the existing content policy.

## Execution

- Chromium and WebKit each passed 8 presentation, 192 onboarding layer, 32 auth-first, 67 backdrop and 89 theme cases. The matrices cover 320, 360, 390 and 430px portrait widths, tablet, desktop and landscape. They check initial content and CTA visibility, enlarged text, simulated safe insets, focused fields, reduced viewport height, scrolling and 071 Back behavior. The initial enlarged-text collision was corrected by allowing the progress row to grow in normal flow. Local provider dispatch uses synthetic SDK responses.
- Local captures show the centered logo, upper-left counter and accessible form on onboarding, and the artwork on product and account routes. At 390px, the light and dark logo crops are byte-identical within each engine. The source, served and production PNG hashes match the attachment.
- The product navigation regression passed in both engines. The real back-forward cache round trip remains unverified. The Calendar corrections suite passed 40/40 in Chromium, including pulling from the new header and preserving the draft. The WebKit pull step timed out on both the 072 baseline and 073. The local WebKit 27.2 runtime reported that `overscroll-behavior-y: contain` is unsupported, so the existing pull gesture guard leaves that gesture unavailable there.
- The wider Chromium Foundation run on the centered layout passed 803/803 base tests and 8/8 onboarding correction cases. The wider WebKit run passed 802/803 base tests and 8/8 onboarding correction cases. M09 reproduced the baseline `loadHistory` failure in WebKit. Both wider runs were stopped after their last reported results. The focused matrices completed independently. [072 baseline result](SHINKA_ONBOARDING_BACKDROP_072.md)
- Local Chromium Health reported 147 PASS, 13 prerequisite BLOCKED and 0 FAIL. H13-020 and H13-021 passed. The dependency tree, audit, typecheck, lint, build, repository Health and active ledger checks passed. npm audit reported zero vulnerabilities. The first maintenance measurement was 16,005 gzip CSS bytes. The final CSS cleanup passed at 15,988 bytes against the existing 16,000-byte limit, with zero static cycles.

Hosted Full Health, Base44 publication, real provider callbacks and physical-device acceptance remain pending.
