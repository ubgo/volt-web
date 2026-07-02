# Volt frontend standard

**Read this before ANY change to TypeScript / React / `.tsx` / styling in Volt.** This is the concrete frontend ruleset for the Volt boilerplate — the specific stack rules that sit on top of the four universal pillars in [code-standards.md](code-standards.md). On conflict, the root `CLAUDE.md` / `volt/CLAUDE.md` win, then this file, then the pillars.

Every rule here is grounded in Volt's real code. Paths like `src/lib/theme.ts` are clickable — jump to the source when in doubt. Do not invent component names, props, or classNames; copy the verbatim patterns in §29.

## 0 · The commandments

Five hard rules. Violate one and you stop and ask before continuing.

1. **GraphQL only through the gqlkit SDK + the shared clients.** Every query / mutation goes through the generated SDK in `src/generated/sdk/` (never edited by hand), executed via a client from `src/lib/gql-clients.ts` (`createAnonClient()` / `createApiClient()`). Raw template-literal `query \`{ ... }\`` + `fetch` is banned. After a backend schema change: `task gqlkit:all`. The SDK is the single source of truth for the wire contract.
2. **No `useEffect` for data fetching.** Server state is TanStack Query (`useQuery` / `useMutation`) — see `src/routes/demo/tanstack-query.tsx`. `useEffect` is for DOM side-effects + subscriptions only. Fetching in `useEffect` defeats caching, dedup, and refetch-on-focus.
3. **No native `window.alert` / `window.prompt` / `window.confirm`.** Use a styled React component every time — a `Dialog` (`src/components/ui/dialog.tsx`) with an `Input` for text capture, a destructive `Dialog` + `variant="destructive"` button for confirmation. Native dialogs can't be themed, block JS, and are dismissed by browser chrome, not the app.
4. **No raw HTML `<select>` / `<option>` in form chrome.** Use the Base UI `Select` (`src/components/ui/select.tsx`) for searchable / rich pickers, or the `NativeSelect` wrapper (`src/components/ui/native-select.tsx`) for plain "pick one of N" — it strips the OS chevron and matches `Input` height via the density tokens. A bare `<select>` renders ~h-9 with an OS chevron and breaks the compact row rhythm.
5. **No Radix. Primitives come from Base UI (basecn).** Volt is built on `@base-ui/react` wrapped shadcn-style in `src/components/ui/`. Never add `@radix-ui/*`. When someone says "shadcn" they mean basecn (Base UI + Tailwind v4). Base UI uses a `render` prop instead of Radix's `asChild` (see `DropdownMenuTrigger` in `src/components/ui/dropdown-menu.tsx`, which accepts `asChild` and forwards it to `render`).

Sixth, Volt-specific and just as hard: **never read `process.env` directly.** Use the typesafe env objects — `env` from `@/env/server`, the client env from `@/env/client`, and `drizzleEnv` from `@/integrations/drizzle/env`. New vars are declared in the `@t3-oss/env-core` + Zod schema, never accessed raw. Raw access bypasses validation and loses type safety.

## 1 · Stack

Volt ships one library per concern. If you're tempted to introduce an alternative, the answer is almost always no — extend the wrapper, don't bypass it. Versions below are from `package.json`.

| Concern | Library | Notes |
|---|---|---|
| Framework | **TanStack Start** (React 19 + Vite 8 + Nitro SSR) | File-based routing, SSR by default |
| Router | `@tanstack/react-router` | `createFileRoute()` per file under `src/routes/` |
| Server state | `@tanstack/react-query` v5 | Never `useEffect` for fetch |
| Client state | `@tanstack/react-store` / `@tanstack/store` | Global UI state only; not for server data |
| Forms | `@tanstack/react-form` | Wrapped as `useAppForm` in `src/demo/form/use-app-form.ts` |
| Tables | `@tanstack/react-table` (available) + bespoke `ServerDataTable` | Use `ServerDataTable` for list pages (§11) |
| Validation | `zod` v4 | Runtime + type extraction, at every boundary |
| GraphQL client | **gqlkit-ts** generated SDK | `src/generated/sdk/` — never edit, never bypass |
| RPC | **tRPC + oRPC** (both) | Dual RPC — see `src/integrations/trpc` and `src/integrations/orpc` |
| ORM (server only) | `drizzle-orm` + `pg` | Server-only; never imported in client code |
| UI primitives | `@base-ui/react` (basecn) | Replaces Radix; never reintroduce `@radix-ui/*` |
| Components | shadcn-style under `src/components/ui/` | Don't build custom when one exists |
| Icons | `lucide-react` ONLY | No mixing icon libraries |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | Utility classes + CSS-variable tokens; no CSS modules / styled-components |
| Toast | `sonner` | `<Toaster>` mounted once in `__root.tsx` |
| Env | `@t3-oss/env-core` + Zod | `@/env/server`, `@/env/client`, `@/integrations/drizzle/env` |
| Sentry | `@sentry/tanstackstart-react` | Boot via `instrument.server.mjs` for SSR |
| Lint + format | **Biome** | `task check` (`biome check src`) — NOT ESLint / Prettier / oxlint |
| Type | TypeScript 6, strict | `target: ES2022`, `moduleResolution: bundler`, `jsx: react-jsx` |
| Package mgr | `pnpm` | Lockfile is `pnpm-lock.yaml` |
| Build | `vite` + `nitro` | `pnpm build` / `task build` → `.output/` |
| Test | `vitest` v4 + `@testing-library/react` + `jsdom` | `*.test.ts(x)` colocated |
| Compiler | `babel-plugin-react-compiler` | Enabled — don't hand-memoize without profiling |

**Do not use:**

- `@radix-ui/*` — banned; use `@base-ui/react` via basecn, even "just for one component".
- raw `fetch()` for GraphQL — use the gqlkit SDK through `gql-clients.ts`.
- `useEffect` + `fetch()` for data — TanStack Query.
- `eslint` / `prettier` / `oxlint` / `oxfmt` — Biome (`task check`).
- CSS modules / styled-components / emotion — Tailwind utilities + tokens.
- Multiple icon libraries — Lucide only.
- `window.alert / .prompt / .confirm` — styled React `Dialog`.
- native `<select>` in form chrome — `Select` / `NativeSelect`.
- `npm` / `yarn` — pnpm.
- `process.env` — the typesafe env objects.
- magic numbers for control sizing (`h-9`, `text-[14px]`) — the density tokens (§5).

## 2 · TypeScript

### Strict, always

`tsconfig.json` invariants (verified): `strict: true`, `target: ES2022`, `jsx: react-jsx`, `moduleResolution: bundler`, path alias `@/*` → `./src/*`. Use the alias everywhere — no relative `../../../` chains.

### `type` over `interface`

Use `type` for component props, response shapes, unions, and discriminated unions. Reserve `interface` for declaration merging (rare). The existing `MyRouterContext` interface in `src/routes/__root.tsx` is the sanctioned exception (router context typing).

### No escape hatches

`any`, `as any`, `@ts-ignore`, `@ts-expect-error`, and check-dodging non-null `!` are banned (pillar §1.1). Genuinely unknown shapes use `unknown`, narrowed with a type guard or a Zod parse. The only place an untyped runtime value enters the type system is a system boundary (network response, JSON, env var) — and there it passes through a Zod schema.

### Branded types for opaque IDs

When IDs are opaque, brand them so you can't pass a task ID where a project ID is expected:

```ts
type ProjectId = string & { readonly __brand: "ProjectId" }
type TaskId = string & { readonly __brand: "TaskId" }
```

### Props patterns

Explicit props type, spread the DOM rest, expose `data-slot`. The real primitives do this — e.g. `Input` (`src/components/ui/input.tsx`) types `InputPrimitive.Props & React.RefAttributes<HTMLInputElement>` and spreads `{...props}` onto the Base UI primitive with `data-slot="input"`.

## 3 · GraphQL — gqlkit SDK only

**Where the SDK lives:** `src/generated/sdk/` — auto-generated, NEVER edited.
**Schema source:** `src/scripts/api/schema-introspected.graphql`, fetched by introspection.
**Regenerate:** `task gqlkit:all` (runs `gqlkit:fetch` then `gqlkit:gen`) after any backend schema change. See `volt/docs/GQLKIT.md`.

**Clients** (`src/lib/gql-clients.ts`) — every SDK call goes through one:

- `createAnonClient()` — no auth headers (login / register / public queries).
- `createApiClient()` — injects `Authorization` + `X-Workspace-Id` (and a dev `X-Internal-Key`) from `localStorage` at request time, via a `fetch` override. Reading tokens at request time (not module load) means tokens set after login are always picked up.

The endpoint is `import.meta.env.VITE_GRAPHQL_URL` with a dev default. Do not hardcode endpoints at call sites.

**Pattern (do):**

