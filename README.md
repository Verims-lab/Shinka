# Base44 Project

Use this repository to run and edit the app locally, then publish changes back through Base44.

[045 ID content delivery and migration runbook](docs/shinka/reports/SHINKA_ID_MODEL_045.md): MessagePair current text with unchanged daily assignment IDs; the publishable optional compatibility schema is already committed in Test → complete backend/shared → frontend → reviewed cleanup → final schema only after hosted verification. No separate intermediate commit is required. No agent-run hosted migration.

Git branch, Builder sync, published frontend and backend data environment are separate. Test is not an isolated database; follow the configured owner sync/publish flow.

## Current Test theme delivery (Buildmarker-048 / HC-047.0)

Verified You light/dark preference is independent of OS; unresolved/onboarding defaults light. Health and tests follow the same contract. [048 evidence and publication steps](docs/shinka/reports/SHINKA_THEME_CLEANUP_048.md). The owner deferred live 045 cleanup after unavailable CLI authentication: keep the four optional daily fields; no final-schema cleanup is claimed. Merge/sync/publish remains owner-controlled.

## Historical Test audit closure (Buildmarker-042 / HC-041.0)

[042 verification and closed notification preparation](docs/shinka/reports/SHINKA_CORE_AUDIT_042.md) preserves Base44 Home/startup/admission work and the original 040 evidence. New written Support resolves workflow native-admin and provider acceptance semantics; entry remains disabled. No workflow creation, send, live user operation or owner publication. Use the normal full-graph GitHub sync/publish workflow; no schema/content import or workflow secret is needed.

## Historical Test deletion stabilization (Buildmarker-040)

[040 deletion fix, regression and live acceptance](docs/shinka/reports/SHINKA_TEST_DELETION_STABILIZATION_040.md) preserves 039. Durable admission, forward checkpoints and separately verified finalization keep the same operation ID. No schema/import step. Owner merges Test to main, waits for full Base44 GitHub sync and publishes matching backend/shared/frontend. Authorized existing-user cleanup remains pending source/identity verification; this delivery does not claim hosted removal.

## Historical Test quality milestone (Buildmarker-039)

[039 audit, fixes, measurements and acceptance](docs/shinka/reports/SHINKA_CORE_QUALITY_MILESTONE_039.md) preserves 036–038 and separates local verification from hosted/device evidence. Domain reads explicitly disclose truncation; You preserves uncertain preference saves; Home clears stale access state and stops after session end. Sync the full matching backend/shared graph before frontend. No schema/reference-data migration or notification activation. Owner handles main merge/publish and published Full Health; Test delivery alone does not close ON-05/First Shinka incidents.

## Historical Test Calendar/Pattern corrections (Buildmarker-038)

038 retains completed 036/037 and fixes same-ID Calendar recovery, retained/coalesced Pattern refresh, count-free themes and current phase/next Full Moon date. [Single four-item report](docs/shinka/reports/SHINKA_CALENDAR_PATTERN_038.md) separates synthetic evidence from unresolved hosted/device incidents. No schema change; owner syncs all matching native/shared backend code before frontend, then publishes and runs acceptance. Test only; 12 backend findings remain USER-DEFERRED, notification entry/scheduler remain closed.

## Historical Test onboarding closure (Buildmarker-036)

036 applies automatic locale, DOB-only NULL verification, authenticated Back and keyboard/app time selection while preserving 035. [Single six-item report](docs/shinka/reports/SHINKA_ONBOARDING_CLOSURE_036.md) separates local verification from the unresolved hosted preparation incident (log access returned 401). No live user operation, import, Health, notification or publish; owner syncs the complete backend/shared graph before frontend and runs published acceptance.

## Historical onboarding functional audit (Buildmarker-035)

