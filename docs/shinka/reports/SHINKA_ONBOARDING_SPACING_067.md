# 067 — First onboarding spacing

Buildmarker-067 / HC-066.0. Before editing, clean `AydanTest` fast-forwarded from `5276d0d` to `e35d112`. Both commits have the same tree.

ON-01 omits the page counter. The safe content height above the 52px CTA defines 100 units. The heading moves down up to 10 units from its 066 logo-relative anchor. The heading-to-paragraph gap is 2.5 units. Both gaps between rows and the gap before Begin increase from 8px to 12px.

The 320×568 baseline had 24.9px of free space above the bottom safe padding. Applying the full heading shift with the requested gaps would need 62.5px. The flexible heading offset takes the available 9.2px after the new gaps and keeps Begin visible. At 320×640 the full 54px offset fits.

H13-012 maps the updated browser geometry checks and U18 verifies the TR/EN counter contract across all five steps. H05-009 recognizes 067 under the existing content-verification policy. The Health catalog has 185 cases.

## Local portrait measurements

Chromium with the app fonts and WebKit with fallback fonts measured the same heading offset and gap sizes. Both locales opened with the CTA visible and no document scroll at these sizes.

| Viewport | Heading offset from 066 | Heading-to-paragraph gap | Row and CTA gaps |
| --- | ---: | ---: | ---: |
| 320×568 | 9.2px | 11.7px | 12px |
| 320×640 | 54px | 13.5px | 12px |
| 360×640 | 54px | 13.5px | 12px |
| 390×844 | 74.4px | 18.6px | 12px |
| 430×932 | 83.2px | 20.8px | 12px |

The before-and-after comparison confirmed the same logo position, dimensions and original-color paint. The boxes kept their measured heights across the TR/EN viewport matrix.

## Verification

- Chromium 156.0.8078.4 and WebKit 27.2 passed 8 presentation scenarios and 120 onboarding layer checks each with zero page errors. The matrix included 24 ON-01 cases per engine, text at 100% and 200%, a 47px top / 34px bottom simulated safe area, portrait and landscape. U18 covers the localized counter on later steps.
- The dependency tree, npm audit, typecheck, lint, build, 19 repository Health checks and the generated five-package ledger passed. The audit found zero vulnerabilities. The production PNG matched the source SHA-256.
- The maintenance gate passed on nine routes with zero cycles. Initial JavaScript measured 491,600 raw / 164,145 gzip bytes and CSS measured 83,112 raw / 15,987 gzip bytes.
- Full Chromium Foundation passed 803/803 assertions with zero page errors. The shared backdrop passed 67/67. The synthetic app Health run returned 146 PASS, 13 hosted-prerequisite BLOCKED and 0 FAIL. Report save retry, history listing and report open passed.
- The full WebKit run recorded 802/803 base assertions. U12 timed out waiting for the combobox fixture. The run then stopped at the ON-04 outer focus outline assertion. The same two failures reproduced on the `e35d112` baseline. On the candidate, a separate rerun passed all eight correction scenarios and U12. The full WebKit suite remains open.

The browser and Health results use a local synthetic SDK. Hosted Full Health and physical-device acceptance remain pending.
