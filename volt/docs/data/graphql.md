# GraphQL SDK (gqlkit)

If your app talks to an external GraphQL backend, Volt gives you a fully-typed way to do it. It uses [**gqlkit**](https://github.com/khanakia/gqlkit) — a schema-first code generator that produces a fluent, typesafe TypeScript SDK. There are no hand-written query strings, no `graphql-codegen`, and no generated hooks: you get typed builder classes (`QueryRoot`, `MutationRoot`) that construct and execute operations against a runtime client.

This layer is **optional**. Volt itself doesn't require a GraphQL backend — if you don't need one, skip this doc and [remove the module](#removing-graphql). It's included because Volt's own reference app (`sync_tanstack`) uses it to talk to a Go dashboard API.

## How it works

The pipeline is two steps, both driven by the `gqlkit` Go CLI: fetch the schema, then generate the SDK.

```
live API ──gqlkit-sdl fetch──> src/scripts/api/schema-introspected.graphql
                                     │
                         gqlkit generate-ts (+ config.jsonc)
                                     │
                                     ▼
                             src/generated/sdk/   (typed builder classes)
                                     │
                   new QueryRoot(createApiClient()).<field>()…execute()
```

At runtime the generated `QueryRoot` / `MutationRoot` classes wrap a `GraphQLClient` from the `gqlkit-ts` npm package. You call fluent, typed builder methods; the client serializes the operation and executes it over `fetch`.

## What's in the box

| Path | What it is |
|---|---|
| `src/generated/sdk/` | The generated SDK (`builder/`, `queries/`, `mutations/`, `inputs/`, `types/`, `enums/`, `scalars/`, `fields/`). Checked into git. **Never edit by hand.** |
| `src/lib/gql-clients.ts` | The runtime clients — `createAnonClient()` and `createApiClient()`. |
| `src/scripts/api/config.jsonc` | The only generator config: custom scalar → TypeScript type bindings. |
| `src/scripts/api/schema-introspected.graphql` | The fetched SDL that generation reads from. |
| `Taskfile.yml` (repo root) | The `gqlkit:fetch` / `gqlkit:gen` / `gqlkit:all` tasks. |

The `gqlkit-ts` runtime is an ordinary `package.json` dependency. The `gqlkit` and `gqlkit-sdl` **Go binaries** are only the generators — you don't need them to run the app, because `src/generated/sdk/` is committed. A fresh clone builds and runs without them.

## Install the generator (only to regenerate)

The generator is a Go CLI, separate from the `gqlkit-ts` runtime dependency:

```bash
curl -sL https://raw.githubusercontent.com/khanakia/gqlkit/main/gqlkit/install.sh | sh
gqlkit --version && gqlkit-sdl --version
```

## The runtime clients

`src/lib/gql-clients.ts` gives you two factories over the `gqlkit-ts` `GraphQLClient`:

| Factory | Use for | Headers |
|---|---|---|
| `createAnonClient()` | public queries, login/register | none |
| `createApiClient()` | authenticated calls | `Authorization: Bearer <token>`, `X-Workspace-Id`, and a dev-only `X-Internal-Key` |

`createApiClient()` reads the access token and workspace id from `localStorage` **at request time** (not module load), so tokens set after login are always picked up, and it's SSR-safe (returns null on the server). The endpoint defaults to the sync dashboard API and is overridable with `VITE_GRAPHQL_URL`. See [../configuration.md](../configuration.md) for the full env list.

When you wire real auth, add a refresh-on-401 retry inside the `fetch` override in `gql-clients.ts` — see the reference project. Volt ships without it because it has no auth feature yet.

## Writing queries and mutations

Every operation goes through a generated root class. Field selection, arguments, and the result shape are all inferred:

```ts
import { QueryRoot } from "@/generated/sdk/queries"
import { createApiClient } from "@/lib/gql-clients"

const data = await new QueryRoot(createApiClient())
  .pimProducts()
  .workspaceId(workspaceId)
  .select((f) =>
    f.total().edges((e) => e.node((n) => n.id().title().status())),
  )
  .execute() // fully typed — no inline GraphQL strings
```

Mutations follow the same shape through `MutationRoot`:

```ts
import { MutationRoot } from "@/generated/sdk/mutations"
import { createApiClient } from "@/lib/gql-clients"

const result = await new MutationRoot(createApiClient())
  .pimProductCreate()
  .input({ workspaceId, title: "New product" })
  .select((f) => f.id().title())
  .execute()
```

Pair these with TanStack Query the usual way — put the `execute()` call inside a `queryFn` or `mutationFn`. There's a live example at **`/demo/gqlkit`** in the running app that does a `{ __typename }` round-trip to show the client is reachable.

## Scalar bindings

Custom GraphQL scalars map to TypeScript types in `src/scripts/api/config.jsonc`. This is the **only** generator config — the endpoint and auth live at runtime in `gql-clients.ts`, not here:

```jsonc
{
  "bindings": {
    "Cursor": "string",
    "Time": "string",
    "JSON": "Record<string, unknown>",
    "JsonSlice": "unknown",
    "Map": "Record<string, unknown>",
    "Password": "string",
    "Uint": "number",
    "Uint64": "string"
  }
}
```

Add a binding whenever the backend introduces a new custom scalar, then regenerate.

## Regenerating after a schema change

```bash
task gqlkit:all          # fetch the new SDL + regenerate the SDK
pnpm exec tsc --noEmit   # confirm the app still type-checks against it
```

`task gqlkit:fetch` reads the introspection endpoint from env vars: `VITE_API_URL` (base URL, default `https://sync-api.localhost`) and `GQL_PKEY` (playground key, default `1234`). Commit the regenerated `src/generated/sdk/` with your code — because it's checked in, teammates and CI don't need the Go binaries.

## Troubleshooting

- **`gqlkit: command not found`** — the Go binaries aren't on your `PATH`. Install them (above); you only need them to regenerate.
- **`task gqlkit:fetch` fails / introspection rejected** — set `GQL_PKEY` and `VITE_API_URL` to match your backend. If introspection is disabled, generate from an SDL file you already have instead of fetching.
- **The demo shows "Unreachable"** — `/demo/gqlkit` runs a live round-trip. Check that `VITE_GRAPHQL_URL` points at a reachable endpoint and that the backend allows your origin (CORS).
- **Types are stale after a schema change** — you edited the schema but didn't regenerate. Run `task gqlkit:all` and re-run `tsc`.

## Removing GraphQL

If you don't need GraphQL: delete `src/generated/sdk/`, `src/lib/gql-clients.ts`, `src/scripts/api/`, and the `/demo/gqlkit` route; remove the `gqlkit:*` tasks from the root `Taskfile.yml`; drop the gqlkit env vars from `.env`; and `pnpm remove gqlkit-ts`. Grep for `@/generated/sdk` and `gql-clients` to catch stray imports.

## Next / Related

- [rpc.md](rpc.md) — the built-in typesafe RPC layers (tRPC / oRPC) for your own server functions.
- [database.md](database.md) — the Drizzle + PostgreSQL module.
- [../configuration.md](../configuration.md) — the gqlkit env vars and the typesafe env system.
- [../../rules/code-standards.md](../../rules/code-standards.md) — the engineering bar for changes.
