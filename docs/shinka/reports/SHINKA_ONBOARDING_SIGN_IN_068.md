# 068 — Mobile Welcome sign-in visibility

Buildmarker-068 / HC-067.0. Clean `AydanTest` fast-forwarded from `7656792` to `ebfe5b5` before editing. Both commits have the same tree.

## Root cause and fix

After Begin, the real App rendered the anonymous ON-02 age declaration and both approved provider buttons. The empty 240px artwork slot and the normal stack spacing put the form below the fold. At 320×568 in Turkish, the declaration occupied y=548–596, Apple y=612–664 and Google y=680–732. The document was 780px tall.

Anonymous ON-02 now gives the form priority within the safe viewport. The empty slot flexes between 0 and 240px. Intrinsic sizing allows the full form and bottom safe padding to scroll into reach at enlarged text. The same shared PNG paints behind the screen. Verified signed-in users follow their existing onboarding or Home route. On authenticated Welcome, Continue restores the current form.

H13-012 maps first-viewport, touch target, safe padding and enlarged-text checks. H05-009 recognizes 068 under the existing content policy. The catalog has 185 cases.

## Local mobile measurements

Chromium and WebKit displayed the age declaration and both providers on first load at 320×568, 360×640, 390×844 and 430×932 in TR and EN. On the Turkish 320×568 screen, the empty slot measured 28px and the Google button ended at y=520. At 360×640 the last button ended at y=592. At 390×844 and 430×932 the full 240px slot fit.

The 47px top / 34px bottom simulated inset kept the controls inside the visible area at standard text size. At 200% text the final button remained scrollable above the bottom safe padding. Measurements used the real App and synthetic SDK.

## Verification

- The dependency tree, npm audit, typecheck, lint, build, 19 repository Health checks and the generated five-package ledger passed. npm audit found zero vulnerabilities. The production PNG matched the source SHA-256.
- The production maintenance gate passed on nine routes with zero cycles. Initial JavaScript measured 491,600 raw / 164,139 gzip bytes and CSS measured 83,134 raw / 15,989 gzip bytes.
- Chromium passed all 803 base assertions and the 120-cell onboarding layer matrix before the full run timed out waiting for the admin panel. The first isolated retry ended with an allocation error while building its fixture. A fresh admin-only run passed 17/17 with zero page errors.
- WebKit passed 794/803 base assertions. The full run ended when the browser target crashed in the ON-04 time dialog check. The nine failed base assertions were PU08, E03, U12, DU08, DU05, DU01, CQ07, RC06 and AU01. A separate WebKit run of the ON-02 geometry assertions passed all 30 cases, including two direct login cases and four simulated safe-area cases.
- The auth-first suite passed all 16 scenarios in each engine. It verified the anonymous provider controls, the synthetic callback, and existing complete, NULL-name and partial sessions without a sign-in prompt. Chromium's separate synthetic Health run gave 146 PASS, 13 hosted-prerequisite BLOCKED and 0 FAIL. Report save retry, history listing and report open passed.

Full browser suite acceptance, hosted OAuth and physical-device verification remain open.
