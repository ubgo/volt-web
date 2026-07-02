# Code Standards

**Read this before writing or editing any code.** These are the standing engineering rules for this repo — apply them by default without being re-asked. Adapted from the `satl-code-standards` universal skill, with this repo's concrete stack rules filled in (§3).

## 1 · The four pillars — apply to EVERY change

### 1.1 Full type safety — no escape hatches

- 100% type safety. **Banned:** `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, and non-null `!` used to dodge a real check. No "just this once" — if you reach for one, solve the type instead.
- Genuinely unknown shapes use `unknown` and are narrowed with a type guard or a Zod parse. Never silence the checker.
- The only place an untyped runtime value enters the type system is a **system boundary** (network response, JSON, env var) — and there it MUST pass through a Zod schema that returns a typed result. The `unknown` never leaks past that line.
- Prefer the type system to runtime checks: discriminated unions, branded/opaque id types, exhaustive `switch` with a `never` default arm.
- The build IS the test: a change isn't done until `pnpm exec tsc --noEmit` (or `task typecheck`) passes clean.

### 1.2 Zero hardcoded strings / magic numbers for closed-set values

- Any closed-set value — status, kind, role, sort key, event name, route segment, cache-key prefix — gets a named constant/`as const` union, defined once, referenced everywhere. Never a bare literal at the use site.
- Keep a canonical iteration list beside the constants (an `as const` array) so seeds, UI lists, and aggregations read from one source — read and write paths never diverge.
- Grep test: any string literal compared with `===` or used as a `case` label / object key is either a named constant or a documented exception (free-form user text, or an upstream wire-format field kept verbatim).
- Magic numbers get the same treatment — a named constant or a **design token**, never `width: 387` / `timeout: 30000` inline.

### 1.3 Context-dense comments — a fresh session loses nothing

- **Every exported function, type, and constant gets a doc comment** stating *what it does*, *why it exists* (the non-obvious reason), and any *invariant/gotcha* a caller must respect. Comment intent and constraints, not mechanics (`// increment i` adds nothing).
- **Document multi-shape fields at the declaration** — if a field/payload/param can hold more than one shape, enumerate every shape in the comment right there, no sidecar docs.
- **Document non-obvious framework rules where they're used**, not in a far-away README (e.g. an SSR/hydration gotcha goes next to the code).
- **Explain the why for any workaround or "looks wrong but intentional" block**, so a future editor doesn't "fix" it and reintroduce the bug.
- Target: a reader who has never seen the file can answer "why does this exist and what breaks if I change it?" from the comments alone.

### 1.4 Modular, importable, no AI slop

- Organize so a unit can be lifted into another project: clear boundaries, no hidden coupling to app-global singletons, dependencies injected not reached-for.
- One responsibility per file, named for what it owns. No 800-line `utils` grab-bag, no kitchen-sink components.
- Intentional public surface: export what callers need, keep the rest private; barrel/index re-exports the surface.
- Slop smells to avoid: dead scaffolding, copy-pasted near-duplicate blocks instead of a shared helper, generic names (`data`, `handleStuff`, `Manager`), commented-out code, and stubs that silently return empty (a data-returning stub must error or warn).
- **Reuse before rebuild:** if a shared component/helper already exists (esp. in `src/components/ui`), extend it — don't hand-roll a local duplicate.

## 2 · Checklists

### 2.1 Pre-flight (before writing code)

- [ ] **Shared resources** — grep every reader/writer of any field/column/env var/public API I'll touch; list them `file:line`; confirm compatibility.
- [ ] **Constants** — every closed-set value has a named constant + canonical iteration list.
- [ ] **Types** — every shape expressed; no escape hatch planned; ids branded where confusable.
- [ ] **Reuse** — does a shared component/helper already exist? Extend it.
- [ ] **Empty / fallback path** — the zero/nil/missing case has a defined graceful degradation (not a crash, not a silent zero).
- [ ] **Module boundary** — where does this live so it's importable? Dependencies injected.

### 2.2 Post-flight (before saying "done")

- [ ] **Build passes** — `pnpm exec tsc --noEmit` clean (type safety verified, not assumed).
- [ ] **Lint/format** — `task check` (Biome) clean.
- [ ] **Comments** — every new exported symbol has a why-and-invariant doc comment; multi-shape fields documented at the declaration; workarounds explain themselves.
- [ ] **Hardcoded-value grep** — diff has no bare closed-set literals and no magic numbers.
- [ ] **Run twice / inverse / lossy-diff** — idempotent on re-run; opposite direction tested; every source field reached the destination or is documented as dropped.
- [ ] **Blast radius** — `git diff`; for each removed/renamed symbol, grep for callers.

## 3 · This repo's stack rules (concrete)

The pillars above are the floor; these are the specifics for this TanStack Start / TypeScript / React codebase. On conflict, `CLAUDE.md` / `volt/CLAUDE.md` win.

- **Env:** never read `process.env` directly. Use the typesafe objects — `env` from `@/env/server` (server) and the client env, `drizzleEnv` from `@/integrations/drizzle/env`. New env vars are declared in the schema (`@t3-oss/env-core` + Zod), never accessed raw.
- **Generated code is read-only:** never hand-edit `src/generated/**` (gqlkit SDK) or `src/routeTree.gen.ts`. Regenerate (`task gqlkit:all`; the router plugin regenerates the tree).
- **Styling is token-first:** density (height/padding/font) and colors are CSS variables in `src/styles.css`, with a `.dark` value for every token. Change tokens, don't hardcode per-component sizing. Dark mode = the `.dark` class.
- **UI components** come from basecn (Base UI): `pnpm dlx shadcn@latest add https://basecn.dev/r/<name>.json`. Reuse `src/components/ui` before building new. Status/tone via the shared `StatusBadge`.
- **Routing & titles:** file-based routes (TanStack Router); per-route document titles are typesafe via `seo()` in `src/lib/seo.ts` + the route `head` option.
- **Validation:** Zod v4 at every boundary (forms, RPC input, env, API responses).
- **Boundaries stay modular:** integrations live self-contained under `src/integrations/*`; demo/example code stays quarantined under `src/routes/demo` + `src/demo`.

## 4 · Non-negotiables

- When a pillar is about to be violated, **stop and ask** — don't "just this once" it.
- **Never auto-commit** — the user reviews and decides each commit. Conventional commits; no AI attribution (see [git-commit.md](git-commit.md)).
- Markdown: single physical line per paragraph (no hard-wrap).
