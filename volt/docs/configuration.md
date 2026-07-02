# Configuration (typesafe env)

Volt validates every environment variable at startup and gives you a typed object to read them from. You never touch `process.env` in app code — you import a validated `env` and get autocomplete, types, and a loud error on boot if something's missing or malformed.

## How it works

Env validation is built on [`@t3-oss/env-core`](https://env.t3.gg/) + [Zod](https://zod.dev/). The central definition lives in `src/env/server.ts`. It declares a Zod schema for each server variable, maps them to `process.env` in `runtimeEnv`, and throws on startup if validation fails:

```ts
// src/env/server.ts (shape)
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    INTERNAL_KEY: z.string().optional(),
    // build info, injected via Docker build args (optional in dev):
    VITE_APP_VERSION: z.string().default("dev"),
    // …
  },
  extends: [sentryEnv /*, drizzleEnv */],
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    INTERNAL_KEY: process.env.INTERNAL_KEY,
    // …
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
```

Then anywhere in your server code:

```ts
import { env } from "@/env/server"

if (env.NODE_ENV === "production") { /* … */ }
```

Two behaviors worth knowing: `emptyStringAsUndefined` treats a blank `FOO=` as unset (so `.optional()` and defaults kick in), and `skipValidation` lets CI/Docker builds skip the check by setting `SKIP_ENV_VALIDATION=1` when the real values aren't present yet.

## Integration envs merge in

Each self-contained integration can own its variables instead of dumping them into the central schema. The integration declares its own `createEnv()` and the central env pulls it in through the `extends` option.

Drizzle is the model here — and it doubles as the on/off switch for an **optional** integration. `src/integrations/drizzle/env.ts` validates `DATABASE_URL` in isolation and exports `drizzleEnv`; `src/env/server.ts` can merge it via `extends: [drizzleEnv]` so `env.DATABASE_URL` becomes fully typed on the central object. **By default that line is commented out on purpose:** Drizzle is optional, so an app with no database (an SPA, or one that only calls an external API) isn't forced to define `DATABASE_URL`. The drizzle client reads `drizzleEnv.DATABASE_URL` directly regardless — so uncomment the `drizzleEnv` import + `extends` entry only when you use Drizzle and want it validated on the central `env` too. Sentry follows the same `extends` pattern via `sentryEnv`, which is active by default. See [data/database.md](data/database.md) for the drizzle side.

## The variables

These are the variables Volt reads. Copy `.env.example` to `.env` (and/or `.env.local`) and fill them in. Client-visible variables must be prefixed `VITE_`.

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `NODE_ENV` | central `env` | no (defaults `development`) | Runtime environment. |
| `PORT` | dev server | no (defaults `3000`) | Port for `pnpm dev`. |
| `DATABASE_URL` | `drizzleEnv` | yes (for DB) | PostgreSQL connection string. |
| `INTERNAL_KEY` | central `env` | no | Secret guarding internal endpoints (`/api/i/*`). |
| `VITE_APP_URL` | client | no | App's public base URL (see the dev-URL note below). |
| `VITE_SENTRY_DSN` | `sentryEnv` | no | Sentry DSN; blank disables Sentry. |
| `VITE_SENTRY_ORG` | `sentryEnv` | no | Sentry org slug (sourcemap upload). |
| `VITE_SENTRY_PROJECT` | `sentryEnv` | no | Sentry project slug. |
| `SENTRY_AUTH_TOKEN` | build | no | Token for uploading sourcemaps in CI. |
| `VITE_GRAPHQL_URL` | gqlkit runtime | no | GraphQL endpoint for the typed SDK clients. |
| `VITE_INTERNAL_KEY` | gqlkit runtime | no | Optional dev-only `X-Internal-Key` header. |
| `VITE_API_URL` | gqlkit codegen | no | Base URL for schema introspection (`task gqlkit:fetch`). |
| `GQL_PKEY` | gqlkit codegen | no | Playground key for the introspection endpoint. |

The gqlkit variables only matter if you keep the [GraphQL SDK](data/graphql.md). The Sentry variables are covered in the monitoring guide.

Note that `VITE_APP_VERSION`, `VITE_APP_COMMIT`, `VITE_APP_BRANCH`, and `VITE_APP_BUILD_TIME` are build-info values injected as Docker build args; they default to safe placeholders in dev, so you don't set them locally.

## Adding a new variable

Two steps, and TypeScript enforces the rest:

1. Declare it in the schema in `src/env/server.ts` — add it to both the `server` block (with a Zod type) and the `runtimeEnv` map (pointing at `process.env.YOUR_VAR`). Add it to `.env.example` too so the next person knows it exists.
2. Use it through the typed object: `import { env } from "@/env/server"` and read `env.YOUR_VAR`.

For a variable that belongs to a specific integration, prefer giving that integration its own `env.ts` and merging it with `extends: [...]` — that keeps the module self-contained and removable.

## Never read `process.env` directly

This is a hard rule in Volt: **always go through the typed env object** (`env` from `@/env/server`, or an integration env like `drizzleEnv`). Raw `process.env` access skips validation, loses type safety, and hides missing-variable failures until they blow up at runtime. If you find yourself reaching for `process.env.SOMETHING`, add `SOMETHING` to the schema instead. This is enforced in [../rules/code-standards.md](../rules/code-standards.md).

## The dev-URL note

There are two ways to run the dev server, and they imply different values for `VITE_APP_URL`:

- Plain `pnpm dev` serves the app at `http://localhost:3000` — set `VITE_APP_URL=http://localhost:3000`.
- `task dev:guard` runs it through portless at a stable HTTPS URL like `https://volt.localhost` (derived from `portless.json`).

If a feature depends on the app's own origin, make sure `VITE_APP_URL` matches whichever mode you're running. The full explanation is in [getting-started.md](getting-started.md).

## Next / Related

- [getting-started.md](getting-started.md) — setup and the two dev-server modes.
- [data/database.md](data/database.md) — `drizzleEnv` and the `DATABASE_URL` merge.
- [data/graphql.md](data/graphql.md) — the gqlkit env vars.
- [../rules/code-standards.md](../rules/code-standards.md) — the engineering bar, including the no-`process.env` rule.
