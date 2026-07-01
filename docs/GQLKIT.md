# GraphQL SDK (gqlkit)

Volt talks to GraphQL backends through [**gqlkit**](https://github.com/ubgo/gqlkit) — a schema-first code generator that produces a fully-typed, fluent TypeScript SDK. There is no `graphql-codegen`, no hand-written operation strings, and no React Query hook generation: you get typed builder classes (`QueryRoot`, `MutationRoot`) that construct and execute operations against a runtime client.

This is the same setup used by the `sync_tanstack` reference frontend.

---

## Table of Contents

1. [How it works](#how-it-works)
2. [Directory layout](#directory-layout)
3. [Prerequisites](#prerequisites)
4. [Taskfile commands](#taskfile-commands)
5. [The runtime clients](#the-runtime-clients)
6. [Writing queries and mutations](#writing-queries-and-mutations)
7. [Scalar bindings](#scalar-bindings)
8. [Regenerating after a schema change](#regenerating-after-a-schema-change)
9. [Troubleshooting](#troubleshooting)

---

## How it works

The pipeline is two steps — fetch the schema, generate the SDK — both driven by the `gqlkit` Go CLI:

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

At runtime, the generated `QueryRoot` / `MutationRoot` classes wrap a `GraphQLClient` from the `gqlkit-ts` npm package. You call fluent, typesafe builder methods; the client serializes the operation and executes it over `fetch`.

---

## Directory layout

```
project root
├── Taskfile.yml                            # gqlkit:fetch / gqlkit:gen / gqlkit:all
└── src/
    ├── scripts/api/
    │   ├── config.jsonc                    # scalar → TS type bindings (generator config)
    │   └── schema-introspected.graphql     # the fetched SDL (source of generation)
    ├── generated/sdk/                      # generated TypeScript SDK (checked in)
    │   ├── builder/  enums/  fields/  inputs/
    │   ├── queries/  mutations/  scalars/  types/
    │   └── …
    └── lib/
        └── gql-clients.ts                  # createAnonClient() / createApiClient()
```

The `gqlkit-ts` runtime is a normal dependency in `package.json`. The `gqlkit` and `gqlkit-sdl` **Go binaries** are the generators and must be on your `PATH` (see below).

---

## Prerequisites

The generator is a Go CLI, separate from the `gqlkit-ts` runtime dependency:

```bash
# Install the gqlkit + gqlkit-sdl binaries (once, globally)
curl -sL https://raw.githubusercontent.com/khanakia/gqlkit/main/gqlkit/install.sh | sh

# verify
gqlkit --version && gqlkit-sdl --version
```

You do **not** need these binaries to run the app — only to regenerate the SDK. The generated `src/generated/sdk/` is checked into git, so a fresh clone builds and runs without them.

---

## Taskfile commands

| Command | Description |
|---|---|
| `task gqlkit:fetch` | Introspect the live API and write `src/scripts/api/schema-introspected.graphql` |
| `task gqlkit:gen` | Generate the SDK at `src/generated/sdk` from the fetched SDL |
| `task gqlkit:all` | `fetch` then `gen` — the full regeneration in one shot |

`gqlkit:fetch` reads the endpoint from env vars (with defaults):

```bash
VITE_API_URL   # base URL, default https://sync-api.localhost
GQL_PKEY       # playground key for the introspection endpoint, default 1234
```

---

## The runtime clients

`src/lib/gql-clients.ts` exposes two factories over the `gqlkit-ts` `GraphQLClient`:

| Factory | Use for | Headers |
|---|---|---|
| `createAnonClient()` | public queries, login/register | none |
| `createApiClient()` | authenticated calls | `Authorization: Bearer <token>`, `X-Workspace-Id`, dev-only `X-Internal-Key` |

`createApiClient()` reads the access token and workspace id from `localStorage` **at request time** (not module load), so tokens set after login are always picked up. The endpoint defaults to the sync dashboard API and is overridable with `VITE_GRAPHQL_URL`.

> When you wire real auth, add a refresh-on-401 retry inside the `fetch` override in `gql-clients.ts` — see the reference project. Volt ships without it because it has no auth feature yet.

---

## Writing queries and mutations

Every operation goes through a generated root class. The builder is fully typed — field selection, arguments, and the result shape are all inferred:

```ts
import { QueryRoot } from "@/generated/sdk/queries";
import { createApiClient } from "@/lib/gql-clients";

const data = await new QueryRoot(createApiClient())
  .pimProducts()
  .workspaceId(workspaceId)
  .select((f) =>
    f.total().edges((e) =>
      e.node((n) => n.id().title().status()),
    ),
  )
  .execute(); // fully typed — no inline GraphQL strings
```

Mutations follow the same shape via `MutationRoot`:

```ts
import { MutationRoot } from "@/generated/sdk/mutations";
import { createApiClient } from "@/lib/gql-clients";

const result = await new MutationRoot(createApiClient())
  .pimProductCreate()
  .input({ workspaceId, title: "New product" })
  .select((f) => f.id().title())
  .execute();
```

Pair these with TanStack Query as usual — put the `execute()` call in a `queryFn` / `mutationFn`. See the live example at **`/demo/gqlkit`** in the running app.

---

## Scalar bindings

Custom GraphQL scalars are mapped to TypeScript types in `src/scripts/api/config.jsonc`. This is the **only** generator config — the endpoint and auth live at runtime in `gql-clients.ts`, not here.

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

---

## Regenerating after a schema change

When the backend schema changes:

```bash
task gqlkit:all      # fetch the new SDL + regenerate the SDK
pnpm exec tsc --noEmit   # confirm the app still type-checks against the new SDK
```

Commit the regenerated `src/generated/sdk/` along with your code. Because the SDK is checked in, teammates and CI don't need the Go binaries to build.

---

## Troubleshooting

### `gqlkit: command not found`

The Go binaries aren't on your `PATH`. Install them (see [Prerequisites](#prerequisites)). You only need them to regenerate — the app runs off the checked-in SDK without them.

### `task gqlkit:fetch` fails / introspection rejected

The introspection endpoint requires the right playground key. Set `GQL_PKEY` (and `VITE_API_URL`) to match your backend before running. If introspection is disabled on the instance, generate from a schema SDL file you already have instead of fetching.

### The demo shows "Unreachable"

`/demo/gqlkit` runs a live `{ __typename }` round-trip. Check that `VITE_GRAPHQL_URL` points at a reachable endpoint and that the backend allows your origin (CORS).

### Types are stale after a schema change

You edited the schema but didn't regenerate. Run `task gqlkit:all` and re-run `tsc`.
