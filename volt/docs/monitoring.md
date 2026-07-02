# Monitoring (Sentry)

Volt ships with [Sentry](https://sentry.io) error monitoring and performance tracing wired into both the client and the server. It's a self-contained module under `src/integrations/sentry/` — off by default, opt in with two env vars, and removable without touching unrelated code.

## What's wired

Sentry runs in two places because the browser and the server are different JavaScript environments:

- **Server** — `instrument.server.mjs` (project root) calls `initSentryServer()` before any app code loads. It captures server errors, HTTP requests, and database queries, and enables session replay.
- **Client** — `src/router.tsx` calls `initSentryClient()` once the app boots in the browser (guarded by `if (!router.isServer)`). It captures client errors and navigation/performance spans.

The module owns its own environment variables. `src/integrations/sentry/env.ts` declares and validates them, and `src/env/server.ts` merges them via `extends: [sentryEnv]` so `env.VITE_SENTRY_DSN` is typed alongside the rest of your server env.

```
project root
├── instrument.server.mjs                 # server entry hook — inits Sentry before app code
└── src/
    ├── env/server.ts                     # extends: [sentryEnv]
    ├── router.tsx                         # calls initSentryClient() in the browser
    └── integrations/sentry/
        ├── index.ts                      # barrel: sentryEnv, initSentryClient, initSentryServer
        ├── env.ts                        # standalone env validation
        ├── client.ts                     # browser Sentry.init wrapper
        └── server.ts                     # server Sentry.init wrapper
```

## Enabling and disabling

Sentry is gated by a master switch, `VITE_SENTRY_ENABLED`, which defaults to `false`. Both the client and the server no-op unless it's set to the string `"true"`. When enabled, you also need `VITE_SENTRY_DSN`.

To turn Sentry on, add to your `.env` or `.env.local`:

```
VITE_SENTRY_ENABLED=true
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

Behaviour by state:

- **Disabled** (`VITE_SENTRY_ENABLED` unset or not `"true"`) — both client and server skip `Sentry.init()`. The app runs normally with no monitoring and no console noise.
- **Enabled but no DSN** — the server logs `VITE_SENTRY_DSN is not defined. Sentry is not running.`; the client silently no-ops.
- **Enabled with a DSN** — Sentry initializes on both sides and starts capturing.

To disable again, set `VITE_SENTRY_ENABLED=false` (or remove it). No code changes needed.

## Environment variables

| Variable | Required | Client | Server | Description |
|----------|----------|--------|--------|-------------|
| `VITE_SENTRY_ENABLED` | To turn it on | Yes | Yes | Master switch — must be `"true"` or Sentry stays off |
| `VITE_SENTRY_DSN` | When enabled | Yes | Yes | Sentry project DSN (a public key — safe in the browser bundle) |
| `VITE_SENTRY_ORG` | No | No | CI | Organization slug for source-map uploads |
| `VITE_SENTRY_PROJECT` | No | No | CI | Project slug for source-map uploads |
| `SENTRY_AUTH_TOKEN` | No | No | CI | Auth token for uploading source maps in CI |

`.env.example` includes `VITE_SENTRY_DSN`, `VITE_SENTRY_ORG`, `VITE_SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN`. Add `VITE_SENTRY_ENABLED=true` yourself to switch monitoring on — that's the flag the code actually checks.

### Why the `VITE_` prefix

Vite only exposes variables prefixed with `VITE_` to client-side code via `import.meta.env`. `VITE_SENTRY_DSN` needs to reach the browser bundle, and the DSN is a public key, so exposing it is safe. `SENTRY_AUTH_TOKEN` has no prefix because it's a secret used only in CI for source-map uploads.

### Why the server loads `--import` first

The `start` and `dev` scripts in `package.json` load `instrument.server.mjs` via Node's `--import` flag so Sentry patches Node internals before any application module loads:

```json
{
  "scripts": {
    "dev": "dotenv -e .env -- sh -c \"NODE_OPTIONS='--import ./instrument.server.mjs' vite dev --port 3000 --host 127.0.0.1\"",
    "start": "node --import ./.output/server/instrument.server.mjs .output/server/index.mjs"
  }
}
```

The `build` script copies `instrument.server.mjs` into `.output/server/` so the production `start` command can find it.

## Using Sentry in application code

Import directly from `@sentry/tanstackstart-react` — the integration module only handles initialization.

### Capture an error

```ts
import * as Sentry from "@sentry/tanstackstart-react";

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}
```

### Trace performance with a span

```ts
import * as Sentry from "@sentry/tanstackstart-react";

const result = await Sentry.startSpan(
  { name: "Fetch user data", op: "db.query" },
  async () => await db.select().from(users),
);
```

### Add context

```ts
import * as Sentry from "@sentry/tanstackstart-react";

Sentry.setContext("order", { orderId: "12345", amount: 99.99 });
```

### Report from a route error boundary

```tsx
import * as Sentry from "@sentry/tanstackstart-react";
import { useEffect } from "react";

export const Route = createFileRoute("/my-page")({
  component: MyPage,
  errorComponent: ({ error }) => {
    useEffect(() => {
      Sentry.captureException(error);
    }, [error]);
    return <div>Something went wrong: {error.message}</div>;
  },
});
```

### Try it live

The interactive demo at `/demo/sentry/testing` (source: `src/routes/demo/sentry.testing.tsx`) exercises client and server error capture and client and server performance tracing.

## Tuning for production

Both `client.ts` and `server.ts` default to full sampling (`tracesSampleRate: 1.0`, and the server also runs `replaysSessionSampleRate: 1.0` / `replaysOnErrorSampleRate: 1.0`). That's great for a fresh project but expensive at scale. For high-traffic production, lower the rates:

```ts
// src/integrations/sentry/server.ts
Sentry.init({
  dsn,
  sendDefaultPii: true,
  tracesSampleRate: 0.1,          // 10% of transactions
  replaysSessionSampleRate: 0.1,  // 10% of sessions
  replaysOnErrorSampleRate: 1.0,  // keep error replays at 100%
});
```

```ts
// src/integrations/sentry/client.ts
Sentry.init({
  dsn,
  tracesSampleRate: 0.1,          // 10% of transactions
  sendDefaultPii: true,
});
```

`sendDefaultPii: true` includes the user IP and request headers — review your privacy requirements before shipping.

## Removing Sentry

1. Delete the integration: `rm -r src/integrations/sentry/`.
2. In `src/env/server.ts`, remove the `sentryEnv` import and drop it from the `extends` array.
3. In `src/router.tsx`, remove the `initSentryClient` import and its call inside the `if (!router.isServer)` block.
4. Delete `instrument.server.mjs` (or remove its Sentry import if it holds other instrumentation), and drop `--import ./instrument.server.mjs` from the `dev` and `start` scripts, plus the copy step in `build`.
5. Optionally remove the demo: `rm src/routes/demo/sentry.testing.tsx` and its nav link.
6. Uninstall the SDK: `pnpm remove @sentry/tanstackstart-react`.
7. Grep for any leftover `import * as Sentry from "@sentry/tanstackstart-react"` in your own code.

## Next / Related

- [Deployment](deployment.md) — production build and running the server.
- [Rendering modes](rendering.md) — SSR, data-only, and SPA.
- [Docs home](README.md) · [Contributing / dev workflow](../CONTRIBUTING.md)
