# Base44 Project

Use this repository to run and edit the app locally, then publish changes back through Base44.

Any change pushed to the repo will also be reflected in the Base44 Builder.

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
npx playwright install chromium # one-time browser setup per machine/CI image
npm ls --all
npm audit --json
npm run security:deps
npm run health:repo
npm run typecheck
npm run test:foundation
npm run lint
npm run build
```

The CLI executes the same `src/foundation/tests` definitions as Health Center in a temporary local Chromium harness. It renders real pages for DOM probes and substitutes only backend access with synthetic fixtures; it never contacts live Base44. Any failed test, Health evidence check or browser exception returns a non-zero exit code. Node must permit a loopback listener and Chromium execution. Standard Playwright browser-cache configuration is supported.

`security:deps` uses npm's native High threshold, including development dependencies: Critical/High or registry errors fail non-zero; remaining Moderate/Low findings still print. Run it for every package. Use `npm ci` for reproducible validation; do not edit the lockfile manually.

CSS is compiled by `@tailwindcss/vite` (Tailwind 4), with `src/index.css` as entry and `src/styles/theme.css` as native theme. There is no separate PostCSS/Tailwind JavaScript config. The same plugin runs in the CLI harness. Optional `FOUNDATION_VISUAL_DIR=/absolute/output/path npm run test:foundation` records Health, Build and login screenshots/layout measurements at 360px and 1280px using synthetic data. The runner emulates OS dark preference to verify the light-only target; it blocks external requests, including hosted fonts, so device font loading still needs live verification.

Current Foundation status and exact remaining advisories are in `docs/shinka/SHINKA_SECURITY_PRIVACY.md` and `SHINKA_RELEASE_HEALTH_CHECK.md`. A successful local run does not certify deployed authentication, server enforcement or history readback.

Data/security foundation: `health:repo` verifies the 20 physical product schemas against canonical field contracts and independent source field receipts, the complete access matrix, direct SDK deny rules and docs/marker/ledger alignment. `domainAccess` exposes guarded reads only; generic product mutation workflows remain inactive. The specific onboarding route uses a production Base44 SDK adapter with keyed upsert, owner-scoped conditional updates and verified readback. Profile/preferences persist without fabricating Sun; health/cycle writes remain blocked by the absent approved consent text/version. This adapter has no native multi-record transaction or rollback guarantee. Approved Sun/TR/consent and durable skip-resume decisions remain open. Native timestamps and deployed RLS require separate Base44 verification. No product data is seeded by these commands. The same canonical test command now includes auth/onboarding/UI regressions and reports current onboarding Health BLOCKED findings separately; the package remains OPEN.
