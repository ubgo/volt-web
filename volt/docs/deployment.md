# Deployment

Volt builds to a self-contained [Nitro](https://nitro.build) server bundle that runs on any Node host — a plain VPS, a container, or a platform like Vercel or Netlify. This is the practical guide: build, run, set env vars, and pick a target. For the full container + CI/CD DevOps setup (secrets, GitHub Actions, review deploys), see [reference/deployment-plan.md](reference/deployment-plan.md).

## Build

```bash
pnpm build
```

This runs `vite build` and copies `instrument.server.mjs` into the output so Sentry can load first at boot. It produces:

- `.output/server/` — the Nitro server bundle (entry: `index.mjs`).
- `.output/public/` — static client assets (and, since SPA mode is enabled, `_shell.html`).

`VITE_`-prefixed variables are **baked into the client bundle at build time**, so they must be present when you run `pnpm build`, not just at runtime. Set `VITE_APP_URL`, and any `VITE_SENTRY_*` values, in the build environment. If build-time env validation gets in the way (for example, in a container where secrets aren't available yet), set `SKIP_ENV_VALIDATION=1` for the build step.

## Run

```bash
pnpm start
```

Under the hood this is:

```bash
node --import ./.output/server/instrument.server.mjs .output/server/index.mjs
```

The `--import` flag loads the Sentry instrumentation before app code (see [Monitoring](monitoring.md)). The server listens on `PORT` (default `3000`) and `HOST` (`0.0.0.0` in containers).

## Production environment variables

Set these in the runtime environment before `pnpm start`:

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` |
| `PORT` | Port to listen on (default `3000`) |
| `HOST` | Bind address (use `0.0.0.0` in containers) |
| `DATABASE_URL` | PostgreSQL connection string |
| `INTERNAL_KEY` | Secret for protected internal endpoints (`/api/i/*`) |
| `VITE_APP_URL` | Public URL of the app (build-time) |
| `VITE_SENTRY_ENABLED` / `VITE_SENTRY_DSN` | Enable + configure error monitoring (build-time) |

See `.env.example` for the full list, including the GraphQL SDK (`VITE_GRAPHQL_URL`) and CI/CD secrets. Never commit real secrets — provide them through your host's environment or secret store.

## Deploy targets

Any Node/Nitro-compatible host works. Pick the one that matches your infrastructure:

| Target | How |
|--------|-----|
| Node / VPS | `pnpm build` then `pnpm start` behind a reverse proxy (Nginx/Caddy). Run under a process manager (systemd, pm2). |
| Docker | Build the image from `.docker/Dockerfile.production` (multi-stage, non-root user, health check on `/api/health`). |
| Vercel / Netlify | Nitro auto-detects most platforms; point the build to `pnpm build` and let the platform serve `.output`. |
| Static SPA | Deploy only `.output/public/` to a CDN — no server. See [Rendering modes → Static SPA export](rendering.md#static-spa-export). |

The bundled `.docker/Dockerfile.production` builds in three stages (deps → build → runner), runs as a non-root `appuser`, and defines a `HEALTHCHECK` that polls `/api/health`. Use it as-is for a container deploy, or as a reference for your own image.

## Health check

The server exposes `/api/health` for load balancers and orchestrators. Point your platform's health probe there.

## Next / Related

- [reference/deployment-plan.md](reference/deployment-plan.md) — the full container + CI/CD DevOps plan (secrets, GitHub Actions, review deploys, multi-version hosting).
- [Rendering modes](rendering.md) — SSR vs. static SPA export.
- [Monitoring](monitoring.md) — Sentry in production.
- [Docs home](README.md) · [Contributing / dev workflow](../CONTRIBUTING.md)
