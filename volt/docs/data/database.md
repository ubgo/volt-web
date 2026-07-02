# Database (Drizzle + PostgreSQL)

Volt ships with [Drizzle ORM](https://orm.drizzle.team/) over PostgreSQL, packaged as a self-contained module under `src/integrations/drizzle/`. Everything the database needs — its schema, client, migrations, env validation, and task commands — lives in that one folder, so you can adopt or remove it without touching the rest of the app.

> **Drizzle is optional.** Building an SPA or an app that only talks to an external API? Skip it: don't set `DATABASE_URL`, skip `task db:push`, and the app still builds (the central env leaves `drizzleEnv` out of its `extends` by default — see [../configuration.md](../configuration.md)). To strip it out completely, jump to [Removing the module](#removing-the-module).

## What you get

The module is small and readable. These are the files you'll actually work with:

| File | What it does |
|---|---|
| `src/integrations/drizzle/schema/` | Your table definitions (`users.ts`, `posts.ts`, and an `index.ts` barrel). This is where you spend most of your time. |
| `src/integrations/drizzle/client.ts` | Creates the `db` client from a `pg` connection pool and runs a `SELECT 1` boot health check. |
| `src/integrations/drizzle/env.ts` | Declares and validates `DATABASE_URL` as a standalone typesafe env (`drizzleEnv`). |
| `src/integrations/drizzle/config.ts` | Shared drizzle-kit config values (dialect, schema path, migrations output). |
| `src/integrations/drizzle/migrate.ts` | The migration runner invoked by `task db:migrate`. |
| `src/integrations/drizzle/migrations/` | Generated SQL migration files (commit these). |
| `src/integrations/drizzle/index.ts` | Barrel export — `db`, `drizzleEnv`, and every table. |
| `drizzle.config.ts` (repo root) | Thin wrapper drizzle-kit requires at the root; it just spreads `drizzleKitConfig` and adds `dbCredentials`. |

## Configure the connection

The database reads one variable, `DATABASE_URL`, a standard PostgreSQL connection string:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

Set it in `.env` (loaded by the Taskfile for db commands) or `.env.local` (loaded by the dev server). The `.env.example` in the repo root shows the expected format.

Unlike most env vars, `DATABASE_URL` is not declared in the central `src/env/server.ts`. The drizzle module owns it: `env.ts` validates it in isolation with `@t3-oss/env-core` and exports the result as `drizzleEnv`. The client then reads `drizzleEnv.DATABASE_URL` directly. If you also want it on the central `env` object, uncomment the `drizzleEnv` lines in `src/env/server.ts` (they merge it in via `extends: [drizzleEnv]`). See [../configuration.md](../configuration.md) for how env merging works.

## The db commands

Database tasks live in the module's own `Taskfile.yml` and are wired into the root Taskfile under the `db:` prefix, so you run them from anywhere in the repo:

| Command | What it does |
|---|---|
| `task db:push` | Push the current schema straight to the database — no migration files. Best while you're iterating on schema design. |
| `task db:generate` | Diff the schema against existing migrations and write a new SQL migration file for the changes. |
| `task db:migrate` | Apply pending migrations to the database, in order, via `migrate.ts`. |
| `task db:studio` | Open [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview), a browser GUI for inspecting and editing your data. |

Every command needs `DATABASE_URL` set. Push and studio are development conveniences; generate + migrate are what you use once the schema stabilizes and for anything production-bound.

## Working with the schema

Tables are defined with Drizzle's `pgTable` helper. The starter ships two related tables — `users` and `posts` — so you have a working example of a foreign key and the standard timestamp columns. Here's the shape (from `schema/posts.ts`):

```ts
import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"
import { users } from "./users"

export const posts = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  body: text().notNull(),
  authorId: integer()
    .notNull()
    .references(() => users.id),
  publishedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
```

To add a table, create a new file under `schema/` and re-export it from `schema/index.ts`. The `config.ts` schema path already points at the whole `schema/` directory, so new files are picked up automatically.

One convention to remember: the client is created with `casing: "snake_case"`. You write columns in **camelCase** in TypeScript (`createdAt`, `authorId`) and Drizzle maps them to **snake_case** in SQL (`created_at`, `author_id`). Don't hand-write the snake_case names.

## The migration workflow

Once your schema stops changing shape every hour, switch from `db:push` to real migrations:

1. Edit a file under `schema/`.
2. Run `task db:generate` — Drizzle writes a new SQL file into `migrations/`.
3. Read the generated SQL to confirm it does what you expect.
4. Run `task db:migrate` to apply it.
5. Commit the migration file alongside your code change.

Push versus migrate, side by side:

| | `db:push` | `db:generate` + `db:migrate` |
|---|---|---|
| Writes migration files | No | Yes |
| Tracks schema history | No | Yes |
| Safe for production | No | Yes |
| Good for early prototyping | Yes | No |

## Using the client

Import `db` and your tables from the module barrel and query with Drizzle's typed API:

```ts
import { eq } from "drizzle-orm"
import { db, users } from "@/integrations/drizzle"

// Select all
const allUsers = await db.select().from(users)

// Insert
await db.insert(users).values({ name: "Jane Doe", email: "jane@example.com" })

// Filter
const [jane] = await db
  .select()
  .from(users)
  .where(eq(users.email, "jane@example.com"))
```

Because the client is initialized with the full `schema`, the relational query API is available too:

```ts
import { db } from "@/integrations/drizzle"

const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.email, "jane@example.com"),
})
```

This is exactly what you'd drop into a tRPC or oRPC handler to back the demo todo/posts routers with real data — see [rpc.md](rpc.md), whose starter routers currently use in-memory arrays.

## Removing the module

Volt is a boilerplate, so removal is a first-class path. To strip Drizzle out: delete `src/integrations/drizzle/`, delete the root `drizzle.config.ts`, remove the `db:` include from the root `Taskfile.yml`, drop the (commented) `drizzleEnv` references in `src/env/server.ts`, and uninstall the deps (`pnpm remove drizzle-orm pg drizzle-kit @types/pg`). Then grep for any leftover imports from `@/integrations/drizzle`.

## Next / Related

- [rpc.md](rpc.md) — expose the database through tRPC or oRPC handlers.
- [../configuration.md](../configuration.md) — how `drizzleEnv` merges into the typesafe env system.
- [graphql.md](graphql.md) — the optional typed GraphQL SDK for talking to external backends.
- [../../rules/code-standards.md](../../rules/code-standards.md) — the engineering bar for changes.
