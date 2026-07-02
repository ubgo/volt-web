# Rendering modes

Volt is server-rendered by default, but you control exactly how much runs on the server — per route, or for the whole app. This guide covers the three rendering modes (full SSR, data-only SSR, and client-only / SPA), how to choose between them, how to configure each, and where to see them running live.

## The default: full SSR

Out of the box, Volt renders every route on the server on each request. This is [TanStack Start](https://tanstack.com/start) running on a [Nitro](https://nitro.build) server — wired up by the `nitro()` and `tanstackStart()` plugins in `vite.config.ts`. You get fast first paint, real HTML for crawlers and link unfurls, and server-side data loading in route `loader`s.

You don't have to do anything to get SSR — it's how a fresh route behaves. A route with no `ssr` option is fully server-rendered:

```tsx
// Full SSR (the default): loader runs on the server, HTML is rendered on the server.
export const Route = createFileRoute('/demo/start/ssr/full-ssr')({
  component: RouteComponent,
  loader: async () => await getPunkSongs(),
})
```

Live demo: `/demo/start/ssr/full-ssr` — the whole list is present in the server HTML.

## Choosing a mode

Set the mode per route with the `ssr` option, or ship the whole app as a static SPA. Use this to decide:

| Mode | `ssr` option | Server renders | Best for |
|------|--------------|----------------|----------|
| Full SSR (default) | omit (or `true`) | HTML + loader data | Public pages, SEO, fastest first paint |
| Data-only SSR | `ssr: 'data-only'` | loader data only | Data on the server, but interactive/client-heavy UI |
| Client-only (SPA route) | `ssr: false` | nothing for this route | Dashboards behind auth, browser-only widgets |
| Static SPA export | `spa: { enabled: true }` (global) | shell only, at build time | Static hosts / CDNs, no running server |

Rule of thumb: keep public, content-heavy, or SEO-sensitive routes on full SSR; drop to `data-only` when the component needs the browser but the data is cheap to fetch server-side; use `ssr: false` for routes where server HTML adds nothing (private app screens); reach for the static SPA export only when you want to deploy without a Node server at all.

## Data-only SSR

With `ssr: 'data-only'`, the route `loader` still runs on the server (so data is fetched close to the source and streamed to the client), but the component renders on the client. This is a good middle ground when the UI depends on browser APIs but you still want server-fetched data.

```tsx
// Data-only: loader runs on the server; the component renders on the client.
export const Route = createFileRoute('/demo/start/ssr/data-only')({
  ssr: 'data-only',
  component: RouteComponent,
  loader: async () => await getPunkSongs(),
})
```

Live demo: `/demo/start/ssr/data-only`.

## Client-only routes (`ssr: false`)

Set `ssr: false` on a single route to skip server rendering for it entirely — no server HTML, and `beforeLoad` / `loader` run in the browser. The rest of the app keeps its server rendering. This is the per-route escape hatch for screens that only make sense in the browser.

```tsx
// Client-only: nothing is server-rendered for this route.
export const Route = createFileRoute('/demo/start/ssr/spa-mode')({
  ssr: false,
  component: RouteComponent,
})
```

Live demo: `/demo/start/ssr/spa-mode` — view source and you'll see the route content isn't in the initial HTML.

You can also flip the default for the whole router by passing `defaultSsr: false` to `createRouter` in `src/router.tsx` — every route becomes client-only unless it opts back in. This still needs a running server (server functions remain available); it just stops rendering route HTML.

## Static SPA export

Volt ships with static SPA export enabled in `vite.config.ts` — the `tanstackStart()` plugin has `spa: { enabled: true }`. In this mode only `__root.tsx` is server-rendered, once, into a shell HTML file; every child route renders in the browser. The result is a fully static bundle you can drop on any CDN with no Node server.

### 1. Confirm SPA mode is enabled

```ts
// vite.config.ts
tanstackStart({
  spa: {
    enabled: true,
  },
}),
```

### 2. Build

```bash
pnpm build
```

This writes `_shell.html` and all static assets into `.output/public/`.

### 3. Preview locally

```bash
pnpx http-server-spa .output/public _shell.html 3000
```

Or via the Taskfile, if a `preview:spa` task is present:

```bash
task preview:spa
```

This serves `.output/public/` with `_shell.html` as the SPA fallback. The port defaults to `3000` (override with the `PORT` env var).

### 4. Deploy the static bundle

Deploy the contents of `.output/public/` to any static host or CDN. Every non-asset request must be rewritten to `/_shell.html` so client-side routing works:

| Host | Config |
|------|--------|
| Nginx | `try_files $uri $uri/ /_shell.html` |
| Netlify | `/* /_shell.html 200` in `_redirects` |
| Cloudflare Pages | `/* /_shell.html 200` in `_redirects` |
| Vercel | `"rewrites": [{ "source": "/(.*)", "destination": "/_shell.html" }]` in `vercel.json` |

### Configuration options

```ts
tanstackStart({
  spa: {
    enabled: true,           // default: true when a spa object is provided
    maskPath: '/',           // URL path used to generate the shell (default: '/')
    prerender: {
      outputPath: '/_shell', // output path for the shell HTML (default: '/_shell')
    },
  },
}),
```

### How the shell is built

1. During build, TanStack Start prerenders a shell page by fetching `maskPath` (`/`) with a `TSS_SHELL: 'true'` header.
2. Only `__root.tsx` is server-rendered — all child routes are skipped.
3. The shell HTML holds the layout, `<head>` tags, and the `<script>` tags that bootstrap the client app.
4. At runtime, the client-side router takes over and renders routes in the browser.
5. Dev mode respects SPA mode too (`vite dev` sets `TSS_SHELL=true`).

### Caveats for a static deploy

- **Server functions** (`createServerFn()`) still require a running server. For a fully static deploy, avoid them or host them separately.
- **`beforeLoad` / `loader`** run client-side only — no server data fetching.

## See it running

The four SSR demos live under `src/routes/demo/start/`:

- `/demo/start/ssr` — overview and links to each mode.
- `/demo/start/ssr/full-ssr` — full server rendering (`ssr` omitted).
- `/demo/start/ssr/data-only` — `ssr: 'data-only'`.
- `/demo/start/ssr/spa-mode` — `ssr: false`.

## Next / Related

- [Deployment](deployment.md) — building and running the Nitro server bundle in production.
- [Monitoring](monitoring.md) — Sentry across the client and server.
- [Docs home](README.md) · [Contributing / dev workflow](../CONTRIBUTING.md)
