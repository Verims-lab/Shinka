# Base44 Project

Use this repository to run and edit the app locally, then publish changes back through Base44.

Any change pushed to the repo will also be reflected in the Base44 Builder.

## Current Test data authority (Buildmarker-015)

All product data and application-admin roles now use PostgreSQL through the existing Base44 functions. Base44 login/OAuth/User IDs stay unchanged; no Supabase Auth or legacy product fallback exists. Missing SQL Test configuration fails closed. Do not publish this branch to a shared Production backend.

Local real-database regression: `SHINKA_PG_BIN=/absolute/postgresql/bin npm run test:postgres`. It owns a disposable loopback cluster and synthetic identities. Hosted Supabase Free Frankfurt setup and acceptance are pending account access. Follow [015 Test setup and Production proposal](docs/shinka/reports/SHINKA_POSTGRESQL_TEST_015.md) for migration, restricted runtime role, explicit admin bootstrap and verification. Existing Base44 setup commands below still describe the host tooling; old package persistence notes are historical.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.
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
- **`base44 dev` runs the frontend for you** (via `site.serveCommand` in this repo's `base44/config.jsonc`) — never run `npm run dev` yourself: alone it serves a UI with no backend behind it (`[base44] Proxy not enabled`, every `/api` call fails), and alongside `base44 dev` the second Vite silently takes the next port and you end up looking at the wrong one.
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

The CLI executes the same `src/foundation/tests` definitions as Health Center in a temporary local Chromium or WebKit harness. It renders real pages for DOM probes and substitutes only backend access with synthetic fixtures; it never contacts live Base44. Any failed test, Health evidence check or browser exception returns a non-zero exit code. Node must permit a loopback listener and the selected browser execution. Standard Playwright browser-cache configuration is supported.

`security:deps` uses npm's native High threshold, including development dependencies: Critical/High or registry errors fail non-zero; remaining Moderate/Low findings still print. Run it for every package. Use `npm ci` for reproducible validation; do not edit the lockfile manually.

CSS is compiled by `@tailwindcss/vite` (Tailwind 4), with `src/index.css` as entry and `src/styles/theme.css` as native theme. There is no separate PostCSS/Tailwind JavaScript config. The same plugin runs in the CLI harness. Optional `FOUNDATION_VISUAL_DIR=/absolute/output/path npm run test:foundation` records Health, Build and login screenshots/layout measurements at 360px and 1280px using synthetic data. The runner emulates OS dark preference to verify the light-only target; it blocks external requests, including hosted fonts, so device font loading still needs live verification.

Current Foundation status and exact remaining advisories are in `docs/shinka/SHINKA_SECURITY_PRIVACY.md` and `SHINKA_RELEASE_HEALTH_CHECK.md`. A successful local run does not certify deployed authentication, server enforcement or history readback.

Data/security foundation: `health:repo` verifies the 20 physical product schemas against canonical field contracts and independent source field receipts, the complete access matrix, direct SDK deny rules and docs/marker/ledger alignment. `domainAccess` exposes guarded reads only; generic product mutation workflows remain inactive. The specific onboarding route uses a production Base44 SDK adapter with keyed upsert, owner-scoped conditional updates and verified readback. Profile/preferences use the approved birth-date-only Sun resolver; valid explicit consent enables cycle persistence with health-consent-v1.0. This adapter has no native multi-record transaction or rollback guarantee. The four approved Sun/TR/consent/durable-route decisions are integrated; a real owner daily message is the final completion marker, and Skip may resume safely before it exists. Native timestamps and deployed RLS require separate Base44 verification. No product data is seeded by these commands. The same canonical test command now includes auth/onboarding/UI regressions and requires every current onboarding Health case to PASS; ON-06/Home and the pure daily engine are implemented in package 011, while production new daily writes are blocked until durable cross-instance persistence is verified. Existing valid daily rows can be displayed. See the 011 handoff for controlled admin import and unresolved decisions.

Active Internal Build history is generated, latest five unique packages including current. Add/update a complete ledger entry with `node scripts/recordBuild.mjs /absolute/package.json`; the command retains the bounded source and rewrites BUILD_HISTORY. See DEVELOPMENT_RULES for required fields and policy. It does not delete Health/audit/user data or rewrite Git.

`FOUNDATION_BROWSER=webkit FOUNDATION_MOBILE_DIR=/tmp/shinka-mobile npm run test:foundation` adds mobile viewport screenshots to the same canonical checks. These are desktop engine/touch emulations, not physical iOS/Android proof. `measureMaintenance.mjs` builds the production graph and a separate real-App lab with stubbed SDK, measures three cold loads per route, enforces byte budgets, and checks lazy-chunk failure/reload retry. Output must be outside the checkout. See [mobile compatibility](docs/shinka/reports/SHINKA_ANDROID_IOS_COMPATIBILITY.md) and [maintenance findings](docs/shinka/SHINKA_DEVELOPMENT_NOTES.md).

First Shinka source preparation (read-only workbooks): `node scripts/prepareFirstContent.mjs /absolute/source-directory`. The generated backend manifest is never imported by normal frontend code. Controlled live admin import instructions and production blockers: [011 handoff](docs/shinka/reports/SHINKA_FIRST_SHINKA_011.md). `FOUNDATION_DAILY_DIR=/tmp/shinka-daily npm run test:foundation` adds ON-06/Home TR/EN mobile/desktop captures using an isolated transport.
