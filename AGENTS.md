# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Working Branch

All development must use the existing `GizemTest` branch. Do not create a replacement branch. Before work, fetch `main` and `GizemTest`, inspect local changes and ancestry, and safely integrate any missing `main` commits while staying on `GizemTest`; preserve all branch history and uncommitted work. Never develop on, commit/push to, or merge into `main`, and never force-push. Complete the authorized implementation, applicable checks and documentation before committing and delivering to `origin/GizemTest`; verify fetched local/remote equality and a clean tree. Publication and live data operations require their own user authorization. See the 074 delivery contract in `docs/shinka/reports/SHINKA_ONBOARDING_TERMS_074.md` for the current legal-admission release prerequisites.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.
