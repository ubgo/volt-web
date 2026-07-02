<p align="center">
  <img src="volt/brand/png/icon-512.png" alt="Volt logo — a lightning bolt on a violet tile" width="72" height="72" />
</p>

<h1 align="center">Volt ⚡</h1>

<p align="center"><strong>The batteries-included TanStack Start starter.</strong></p>

<p align="center">A production-ready <a href="https://tanstack.com/start">TanStack Start</a> boilerplate for server-side-rendered React apps — token-driven design system, dashboard shell, dual RPC (tRPC + oRPC), Drizzle + PostgreSQL, a typed GraphQL SDK, light/dark theming, and typesafe env.</p>

<p align="center">
  <img src="https://img.shields.io/badge/TanStack-Start-7C3AED" alt="TanStack Start" />
  <img src="https://img.shields.io/badge/React-19-61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Tailwind-v4-38BDF8" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/SSR%20%2B%20SPA-ready-7C3AED" alt="SSR and SPA ready" />
  <img src="https://img.shields.io/badge/license-Commercial-7C3AED" alt="Commercial license" />
</p>

**Volt** is a batteries-included starter for quickly bootstrapping a **server-side-rendered React app** with [TanStack Start](https://tanstack.com/start). It ships with a token-driven **design system**, a **dashboard shell**, light/dark **theming**, two **RPC** layers (**tRPC** + **oRPC**), a typed **GraphQL** SDK (**gqlkit**), a **Drizzle + PostgreSQL** database, **typesafe env**, and a full gallery of demo pages — so you delete the demos and start building your actual app in minutes, not plumbing.

> Volt is the web half of a full-stack family — pair it with **Volt API** (the Go backend starter) for an end-to-end stack.

> **Setting up or running Volt?** The full documentation — prerequisites, install, the portless HTTPS dev workflow, project structure, data & APIs, and deployment — lives in **[volt/docs/](volt/docs/README.md)** (start at [Getting started](volt/docs/getting-started.md)).

> Everything Volt-specific (this pitch, the setup guide, brand kit, and docs) lives in the [`volt/`](volt/) folder. Building your own app? Replace this `README.md` and `LICENSE`, then keep or delete `volt/` as you like.

## Contents

- [Why Volt?](#why-volt)
- [What's inside](#whats-inside)
- [Features](#features)
- [Screenshots](#screenshots)
- [Getting started](#getting-started)
- [FAQ](#faq)
- [License](#license)

## Why Volt?

Most starters give you a framework and a blank page. The hard part — wiring a design system, data layer, RPC, auth-ready shell, theming, and typesafe env so they actually agree with each other — is left to you, and it's a week of plumbing before you write a single feature.

**Volt is that week, already done.** Every layer is wired end-to-end and consistent, so day one is feature work.

- **Token-driven design system** — control density (height, padding, font) and the full color palette are CSS variables in one file. Change one token and the whole UI rescales; flip a class and the whole app re-themes. No component-by-component restyling.
- **Two RPC layers, side by side** — the same CRUD implemented in both **tRPC v11** and **oRPC**, plus a typed **GraphQL** SDK via gqlkit. Keep the one you like, delete the rest.
- **A real dashboard shell** — fixed sidebar, `PageHeader`, `Surface`, `StatusBadge`, user menu, and a FOUC-safe theme toggle. Not a hello-world layout.
- **34 UI components** from [basecn](https://basecn.dev) (Base UI), tuned to a compact, consistent density — not stock shadcn spacing.
- **Typesafe everything** — routes, RPC, forms, env, and per-route document titles are compile-checked.
- **Demo isolation** — the entire showcase is quarantined under `/demo`, so removing it leaves a clean foundation.

**Who it's for:** solo developers shipping a SaaS or side project who want a full stack ready on day one, and teams that want one opinionated, consistent React foundation across projects.

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
| GraphQL | [gqlkit](https://github.com/ubgo/gqlkit) — typed SDK generated from your schema (no graphql-codegen) |
| Database | Drizzle ORM + PostgreSQL |
| UI kit | Base UI (`@base-ui/react`) via [basecn](https://basecn.dev) — 34 components |
| Styling | Tailwind CSS v4 (config-in-CSS) + design tokens |
| Theming | Light / Dark / System with a switcher, FOUC-safe |
| Monitoring | Sentry (client + server) |
| Tooling | Vite 8, TypeScript 6, Biome (lint + format), Vitest |
| Env | Typesafe env via `@t3-oss/env-core` |

## Features

- **Token-driven design system** — control density (height, padding, font) and the full color palette are CSS custom properties in one file (`src/styles.css`). Change one token and the whole UI rescales; flip a class and the whole app re-themes.
- **34 UI components** from basecn (checkbox, radio, tabs, accordion, dialog, sheet, command palette, tooltip, hover-card, combobox, calendar, and more) — all styled to a compact, consistent density.
- **Dashboard shell** — a fixed sidebar layout (`AdminShell`) with `PageHeader`, `Surface`, `StatusBadge`, a user menu, and the theme toggle.
- **Two RPC layers side by side** — the same todo CRUD implemented in both tRPC and oRPC so you can pick your favorite.
- **Server functions, streaming, and every SSR mode** — full SSR, SPA mode, and data-only rendering demonstrated.
- **Typesafe everything** — routes, RPC, forms, env, and per-route document titles are all compile-checked.
- **Demo isolation** — the entire showcase is quarantined so your real app starts clean.

## Screenshots

<p align="center">
  <img src="volt/screenshots/dashboard.png" alt="Volt dashboard shell" width="49%" />
  <img src="volt/screenshots/components.png" alt="Volt component gallery" width="49%" />
</p>
<p align="center">
  <img src="volt/screenshots/server-table.png" alt="Volt server data table" width="49%" />
  <img src="volt/screenshots/form-field-showcase.png" alt="Volt form field showcase" width="49%" />
</p>

More in [volt/docs/README.md](volt/docs/README.md) — the dashboard, basecn component gallery, `ServerDataTable`, and form field showcase (light + dark).

## Getting started

```bash
pnpm install
cp .env.example .env      # set DATABASE_URL (+ INTERNAL_KEY)
task db:push             # push the Drizzle schema
task dev:guard           # ★ https://volt.localhost  (or: pnpm dev → http://localhost:3000)
```

That's the short path. For the full setup — **prerequisites** (Node, pnpm, Postgres, Task, portless, gqlkit), the **portless HTTPS dev workflow**, **project structure**, **data & APIs**, how to **start your real app**, and **deployment** — see **[volt/docs/](volt/docs/README.md)**, starting with [Getting started](volt/docs/getting-started.md).

## FAQ

**Is Volt open source?**
No. Volt is a commercial product — purchasing a license grants you access to the repository, and you can use it in your own personal and commercial applications. See [License](#license). It is not redistributable as a starter/boilerplate itself.

**What is TanStack Start?**
[TanStack Start](https://tanstack.com/start) is a full-stack React framework built on TanStack Router and Vite, with SSR, streaming, server functions, and SPA mode. Volt is a production-ready wiring of it.

**Do I have to use both tRPC and oRPC?**
No. They're included side by side so you can compare them. Pick the one you prefer and delete the other — the same CRUD is implemented in both.

**Can I use it without GraphQL?**
Yes. The gqlkit GraphQL SDK is optional — if you don't need GraphQL, ignore or remove `src/generated/sdk` and `src/lib/gql-clients.ts`. tRPC/oRPC cover typed RPC on their own.

**Does it need a database to run?**
The demos use Drizzle + PostgreSQL. Set `DATABASE_URL` and run `task db:push`. If your app doesn't need a database, remove the `src/integrations/drizzle` module.

**How do I change the theme or colors?**
Everything is tokens in `src/styles.css` — edit the `oklch` color variables and the control-density variables. Both light and dark are defined there; the theme toggle is FOUC-safe.

**How do I remove all the demo/example code?**
Delete `src/routes/demo/` and `src/demo/`, then replace the `/` redirect in `src/routes/index.tsx`. The demo is fully quarantined, so nothing else depends on it.

**How do I rebrand it as my own app?**
Drop a square logo at `public/logo-source.png`, run `task branding:gen`, and update `public/manifest.json` + `SITE_NAME` in `src/lib/seo.ts`. The in-app `/demo/branding` page walks through every asset.

## License

Volt is a **commercial product** distributed under a proprietary license — see [LICENSE](LICENSE). A purchase grants a license to use Volt as the foundation of your own applications; it does not permit redistributing or reselling Volt itself (or a derivative starter) as a product. This is not open-source software.

<sub>Volt — a commercial TanStack Start boilerplate / React SSR starter kit: token-driven design system, dashboard shell, tRPC + oRPC, typed GraphQL (gqlkit), Drizzle + PostgreSQL, Tailwind CSS v4, light/dark theming, typesafe env. Built with <a href="https://tanstack.com/start">TanStack Start</a>.</sub>