035 preserves Base44 main f52b1c3 and the pinned dependency lock, verifies the five-step onboarding and new A/P birthplace search, and corrects readback, completed-owner writes, async account isolation, focus/retry and 44px controls. Current local results, original failures, Health mapping and owner-only hosted/device acceptance are in the [035 delivery report](docs/shinka/reports/SHINKA_ONBOARDING_AUDIT_035.md). No live provider/user/push action, main merge or publish is performed; notification entry and scheduler remain disabled.

034 is historical: its local 649/649 Chromium/WebKit results validated that package, and PR #36 has since been merged. They are not 035 evidence. [Retained 034 report](docs/shinka/reports/SHINKA_STABILIZATION_034.md).

## Historical scheduler authorization preparation (Buildmarker-033; superseded by 042)

The following 029–034 contract notes are historical; 042 above replaces the secret/workflow and acceptance assumptions. 033 prepared scheduler-only shared-secret comparison and a separate machine admission path. Manual admin checks stay intact; real secret registration/transport is unbound and the actual entry stays disabled. [033 implementation, evidence and owner setup](docs/shinka/reports/SHINKA_SCHEDULER_AUTHORIZATION_033.md).

032 adds the [native setup inventory and two-stage device plan](docs/shinka/reports/SHINKA_NATIVE_NOTIFICATION_READINESS_032.md), with no notification runtime behavior change. Physical acceptance remains NOT_RUN. 031 reduces redundant backend reads with fresh write/readback/send guards: [matched measurements and validation](docs/shinka/reports/SHINKA_NOTIFICATION_PERFORMANCE_031.md). The completed 029 daily engine/UI is retained. 030 adds the shared fresh native-admin guard for manual starts and a narrow adapter for the user-relayed push input schema. Workflow identity and provider response/recipient/device contracts remain unverified. Actual entry is disabled; unknown adapter output never becomes SENT. No live send or schedule is enabled. Mobile credentials alone cannot complete these contracts. See the [retained 029/030 evidence](docs/shinka/reports/SHINKA_NOTIFICATIONS_029.md). Test delivery is local implementation only; main merge/publish and controlled native acceptance remain owner-owned.

## Existing data authority (Buildmarker-023 onward)

Base44 is the single product-data, identity and admin-role authority. Browser calls Base44 backend functions; no SQL secret, service, database setup or second login is required. Home reconciles immutable daily candidates; Calendar calculates from actual dates; reset verifies each step; deletion uses a durable target lifecycle with bounded resumable cleanup.

Owner privacy is implemented at `/account-privacy` and external `/delete-account`: separate consent withdrawal and self account erasure, bounded same-request recovery, verified active-store absence and visible pending platform erasure. Add the two closed operational schemas before `accountPrivacy`, `applicationSession` and all native/shared code, then the matching frontend. [023 delivery, scope matrix and acceptance](docs/shinka/reports/SHINKA_PRIVACY_023.md). No live mutation or Full Health was run.

You/Profile and preferences are implemented at `/you`, with closed owner-only `you` backend operations. Sync the new function plus all shared native code before the matching frontend. Package 022 had no schema delta or live mutation; 023 adds two operational schemas. [You delivery and acceptance](docs/shinka/reports/SHINKA_YOU_022.md).

Pattern is now a read-only native route using assigned daily categories and verified Moon intervals. It generates no daily message and writes no summary cache. Sync the new `pattern` function with shared backend code and frontend through the normal owner publish flow. See [Pattern delivery](docs/shinka/reports/SHINKA_PATTERN_021.md).

Read [Base44 continuation and rollout](docs/shinka/SHINKA_BASE44_CONTINUATION.md) before syncing. UserCalendarAction, AdminTestOperation.step_fingerprints and applicationSession must stay aligned with all native function entries/shared code. A frontend-only sync is insufficient. Approved content and Moon references were imported and verified on the explicitly authorized existing app/prod target; this is not an isolated Test database. See the [016 hosted closure evidence and remaining acceptance](docs/shinka/reports/SHINKA_HOSTED_CLOSURE_016.md). Main merge/publish remains with the owner. Historical 014/015 reports are retained as superseded evidence.

