# Getting started

Everything you need to get Volt running locally: what to install, how to configure your environment, how to set up the database, and the two ways to run the dev server. Follow it top to bottom and you'll land on the demo dashboard in a few minutes.

## Prerequisites

Install these before you start. **Node** and **pnpm** are required. **PostgreSQL** is only needed if you use the built-in database (Drizzle) — an SPA, or an app that talks only to an external API, can skip it entirely (see [Building without a database](#building-without-a-database)). **Task** and **portless** make day-to-day development much nicer (and every command in these docs assumes Task), and **gqlkit** is only needed if you regenerate the typed GraphQL SDK.

| Tool | Required? | Why you need it | Install |
|---|---|---|---|
| **Node.js 20+** | Required | Runtime — Volt is built on TanStack Start / Vite. | [nodejs.org](https://nodejs.org), or `nvm install 20` |
| **pnpm** | Required | Package manager (the exact version is pinned via `packageManager` in `package.json`). | `corepack enable` (ships with Node), or [pnpm.io/installation](https://pnpm.io/installation) |
| **PostgreSQL** | Optional | Only if you use the built-in Drizzle database (powers the DB demos). Skip it for an SPA or an API-only app. | [postgresql.org/download](https://www.postgresql.org/download/), Postgres.app, or `docker run -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres` |
| **Task** | Recommended | Runs the shortcut commands in `Taskfile.yml` (`task dev:guard`, `task db:push`, …) that these docs use throughout. | [taskfile.dev/installation](https://taskfile.dev/installation/) — e.g. `brew install go-task` |
| **portless** | Recommended | Serves the app at a stable HTTPS URL (`https://volt.localhost`) instead of a random `http://localhost:PORT`. | `npm install -g portless` — [github.com/vercel-labs/portless](https://github.com/vercel-labs/portless) |
| **gqlkit** | Optional | Regenerates the typed GraphQL SDK from a schema (`task gqlkit:all`). Not needed to run the app — the SDK is checked in. | [github.com/khanakia/gqlkit](https://github.com/khanakia/gqlkit) — see [data/graphql.md](data/graphql.md) |

## 1. Install dependencies

```bash
pnpm install
```

Then enable the **secret-scanning pre-commit hook** for this clone (recommended — it stops you from committing API keys, tokens, or private keys by mistake):

```bash
task hooks:install
```

This points git at `.githooks/` and installs [gitleaks](https://github.com/gitleaks/gitleaks) if it's missing. It's a one-time step per clone (git hook config isn't shared through the repo). See [Secret scanning](#secret-scanning) below for details.

## 2. Configure your environment

Copy the example env file and fill in your values. Volt validates env at startup through typesafe env objects, so missing or malformed required values fail fast with a clear error.

```bash
cp .env.example .env
```

At minimum, set these two:

| Variable | What to set it to |
|---|---|
| `DATABASE_URL` | Your Postgres connection string, e.g. `postgresql://user:password@localhost:5432/mydb`. |
| `INTERNAL_KEY` | Any random string. It protects the internal endpoints under `/api/i/*`. |

The rest are optional for a first run: `VITE_SENTRY_DSN` (see [monitoring.md](monitoring.md)) and the gqlkit variables like `VITE_GRAPHQL_URL` (see [data/graphql.md](data/graphql.md)). For the full list and how env is wired, see [configuration.md](configuration.md).

## 3. Set up the database

> Using an SPA or an external API only? Skip this step — see [Building without a database](#building-without-a-database).

Push the Drizzle schema to the database named in your `DATABASE_URL`:

```bash
task db:push
```

This creates the tables directly (no migration files) — ideal for local development. For generating and running versioned migrations instead, see [data/database.md](data/database.md).

### Building without a database

Drizzle is an **optional** integration. If your app has no database, don't set `DATABASE_URL` and skip `task db:push` — the app still builds and runs (the central env in `src/env/server.ts` deliberately leaves `drizzleEnv` out of its `extends`, so nothing forces `DATABASE_URL`). To remove Drizzle entirely, follow the removal steps in [data/database.md](data/database.md). Pair this with [SPA mode](rendering.md) for a fully client-only build.

## 4. Run the dev server

Pick one of two paths.

### Recommended: portless at `https://volt.localhost`

This gives you a stable HTTPS URL with a trusted certificate — no random ports, no browser warnings, and real HTTPS locally (which secure cookies and service workers need).

One-time setup per machine:

```bash
npm install -g portless    # if you haven't already
task portless:trust        # install portless' local CA into your system trust store (needs sudo)
```

Then, day to day:

```bash
task portless:up           # start the HTTPS proxy daemon on :443 (once per boot; auto-elevates with sudo)
task dev:guard             # start Volt at https://volt.localhost, auto-restarting on crash
```

Open **https://volt.localhost** and press **Ctrl-C** to stop `dev:guard`.

`dev:guard` is a supervisor: if a bad edit crashes the dev server (an undefined import, a syntax error, an SSR blowup), it restarts automatically with backoff, so you and your AI agent can keep working without babysitting the terminal. If you don't want auto-restart, use `task dev:portless` instead. The full portless workflow, changing the dev URL, and the helper tasks are covered in [configuration.md](configuration.md).

Handy portless tasks:

| Task | What it does |
|---|---|
| `task portless:up` | Start the HTTPS proxy daemon (port 443). |
| `task portless:down` | Stop the proxy daemon. |
| `task portless:url` | Print this app's dev URL. |
| `task portless:list` | Show all active portless routes. |
| `task portless:prune` | Kill orphaned dev servers from crashed sessions. |

### Simple: `pnpm dev` at `http://localhost:3000`

No extra tools, fixed port:

```bash
pnpm dev
```

Open **http://localhost:3000**. This is the quickest way to a running app; you can adopt portless later.

## You're in

Either URL lands you on the **demo dashboard** at `/demo` — the `/` route redirects there. From the sidebar you can browse the component gallery, the `ServerDataTable`, the form showcase, and the RPC/SSR demos. When you're ready to strip the demos and build your own app, see [making-it-yours.md](making-it-yours.md).

## Secret scanning

Volt ships a **two-layer pre-commit secret scanner** so an API key, token, or private key never lands in a commit by accident. Enable it once per clone with `task hooks:install`.

- **Layer 1 — [gitleaks](https://github.com/gitleaks/gitleaks):** 200+ maintained detectors + entropy, run against the staged diff via the repo's `.gitleaks.toml`.
- **Layer 2 — regex fallback:** a project-tuned pattern list in `.githooks/pre-commit` that runs even if gitleaks isn't installed.

If a commit is blocked, move the value to `.env` (gitignored) and read it through the [typesafe env](configuration.md) — never `process.env` directly. For a genuine false positive, add the placeholder shape to `.gitleaks.toml` `[allowlist]` **and** `ALLOW_RE` in `.githooks/pre-commit` (keep both in sync). Bypass only with care: `git commit --no-verify`.

Manual scans: `task secrets:scan` (full history) and `task secrets:scan:staged` (staged diff only). The full guide — CI backstop, allowlisting, adding detectors — is in [secret-scanning.md](secret-scanning.md).

## Next / Related

[configuration.md](configuration.md) · [project-structure.md](project-structure.md) · [making-it-yours.md](making-it-yours.md) · docs home: [README.md](README.md)
