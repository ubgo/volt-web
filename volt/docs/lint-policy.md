# Frontend lint policy

The biome linter runs at full strength: the recommended preset with **no per-rule off-switches, no severity downgrades, and no per-line `// biome-ignore` suppressions in hand-written code** — findings are fixed at the root cause. `pnpm lint` exits 0 with zero findings. (History note: the boilerplate once shipped an `overrides` block turning off `useExhaustiveDependencies`, `noArrayIndexKey`, and several a11y rules for `components/ui` + demos; that block was removed 2026-08-22 and every finding fixed for real — do not reintroduce it.)

## The one exclusion: generated code

`files.includes` in `biome.json` excludes generated artifacts:

- `src/generated/**` — the gqlkit SDK (generated from the GraphQL schema).
- `src/routeTree.gen.ts` — TanStack Router output.

These are **tool output, not hand-maintained code** — linting them lints the generator, not our source. Excluding them at the config level is the sanctioned way to scope a linter off generated artifacts (it's not silencing a finding in code we own).

## Notable fixes worth remembering

These patterns came from real remediations (most on the sync fork, ported back here); if you touch these areas, keep the pattern:

- **`useExhaustiveDependencies`** — fixed structurally, never by suppressing: lazy `useState` initializers for hydrate-once values, functional `setState` for reset-on-key effects, the render-phase "previous value" compare for reset-on-change, `useCallback` for effect-referenced callbacks, and the ref-latest pattern (hold changing values in a ref so an effect fires only on its true triggers).
- **`noArrayIndexKey`** — placeholder lists (skeleton rows, slider thumbs, loading cards) never reorder but still must not use the index argument as key: use `stableKeys(prefix, count)` from `src/lib/react-keys.ts`, which maps over pre-built string keys instead.
- **`noLabelWithoutControl` (`ui/label.tsx`)** — the `<Label>` primitive renders an explicit `htmlFor` and its `{children}`, so the label↔control association is statically visible. A self-closing forwarding `<label {...props} />` is NOT enough — biome can't verify it. Prefer `labelClassName` + a native `<label htmlFor>` at call sites when you don't need the component.
- **`useValidAnchor` / `useAnchorContent` (`ui/breadcrumb.tsx`)** — a Base-UI-style component whose default render was a bare `<a />` fails statically even though props merge in later. Default the render to `<a {...props} />` instead, so the caller's `href` + children flow into the literal; pass `render={<Link …/>}` for router links.
- **Non-interactive "current" items** — `BreadcrumbPage` is a plain `<span aria-current="page">`, no `role="link"`, no `aria-disabled`: the current page is not a link (WAI-ARIA breadcrumb pattern), so giving it a link role only creates an unfocusable fake link.
- **`noStaticElementInteractions` / `useSemanticElements` (interactive widgets)** — an interactive container that must nest its own controls can't be a native `<button>`: split the primary action into a stretched/sibling `<button>` (positioned to cover the tile, nested controls above via z-index) instead of putting `role="button"` on the container.
