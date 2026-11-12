# 072 — Shared onboarding backdrop and progress row

Buildmarker-072 / HC-071.0. Clean `AydanTest` fast-forwarded from `db0bf13` to `ad34caf` before editing. The commits have the same tree.

The supplied device captures show the color wash and lower artwork anchor on ON-02. The shared fixed PNG now uses ON-01's original-color safe top-left treatment for every screen in the onboarding shell. The existing logo clearance places the localized counter and Back below the original artwork, and the form content follows in normal flow. ON-01 retains its original layout. Preparation and inactive-account screens use the artwork without a numbered progress row.

Back follows the 071 state transitions. ON-02 can return to ON-01. ON-04 can return to the unsaved name draft when reached from that draft. ON-05 can return to ON-04. Back is disabled at direct ON-03 and at saved or reset ON-04. The shared shell preserves the anonymous sign-in controls and verified session routing.

H13-012, H13-020 and H13-021 cover backdrop geometry, counter and Back placement, and sign-in controls. H05-009 retains the existing content verification policy for this package.

## Execution

- Chromium and WebKit each passed 8 presentation and 168 layer cases with zero page errors. The matrix covers ON-01 through ON-05 and preparation in TR and EN. It measures 320, 360, 390 and 430px portrait widths, landscape, desktop, 100% and 200% text, simulated insets, scrolling and reduced viewport height. At 320×568 the original logo ends at y=117.9px, the progress row starts at y=128px and Google ends at y=476px. Both languages fit the default portrait sign-in viewport.
- The auth-first suite passed 32/32 in each engine. Chromium also passed all 803 Foundation base tests, six onboarding closure scenarios and 67 shared backdrop scenarios. The wider Chromium run was stopped after an extended period without additional results. WebKit passed 802/803 base tests and stopped at the existing ON-04 field-focus check. The eight correction scenarios passed in a separate run. M09 failed in isolation with the same `loadHistory` error on both the candidate and the previous `db0bf13` AydanTest snapshot.
- Local Chromium Health reported 147 PASS, 13 prerequisite BLOCKED and 0 FAIL, including H13-020 and H13-021 PASS. The locked install, dependency tree, npm audit, typecheck, lint, build, repository Health and active ledger passed. npm audit reported zero vulnerabilities. Maintenance passed on nine routes with zero cycles and 15978 gzip CSS bytes against the 16000-byte limit.
- The bundled and production PNG share the 066 SHA-256 `fddb6423ad197f498d278013d01b6d61a02a6e966ac757c3fd3ae6a264e9ed6f`. The local sign-in capture shows the logo, progress row and form separated in the initial viewport.

Hosted Full Health, Base44 publication and physical-device acceptance remain pending.
