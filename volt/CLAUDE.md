# Volt — agent & developer guide

Volt is a commercial TanStack Start boilerplate (SSR React) with a token-driven design system, a dashboard shell, dual RPC (tRPC + oRPC), Drizzle + PostgreSQL, a typed GraphQL SDK (gqlkit), light/dark theming, and typesafe env. This is the operating guide for AI agents and developers working in the codebase.

## Repository layout

- `src/` — the app. Routes are file-based (TanStack Router); `src/routes/__root.tsx` is the document shell.
- `src/routes/demo/` + `src/demo/` — the demo/showcase, fully isolated. Delete both to strip the demos.
- `src/components/ui/` — the design system (basecn / Base UI) + the bespoke `ServerDataTable`.
- `src/integrations/` — self-contained modules: drizzle · trpc · orpc · tanstack-query · sentry.
- `src/generated/sdk/` — the generated gqlkit GraphQL SDK. **Do not edit by hand.**
- `src/lib/` — utils, theme, `seo`, `gql-clients`.
- `src/styles.css` — Tailwind v4 + design tokens (colors + control density). Dark mode is the `.dark` class.
- `public/` — runtime assets (favicon, PWA icons, logo). App-facing, not the brand kit.
- `volt/` — everything Volt-specific (this guide, `README.md`, `CONTRIBUTING.md`, brand kit, docs). Deletable when you make the repo your own.

## Conventions (do / don't)

- **Never use `process.env` directly.** Use the typesafe env objects: `env` from `@/env/server`, `drizzleEnv` from `@/integrations/drizzle/env`. Raw access bypasses validation and loses type safety.
- **Never edit generated files:** `src/generated/**` and `src/routeTree.gen.ts`. Regenerate them instead.
- **Styling is token-first.** Change density/colors via the CSS variables in `src/styles.css`; don't hardcode per-component sizing. Every token has a `.dark` value, so dark mode "just works."
- **UI components** come from basecn (the Base UI port of shadcn): `pnpm dlx shadcn@latest add https://basecn.dev/r/<name>.json`.
- **Per-route document titles** are typesafe via `seo()` in `src/lib/seo.ts` + the route `head` option.

## Commands (Taskfile — run `task --list`)

- `task dev:guard` — dev server via portless at **https://app.localhost**, auto-restarts on crash (use day-to-day). Plain `pnpm dev` serves http://localhost:3000.
- `task typecheck` (tsc) · `task check` (biome) · `task build`.
- `task db:push | db:generate | db:migrate | db:studio` — Drizzle.
- `task gqlkit:all` — regenerate the GraphQL SDK · `task branding:gen` — regenerate app icons · `task screenshots` — capture demo screenshots.
- The dev URL is derived from `portless.json` (`name` → `https://<name>.localhost`).

## Git

- Conventional commits: `type(scope): description`. See `.claude/rules/git-commit.md`.
- Never include AI attribution — no "Generated with Claude Code", no "Co-Authored-By: Claude".

## Docs

- Setup + dev workflow: `volt/CONTRIBUTING.md`.
- Per-module guides: `volt/docs/` (Drizzle, gqlkit, Sentry, basecn/SHADCN, SPA mode, deployment) + `volt/docs/incidents/`.
- Brand identity (for reuse across the family, e.g. Volt API): `volt/brand/BRAND_GUIDELINES.md`.
