# Development guide

How to set up, run, and work in the Volt codebase. This is the durable technical reference — the [README](README.md) is the product landing page and will typically be replaced by your own app's README once you start building, so **keep this file** for setup and workflow notes.

> Volt is a commercial product, not an open-source project — this guide is for licensed users developing on top of Volt, not a public-contribution workflow. For support or licensing questions see [SUPPORT.md](SUPPORT.md).

## Contents

- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Local development (portless)](#local-development-portless)
- [Scripts & tasks](#scripts--tasks)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [Starting your real app](#starting-your-real-app)
- [Deployment](#deployment)
- [Further docs](#further-docs)

## Prerequisites

Install these before you start. Only the first three are strictly required; **Task** and **portless** make day-to-day dev much nicer, and **gqlkit** is only needed if you regenerate the GraphQL SDK.

| Tool | Why you need it | Install |
|---|---|---|
| **Node.js 20+** | Runtime (Volt is built on TanStack Start / Vite). | [nodejs.org](https://nodejs.org) — or `nvm install 20` |
| **pnpm** | Package manager (version is pinned via `packageManager`). | `corepack enable` (ships with Node), or [pnpm.io/installation](https://pnpm.io/installation) |
| **PostgreSQL** | Database for the Drizzle demos. | [postgresql.org/download](https://www.postgresql.org/download/), Postgres.app, or `docker run -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres` |
| **Task** | Runs the shortcut commands in `Taskfile.yml` (`task dev:guard`, `task db:push`, …). | [taskfile.dev/installation](https://taskfile.dev/installation/) — e.g. `brew install go-task` |
| **portless** _(recommended)_ | Serves the app at a **stable HTTPS URL** (`https://app.localhost`) instead of a random `http://localhost:PORT`. | `npm install -g portless` — [github.com/vercel-labs/portless](https://github.com/vercel-labs/portless) |
| **gqlkit** _(optional)_ | Regenerates the typed GraphQL SDK from a schema (`task gqlkit:all`). Not needed to run the app — the SDK is checked in. | [github.com/khanakia/gqlkit](https://github.com/khanakia/gqlkit) — see [docs/GQLKIT.md](docs/GQLKIT.md) |

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure env — copy the example and fill in values
cp .env.example .env
#    Required:  DATABASE_URL (your Postgres connection string)
#    Recommended: INTERNAL_KEY (any random string, protects /api/i/*)
#    Optional:  VITE_SENTRY_DSN, gqlkit VITE_GRAPHQL_URL

# 3. Push the schema to your database
task db:push          # or: pnpm drizzle-kit push

# 4. Run the dev server — pick one:
task dev:guard        # ★ recommended → https://app.localhost  (needs portless — see below)
pnpm dev              # simplest, zero extra tools → http://localhost:3000
```

Open the URL your chosen command prints — **[https://app.localhost](https://app.localhost)** with `task dev:guard`, or [http://localhost:3000](http://localhost:3000) with `pnpm dev` — and you'll land on the demo dashboard.

## Local development (portless)

Volt supports two ways to run the dev server:

| Command | URL | Notes |
|---|---|---|
| `pnpm dev` | `http://localhost:3000` | Simple, no extra tools. Fixed port `3000`. |
| `task dev:guard` | `https://app.localhost` | **Recommended.** Stable HTTPS URL via [portless](https://github.com/vercel-labs/portless), auto-restarts on crashes. |

**Why portless?** It gives your dev server a fixed, memorable HTTPS URL (`https://app.localhost`) instead of a random port — no port conflicts, no cookie/storage clashes, and real HTTPS locally (needed for secure cookies, service workers, etc.). It runs a small proxy on port 443 and injects the actual port into Vite for you.

### One-time setup

```bash
npm install -g portless    # if not already installed
task portless:trust        # install portless' local CA into your system trust store (needs sudo)
```

`portless:trust` is what makes `https://app.localhost` load with **no browser warning** — it adds a locally-generated certificate authority to your trust store. You only do this once per machine.

### Every day

```bash
task portless:up           # start the HTTPS proxy daemon on :443 (once per boot; auto-elevates with sudo)
task dev:guard             # start Volt at https://app.localhost, auto-restarting on crashes
```

Then open **[https://app.localhost](https://app.localhost)**. Press **Ctrl-C** to stop `dev:guard`.

`dev:guard` is a supervisor (`dev-guard.sh`): if a bad edit crashes the dev server — an undefined import, a syntax error, an SSR blowup — it restarts automatically (with exponential backoff), so you and your AI agent can keep working without babysitting the terminal. If you don't want auto-restart, use `task dev:portless` instead.

### Changing the dev URL

The URL comes from **`portless.json`** at the repo root:

```json
{ "name": "app", "script": "dev:vite" }
```

The `name` field is the subdomain: `name: "app"` → `https://app.localhost`. To change it (e.g. to `https://volt.localhost`), edit `name` to `"volt"` and restart the dev server. Print the current URL any time with `task portless:url`.

> If your app reads its own URL from env, also update `VITE_APP_URL` in `.env` to `https://app.localhost` (it defaults to `http://localhost:3000` for the `pnpm dev` path).

### portless helper tasks

| Task | Command | What it does |
|---|---|---|
| `task portless:trust` | `portless trust` | Install the local CA (one-time, sudo). |
| `task portless:up` | `portless proxy start` | Start the HTTPS proxy daemon (port 443). |
| `task portless:down` | `portless proxy stop` | Stop the proxy daemon. |
| `task portless:url` | `portless get app` | Print this app's dev URL. |
| `task portless:list` | `portless list` | Show all active portless routes. |
| `task portless:prune` | `portless prune` | Kill orphaned dev servers from crashed sessions. |
| `task portless:clean` | `portless clean` | Full reset — remove portless state, CA, and hosts entries. |

## Scripts & tasks

Common package scripts:

```bash
pnpm dev            # dev server (port 3000, with Sentry instrumentation)
pnpm build          # production build
pnpm start          # run the production build
pnpm test           # Vitest
pnpm check          # Biome lint + format check
pnpm exec tsc --noEmit   # typecheck
```

Reusable commands live in the [Taskfile](https://taskfile.dev) (`task --list` to see them all):

```bash
task dev            # dev server, logs → tmp/dev.log
task typecheck      # tsc --noEmit
task check          # biome check
task build          # production build
task db:push        # push Drizzle schema
task db:generate    # generate a migration
task db:migrate     # run migrations
task db:studio      # open Drizzle Studio
```

## Project structure

```
src/
├── routes/                 # File-based routes (TanStack Router)
│   ├── __root.tsx          # Document shell, head, providers, theme init
│   ├── index.tsx           # / → redirects to /demo
│   └── demo/               # 🎯 All demo/showcase pages (delete for a real app)
├── components/
│   ├── ui/                 # The design system — 34 basecn components + ServerDataTable
│   ├── admin-shell.tsx     # Dashboard layout (sidebar, PageHeader, Surface…)
│   └── theme-toggle.tsx
├── demo/                   # 🎯 Demo-only helpers (form kit, mock data) — delete for a real app
├── integrations/           # drizzle · trpc · orpc · tanstack-query · sentry
├── generated/sdk/          # gqlkit typed GraphQL SDK (generated — `task gqlkit:all`)
├── lib/                    # utils, theme, seo, gql-clients, and reusable helpers
├── env/                    # Typesafe client + server env
└── styles.css              # Tailwind v4 + design tokens (colors, density, dark mode)
```

## Design system

The look is driven entirely by tokens in `src/styles.css`:

- **Color tokens** (`--background`, `--foreground`, `--primary`, `--border`, …) in `oklch`, with a full parallel `.dark` set. Every component reads these, so dark mode "just works."
- **Control-density tokens** (`--control-height`, `--control-padding-x`, `--control-font-size`, `--row-padding-y`, …) drive the size of every input, select, button, and table row. Tune one value to rescale the entire UI's compactness.

Components come from **basecn** (the Base UI port of shadcn). To add more:

```bash
pnpm dlx shadcn@latest add https://basecn.dev/r/<component>.json
```

Browse the whole kit at **`/demo/components`** in the running app. The full brand identity (logo, favicon, OG image, tokens) lives in [`brand/`](brand/) and regenerates from `brand/brand.json`.

## Starting your real app

The demo is deliberately isolated so removing it is trivial:

1. Delete `src/routes/demo/` and `src/demo/`.
2. Replace the redirect in `src/routes/index.tsx` with your own landing route.
3. Edit `NAV_SECTIONS` in `src/components/admin-shell.tsx` for your app's navigation.
4. **Rebrand** — drop your square logo at `public/logo-source.png`, run `task branding:gen`, update `public/manifest.json` + `SITE_NAME` in `src/lib/seo.ts`. The **`/demo/branding`** page documents every icon and where it's wired.
5. **Make the repo yours.** Replace the root `README.md` and `LICENSE` with your own, and update `package.json` `name`. Everything Volt-specific lives in the **`volt/`** folder (this guide, the product overview `volt/README.md`, the brand kit, and the docs) — keep it as a reference, or delete the whole folder once you don't need it. Want your own contributing/security docs at the repo root? Add them there; Volt's copies stay in `volt/`.

What remains — the UI kit, dashboard shell, theming, RPC/DB/GraphQL integrations, and env setup — is your foundation.

## Deployment

`pnpm build` produces a Nitro server bundle in `.output/`. Run it with `pnpm start`, or deploy to any Node host / platform that supports Nitro (Vercel, Netlify, Node servers, etc.). Set your production environment variables (`DATABASE_URL`, `VITE_SENTRY_DSN`, …) on the platform.

See [docs/DEPLOYMENT_PLAN.md](docs/DEPLOYMENT_PLAN.md) for the full container / CI/CD deployment plan.

## Further docs

Deeper, per-module guides live in [`docs/`](docs/):

- [docs/DRIZZLE.md](docs/DRIZZLE.md) — the Drizzle ORM module (schema, migrations, env).
- [docs/GQLKIT.md](docs/GQLKIT.md) — the typed GraphQL SDK (generation, clients, scalar bindings).
- [docs/SENTRY.md](docs/SENTRY.md) — Sentry client + server instrumentation.
- [docs/SHADCN.md](docs/SHADCN.md) — adding/using basecn (Base UI) components.
- [docs/SPA_MODE.md](docs/SPA_MODE.md) — SSR vs SPA mode notes.
- [docs/DEPLOYMENT_PLAN.md](docs/DEPLOYMENT_PLAN.md) — container + CI/CD deployment.
