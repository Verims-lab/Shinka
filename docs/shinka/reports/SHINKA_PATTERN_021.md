# Pattern — Buildmarker-021 / HC-021.0

Status: REPOSITORY_COMPLETE; local gates passed; hosted acceptance is MANUAL_USER_VALIDATION_PENDING. Test only; no live call/mutation/import, main merge or publish.

The source request is attachment 37ea216e-3297-448f-bd6c-9d783b518ece. UC-16/17 KK-21/22/34, canonical docs and uiuxTables govern implementation. Base44 remains sole authority. The existing UserPatternSummary shape is a read-only computed projection, not a new persisted cache. No schema delta, content or category mapping change.

Themes count one Home-selected candidate per saved local day in the inclusive 30-calendar-day window, not the last 30 rows. First-day metadata adjusts the initial 1–29-day window; gaps stay gaps. Categories rank count then latest seen and use the exact approved bilingual lookup. The two sections fail/retry independently. Moon uses validated UTC phase intervals, four starts plus the final next-New boundary, proportional coordinates, local labels and Today/current phase. Opening Pattern invokes no daily generator and writes no snapshots/summary.

The generic native domainAccess summary route also uses the same calculation; owner/admin record-ID reads reject stale cache access.

Privacy: native session owner only, current User/ACTIVE/reset/deletion checks before and after reads; no health table reads, direct SDK access or persistent UI cache. History bounds/projections/sentinels reject malformed/oversized results. Ordinary reads are not transaction isolation; a newly visible earlier candidate may change the next reconciled result. Deadline/unmount drops obsolete responses without claiming cancellation of an SDK call.

Health: H10-001 activated, H12-037 and local H13-017 added; H15-004/H13 common boundaries updated. 163 registered / 139 in-app / 24 separate acceptance. No suite or failed case removed. Historical ON-05, hosted flows/Full Health history and physical-device obligations remain open. Normal Health uses isolated synthetic handlers, never live product writes.

## Verification

- Chromium 156.0.8078.4 and WebKit 27.2: **507/507 canonical regressions each**, 22 Pattern App scenarios and 87 existing mobile checks each, zero page exceptions. The final full runs include all 19 PT and five PU checks, latest cache/metadata boundaries and exact 200% sizing; earlier focused failures remain in verification.json.
- Local Health: **126 PASS / 13 BLOCKED**, 139 executable cases. H10-001/H12-037/H15-004 PASS with evaluated synthetic assertions. Unavailable hosted prerequisite cases remain BLOCKED; synthetic save/list UI evidence is not hosted report persistence.
- npm ci, direct/full tree, typecheck, lint, repository Health (17 checks), build and generated five-package history passed. security:deps passes: 0 Critical/High, two existing Moderate router findings; full npm audit exits 1 for those advisories. No dependency/lock change or forced major upgrade.
- Production initial JS **453,106 raw / 149,772 gzip** bytes, CSS **86,467 / 14,914**; within 500,000/165,000 and 90,000/16,000 budgets. No static cycle; lazy failure/reload retry passed. Laboratory route metrics are separate: Pattern cold CLS samples include 0.1484 (data-arrival reflow); field p75/INP is NOT_MEASURED and no Core Web Vitals acceptance is claimed.
- Local screenshots: [320px TR](pattern-021/pattern-tr-320.png), [WebKit 200%](pattern-021/pattern-tr-320-200percent.png). These are desktop engine emulations, not physical-device PASS.

Final measured results are recorded in [verification.json](pattern-021/verification.json), [case audit](pattern-021/case-audit.md) and [performance](pattern-021/performance.json). Browser evidence is not physical Android/iOS or hosted Base44 proof. Initial failures are retained in verification history rather than hidden.

## Owner's in-app acceptance (after normal main merge, complete backend/shared sync and frontend publish)

1. Complete existing onboarding normally, then Home → Pattern → Calendar → Pattern. Confirm all three navigation items and the current Profile/You behavior; opening Pattern must not create another daily Shinka.
2. View both cards with existing history; switch TR/EN. Same top categories/counts must keep their identity while names change. A valid empty history shows the approved empty text, never a service error disguised as empty.
3. Check five lunar nodes, Today/current phase and local dd.MM HH:mm labels on a narrow phone; compare the displayed timezone. An unavailable section shows its own Retry while the other verified section remains usable.
4. Test offline/online, a section retry, back/reopen and session change; no former user's results or old pending response should reappear. Repeat on physical Android Chrome and iOS Safari for text scaling, bars/insets and VoiceOver/TalkBack.
5. As admin, run current HC-021.0 Full Health once, then verify save → list → open. Share any actual FAIL/BLOCKED. This does not close original ON-05 or other unperformed live acceptance.
