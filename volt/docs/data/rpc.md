# Typesafe RPC (tRPC and oRPC)

Volt ships **two** end-to-end typesafe RPC layers side by side: [tRPC v11](https://trpc.io/) and [oRPC](https://orpc.dev/). Both are wired, both integrate with TanStack Query, and both back the same todo CRUD demo so you can compare them directly. You pick one for your app and delete the other — this doc shows how each works and how to choose.

## Why two?

They solve the same problem — call server functions from the client with full type inference and no code generation — with different tradeoffs. tRPC is the mature, ubiquitous default with a huge ecosystem. oRPC is newer, leaner, generates an OpenAPI-compatible contract, and needs no React provider. Volt includes both so you can evaluate them against your real code before committing.

You are not meant to keep both. Once you've chosen, [remove the other](#pick-one-delete-the-other).

## Side-by-side wiring

Each layer is a self-contained module with an identical folder shape:

| Piece | tRPC | oRPC |
|---|---|---|
| Module | `src/integrations/trpc/` | `src/integrations/orpc/` |
| Init | `init.ts` — `initTRPC.create()` with superjson | `init.ts` — the base `os` instance from `@orpc/server` |
| Procedures | `procedures/index.ts` — `publicProcedure` | `procedures/index.ts` — `publicProcedure` |
| Routers | `routers/{todos,posts}.ts` + `routers/index.ts` | `routers/{todos,posts}.ts` + `routers/index.ts` |
| Input schemas | `routers/schema/` (Zod) | `routers/schema/` (Zod) |
| Client glue | `react.ts` — `TRPCProvider` + `useTRPC` | `react.ts` — `ORPCClient` type + `createORPCQueryUtils` |
| Server route | `src/routes/api.trpc.$.tsx` (`/api/trpc/*`) | `src/routes/api.orpc.$.tsx` (`/api/orpc/*`) |
| Demo page | `src/routes/demo/trpc-todo.tsx` | `src/routes/demo/orpc-todo.tsx` |

The clients for both are created once in the shared context factory `getContext()` at `src/integrations/tanstack-query/root-provider.tsx`. It builds a tRPC options proxy (`createTRPCOptionsProxy`) and oRPC query utils (`createTanstackQueryUtils`) and puts them on the router context as `context.trpc` and `context.orpc`, alongside the single `queryClient`.

### How a request flows

Both handlers are catch-all API routes that hand the request to the framework adapter:

```ts
// src/routes/api.trpc.$.tsx — tRPC
fetchRequestHandler({ req: request, router: trpcRouter, endpoint: "/api/trpc" })

// src/routes/api.orpc.$.tsx — oRPC
new RPCHandler(orpcRouter).handle(request, { prefix: "/api/orpc", context: {} })
```

On the client, both are exposed through TanStack Query. The difference is how you reach them: tRPC uses a React context hook (`useTRPC()`), oRPC uses the utils object off the route context (`Route.useRouteContext().orpc`).

## The routers

The starter routers are intentionally simple — an in-memory array of todos with `list`, `add`, `update`, `toggle`, `delete`. The two implementations are nearly identical; the differences are purely the RPC library's API.

tRPC separates queries from mutations and uses `TRPCError`:

```ts
// src/integrations/trpc/routers/todos.ts
export const todosRouter = {
  list: publicProcedure.query(() => todos),
  add: publicProcedure.input(addTodoInputSchema).mutation(({ input }) => {
    const newTodo = { id: nextId++, name: input.name, completed: false }
    todos.push(newTodo)
    return newTodo
  }),
  // update / toggle / delete …
} satisfies TRPCRouterRecord
```

oRPC uses a single `.handler()` for everything and `ORPCError`, and the router is a plain object:

```ts
// src/integrations/orpc/routers/todos.ts
export const todosRouter = {
  list: publicProcedure.handler(async () => todos),
  add: publicProcedure.input(addTodoInputSchema).handler(async ({ input }) => {
    const newTodo = { id: nextId++, name: input.name, completed: false }
    todos.push(newTodo)
    return newTodo
  }),
  // update / toggle / delete …
}
```

Both share the exact same Zod input schemas pattern in `routers/schema/`, and both aggregate their domain routers in `routers/index.ts`. To back these with the real database, drop a `db` query into the handler body — see [database.md](database.md).

## Using it in a component

The demos at `/demo/trpc-todo` and `/demo/orpc-todo` are the same CRUD screen built on each layer — a good copy-paste reference. Both prefetch the list in the route loader and use TanStack Query's `useQuery` / `useMutation`.

tRPC reaches the API through the `useTRPC()` hook:

```tsx
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/integrations/trpc/react"

const trpc = useTRPC()
const { data: todos = [] } = useQuery(trpc.todos.list.queryOptions())
```

oRPC reaches it through the router context — no provider or hook import needed:

```tsx
import { useQuery } from "@tanstack/react-query"

const { orpc } = Route.useRouteContext()
const { data: todos = [] } = useQuery(orpc.todos.list.queryOptions())
```

From there both are identical: `useMutation({ ...x.todos.add.mutationOptions(), onSuccess })`, `queryClient.invalidateQueries({ queryKey: x.todos.list.queryKey() })`, and loader prefetch via `context.queryClient.prefetchQuery(context.<trpc|orpc>.todos.list.queryOptions())`.

## API differences at a glance

| | tRPC | oRPC |
|---|---|---|
| Init | `initTRPC.create()` | `os` from `@orpc/server` |
| Handlers | `.query()` / `.mutation()` (split) | `.handler()` (unified) |
| Root router | `createTRPCRouter({ … })` | plain object `{ … }` |
| Errors | `throw new TRPCError({ code, message })` | `throw new ORPCError("CODE", { message })` |
| Server adapter | `fetchRequestHandler` | `RPCHandler` from `@orpc/server/fetch` |
| Client access | `useTRPC()` React hook (needs `TRPCProvider`) | `Route.useRouteContext().orpc` (no provider) |
| Transformer | superjson (built in) | RPC serialization (built in) |

## When to use which

- **Choose tRPC** if you want the widely-adopted standard, the largest ecosystem of guides and middleware, and you're comfortable with a React context provider. It's the safe default.
- **Choose oRPC** if you want a leaner surface, no client provider, unified handlers, and an OpenAPI-compatible contract you can expose to non-TypeScript consumers later.

Both give you identical type safety and the same TanStack Query ergonomics, so this is a preference and roadmap call, not a capability gap.

## Pick one, delete the other

Once you've decided, remove the loser cleanly. To drop, say, oRPC:

1. Delete `src/integrations/orpc/`.
2. Delete `src/routes/api.orpc.$.tsx` and `src/routes/demo/orpc-todo.tsx`.
3. In `src/integrations/tanstack-query/root-provider.tsx` (`getContext()`), remove the oRPC client, the `createTanstackQueryUtils` call, and the `orpc` key on the returned context.
4. Uninstall the packages (`pnpm remove @orpc/server @orpc/client @orpc/tanstack-query`).
5. Grep for `orpc` to catch any stray imports or `Route.useRouteContext().orpc` reads.

Dropping tRPC is the mirror image: remove `src/integrations/trpc/`, the `api.trpc.$.tsx` route and `trpc-todo.tsx` demo, the `TRPCProvider` wrapper plus the tRPC client and options proxy from the context factory, then `pnpm remove @trpc/server @trpc/client @trpc/tanstack-react-query superjson` (keep superjson if anything else uses it).

## Next / Related

- [database.md](database.md) — back these routers with real Drizzle queries.
- [graphql.md](graphql.md) — the alternative for talking to an external GraphQL backend.
- [../configuration.md](../configuration.md) — the typesafe env system.
- [../../rules/code-standards.md](../../rules/code-standards.md) — the engineering bar for changes.