```tsx
import { useQuery } from "@tanstack/react-query"
import { createApiClient } from "@/lib/gql-clients"
// import the generated SDK operation from src/generated/sdk

function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => createApiClient().request(/* generated SDK document */),
  })
}
```

**Anti-pattern (don't):**

```tsx
// BANNED — inline string + raw fetch
const query = `query { projects { id name } }`
await fetch("/api/query", { method: "POST", body: JSON.stringify({ query }) })
```

### Not applicable in Volt (from the reference project)

- **`entgql.Skip(SkipMutationCreateInput, …)` audit** — that gotcha belongs to an ent/gqlgen backend. Volt's backend is not ent-based, so there's no `SkipMutations` annotation to audit. Retained here only so the class of bug ("frontend sends a key the backend silently ignores") stays on your radar for any GraphQL save-no-op.
- **gqlkit `batch()` breakage** — if you hit a broken batch builder, fall back to `Promise.all([...request(), ...request()])`. One round-trip per query, but it works.

## 4 · Components & UI

### Layer

```
@base-ui/react primitives
        ↓
src/components/ui/<thing>.tsx     (shadcn-style wrapper: data-slot, cn(...), density tokens)
        ↓
src/components/<feature>.tsx      (composed feature components, e.g. admin-shell.tsx)
        ↓
src/routes/...                    (pages assembling features)
```

### Adding a component — basecn, not raw shadcn

Volt's `ui/` components are the **basecn** port of shadcn (Base UI + Tailwind v4). Add new ones with:

```
pnpm dlx shadcn@latest add https://basecn.dev/r/<name>.json
```

See `volt/docs/SHADCN.md`. **Reuse `src/components/ui/` before building anything new** — the directory already ships accordion, alert, avatar, badge, breadcrumb, button, calendar, card, checkbox, collapsible, combobox, command, dialog, dropdown-menu, hover-card, input, label, native-select, popover, progress, radio-group, scroll-area, select, separator, sheet, skeleton, slider, switch, table, tabs, textarea, toggle, toggle-group, tooltip, and the bespoke `server-data-table/`.

### Volt's own composed components

`src/components/admin-shell.tsx` exports the shell building blocks — import these, don't re-create them:

- `AdminShell` — the sidebar + main layout (`w-[248px]` sidebar, sectioned nav, mobile top bar).
- `PageHeader` — the title row (icon · title · subtitle · secondaryActions · primaryAction · right), see §12.
- `Surface` — a rounded card (`rounded-xl border border-border bg-background shadow-sm overflow-hidden`) to wrap tables/sections.
- `Thumb` — square thumbnail with `referrerPolicy="no-referrer"` + an `ImageOff` fallback.

`StatusBadge` (tone-based status pill) lives in `src/demo/form/form-kit.tsx`, not admin-shell — import it from there.

### `data-slot`, `cn()`, `render` (not `asChild`)

- **Every wrapper exposes `data-slot="<name>"`** — don't strip it; styling and queries key off it.
- **Use `cn()` from `@/lib/utils`** (clsx + tailwind-merge) for all className composition. Never raw string concatenation — merges like `p-4` overridden by `p-6` silently lose precedence without tailwind-merge.
- **Base UI uses `render`, not `asChild`.** To render a trigger as a custom child, pass `render={<Button …/>}` (see `PopoverTrigger` usage in `form-kit.tsx`'s `DateField`, and `DialogFooter`'s `DialogPrimitive.Close render={<Button …/>}`). `DropdownMenuTrigger` accepts an `asChild` convenience prop and forwards it to `render` internally.

### File naming

- Components: PascalCase symbols; files are mostly kebab-case in Volt (`admin-shell.tsx`, `native-select.tsx`, `server-data-table/`). Match the directory you're in.
- Hooks: `use<Thing>` (`useAppForm`).
- Routes: file-based per TanStack Router (`demo/form.simple.tsx`, `demo/start.ssr.spa-mode.tsx`).
- Utilities: kebab-case (`gql-clients.ts`, `client-datatable.ts`).

### Boolean prefixes

`is*` / `has*` / `should*` — `isLoading`, `isPending`, `isSubmitting`, `hasError`. Bare booleans get confused with state objects.

### Composition over inheritance

No class components. Hooks + functional composition + children-as-function when needed. No `extends`, no HOCs unless framework-required.

## 5 · Design tokens (taste, not negotiable)

Volt's `src/styles.css` is the single source of truth. Don't override per-component — change the token.

### Fonts — SYSTEM stacks (Volt does NOT use Fraunces / Geist)

Volt intentionally ships the **native system font stack** — no bundled webfont. From `styles.css`:

```css
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
code { font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace; }
```

Body is antialiased (`-webkit-font-smoothing: antialiased`). There is no `font-display` / Fraunces serif and no Geist variable font — do not add `@fontsource` imports or a `font-display` class expecting them to exist. **Render numeric data (counts, MRR, dates, IDs) with `tabular-nums`** so columns align — the demo table and query pages already do this (`tabular-nums` on the MRR and count cells).

### Control density — the token system (memorize)

The compact feel is driven by five CSS variables in `:root` (see the "Control density" block in `styles.css`). Every input / select / default button / table row reads them, so changing one value rescales the whole UI in lockstep. Defaults are the Polaris-grade 28px control / 13px row baseline:

| Token | Value | Meaning |
|---|---|---|
| `--control-height` | `1.75rem` (28px) | input / select / button height |
| `--control-padding-x` | `0.625rem` (10px) | horizontal field padding |
| `--control-font-size` | `0.75rem` (12px) | field + control text size |
| `--row-padding-y` | `0.375rem` (6px) | table / list row vertical padding |
| `--row-font-size` | `0.8125rem` (13px) | table / list row text size |

**Consume them with Tailwind v4 functional-variable syntax** — never hardcode px for controls:

```
h-(--control-height)                      /* height */
px-(--control-padding-x)                  /* padding */
text-(length:--control-font-size)         /* font-size (note the length: hint) */
py-(--row-padding-y)                       /* row padding */
text-(length:--row-font-size)             /* row font-size */
size-(--control-height)                    /* square icon buttons */
```

Real usage: `Input`, `NativeSelect`, `Button` (`default`/`sm`/`icon` sizes), the `ReadonlyValue` and `StatusBadge` helpers, and the TanStack Query demo's row (`py-(--row-padding-y) text-(length:--row-font-size)`) all read these. When a change needs to be denser or roomier, edit the token in `styles.css` once — do not sprinkle `h-8`/`text-[13px]` overrides.

### Colors — oklch, full light + `.dark` set

Tokens are declared in `:root` (light, `color-scheme: light`) with a complete `.dark` override block (`color-scheme: dark`), then mapped to Tailwind color utilities in `@theme inline`. Use the semantic names only: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1..5`, and the `sidebar*` set.

**Volt's `primary` is a neutral near-black in light mode (`oklch(0.21 0.006 285.885)`) and near-white in dark mode — a Polaris-grade neutral, NOT a teal/emerald or a Tailwind blue.** Never ship a default Tailwind-blue primary button. `destructive` is the only saturated semantic color. There is **no** `surface-1/2/3` palette and **no** `.status-*` utility class in Volt (those were reference-project extras) — status/tone is expressed through the shared `StatusBadge` component instead (§29.12). `accent` and `muted` are near-neutral greys; use them for chrome, not signal.

Never hardcode `bg-white` / `text-black` / `bg-[#fff]` — use the semantic tokens so dark mode "just works". (The `__root.tsx` 404 fallback still uses `text-blue-500`; treat that as a leftover, not a pattern to copy.)

### Radius

`--radius: 0.625rem` (10px). Derived: `--radius-sm = radius - 4px`, `--radius-md = radius - 2px`, `--radius-lg = radius`, `--radius-xl = radius + 4px`. Pick from `rounded-sm/md/lg/xl` — no `rounded-[7px]` randomness.

### Dark mode + the FOUC-safe bootstrap (a Volt hard-won pattern)

Dark mode is the `.dark` class on `<html>`, driven by the custom variant `@custom-variant dark (&:is(.dark *))`. The theme system lives in `src/lib/theme.ts`:

- `THEME_INIT_SCRIPT` — a dependency-free inline script string. It runs in `<head>` **before paint** (injected via `dangerouslySetInnerHTML` in `src/routes/__root.tsx`'s `RootDocument`), reading the persisted `"theme"` preference and toggling `.dark` + setting `root.style.colorScheme` so the page paints the correct canvas immediately. This is what kills the light→dark flash (FOUC) on first load.
- `<html suppressHydrationWarning>` — set in `__root.tsx` because the init script mutates `<html>` before React hydrates; without it React warns about the attribute mismatch.
- `setTheme(theme)` — persists to `localStorage["theme"]` then applies via `withoutTransitions()`.
- `withoutTransitions(mutate)` — injects a `* { transition: none !important; animation: none !important }` style, runs the mutation, forces a reflow, then removes the style on the next frame. Without it, flipping the palette animates every `transition-colors` element at slightly different times — a flickery in-between state. The theme switch must be instant, not animated.
- `applyTheme` / `getStoredTheme` / `prefersDark` — all SSR-safe (guard `typeof document` / `typeof window` / `typeof localStorage`).

When adding theme-affected UI, rely on the tokens — do not re-implement theme detection, and never call `applyTheme` without going through `setTheme` (you'd lose persistence + the flicker guard).

### Ship-gate taste (enforced on review)

- No default Tailwind-blue primary button — Volt's primary is the neutral near-black/white token.
- No heavy `border-2` frames — hairline `border-border` (solid, not opacity-dimmed) or a `ring-1`.
- Numeric/columnar data in `tabular-nums`.
- Density comes from the tokens, not one-off `h-9`/`text-[14px]` literals.
- Commit to the Polaris-grade dense direction — not generic "modern SaaS" spacing.

## 6 · Forms — TanStack Form + Zod v4

Volt wraps TanStack Form once via `createFormHook` in `src/demo/form/use-app-form.ts`, exposing `useAppForm` with pre-bound field + form components (`src/demo/form/form-fields.tsx`): `TextField`, `TextArea`, `Select`, plus a `SubscribeButton` form component (and `Slider` / `Switch` field components). Contexts live in `src/demo/form/form-context.ts`.

### Canonical pattern (from `src/routes/demo/form.simple.tsx`)

```tsx
import { z } from "zod"
import { toast } from "sonner"
import { useAppForm } from "@/demo/form/use-app-form"

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
})

function SimpleForm() {
  const form = useAppForm({
    defaultValues: { title: "", description: "" },
    validators: { onBlur: schema },              // or onSubmit / onChange
    onSubmit: ({ value }) => { toast.success("Saved", { description: value.title }) },
  })

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}
      className="rounded-md border border-border bg-background p-4 space-y-3"
    >
      <form.AppField name="title">
        {(field) => <field.TextField label="Title" placeholder="A short title" />}
      </form.AppField>
      <form.AppField name="description">
        {(field) => <field.TextArea label="Description" />}
      </form.AppField>
      <div className="flex justify-end border-t border-border pt-3">
        <form.AppForm>
          <form.SubscribeButton label="Submit" />
        </form.AppForm>
      </div>
    </form>
  )
}
```

### Field scaffolding (`src/demo/form/form-kit.tsx`)

Reusable, all styled to the density tokens — use these instead of hand-rolling field chrome:

- `Field` — label · control · hint/error wrapper (`space-y-1.5`, 11px hint/error text, required asterisk).
- `FormSection` — section title + description + `FormCard`.
- `FormCard` — `rounded-md border border-border bg-background p-4 space-y-3`.
- `FormActions` — right-aligned action row (`flex justify-end gap-2 pt-1`).
- `ReadonlyValue` — read-only inline value that reads the SAME control tokens as `Input`, so it never drifts taller/shorter than editable fields beside it.
- `SwitchRow` — label + description on the left, control on the right.
- `DateField` — outline trigger `Button` + `Calendar` in a `Popover`.
- `StatusBadge` — the one status pill used everywhere (§29.12).

### Rules

- **Validation is Zod v4 at the boundary** — `validators.onBlur` / `onSubmit`. Errors surface via `field.state.meta.errors`, gated by `field.state.meta.isTouched` (see `form-fields.tsx`). Error text: `text-[11px] text-destructive`.
- **Submit state** via `form.Subscribe` — `SubscribeButton` disables the button and swaps the label to `"Saving…"` (ellipsis char `…`) while `isSubmitting`. Never spin without disabling; never leave the form disabled after success without resetting.
- **Toast on success/error** via `sonner` — `toast.success(...)` / `toast.error(...)`.
- **No raw `<select>`** — the `Select` field component uses the Base UI `Select`; for plain cases use `NativeSelect`. **No `window.confirm` / `window.prompt`.**
- **`e.stopPropagation()` in the `onSubmit` handler** (alongside `preventDefault`) — matches the demo forms and avoids double-handling inside nested interactive containers.

## 7 · Data fetching — TanStack Query

### Basic shape

```tsx
function useThing(id: string) {
  return useQuery({
    queryKey: ["thing", id],
    queryFn: () => createApiClient().request(/* SDK document */),
    enabled: !!id,
  })
}

function useUpdateThing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => createApiClient().request(/* SDK mutation */, input),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["thing", vars.id] }),
  })
}
```

The provider is set up in `src/integrations/tanstack-query/` and wired into `__root.tsx` via `<Provider queryClient={queryClient}>`; the query client also rides on the router context (`MyRouterContext.queryClient`).

### Rules

- **Query keys** are tuple-typed, stable, hierarchical (`["thing", id]`). Never anonymous objects as keys (referential identity changes each render).
- **Loading / error / pending** come from the hook (`isLoading`, `isError`, `error`, `isPending`) — see `src/routes/demo/tanstack-query.tsx`. Never roll your own with `useState` + `useEffect`.
- **Empty states** are first-class — `ServerDataTable` takes `emptyMessage` / `emptyDescription` / `emptyAction`; ad-hoc lists render a styled empty branch, never a bare `"No results."`.

### Skeleton gating — recommended, not yet wired

Volt ships `src/components/ui/skeleton.tsx` but **no `useDelayedFlag` helper yet**. The hardened pattern from the reference project: gate every route skeleton behind a delay so fast loads (<150ms) don't flash a skeleton on each navigation. If you introduce skeletons on a data route, add a small `useDelayedFlag(isLoading, 150)` helper under `src/lib/` and gate on it rather than rendering the skeleton the instant `isLoading` is true. (Pattern retained for reference; add the helper the first time you need it.)

### Cached shell fetches + auth refresh — pattern retained for reference; not yet wired in Volt

Volt has no auth wired (the shell shows a static demo identity). When you add auth:

- Route always-mounted shell fetches (a `getMe()` / `getWorkspaces()`) through a **module-level cached singleton promise** with a `reset*()` on login/logout/mutation — not a fresh request per mount (AuthGate remount + StrictMode double-invoke multiply identical queries). Don't cache rejections.
- Add a **401 + GraphQL-`unauthorized` refresh-and-retry** to the `fetch` override in `createApiClient()` (`gql-clients.ts` already flags this as the hook point) — dedupe the refresh, retry once, redirect to login on failure. The anon client must NOT use it.

## 8 · Client state — TanStack Store

For genuinely global UI state (sidebar collapsed, theme preference, command-palette open) — not for server data. See `src/routes/demo/store.tsx` and `src/demo/data/`.

```ts
import { Store, useStore } from "@tanstack/store"

export const sidebarStore = new Store({ collapsed: false })

export function useSidebar() {
  const collapsed = useStore(sidebarStore, (s) => s.collapsed)
  return { collapsed, toggle: () => sidebarStore.setState((s) => ({ collapsed: !s.collapsed })) }
}
```

Local UI state (open/closed, hover, transient draft) stays in `useState`. Don't reach for a store when `useState` works.

**`useSyncExternalStore` trap:** any custom external store subscriber must back its `getSnapshot` with a token-keyed cache (bump a token on mutation, return the cached snapshot when the token is unchanged). Allocating a fresh array/object on every read triggers "Maximum update depth exceeded." (TanStack Store already handles this; the trap is for hand-rolled subscribers.)

## 9 · Routing — TanStack Router (file-based)

### Route file

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/demo/server-table")({
  component: ServerTableDemo,
  head: () => seo({ title: "Server data table" }),
})
```

### Typesafe titles — `seo()` + the `head` option

Per-route document titles go through `seo()` in `src/lib/seo.ts`, used with the route `head` option. `seo({ title })` returns the exact `{ meta: [...] }` shape TanStack Router expects and formats the title as `"<title> · Volt"` (the deepest matched route wins, overriding the root default). The root `__root.tsx` sets the base `head` (charset, viewport, favicon/manifest links, default `"Volt"` title). Never write raw `<title>` tags or hand-build the meta array — call `seo()`.

### Root + context

`__root.tsx` uses `createRootRouteWithContext<MyRouterContext>()`; the context carries `queryClient`, `trpc`, and `orpc`. `RootComponent` wraps `<Outlet/>` in the TanStack Query `<Provider>`; `RootDocument` (the `shellComponent`) renders `<html>`, the theme init script, `<HeadContent/>`, `<Toaster/>`, devtools, and `<Scripts/>`.

### routeTree regen

`src/routeTree.gen.ts` is **auto-generated by the TanStack Router/Start Vite plugin on `vite dev` / `vite build`** — never edit it, never format it, and don't rely on a manual `tsr generate` step. After moving/renaming a route file, run `task dev:guard` (or `task build`) to regenerate, then confirm the old path is gone from `routeTree.gen.ts` before committing.

### Flat-file path-nesting gotcha

A dotted filename like `parent.$id.child.tsx` generates `/parent/$id/child` as a **child** route of `/parent/$id`. If the parent's component doesn't render `<Outlet/>`, the child never mounts — clicking through looks like a silent nav failure (URL changes, view doesn't). Fix by flattening the filename so the target is a sibling, or render `<Outlet/>` in the parent. Volt's demo SSR routes (`start.ssr.index.tsx`, `start.ssr.full-ssr.tsx`, etc.) are a live example of the dotted flat-file convention.

## 10 · Dialogs, Sheets

### Dialog — the 3-zone structure (`src/components/ui/dialog.tsx`)

Volt's `Dialog` is Polaris-grade: `DialogContent` is **padding-less** and `overflow-hidden` with an inner `flex flex-col`, and the three zones each own their padding + separator:

- `DialogHeader` — `border-b border-border px-4 py-3 pr-8` (the `pr-8` leaves room for the absolute close X).
- `DialogBody` — `px-4 py-3.5` (the scroll area; add `overflow-y-auto` here for long content).
- `DialogFooter` — `border-t border-border bg-muted/50 px-4 py-2.5`, right-aligned actions `gap-2`.
- `DialogTitle` — `text-[15px] leading-tight font-semibold`. `DialogDescription` — `text-[11px] text-muted-foreground`.
- The close X (`DialogPrimitive.Close`, top-right) already bakes `cursor-pointer` + hover.

Base default width is `max-w-[calc(100%-2rem)] sm:max-w-[400px]`. Widen per dialog with `sm:max-w-[540px]` (standard create/edit), `sm:max-w-[600px]` (wide with side metadata), `sm:max-w-[720px]` MAX (long-form; beyond that, route to a full page).

**Long-content note (divergence from the reference project):** Volt's `DialogContent` does NOT bake a `max-h-[calc(100dvh-2rem)]`. For a dialog whose body can exceed the viewport, add `max-h-[calc(100dvh-2rem)]` to the `DialogContent` and `overflow-y-auto` to the `DialogBody` so the header/footer stay pinned and the body scrolls. Use `dvh` (dynamic viewport height), not `vh`. Consider promoting this into the `DialogContent` base class if long dialogs become common.

### Sheet width — inline `style`, or you lose

`src/components/ui/sheet.tsx` bakes `w-3/4 sm:max-w-sm` into the right/left `SheetContent`. Tailwind's data-attribute/base variants win over a plain breakpoint class at runtime, so `className="sm:w-[480px]"` is a **no-op** — the sheet renders at 75% width or clamps to `max-w-sm`. The only reliable override:

```tsx
<SheetContent style={{ width: "480px", maxWidth: "100vw" }} className="p-0 ...">
```

`maxWidth: "100vw"` is the mobile safety bound. For a resizable drawer, drive width from `useState` via inline `style`.

### Focus + escape

Base UI handles focus trap, escape-to-close, and focus restoration automatically. Don't reimplement.

### Quick-view drawer system — pattern retained for reference; not yet wired in Volt

The reference project routes entity detail views through a shared `QuickViewContext` (stacking Sheets with maximize→full-page). Volt does not ship this. If you build a list→detail quick-view, prefer a single shared context over per-page `<Sheet>` instances so back/maximize/resize/stack behave consistently.

## 11 · Tables & lists

### Never a bare `<table>` for a list page — use `ServerDataTable`

**Hard rule.** Any list page (entities, logs, settings rows — anything tabular with more than one column) uses the bespoke `ServerDataTable` (`src/components/ui/server-data-table/`), never a hand-rolled `<table>`/`<Table>` + `.map(row => <tr>)`. The bare table gives you nothing; `ServerDataTable` ships sort, filter, full-text search, cursor pagination, column show/hide + resize + reorder, saved views, row-action dropdowns, empty/loading/error states, CSV export, keyboard navigation, and alternate layouts. Rebuilding those per page is wasted work and pages drift.

The low-level `@tanstack/react-table` and the plain `ui/table.tsx` primitive exist for bespoke non-list tables only.

### Canonical usage (verbatim — from `src/routes/demo/server-table.tsx`)

Define columns, filter fields, and sort options with the typed helpers, then render `ServerDataTable` inside the page wrapper:

```tsx
import {
  type DataTableColumn,
  defineFilterFields,
  defineSortOptions,
  ServerDataTable,
} from "@/components/ui/server-data-table"
import { clientConnection } from "@/lib/client-datatable"
import { StatusBadge, type StatusTone } from "@/demo/form/form-kit"

type Row = { id: string; name: string; email: string; status: Status; mrr: number }
type Where = { search?: string; status?: Status; minMrr?: number }

const columns: DataTableColumn<Row>[] = [
  {
    id: "name", header: "Customer", size: 220,
    cell: (r) => (
      <div className="min-w-0">
        <div className="text-[13px] font-medium truncate">{r.name}</div>
        <div className="text-[11px] text-muted-foreground truncate">{r.email}</div>
      </div>
    ),
    meta: { sortFieldId: "name", filterFieldId: "search" },
  },
  {
    id: "status", header: "Status", size: 130,
    cell: (r) => <StatusBadge label={r.status} tone={STATUS_TONE[r.status]} />,
    meta: { sortFieldId: "status", filterFieldId: "status" },
  },
  {
    id: "mrr", header: "MRR", size: 110,
    cell: (r) => <span className="tabular-nums text-[13px]">${r.mrr.toLocaleString()}</span>,
    meta: { sortFieldId: "mrr", className: "text-right" },
  },
]

const filterFields = defineFilterFields<Where>()([
  { id: "search", type: "text", label: "Search", placeholder: "name / email",
    toWhere: (c) => ({ search: c.value ?? undefined }) },
  { id: "status", type: "select", label: "Status",
    options: STATUSES.map((s) => ({ value: s, label: s })),
    toWhere: (c) => ({ status: (Array.isArray(c.value) ? c.value[0] : c.value) as Status }) },
  { id: "minMrr", type: "number", label: "Min MRR",
    toWhere: (c) => ({ minMrr: Number(c.value) || undefined }) },
])

const sortOptions = defineSortOptions()([
  { fieldId: "name", label: "Customer" },
  { fieldId: "mrr", label: "MRR" },
])

<ServerDataTable<Row, Where>
  queryKey="demoCustomers"
  columns={columns}
  filterFields={filterFields}
  sortOptions={sortOptions}
  defaultSort={[{ fieldId: "mrr", direction: "desc" }]}
  getRowId={(r) => r.id}
  pageSize={20}
  search={{ placeholder: "Search customers…", toWhere: (q) => ({ search: q }) }}
  views={{}}
  queryFn={async (args) => clientConnection(DATA, args, {
    filter: (r, where) => { /* apply where; return boolean */ return true },
    sorters: { name: (r) => r.name.toLowerCase(), mrr: (r) => r.mrr },
  })}
/>
```

### The config surface (`ServerDataTableConfig`, from `types.ts`)

Real props — pass what you need:

- **Data:** `queryKey` (stable cache-key prefix), `queryFn(args)` (returns a Relay-style `Connection<TNode>`), `columns`, `getRowId`, `rowClassName`.
- **Interaction:** `filterFields`, `search`, `sortOptions`, `defaultSort`, `rowActions(row, ctx) => ActionItem[]`, `views`, `toolbar(ctx)`, `layouts` + `defaultLayout`.
- **Pagination:** `pageSize` (default 20), `pageSizeOptions` (default `[10, 20, 50, 100]`).
- **UX:** `emptyMessage`, `emptyDescription`, `emptyAction`, `density` (`"compact" | "comfortable"`), `stickyHeader`, `className`.
- **Columns:** `enableColumnResize`, `enableColumnReorder`, `urlState` (URL state sync, default on).

`DataTableColumn<T>` is `{ id, header, cell(row, rowIndex), size?, minSize?, maxSize?, meta? }`. `meta` carries `className`, `label`, `sortFieldId`, `filterFieldId`, `hideable`, `resizable`, `draggable`. Use `defineFilterFields<Where>()([...])` and `defineSortOptions()([...])` — the curried form preserves literal `id`/`fieldId` unions so saved views and `defaultSort` are type-checked against them.

### Connection adapters (`src/lib/client-datatable.ts`)

`ServerDataTable.queryFn` must return a `Connection` (Relay cursor contract). Three adapters bridge real backends:

- `clientConnection(all, args, { filter, sorters })` — in-memory: filter → sort → cursor-paginate. Use when the GraphQL query returns the full list (no server paging).
- `offsetPaging(args)` → `{ limit, offset }` and `offsetConnection(items, total, offset, limit)` — for an OFFSET-paginated backend (`{ items, total }`), decode the cursor to an offset for the request, then re-encode the page. The cursor scheme is byte-for-byte identical to `clientConnection`, so forward/back nav behaves the same either way.

### Row actions — the `rowActions` prop, not a custom column

Pass `rowActions={(row, ctx) => [{ label, icon, onAction }, { label, icon, destructive: true, onAction }]}` — `ServerDataTable` renders the dropdown. Add a custom column alongside `rowActions` only for frequent single-click actions (star, archive); don't replace the dropdown.

### List rows as `<Link>` (when the entity has a detail page)

When an entity has a detail route, make the row a `<Link to="/…/$id">` with hover-revealed overlay icons via `group/row` + `group-hover/row:opacity-100`, so middle-click-to-open-tab and copy-link work. Never a `<div onClick>` / `<li onClick>` (no anchor, no keyboard, no middle-click). When there's no detail page yet, skip the `<Link>` and let `rowActions` carry Edit/Delete.

## 12 · Page layout

### AdminShell + PageHeader

Top-level pages render inside `AdminShell` (sidebar + main) and open with a `PageHeader`. The demo pages are the reference — e.g. `server-table.tsx`, `form.simple.tsx`, `tanstack-query.tsx`.

`PageHeader` (from `admin-shell.tsx`) renders `flex items-center justify-between … border-b border-border pb-3 mb-4` — it provides its own bottom border but **no horizontal or top padding**. The **leaf page owns the wrapper and the header content** (icon, title, subtitle, CTAs) — the layout does not inject a header via a route→title map. Wrap it:

```tsx
<AdminShell>
  <div className="px-6 py-6">                      {/* default: list / table / dashboard */}
    <PageHeader icon={<Table2 />} title="…" subtitle="…" primaryAction={<Button>New</Button>} />
    {/* page body */}
  </div>
</AdminShell>
```

Add a `max-w-*` only for reading-width detail pages (`px-6 py-6 max-w-3xl` for forms, `max-w-[1280px]` for wide tables — both appear in the demos). Don't let a title stick to the viewport edge by wrapping `PageHeader` directly in a flex column with no padding.

`PageHeader` slots (all optional except `title`): `icon` (lucide, rendered at `size-[18px]`), `title` (`text-[18px] font-semibold tracking-tight`), `subtitle` (`text-[12px] text-muted-foreground`), `secondaryActions`, `primaryAction`, `right` — the right cluster renders `secondaryActions` then `primaryAction` then `right`.

### Surface for grouped content

Wrap a table or a distinct section in `Surface` (`rounded-xl border border-border bg-background shadow-sm overflow-hidden`) when it needs a card frame.

### `overflow-auto` + `h-full`

Every scrollable inner panel must be `h-full w-full overflow-auto` (or a `flex-col h-full overflow-hidden` parent with a `flex-1 overflow-auto` child). Inside a fixed-height or `overflow-hidden` parent, a missing `h-full` makes content overlay siblings or clip without a scrollbar.

## 13 · SSR safety (TanStack Start / Nitro)

### `localStorage` — never bare at module / SSR-reachable scope

Nitro SSR exposes a `localStorage` global that is not a real `Storage` — `typeof localStorage` is `"object"` (passes a naive guard) but `.getItem` may be missing, so a bare `localStorage.getItem(...)` throws and can 500 every route when the offending module is imported transitively by a shell component. Route reads through a guard. Volt does this in `src/lib/gql-clients.ts`:

```ts
function lsGet(key: string): string | null {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage
    if (!ls || typeof ls.getItem !== "function") return null
    return ls.getItem(key)
  } catch { return null }
}
```

`src/lib/theme.ts` uses the same `typeof localStorage === "undefined"` guard before every read/write. Copy `lsGet` for any new SSR-reachable `localStorage` read; writes are client-only event-handler paths (lower risk) but prefer the guard anyway.

### `suppressHydrationWarning` + mount shell before gates

`<html suppressHydrationWarning>` is required because the theme init script mutates `<html>` pre-hydration (§5). Anything that must reflect the route regardless of app state (title sync, analytics, telemetry) mounts in the always-rendered layer of `__root.tsx`, not inside a future auth gate — otherwise it stalls until app state resolves.

### `clientOnly` for canvas-heavy editors

Canvas/WASM libraries (Excalidraw, tldraw, Monaco) are not SSR-safe and crash hydration via `React.lazy()`. Wrap them in TanStack Start's client-only boundary. Volt ships none today, so there's no in-repo example yet — apply this the first time you add one, and extend `vite.config.ts` `optimizeDeps` / SSR `noExternal` for the new heavy dep.

### Barrel import cycles

When repointing a shared-infra module (`gql-clients.ts`, an env module — anything pulled in transitively) to a feature, deep-import the concrete file, never the feature's barrel `index.ts`. Shared-infra → barrel → feature → shared-infra is an init cycle (`… is not a function`). Feature→feature and component→barrel edges are fine. Comment the deep-import explaining why.

## 14 · Auth — pattern retained for reference; not yet wired in Volt

Volt ships **no auth**. `AdminShell`'s `UserMenu` shows a static demo identity ("Demo User"), and there's no `AuthGate` in `__root.tsx`. The hooks are in place for when you add it: `createApiClient()` already reads `authmgr.access` + `authmgr.workspace` from `localStorage` and injects `Authorization` / `X-Workspace-Id`. When wiring real auth:

- Gate the app in `__root.tsx`, with public routes for login / API / oauth.
- Add cached `getMe()` / `getWorkspaces()` singletons + resets (§7) and a 401 refresh-and-retry in `createApiClient()`'s `fetch` override.
- On workspace switch, remount the routed subtree via a `key`ed scope rather than `window.location.reload()`.

## 15 · Keyboard — ServerDataTable ships nav; no global provider yet

Volt has **no global keyboard-shortcut provider**. `ServerDataTable` ships its own keyboard support (`useShortcuts`, `useListNavigation`, `Kbd`, `ShortcutsHelp` under `server-data-table/keyboard/`) scoped to the table. If you build app-wide shortcuts later, centralize on a single capture-phase `window` keydown listener — do not scatter `window.addEventListener("keydown", …)`. When a dispatcher consumes a keystroke, call both `preventDefault()` and `stopPropagation()`, and never bind both `?` and `Shift+?` (they're the same keystroke). An `<input>` inside a Base UI `DropdownMenu`/`Select` needs a wrapping `div` with `onKeyDown={(e) => e.stopPropagation()}` or the menu's typeahead swallows its keystrokes. (Patterns retained for reference; only the table's own keyboard layer is wired today.)

## 16 · Mentions / entity links — not applicable in Volt

Volt has no rich-text mention system. If you add one, keep the insert-side path map and the render/navigate-side matcher in sync (updating one without the other 404s links), and when renaming a link format, match the canonical form first then fall through to the legacy pattern so already-saved bodies keep resolving. (Retained for reference; nothing to maintain today.)

## 17 · Media / file grids — not applicable in Volt

Volt has no shared media-grid component. `Thumb` (`admin-shell.tsx`) is the only image primitive. If you build a media surface, make one shared `FileGrid`/`FileCard` with feature-flag props (quick-view, selection mode, drag-to-folder) rather than a per-page card, so selection and DnD behave consistently. (Retained for reference.)

## 18 · Toasts, errors, loading

- **Toast:** `sonner`. The `<Toaster theme="system" richColors closeButton position="top-right" />` is mounted once in `__root.tsx` — never add a second `Toaster`. Fire with `toast.success("Saved")` / `toast.error("Failed: " + msg)`.
- **Error states:** surface `error` from the Query hook near the failing surface or via a toast; give error boundaries a useful message + a retry/back action, not just "Something went wrong."
- **Empty states:** `ServerDataTable`'s `emptyMessage` / `emptyDescription` / `emptyAction`; for ad-hoc lists render a styled empty branch, never a bare `<p>No results.</p>`.
- **Loading:** read `isLoading` / `isPending` from the hook; skeletons via `ui/skeleton.tsx` (gate behind a delay flag — §7).

## 19 · Icons, images, animations

- **Icons:** `lucide-react` ONLY. Size via Tailwind (`size-4`, `size-3.5`) or the `[&_svg]:size-*` hooks baked into the primitives (Button sets `[&_svg]:size-3.5` at default size). No second icon library.
- **Images:** SVG inline for logos; raster via `public/`. `Thumb` sets `loading="lazy"` + `referrerPolicy="no-referrer"` for CDN hotlinks. Trust the deploy target for optimization.
- **Hover / focus / disabled:** Tailwind utilities baked into the primitives — Button uses `focus-visible:ring-ring/50 focus-visible:ring-[3px]`, `disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed`, `active:translate-y-px`. Match these; don't author bespoke CSS.
- **Animation:** `tw-animate-css` for sequences; Base UI drives dialog/dropdown transitions through `data-[starting-style]`/`data-[ending-style]` (dialog) and `data-[open]`/`data-[closed]` (dropdown) markers — compose with those, don't bolt on keyframe animations (they flash on close; see the comment in `dialog.tsx`).

## 20 · Accessibility

- Semantic HTML — `<header>`, `<nav>`, `<main>`, `<aside>`, `<button>`, `<a>`. Don't reach for `<div onClick>`.
- `aria-label` on icon-only buttons; `aria-invalid` on errored inputs (also a styling hook — the primitives style `aria-invalid:*`); `aria-describedby` linking error text to input.
- Never `outline: none` without a visible ring alternative. Base UI dialogs handle focus trap automatically.
- `styles.css` bakes `cursor: pointer` on interactive roles (`button`, `[role="button"]`, menu items, switches, `label[for]`, `summary`) so Base UI's native-element triggers still read as clickable — keep that behavior; don't strip roles.
- Color contrast: the tokens meet AA at default opacities; re-verify when dipping into `/60` / `/40` layers.

## 21 · Lint, format, generated files

- **Biome** is lint + format (`@biomejs/biome`). Config is Biome's. Commands: `task check` (`biome check src`), `pnpm lint` / `pnpm format` for the sub-steps.
- **Type-check:** `task typecheck` (`pnpm exec tsc --noEmit`). The build IS the test — a change isn't done until this is clean.
- **CI floor:** `task check` + `task typecheck` + `task test` (`vitest run`) all green.

### Generated files — never edit, never format

- `src/routeTree.gen.ts` — TanStack Router output (regenerated on `vite dev`/`build`).
- `src/generated/sdk/` — the gqlkit SDK (regenerated by `task gqlkit:all`).

Edits are clobbered on the next regen. Change the source (route file, GraphQL SDL) instead. These files ARE committed so consumers can build without running codegen.

## 22 · Performance

- **Code splitting** is automatic per route (TanStack Router). `lazy()` heavy in-route components — behind a client-only boundary if canvas/WASM (§13).
- **React Compiler** (`babel-plugin-react-compiler`) is enabled — don't hand-memoize (`useMemo`/`useCallback`) unless profiling proves a need.
- **Virtualize** long lists with `@tanstack/react-table` + virtualization when row counts grow; `ServerDataTable` paginates by default.
- **Bundle:** heavy deps go in `vite.config.ts` `optimizeDeps.include` + SSR `noExternal`.

## 23 · Tests

- **Framework:** `vitest` v4 + `@testing-library/react` + `jsdom`.
- **Naming:** `*.test.ts` / `*.test.tsx`, colocated with source.
- **Run:** `task test` / `pnpm test` (`vitest run`, single pass); `pnpm exec vitest` to watch.
- **Mock the SDK / RPC** at the module boundary — don't hit real GraphQL or a live backend in unit tests.
- **Test behavior, not implementation** — query by accessible role, assert on visible output, drive with `fireEvent` / `userEvent`.

## 24 · Commits + repo hygiene

- Conventional, present-tense commits: `type(scope): description`. Full rules in [git-commit.md](git-commit.md).
- **Never** commit AI attribution (`Co-Authored-By: Claude`, "Generated with Claude Code") — see git-commit.md.
- **Never** auto-commit — the user reviews each commit (root `CLAUDE.md`).
- **Never** commit `.env*` / credentials.
- Generated files (`routeTree.gen.ts`, `src/generated/sdk/`) ARE committed but never hand-edited.

## 25 · AI behavior (taste, enforced)

- Questions about code = answer only. Wait for "do it" / "fix it" / "add it" before editing (root `CLAUDE.md` default-to-answering rule).
- Don't add features beyond what was asked; don't refactor adjacent code that isn't broken; don't delete comments unless asked.
- Match existing code style — including the tab indentation the `ui/` components use.
- Don't touch generated files, `volt/` (unless updating the Volt layer deliberately), or `.env*`.
- Keep demo/example code quarantined under `src/routes/demo` + `src/demo` (§ Volt extras).

## 26 · Anti-pattern catalog

| Anti-pattern | Why banned | Instead |
|---|---|---|
| Inline GraphQL string + raw `fetch` | Bypasses generated types; rename = silent breakage | gqlkit SDK via `gql-clients.ts` (§3) |
| `useEffect(() => { fetch(...) }, [])` | No cache, dedup, or refetch-on-focus | TanStack `useQuery` (§7) |
| `window.alert / .prompt / .confirm` | Unstyleable; blocks JS; dismissed by browser chrome | `Dialog` + `Input` / destructive `Dialog` (§10) |
| Raw `<select>` / `<option>` in form chrome | OS chevron + padding break the h-(--control-height) row | `Select` / `NativeSelect` (§0, §6) |
| `import … from "@radix-ui/…"` | Volt is on Base UI | `@base-ui/react` via `ui/` wrappers (§4) |
| `asChild` on a Base UI primitive | Radix API; Base UI uses `render` | `render={<Child/>}` (§4) |
| `process.env.FOO` | Bypasses env validation + types | `env` / `drizzleEnv` from the typesafe modules (§0) |
| Mixing icon libraries | Visual inconsistency | Lucide only (§19) |
| CSS modules / styled-components | Tailwind v4 + tokens is the only system | Utility classes + CSS-var tokens (§5) |
| `any` / `as any` / `@ts-ignore` | Hides real type errors | `unknown` + narrow / Zod (§2) |
| Hardcoded `h-9` / `text-[14px]` on controls | Drifts from the density system | `h-(--control-height)`, `text-(length:--control-font-size)` (§5) |
| Default Tailwind-blue primary | "AI slop" look; Volt's primary is neutral near-black/white | Semantic `primary` token (§5) |
| `bg-white` / `text-black` / `bg-[#fff]` | Breaks dark mode | Semantic tokens (§5) |
| Re-implementing theme detection / calling `applyTheme` directly | Loses persistence + the flicker guard | `setTheme()` from `theme.ts` (§5) |
| Bare `localStorage.getItem(...)` at SSR-reachable scope | Nitro SSR can 500 every route | `lsGet(...)` guard (§13) |
| Second `<Toaster>` | Duplicate toasts | The single `Toaster` in `__root.tsx` (§18) |
| Editing `src/generated/sdk/` | Clobbered on `task gqlkit:all` | Change SDL + regen (§3, §21) |
| Editing `src/routeTree.gen.ts` | Auto-regenerated by Vite plugin | Move/rename the route file (§9, §21) |
| Bare `<table>` / `.map(row => <tr>)` on a list page | No sort/filter/search/pagination/views/actions | `ServerDataTable` (§11) |
| Custom Actions column duplicating a dropdown | Re-implements built-in behavior | `rowActions` prop (§11) |
| `<div onClick>` / `<li onClick>` list rows | No `<a>`, no keyboard, no middle-click | `<Link>` row + overlay icons (§11) |
| `<PageHeader>` with no padding wrapper | Title sticks to viewport edge | `<div className="px-6 py-6"><PageHeader/></div>` (§12) |
| Layout injecting `PageHeader` via a route→title map | Brittle; blocks per-page CTAs | Each leaf page owns its header (§12) |
| `className="sm:w-[480px]"` on `<SheetContent>` | Base data-attr width wins; override is a no-op | `style={{ width, maxWidth: "100vw" }}` (§10) |
| Viewer with `overflow-auto` but no `h-full` | Content overlays siblings or clips silently | `h-full w-full overflow-auto` (§12) |
| Keyframe animations on Base UI dialog/dropdown | Flash on close | `data-[starting/ending-style]` / `data-[open/closed]` transitions (§19) |
| Skeleton rendered the instant `isLoading` is true | Flashes on fast navigations | Gate behind a delay flag (§7) |
| Hand-memoizing everything | React Compiler already handles it | Only memoize when profiling proves it (§22) |
| `oxlint` / `eslint` / `prettier` invocation | Volt uses Biome | `task check` (§21) |

## 27 · Pre-PR checklist

- [ ] §0 — GraphQL through the gqlkit SDK + `gql-clients.ts`; no `useEffect`-fetch; no native dialogs; no raw `<select>`; no Radix; no `process.env`.
- [ ] §2 — `tsconfig` strict invariants intact; no new `any`/`as any`/`@ts-ignore`.
- [ ] §3 — new queries/mutations go through the SDK; if backend SDL changed, `task gqlkit:all` ran.
- [ ] §4 — new components in the right layer, reuse `ui/` first; `cn()`; `data-slot`; Base UI `render` not `asChild`.
- [ ] §5 — density via tokens (`h-(--control-height)` etc.), not `h-9`/`text-[14px]`; colors via semantic tokens; data in `tabular-nums`; theme changes via `setTheme`.
- [ ] §6 — forms via `useAppForm` + Zod v4; every dropdown is `Select`/`NativeSelect` (grep `<select` in diff = 0).
- [ ] §7 — server state via `useQuery`; empty/error/loading covered; skeletons delay-gated.
- [ ] §9 — new route titles via `seo()`; `routeTree.gen.ts` regenerated via `vite dev`/`build`, not hand-edited; flat-file nesting checked for `<Outlet/>`.
- [ ] §10 — long dialogs get `max-h-[calc(100dvh-2rem)]` + scrollable `DialogBody`; Sheet width via `style`.
- [ ] §11 — list pages use `ServerDataTable` with columns/filterFields/sortOptions/rowActions/queryFn; rows are `<Link>` when a detail page exists.
- [ ] §12 — `PageHeader` wrapped in `px-6 py-6` (or a reading-width variant); scrollable panels are `h-full w-full overflow-auto`.
- [ ] §13 — new SSR-reachable `localStorage` reads use `lsGet`; deep-import from shared infra; `suppressHydrationWarning` intact.
- [ ] §18 — one `Toaster`; toasts via `sonner`.
- [ ] §19/§20 — Lucide only; semantic HTML; `aria-label` on icon buttons; `aria-invalid` on errored inputs.
- [ ] §21 — `task check` + `task typecheck` + `task test` green; no edits to `src/generated/sdk/` or `routeTree.gen.ts`.
- [ ] §24 — commit conventional + present-tense; no AI attribution; not auto-committed; no `.env*`.
- [ ] §25 — only did what was asked; demo code stays under `src/routes/demo` + `src/demo`.

## 29 · Concrete UI patterns (verbatim taste)

The visual rulebook — real Volt classNames. When in doubt, copy these literally. Density is expressed through the tokens, not hardcoded px.

### 29.1 · Page wrapper

Default for list / table / dashboard pages: `<div className="px-6 py-6">` (optionally `max-w-[1280px]` for wide tables). Reading-width forms/detail: `px-6 py-6 max-w-3xl`. Both are live in the demos. Grep a sibling demo route before choosing a width; mismatched widths in the same shell read as a bug.

### 29.2 · Button (`src/components/ui/button.tsx`)

`cva` base (verbatim essentials): `inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive`. `cursor-pointer` and the focus ring are baked in — call sites never re-add them.

Variants: `default` (`bg-primary text-primary-foreground hover:bg-primary/90 active:translate-y-px`), `destructive` (solid red), `destructive-outline` (outline frame + red text — the soft row-delete affordance), `outline` (`border border-input bg-background hover:bg-muted`), `secondary`, `ghost` (`text-foreground/80 hover:bg-muted hover:text-foreground`), `link`. There is no `soft` / `destructive-soft` variant.

Sizes — the **default reads the density tokens** so it lines up with inputs in a toolbar:

```
default   h-(--control-height) rounded-lg gap-1.5 px-3 text-(length:--control-font-size) font-medium [&_svg]:size-3.5   ★ ~28px
sm        (alias of default — existing call sites keep working)
xs        h-6 rounded-md gap-1 px-2 text-[11px]                     table-row actions / chips
md        h-8 rounded-lg px-3.5 text-[13px]                          page-header CTAs that stand out
lg        h-9 rounded-lg px-4 text-[13px]                            full-width form CTAs (login / set-password)
icon      size-(--control-height)                                    square icon button, control height
icon-sm   size-6      icon-md size-8      icon-lg size-9
```

Because `default` already lands at control height, most buttons omit `size=`. Reach for `md` on a prominent page-header CTA, `lg` on a full-width form submit, `xs` for table-row chips. Loading: `disabled={isSubmitting}` + label `"Saving…"` (ellipsis char), as `SubscribeButton` does.

### 29.3 · Input (`input.tsx`) + NativeSelect (`native-select.tsx`)

Input base (verbatim essentials): `border-input dark:bg-input/30 flex h-(--control-height) w-full min-w-0 rounded-md border bg-background px-(--control-padding-x) py-0.5 text-(length:--control-font-size) transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50` + `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring` + `aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30`. **Flat 1px border, NO shadow, NO inset-depth trick** — the focus ring tighten is the only emphasis (see the comment in `input.tsx`).

`NativeSelect` mirrors the Input chrome with `appearance-none … pr-7` + an absolute lucide `ChevronDown` (`size-3`, `right-2`, `-translate-y-1/2`), so it strips the OS chevron and aligns to control height. Use it (or the Base UI `Select`) — never a raw `<select>`.

### 29.4 · Form field

Field spacing `space-y-3` on the form, `space-y-1.5` inside a field (label · control · error). Label via the `Label` primitive. Hint: `text-[11px] text-muted-foreground`. Error: `text-[11px] text-destructive`, gated by `field.state.meta.isTouched`. Required asterisk: `<span className="text-destructive ml-0.5">*</span>` (see `form-kit.tsx` `Field`). Action row: `flex justify-end gap-2` with a `border-t border-border pt-3` separator above the submit.

### 29.5 · Dialog (`dialog.tsx`) — 3-zone

```tsx
<DialogContent className="sm:max-w-[540px]">      {/* padding-less, overflow-hidden, flex-col */}
  <DialogHeader>                                  {/* border-b px-4 py-3 pr-8 */}
    <DialogTitle>Create API key</DialogTitle>     {/* text-[15px] font-semibold */}
    <DialogDescription>…</DialogDescription>       {/* text-[11px] text-muted-foreground */}
  </DialogHeader>
  <DialogBody className="overflow-y-auto">…</DialogBody>          {/* px-4 py-3.5 */}
  <DialogFooter>                                   {/* border-t bg-muted/50 px-4 py-2.5, right-aligned gap-2 */}
    <Button variant="outline">Cancel</Button>
    <Button>Create</Button>
  </DialogFooter>
</DialogContent>
```

Cancel left, primary right. For a long body, add `max-h-[calc(100dvh-2rem)]` on `DialogContent` (§10). The close X is auto-rendered top-right with `cursor-pointer` baked.

### 29.6 · Card / Surface

Use `Surface` (`rounded-xl border border-border bg-background shadow-sm overflow-hidden`) to frame a table/section, or the `ui/card.tsx` primitive for a standalone panel. For a list of sections on one page, prefer bare `<section>` blocks with hairline separators over card-soup. `FormCard` (`rounded-md border border-border bg-background p-4 space-y-3`) is the form-specific frame.

### 29.7 · Table row (ServerDataTable)

Density is token-driven: rows read `--row-padding-y` (6px) and `--row-font-size` (13px); the ad-hoc list in the TanStack Query demo uses `px-3 py-(--row-padding-y) text-(length:--row-font-size) hover:bg-muted/60`. Cell taste: primary/identifying column `text-[13px] font-medium`, secondary line `text-[11px] text-muted-foreground truncate`, numeric columns `tabular-nums` and `meta: { className: "text-right" }`. Status cells render `<StatusBadge>` (§29.12). Never dim body cells the user scans to `text-muted-foreground` — the hover background already provides contrast.

### 29.8 · Sidebar nav (`admin-shell.tsx`)

Sidebar is `w-[248px]` with sectioned nav. Nav link: `group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors`; active adds `bg-muted text-foreground font-semibold`. Icons `size-[16px] shrink-0`. Section labels are **mixed-case** `text-[12px] font-semibold text-foreground/70` (not uppercase tracking-wider — that reads washy on chrome the user scans). Item gap `space-y-px`; section top-gap `pt-4`.

### 29.9 · PageHeader

```tsx
<div className="flex items-center justify-between gap-4 border-b border-border pb-3 mb-4">
  <div className="flex items-center gap-2 min-w-0">
    <span className="text-foreground/80 [&_svg]:size-[18px]">{icon}</span>
    <div className="min-w-0">
      <h1 className="text-[18px] font-semibold tracking-tight leading-tight truncate">{title}</h1>
      <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  </div>
  <div className="flex items-center gap-2 shrink-0">{secondaryActions}{primaryAction}{right}</div>
</div>
```

### 29.12 · StatusBadge (`src/demo/form/form-kit.tsx`)

The single status pill used across every table/list. One shell, tone maps to a dot color — map your domain status → tone at the call site:

```tsx
export type StatusTone = "success" | "warning" | "neutral" | "danger" | "info"
// dot: success→bg-emerald-500, warning→bg-amber-500, neutral→bg-zinc-400, danger→bg-destructive, info→bg-blue-500
<StatusBadge label={row.status} tone={STATUS_TONE[row.status]} />
// shell: inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-0.5
//        text-(length:--control-font-size) font-medium capitalize + a size-1.5 rounded-full dot
```

Don't reach for raw `bg-green-500` / `bg-red-500` in a table — route status through `StatusBadge` so "Active" on the dashboard and "Done" on a todo read identically.

## Volt-specific extras

### Demo isolation

The demo/showcase is fully quarantined: routes under `src/routes/demo/` + components/data under `src/demo/`. Deleting both directories strips every demo cleanly (the shared `ServerDataTable`, `ui/`, `admin-shell.tsx`, `lib/`, and integrations stay). Keep example code there — do not leak demo-only helpers (`form-kit.tsx`, `use-app-form.ts`, faker seeds) into `src/components` or `src/lib`. Note that `StatusBadge` currently lives in `src/demo/form/form-kit.tsx`; if you keep the demos deletable, promote shared pieces you actually depend on into `src/components/ui` before deleting the demo dir.

### Portless dev workflow

Day-to-day dev runs through **portless** for a stable HTTPS URL. `task dev:guard` runs portless with auto-restart on crash → **https://app.localhost** (the `name` in `portless.json` maps to `https://<name>.localhost`). One-time: `task portless:trust` (installs the local CA, needs sudo) and `task portless:up` (starts the :443 proxy). Plain `pnpm dev` still serves `http://localhost:3000`. See `volt/CONTRIBUTING.md`.

### Dual RPC (tRPC + oRPC side by side)

Volt ships **both** RPC stacks, self-contained under `src/integrations/trpc/` and `src/integrations/orpc/`, mounted at `src/routes/api.trpc.$.tsx` and `src/routes/api.orpc.$.tsx`, both exposed on the router context (`MyRouterContext.trpc` / `.orpc`) and both integrated with TanStack Query (`@trpc/tanstack-react-query`, `@orpc/tanstack-query`). Demos: `demo/trpc-todo.tsx`, `demo/orpc-todo.tsx`. They coexist as reference implementations — pick one per real feature; don't split a single feature's calls across both. GraphQL (gqlkit) remains the primary data path; RPC is for app-local server functions.

### Integrations are self-contained modules

`src/integrations/*` (drizzle, trpc, orpc, tanstack-query, sentry) are pluggable: each owns its own setup and, where relevant, its own env (`drizzleEnv` from `@/integrations/drizzle/env`) and Taskfile. Keep new cross-cutting infra in this shape. Per-module guides live in `volt/docs/` (DRIZZLE, GQLKIT, SENTRY, SHADCN, SPA_MODE, DEPLOYMENT) and incident write-ups in `volt/docs/incidents/`.

## Appendix A · Building a page (end-to-end)

The canonical recipe for "build a list / CRUD / settings page for X". Adapted to Volt's stack — where the reference playbook hand-rolls a `<table>` + `useEffect` + `confirm()`, Volt uses `ServerDataTable` + TanStack Query + a styled `Dialog`, because those are commandments (§0). Run top to bottom.

### 1 · Primitives are already right — don't re-check them per page

Volt ships the primitives at the Polaris-dense baseline (Button, Input, NativeSelect, the 3-zone Dialog, AdminShell/PageHeader) with density driven by the `styles.css` tokens. You do not need to verify or rewrite them per page — reuse them. If a primitive is genuinely off-spec, fix it once at `src/components/ui/*` (or the token in `styles.css`), never patch around it in the page.

### 2 · Shell + wrapper (the leaf owns its header)

```tsx
export const Route = createFileRoute("/things")({
  component: ThingsPage,
  head: () => seo({ title: "Things" }),
})

function ThingsPage() {
  return (
    <AdminShell>
      <div className="px-6 py-6">              {/* px-6 py-6, add max-w-[1280px] for wide tables */}
        <PageHeader
          icon={<Boxes />}
          title="Things"
          subtitle="What these are and why they exist"
          primaryAction={<Button onClick={() => setCreateOpen(true)}>New thing</Button>}
        />
        {/* table + dialogs */}
      </div>
    </AdminShell>
  )
}
```

The layout provides only the shell + gutter. The `PageHeader` (icon · title · subtitle · CTA) is owned by the leaf — never a route→title map in the layout (§12).

### 3 · Data via TanStack Query — never `useEffect` + `confirm`

- Read with `useQuery` (`queryKey` + `queryFn` through the gqlkit SDK / RPC), mutate with `useMutation` + `queryClient.invalidateQueries` (§7). No `reload()`-in-`useEffect`, no optimistic hand-rolling until needed.
- Destructive actions go through a styled `Dialog` with a `variant="destructive"` confirm button — never `window.confirm` (§0, §10).

### 4 · The table is `ServerDataTable` (not a bare `<table>`)

Define `columns` (`DataTableColumn<Row>[]`), `filterFields` (`defineFilterFields<Where>()([...])`), `sortOptions` (`defineSortOptions()([...])`), and a `queryFn` returning a `Connection` (use `clientConnection` for in-memory data, `offsetPaging`/`offsetConnection` for an offset backend). Render `<ServerDataTable<Row, Where> …>` with `getRowId`, `pageSize`, `rowActions`, and `emptyMessage`/`emptyDescription`. Copy the verbatim shape in §11 — it already gives you sort, filter, search, pagination, column visibility, saved views, row-action dropdown, and empty/loading/error states. Status cells render `<StatusBadge>` (§29.12); numeric cells use `tabular-nums`.

### 5 · The create/edit dialog — 3-zone

Use the `Dialog` primitive's Header / Body / Footer zones (§29.5). Wrap the form in `<form onSubmit={…} className="contents">` so it spans the three zones without breaking the flex column. Fields via `useAppForm` + the `form-kit` helpers (§6). Footer: Cancel (`variant="outline"`) left, primary right; disable + swap label to `"Saving…"` while submitting.

### 6 · States + toasts

`ServerDataTable` renders empty/loading/error for you — set `emptyMessage`/`emptyDescription`/`emptyAction` and name the primary CTA in the empty copy. For any ad-hoc list, render loading/empty/data as a flat branch, never a bare `"No results."`. Fire `toast.success` / `toast.error` (single `Toaster` in `__root.tsx`).

### 7 · Done-criteria

- [ ] Route uses `createFileRoute` + `head: () => seo({ title })`.
- [ ] `AdminShell` + `px-6 py-6` wrapper; `PageHeader` with icon + title + subtitle + primaryAction, owned by the leaf.
- [ ] List is `ServerDataTable` (no bare `<table>`); columns/filterFields/sortOptions/rowActions/queryFn set; `tabular-nums` on numbers.
- [ ] Data via `useQuery`/`useMutation`; destructive via styled `Dialog`, not `confirm`.
- [ ] Create/edit dialog is 3-zone; form via `useAppForm` + Zod; submit disables + shows `"Saving…"`.
- [ ] Empty copy names the CTA; toasts via `sonner`.
- [ ] `task check` + `task typecheck` clean.

## Appendix B · Density pass

When the user says "make it more compact / sleek", "Polaris-grade / Linear-tight", "too big / too washy / hardly visible", or "iterate on the UI" — this is the sequence. **Volt's key advantage: density is already token-driven, so a global density change is a token edit, not a 7-primitive rewrite.**

### 1 · First lever — the density tokens in `styles.css`

Volt's controls and rows read the five `--control-*` / `--row-*` variables (§5). To rescale the whole UI's compactness in one move, edit those values in `src/styles.css` — e.g. drop `--control-height` from `1.75rem` (28px) to a tighter value, or bump `--row-padding-y`. Every input, select, default/`sm`/`icon` button, and token-driven row rescales in lockstep. This is the first thing to try; it often is the entire density pass.

### 2 · Verify the flat, dense look holds

Volt already ships the Polaris-dense taste; confirm nothing drifted:

- Buttons/inputs read from `--control-height` (no stray `h-9`/`h-10` on chrome — those are reserved for `md`/`lg` CTAs).
- Inputs/buttons are flat: 1px border, no `shadow-sm`, no inset-depth trick (shadows belong on popovers / dropdowns / dialogs only).
- Borders are solid `border-border` / `border-input`, not opacity-dimmed (`/40`, `/60`, `/80`) on chrome edges.
- Table headers use the legibility flavor (`text-[12px] font-semibold text-foreground` on `bg-muted/50`), not tiny uppercase gray; body cells use `text-foreground` or `/70`, never `text-muted-foreground` for scanned columns (§29.7).
- Sidebar section labels are mixed-case `text-[12px] font-semibold text-foreground/70`, inactive nav items `text-foreground/80` (not `text-muted-foreground`) — §29.8.

### 3 · Sweep any per-page drift (blunt regexes — spot-check after)

```bash
# opacity-dimmed chrome borders → solid
rg -l "border-(border|input)/(20|30|40|50|60|70|80)" src/routes src/components
# muted-foreground on body cells / chrome the user scans
rg -l "text-muted-foreground" src/routes | head
# raw <select> that should be NativeSelect / Select
rg -n "<select" src/routes src/components
# hardcoded control heights that should read the token
rg -n "h-9|h-10|text-\[14px\]" src/routes src/components/ui
```

Revert any hit where the opacity/size was intentional (subtle dividers, hero CTA `lg`). Fix at the primitive or the token, not per call-site.

### 4 · Cursor-pointer holds at the primitive base

`cursor-pointer` is baked into the Button cva base, the Dialog close X, and `styles.css` bakes it onto interactive roles app-wide (§20). Don't add it per call-site. Grep for leaks on any custom clickable `<div>`: `rg "onClick=\{" src/ | rg -v "cursor-pointer"`.

### 5 · Don't ship mixed density, don't patch one page

Commit the whole app to one density in a single pass (a token edit, ideally). A tighter button next to an untouched input reads as broken. After the pass, tell the user which token(s) changed and any sweep counts, then stop until new feedback.
