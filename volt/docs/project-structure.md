# Project structure

A map of the Volt codebase so you know where everything lives before you start building. Almost all of your work happens under `src/`; the `volt/` folder is a self-contained reference layer you can keep or delete.

## The `src/` tree

```
src/
├── routes/                     # File-based routes (TanStack Router)
│   ├── __root.tsx              # Document shell: <head>, providers, theme init
│   ├── index.tsx               # / → redirects to /demo
│   ├── api.*.ts                # Server routes (health, version, /api/i/bootinfo, …)
│   ├── api.trpc.$.tsx          # tRPC handler
│   ├── api.orpc.$.tsx          # oRPC handler
│   ├── mcp.ts                  # MCP server endpoint
│   └── demo/                   # All demo/showcase pages — quarantined, deletable
├── components/
│   ├── ui/                     # The design system (basecn / Base UI components)
│   │   └── server-data-table/  # ServerDataTable: server-paginated/sorted/filtered table
│   ├── admin-shell.tsx         # Dashboard layout: sidebar, PageHeader, Surface, NAV_SECTIONS
│   └── theme-toggle.tsx        # Light/dark switch
├── demo/                       # Demo-only helpers (form kit, mock data) — deletable
│   ├── data/                   # Fake data + store demos
│   └── form/                   # The form kit used by the form demos
├── integrations/               # Self-contained, pluggable modules
│   ├── drizzle/                # Drizzle ORM: client, schema, config, env, migrations, Taskfile
│   ├── trpc/                   # tRPC: init, procedures, routers, react client
│   ├── orpc/                   # oRPC: init, procedures, routers, react client
│   ├── tanstack-query/         # Query client + provider + devtools
│   └── sentry/                 # Sentry client + server instrumentation + env
├── generated/
│   └── sdk/                    # gqlkit typed GraphQL SDK — generated, do NOT edit by hand
├── lib/                        # Cross-cutting helpers
│   ├── utils.ts                # cn() and friends
│   ├── theme.ts                # Theme init / persistence
│   ├── seo.ts                  # seo() helper + SITE_NAME for per-route <head>
│   ├── gql-clients.ts          # GraphQL client wiring (uses gqlkit SDK)
│   ├── gql-hooks.ts            # React Query hooks over the GraphQL SDK
│   ├── client-datatable.ts     # Client-side table helpers
│   └── middleware.ts           # Server middleware
├── env/
│   ├── client.ts               # Typesafe client env (VITE_* vars)
│   └── server.ts               # Typesafe server env (merges integration envs)
└── styles.css                  # Tailwind v4 + design tokens (colors, control density, dark mode)
```

## What lives where

### `routes/` — pages and server endpoints

File-based routing via TanStack Router. `__root.tsx` is the document shell that sets up the `<head>`, the providers (TanStack Query, theme), and wraps every page. `index.tsx` at the root just redirects `/` to `/demo`. Files named `api.*.ts` are server routes (health check, version, the internal `bootinfo` endpoint), and the RPC handlers (`api.trpc.$.tsx`, `api.orpc.$.tsx`) plus the MCP endpoint (`mcp.ts`) live here too. To learn the routing conventions and how to add a page, see [building-a-page.md](building-a-page.md).

### `components/ui/` — the design system

The component kit, ported from shadcn onto Base UI via **basecn** (accordion, button, dialog, select, table, and ~30 more). The standout is **`server-data-table/`** — `ServerDataTable`, a batteries-included table with server-side pagination, sorting, filtering, column visibility, and saved views. Add more components with `pnpm dlx shadcn@latest add https://basecn.dev/r/<name>.json`. See [design-system.md](design-system.md).

### `components/admin-shell.tsx` — the dashboard shell

The layout that wraps dashboard pages: the sidebar, the `PageHeader`, and the `Surface` container. Navigation is driven by the `NAV_SECTIONS` array in this file — edit it to change the sidebar. This is one of the files you'll customize first when making the app your own.

### `integrations/` — pluggable modules

Each subfolder is a self-contained module you can understand (or remove) in isolation:

| Module | What it provides |
|---|---|
| `drizzle/` | Drizzle ORM + PostgreSQL: client, schema, config, its own env (`drizzleEnv`), migrations, and a Taskfile. See [data/database.md](data/database.md). |
| `trpc/` | tRPC server + client: `init`, `procedures`, `routers`, and the React client. See [data/rpc.md](data/rpc.md). |
| `orpc/` | oRPC server + client, mirroring the tRPC layout. See [data/rpc.md](data/rpc.md). |
| `tanstack-query/` | The Query client, root provider, and devtools wiring. |
| `sentry/` | Sentry client + server instrumentation and its env. See [monitoring.md](monitoring.md). |

### `generated/sdk/` — the GraphQL SDK

The typed GraphQL SDK produced by **gqlkit** from a schema. It's checked in and read-only — never edit it by hand; regenerate with `task gqlkit:all`. See [data/graphql.md](data/graphql.md).

### `lib/` — cross-cutting helpers

Small, importable utilities: `utils.ts` (the `cn` class helper), `theme.ts`, `seo.ts` (typesafe per-route titles via the route `head` option), the GraphQL client wiring (`gql-clients.ts`, `gql-hooks.ts`), and server `middleware.ts`.

### `env/` — typesafe environment

`server.ts` and `client.ts` expose validated env objects. Always import from these — never read `process.env` directly, which bypasses validation and loses types. Integration envs (like Drizzle's) are merged into the central server env. Details in [configuration.md](configuration.md).

### `styles.css` — tokens and theming

Tailwind v4 plus the design tokens that drive the whole UI: color tokens in `oklch` (with a parallel `.dark` set) and control-density tokens (`--control-height`, `--row-padding-y`, …). Change a token here and the entire UI rescales or recolors. See [design-system.md](design-system.md).

## Demo isolation

The demos are deliberately quarantined so you can delete them cleanly. Everything demo-related lives in exactly two places:

- `src/routes/demo/` — every demo page (the dashboard, component gallery, tables, forms, RPC/SSR showcases).
- `src/demo/` — demo-only helpers (the form kit and mock data those pages use).

Nothing outside those two folders imports from them, except the `/` redirect in `src/routes/index.tsx` and the `NAV_SECTIONS` links in `src/components/admin-shell.tsx`. Delete both folders, update those two references, and the demos are gone with nothing left dangling. The step-by-step is in [making-it-yours.md](making-it-yours.md).

## The `volt/` layer

`volt/` is the Volt-specific layer, updated and versioned as one unit and separate from your app code:

- `volt/CONTRIBUTING.md` — the durable setup + dev-workflow reference.
- `volt/README.md` — the product overview.
- `volt/docs/` — these framework docs.
- `volt/rules/` — the engineering standards ([../rules/code-standards.md](../rules/code-standards.md), [../rules/frontend.md](../rules/frontend.md)).
- `volt/brand/` — the brand kit (logo, tokens, generators).

Your own project rules go in `.claude/rules/` (Volt never writes there). When you no longer need the reference, you can delete the whole `volt/` folder — see [making-it-yours.md](making-it-yours.md).

## Next / Related

[getting-started.md](getting-started.md) · [making-it-yours.md](making-it-yours.md) · [design-system.md](design-system.md) · [building-a-page.md](building-a-page.md) · docs home: [README.md](README.md)
