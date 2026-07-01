# TanStack Start Boilerplate

A batteries-included starter for quickly bootstrapping a **server-side-rendered React app** with [TanStack Start](https://tanstack.com/start). It ships with a token-driven design system, a dashboard shell, light/dark theming, two RPC layers, a database, typesafe env, and a full gallery of demo pages — so you can delete the demos and start building your actual app in minutes.

> Everything demo/showcase-related lives under `/demo` (routes) and `src/demo/` (helpers). Delete those two, swap the `/` redirect, and you have a clean, opinionated foundation.

---

## What's inside

| Area | Choice |
|---|---|
| Framework | TanStack Start (React 19, SSR **and** SPA mode) |
| Routing | TanStack Router — file-based, fully typesafe |
| Data fetching | TanStack Query v5 |
| Forms | TanStack Form + Zod v4 validation |
| Tables | TanStack Table **and** a bespoke `ServerDataTable` (filters, sort, cursor pagination, saved views, URL state) |
| Client state | TanStack Store |
| RPC | tRPC v11 **and** oRPC — both wired end-to-end |
| Database | Drizzle ORM + PostgreSQL |
| UI kit | Base UI (`@base-ui/react`) via [basecn](https://basecn.dev) — 34 components |
| Styling | Tailwind CSS v4 (config-in-CSS) + design tokens |
| Theming | Light / Dark / System with a switcher, FOUC-safe |
| Monitoring | Sentry (client + server) |
| Tooling | Vite 8, TypeScript 6, Biome (lint + format), Vitest |
| Env | Typesafe env via `@t3-oss/env-core` |

---

## Features

- **Token-driven design system** — control density (height, padding, font) and the full color palette are CSS custom properties in one file (`src/styles.css`). Change one token and the whole UI rescales; flip a class and the whole app re-themes.
- **34 UI components** from basecn (checkbox, radio, tabs, accordion, dialog, sheet, command palette, tooltip, hover-card, combobox, calendar, and more) — all styled to a compact, consistent density.
- **Dashboard shell** — a fixed sidebar layout (`AdminShell`) with `PageHeader`, `Surface`, `StatusBadge`, a user menu, and the theme toggle.
- **Two RPC layers side by side** — the same todo CRUD implemented in both tRPC and oRPC so you can pick your favorite.
- **Server functions, streaming, and every SSR mode** — full SSR, SPA mode, and data-only rendering demonstrated.
- **Typesafe everything** — routes, RPC, forms, env, and per-route document titles are all compile-checked.
- **Demo isolation** — the entire showcase is quarantined so your real app starts clean.

---

## Quick start

**Prerequisites:** Node 20+, [pnpm](https://pnpm.io), and a PostgreSQL database. [Task](https://taskfile.dev) is recommended for the shortcut commands but optional.

```bash
# 1. Install
pnpm install

# 2. Configure env (copy the example and fill in values, incl. DATABASE_URL)
cp .env.example .env

# 3. Push the schema to your database
task db:push        # or: pnpm drizzle-kit push

# 4. Run the dev server
pnpm dev            # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the demo dashboard.

---

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

---

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
├── integrations/           # drizzle · trpc · orpc · tanstack-query · sentry · graphql-codegen
├── lib/                    # utils, theme, seo, and reusable helpers
├── env/                    # Typesafe client + server env
└── styles.css              # Tailwind v4 + design tokens (colors, density, dark mode)
```

---

## Design system

The look is driven entirely by tokens in `src/styles.css`:

- **Color tokens** (`--background`, `--foreground`, `--primary`, `--border`, …) in `oklch`, with a full parallel `.dark` set. Every component reads these, so dark mode "just works."
- **Control-density tokens** (`--control-height`, `--control-padding-x`, `--control-font-size`, `--row-padding-y`, …) drive the size of every input, select, button, and table row. Tune one value to rescale the entire UI's compactness.

Components come from **basecn** (the Base UI port of shadcn). To add more:

```bash
pnpm dlx shadcn@latest add https://basecn.dev/r/<component>.json
```

Browse the whole kit at **`/demo/components`** in the running app.

---

## Starting your real app

The demo is deliberately isolated so removing it is trivial:

1. Delete `src/routes/demo/` and `src/demo/`.
2. Replace the redirect in `src/routes/index.tsx` with your own landing route.
3. Edit `NAV_SECTIONS` in `src/components/admin-shell.tsx` for your app's navigation.

What remains — the UI kit, dashboard shell, theming, RPC/DB integrations, and env setup — is your foundation.

---

## Deployment

`pnpm build` produces a Nitro server bundle in `.output/`. Run it with `pnpm start`, or deploy to any Node host / platform that supports Nitro (Vercel, Netlify, Node servers, etc.). Set your production environment variables (`DATABASE_URL`, `VITE_SENTRY_DSN`, …) on the platform.

---

Built with [TanStack Start](https://tanstack.com/start).
