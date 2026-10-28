# 050 — Base44 mobile follow-up

Buildmarker-050 / HC-049.0. Focused verification and fixes, not a general audit. Clean Test `41820e0` matched origin/Test; main `f5856bc` was two commits ahead, including the owner merge of 049 and Base44's preference-sheet change. Test was fast-forwarded without conflict. No user/Base44 work was discarded.

## Proven defects and scope of change

1. **Preference sheet keyboard:** the original `role=radio` buttons had no arrow navigation/roving Tab stop. The real-App Chromium baseline failed on ArrowDown (focus remained `tr` instead of `en`). The sheet now maintains its own temporary choice, implements Arrow/Home/End and one radio Tab stop. Enter/Space or click transfers the choice to the parent draft and closes. Cancel, Escape and browser Back discard only sheet navigation; other profile/preference drafts remain.
2. **WebKit focus return:** the first full WebKit run failed because pointer activation did not focus the trigger; the shared modal captured the body as its return target. PreferencePicker now focuses its own trigger before opening. The shared modal/history implementation is unchanged; no native `backbutton` listener or invented wrapper bridge was added.
3. **Calendar feedback:** CU08 failed before the fix because selecting a date had no explicit unsaved status. Central TR/EN draft and pending live status now accompany the existing selected ring/input; the form exposes busy state. The live region is outside the busy form so announcements need not be deferred. No additional date parsing, optimistic record, success-before-readback, rollback, new retry ID or persistence algorithm is introduced. CU08 runs actual native helpers with a lost response after persistence, then confirms the same action and a single record.

The existing dirty notice needed no product-code change. Initial load, Cancel/Escape/Back, reverted selection, confirmed save and reopening are checked for false notice. Pending/unknown/conflict keep confirmed values distinct from the draft. Existing `checkAppTheme` covers before-write failure, after-write lost response, check/same-intent retry and late old-account response; new sheet tests add open-layer account change and unrelated profile draft preservation. Copy stays in the existing centralized catalogs.

## Preserved behavior

- Default/unverified/onboarding stays light; only verified account preference applies dark. No OS/System/Auto mode. Light palette and section images unchanged.
- Existing ProductTabs scroll, Calendar month and selected draft survive switching to Pattern and back. Pending mutations remain pending across tab switches; recovery doesn't create an extra record. Browser Back closes a layer before route navigation. Existing architecture remains.
- Simulated top/left/right/bottom insets and 200% text test the actual sheet CSS: one bottom owner, no duplicate shell bottom padding, reachable cancel, bounded scroll and ≥44px controls. Actual OS/keyboard/notch insets remain physical acceptance.
- 049 session deadlines, Home recovery, safe diagnostics and migration integration are unchanged. The four optional legacy daily fields and cleanup-pending state remain. **No live DB cleanup was attempted in 050**. The previous cleanup result remains 0 inspected / 0 cleaned / remaining unknown / full verify NOT_RUN in the separate 049 task.
- No backend behavior, notification activation, provider/workflow setup, hosted Full Health, Security scan, main merge or publish. Dependency audit is the required local quality gate, not a hosted Security scan.

[Preserved-source hashes](mobile-050/preserved-sources.json) cover the unchanged controllers, modal/history, theme/assets and 049 code. [Initial failures](mobile-050/before-fix.json) preserve Base44's original browser NOT_RUN and the later regression/fixture failures separately.

## Execution and Health

Final receipts are recorded in [verification](mobile-050/verification.json), with separate Chromium/WebKit, quality and performance files. Local browser tests use the actual App/router/components and only substitute SDK transport with isolated fixtures; external requests, including CDN fonts/images, are blocked. They do not prove a hosted user mutation, platform transaction or native device result.

Final execution on 2026-10-28: **Chromium 156.0.8078.4 and WebKit 27.2 each passed 735/735 canonical tests with zero page errors**. Each engine also passed 25 preference-sheet checks (TR/EN × 320/360/390px × 100/200% text × two sheets, plus the state/reopen/account scenario) and two TR/EN Calendar continuity scenarios. Existing manual-theme, unknown-save/check/retry, account isolation and 049 startup regressions passed. Screenshot evidence is in [Chromium](mobile-050/chromium) and [WebKit](mobile-050/webkit).

Local in-app Health: **140 PASS / 13 BLOCKED / 0 FAIL**, with save, retry-save, listing and private report opening verified against synthetic transport. The 13 unavailable hosted prerequisites remain H04-019, H05-001–009, H08-005, H09-004 and H12-031; this is not a new hosted Full Health run.

Required local gates passed: clean install, dependency tree, dependency audit (zero vulnerabilities), typecheck, lint, production build, repository Health and generated history. Performance passed with initial JS 474,918 raw / 157,884 gzip bytes and CSS 78,659 raw / 14,465 gzip bytes, within unchanged limits; zero import cycles and successful synthetic lazy-asset retry. Existing lazy-chunk/dynamic-import and npm configuration advisories remain warnings. Final evidence/ledger prose was completed after browser execution; repository and generated-history consistency were checked again without repeating unchanged behavioral tests.

Reproduce the full browser runs locally with `FOUNDATION_BROWSER=chromium npm run test:foundation` and `FOUNDATION_BROWSER=webkit npm run test:foundation`. `FOUNDATION_PREFERENCES_DIR` optionally captures sheet screenshots. For the new focused paths, add `FOUNDATION_PREFERENCES_ONLY=1` or `FOUNDATION_CALENDAR_CONTINUITY_ONLY=1`; the default full run includes both. Performance uses `node scripts/measureMaintenance.mjs /private/tmp/shinka-050-performance`.

Health **0 added / 4 updated / 0 removed**: H13-018 (sheet and preference state), H13-015 (CU08 and Calendar continuity), H13-012 (mobile/layout/focus/retention), H05-009 (unchanged exact source readiness policy for 050). Inventory stays 179: 153 in-app, 12 local, 14 external. No fixed-PASS case or weakened assertion. Active Internal Build history is generated by recordBuild, retaining 046–050.

Base44's prior typecheck/lint/build PASS and browser NOT_RUN remain historical; this delivery records its own new runs, not retroactive success for that attempt.

## Remaining device/platform acceptance

Physical Android/iOS: hardware/gesture Back order, real keyboard and viewport resizing, notch/home-indicator/browser-bar insets, OS date/time controls, VoiceOver/TalkBack announcements and focus, and the actual Base44 store wrapper. H13-013/H14-901/H16-901 remain external; synthetic/browser checks do not close them. Existing native notification/workflow acceptance is unchanged and outside this task.

Owner publication uses the usual complete Test → main → Base44 backend/shared sync → matching frontend flow. There is no new schema/import/secret step. This task does not schedule or run the separately pending DB cleanup.