Run `npm ci`, `npm run health:repo`, `npm run test:foundation` (also `FOUNDATION_BROWSER=webkit`), `npm run lint`, `npm run typecheck`, `npm run build`, `npm run security:deps`. Local synthetic evidence does not close hosted or physical-device acceptance.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install the locked dependencies: `npm ci`.
4. Use `npx base44@latest` or the optional globally installed Base44 CLI.
5. Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) — the local Base44 backend runs on it.

Run `base44 --help` (or see the [CLI reference](https://docs.base44.com/developers/references/cli/commands/introduction)) for the full command surface.

## Run Locally

Three commands, from the project root:

```bash
base44 login   # one-time per machine
base44 link    # one-time per clone
base44 dev     # local backend + frontend together
```

Open the frontend URL that `base44 dev` prints (typically `http://localhost:5173`).

Notes:

- **Every fresh clone needs `base44 link`.** It writes `base44/.app.jsonc` (the app-id pointer), which is deliberately gitignored. Your app id is in the Builder URL (`app.base44.com/apps/<id>/...`); `base44 link --help` shows the non-interactive flags.
- **`base44 dev` runs the frontend for you** (via `site.serveCommand` in this repo's `base44/config.jsonc`) — do not start a second Vite alongside it. `npm run dev` is frontend-only and requires the existing hosted-backend configuration; it does not start a local backend or create isolated data.
- **The app must be published at least once for the UI to load under `base44 dev`.** The frontend boots by fetching app settings from the hosted app; before the first publish that fails and every page redirects to login. The local API works regardless.
- Entities, functions, and auth run locally — entity data is **in-memory only**, wiped when `base44 dev` restarts. Everything else (Core integrations, OAuth login) is forwarded to your deployed app. Full breakdown: [Local development overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview).

## Frontend Only, Hosted Backend

To work on just the frontend against your app's live hosted backend:

```bash
base44 dev --remote
```

⚠️ In this mode writes go to your app's **production data** — plain `base44 dev` keeps everything local.

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

This repo syncs to Base44 through git, so publish from the dashboard rather than `base44 deploy` — a CLI deploy ships your local tree directly, bypassing the sync, and the deployed state silently diverges from the repo.

## Docs & Support

GitHub integration: [https://docs.base44.com/developers/app-code/local-development/github](https://docs.base44.com/developers/app-code/local-development/github)

Local development: [https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview)

Support: [https://app.base44.com/support](https://app.base44.com/support)

## Foundation regression (no Base44 deployment required)

```bash
npm ci
npx playwright install chromium webkit # one-time browser setup per machine/CI image
npm ls --all
npm audit --json
npm run security:deps
npm run health:repo
npm run typecheck
npm run test:foundation
FOUNDATION_BROWSER=webkit npm run test:foundation
node scripts/recordBuild.mjs --check
node scripts/measureMaintenance.mjs /tmp/shinka-measure
npm run lint
npm run build
```

The CLI executes the comprehensive `src/foundation/tests` definitions; Health Center runs the declared in-app subset in a temporary local Chromium or WebKit harness. It renders real pages for DOM probes and substitutes only backend access with synthetic fixtures; it never contacts live Base44. Any failed test, Health evidence check or browser exception returns a non-zero exit code. Node must permit a loopback listener and the selected browser execution. Standard Playwright browser-cache configuration is supported.

`security:deps` uses npm's native High threshold, including development dependencies: Critical/High or registry errors fail non-zero; remaining Moderate/Low findings still print. Run it for every package. Use `npm ci` for reproducible validation; do not edit the lockfile manually.

Local comparable route timing: `node scripts/measureTransitions.mjs /private/tmp/shinka-transitions` uses production assets and the real SDK with synthetic HTTP, fixed latency/CPU and blocked external traffic; no hosted requests or field INP claim.

CSS is compiled by `@tailwindcss/vite` (Tailwind 4), with `src/index.css` as entry and `src/styles/theme.css` as native theme. There is no separate PostCSS/Tailwind JavaScript config. The same plugin runs in the CLI harness. Optional `FOUNDATION_VISUAL_DIR=/absolute/output/path npm run test:foundation` records Health, Build and login screenshots/layout measurements at 360px and 1280px using synthetic data. The runner emulates OS dark preference to verify the unresolved light default under dark OS preference; checkAppTheme separately verifies all OS light/dark × saved app light/dark combinations and runtime OS changes; it blocks external requests, including hosted fonts, so device font loading still needs live verification.

Current Foundation status and exact remaining advisories are in `docs/shinka/SHINKA_SECURITY_PRIVACY.md` and `SHINKA_RELEASE_HEALTH_CHECK.md`. A successful local run does not certify deployed authentication, server enforcement or history readback.

Data/security foundation: `health:repo` verifies the 20 physical product schemas against canonical field contracts and independent source field receipts, the complete access matrix, direct SDK deny rules and docs/marker/ledger alignment. `domainAccess` exposes guarded reads only; generic product mutation workflows remain inactive. The specific onboarding route uses a production Base44 SDK adapter with keyed upsert, owner-scoped conditional updates and verified readback. Profile/preferences use the approved birth-date-only Sun resolver; valid explicit consent enables cycle persistence with health-consent-v1.0. This adapter has no native multi-record transaction or rollback guarantee. The four approved Sun/TR/consent/durable-route decisions are integrated; a real owner daily message is the final completion marker, and Skip may resume safely before it exists. Native timestamps and deployed RLS require separate Base44 verification. No product data is seeded by these commands. The same canonical test command now includes auth/onboarding/UI regressions and requires every current onboarding Health case to PASS; ON-06/Home and the daily engine use the current 016 native immutable-candidate contract. Approved references are now verified in the explicitly authorized shared target; existing valid daily rows are reused. See the 016 hosted closure for actual evidence, recovery limits and remaining acceptance.

Active Internal Build history is generated, latest five unique packages including current. Add/update a complete ledger entry with `node scripts/recordBuild.mjs /absolute/package.json`; the command retains the bounded source and rewrites BUILD_HISTORY. See DEVELOPMENT_RULES for required fields and policy. It does not delete Health/audit/user data or rewrite Git.

`FOUNDATION_BROWSER=webkit FOUNDATION_MOBILE_DIR=/tmp/shinka-mobile npm run test:foundation` adds mobile viewport screenshots to the same canonical checks. These are desktop engine/touch emulations, not physical iOS/Android proof. `measureMaintenance.mjs` builds the production graph and a separate real-App lab with stubbed SDK, measures three cold loads per route, enforces byte budgets, and checks lazy-chunk failure/reload retry. Output must be outside the checkout. See [mobile compatibility](docs/shinka/reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md) and [maintenance findings](docs/shinka/SHINKA_DEVELOPMENT_NOTES.md).

First Shinka source preparation (read-only workbooks): `node scripts/prepareFirstContent.mjs /absolute/source-directory`. The generated backend manifest is never imported by normal frontend code. Controlled live admin import instructions and production blockers: [011 handoff](docs/shinka/reports/SHINKA_FIRST_SHINKA_011.md). `FOUNDATION_DAILY_DIR=/tmp/shinka-daily npm run test:foundation` adds ON-06/Home TR/EN mobile/desktop captures using an isolated transport.

Package 018: no routine agent-run hosted Health. Normal Health requires no terminal or JSON import. Local browser regressions and external/device acceptance are separate from in-app results. See [018 handoff](docs/shinka/reports/SHINKA_HEALTH_USABILITY_018.md) for save and deletion outcome recovery.

Package 024 targeted Health read closure: [evidence and owner handoff](docs/shinka/reports/SHINKA_HEALTH_READ_024.md). No schema/content delta. Sync the complete backend/shared dependency graph before publishing the matching frontend; the owner runs post-publish Full Health. Narrow successful prod reads do not erase the historical HC-023 failure or prove its cause.
