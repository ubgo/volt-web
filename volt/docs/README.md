# Volt documentation

Everything you need to build with **Volt**, the TanStack Start boilerplate. New here? Start with [Getting started](getting-started.md), then open the guide for whatever you're building.

> These docs live in `volt/` and update as one unit. Building your own app? Keep them as a reference or delete the whole `volt/` folder — your own project docs stay separate. The product overview is [`../README.md`](../README.md); the engineering rules are in [`../rules/`](../rules/).

## Start here

- [Getting started](getting-started.md) — prerequisites, install, env, and running the dev server (portless → `https://app.localhost`).
- [Project structure](project-structure.md) — what lives where, and how the demo is isolated.
- [Configuration](configuration.md) — the typesafe env system and every `.env` variable.

## Build

- [Design system](design-system.md) — basecn (Base UI) components, design tokens, theming & dark mode.
- [Building a page](building-a-page.md) — the app shell (`AdminShell`/`PageHeader`), `ServerDataTable`, and forms.
- Data & APIs:
  - [Database — Drizzle + PostgreSQL](data/database.md)
  - [RPC — tRPC + oRPC](data/rpc.md)
  - [GraphQL — gqlkit SDK](data/graphql.md)

## Ship

- [Rendering modes](rendering.md) — SSR (default), SPA mode, and data-only.
- [Monitoring — Sentry](monitoring.md) — client + server error tracking.
- [Branding](branding.md) — swap the logo, favicon, name, and theme for your own.
- [Deployment](deployment.md) — build and deploy (Nitro output; hosts).
- [Making it yours](making-it-yours.md) — strip the demos and start your real app.

## Reference

- [Deployment plan](reference/deployment-plan.md) — the full Docker + CI/CD DevOps reference.
- [Incidents](incidents/) — postmortems for notable build/runtime issues.
- [Engineering standards](../rules/) — the standing bar: [code-standards](../rules/code-standards.md), [frontend](../rules/frontend.md), [git-commit](../rules/git-commit.md).

## Screenshots

The UI these docs describe, captured from the running demo (`https://app.localhost`).

| | |
|---|---|
| ![Volt dashboard](../screenshots/dashboard.png) | ![Component gallery](../screenshots/components.png) |
| The dashboard shell (`/demo`) | The basecn component gallery (`/demo/components`) |
| ![Server data table](../screenshots/server-table.png) | ![Form field showcase](../screenshots/form-field-showcase.png) |
| The `ServerDataTable` (`/demo/server-table`) | Every field type (`/demo/form/kitchen-sink`) |

> Regenerate anytime: start the app (`task dev:guard`) then run **`task screenshots`** (drives Chrome via CDP, captures these pages at 1440×900 into `volt/screenshots/`).
