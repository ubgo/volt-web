# Design system

Volt ships a token-driven design system: a set of owned UI components, a compact control-density token scale, an oklch color palette with light and dark values, and FOUC-safe theming. This page is the tour. For the verbatim engineering rules (className patterns, ship-gate taste, component conventions) see [`../rules/frontend.md`](../rules/frontend.md).

## What the components are built on (and what they are NOT)

Volt's UI components come from **basecn** — the Base UI port of shadcn. When you add a component you get source code copied into `src/components/ui/`, which you own outright. Under that source, the interactive primitives depend on **[`@base-ui/react`](https://base-ui.com)**, styled with **Tailwind CSS v4** and variant-managed with **class-variance-authority (CVA)**.

Two corrections worth stating plainly, because the ecosystem naming is confusing:

- Volt is **not built on Radix UI.** The classic shadcn/ui distribution wraps Radix primitives; basecn swaps that layer for Base UI. There is no `@radix-ui/*` dependency in Volt.
- There is **no shadcn runtime package.** Nothing imports from `shadcn` at runtime. The CLI is a one-time code generator; after it copies a component, the only runtime deps are `@base-ui/react`, CVA, `clsx`, `tailwind-merge`, and `lucide-react` for icons.

A practical consequence of the Base UI port: triggers compose with the `render` prop, not shadcn's `asChild`. For example `<DropdownMenuTrigger render={<Button …/>} />` (see `src/components/theme-toggle.tsx`). Keep that in mind when you copy snippets from the wider shadcn community — they usually assume Radix + `asChild`.

## The component library

There are 35 components in `src/components/ui/`: 34 basecn primitives plus the bespoke `ServerDataTable` (its own subdirectory — see [Building a page](building-a-page.md)). The primitives, grouped:

| Group | Components |
|---|---|
| Form controls | `button`, `input`, `textarea`, `label`, `checkbox`, `radio-group`, `switch`, `select`, `native-select`, `combobox`, `slider`, `toggle`, `toggle-group`, `calendar` |
| Overlays | `dialog`, `sheet`, `popover`, `dropdown-menu`, `hover-card`, `tooltip`, `command` |
| Layout & structure | `card`, `accordion`, `collapsible`, `tabs`, `separator`, `scroll-area`, `table`, `breadcrumb` |
| Feedback & status | `alert`, `badge`, `progress`, `skeleton`, `avatar` |

Every one imports from `@/components/ui/<name>`. You can open and edit any of them — they are your source, not a vendored dependency.

### The in-app gallery

Run the app and open **`/demo/components`** for a live gallery of the primitives with their variants rendered in both light and dark. It is the fastest way to see what each component looks like before you reach for it. The demo is fully isolated under `src/routes/demo/` + `src/demo/` — delete both to strip it.

## Adding a component

Use the basecn registry, not the default shadcn registry. Pass the full basecn registry URL to the shadcn CLI:

```bash
pnpm dlx shadcn@latest add https://basecn.dev/r/<name>.json
```

The CLI reads `components.json` (style `new-york`, base color `zinc`, CSS variables on, icon library `lucide`, css at `src/styles.css`, `rsc: false` for TanStack Start) and writes the component into `src/components/ui/`, installing any Base UI subpackage it needs. After that the component is ready to import — no extra wiring.

## Design tokens

All tokens live in [`src/styles.css`](../../src/styles.css). Change them there; do not hardcode per-component sizing or colors. See [`../rules/frontend.md`](../rules/frontend.md) §5 for the full token rules.

### Fonts — system stacks

Volt uses native system font stacks, not bundled webfonts. `body` renders in the OS UI stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, …) and `code` in the system monospace stack (`source-code-pro`, `Menlo`, `Monaco`, `Consolas`, …). Nothing to download, no layout-shift on load.

### Control density

The compactness of the whole UI is driven by five CSS variables defined once in `:root`. Every input, select, native-select, combobox, default button, and every data-table row reads them, so changing one value rescales the app in lockstep. The defaults hit a Polaris-grade 28px control / 13px row baseline:

| Variable | Default | Controls |
|---|---|---|
| `--control-height` | `1.75rem` (28px) | input / select / button height |
| `--control-padding-x` | `0.625rem` (10px) | horizontal field padding |
| `--control-font-size` | `0.75rem` (12px) | field + control text size |
| `--row-padding-y` | `0.375rem` (6px) | table / list row vertical padding |
| `--row-font-size` | `0.8125rem` (13px) | table / list row text size |

Components consume these with Tailwind v4's functional-variable syntax so the token is the single source of truth — e.g. `h-(--control-height)`, `px-(--control-padding-x)`, `text-(length:--control-font-size)`. You can see this in `src/demo/form/form-kit.tsx` (`ReadonlyValue`, `StatusBadge`), which is why a read-only value can never drift taller or shorter than the editable input beside it.

### Colors — oklch, light + dark

Colors are defined in the oklch color space, with a complete set under `:root` (light) and a matching set under `.dark`. Because every semantic token has a dark value, dark mode "just works" — no per-component dark styling. Each color pairs with a `-foreground` for readable text on top of it. The semantic tokens: `background`/`foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1`…`chart-5`, and the `sidebar-*` set. The `@theme inline` block maps each CSS variable to a Tailwind color utility, so `bg-primary`, `text-muted-foreground`, `border-border`, etc. all resolve to your tokens.

### Radius

One knob: `--radius` (`0.625rem`). Everything else derives from it — `--radius-sm` is `calc(var(--radius) - 4px)`, `-md` is `-2px`, `-lg` is the base, `-xl` is `+4px`. Components use `rounded-sm|md|lg|xl` and follow whatever you set.

## Theming & dark mode

Dark mode is the **`.dark` class** on `<html>`, wired via `@custom-variant dark (&:is(.dark *))` in `styles.css`. The whole palette is token-driven, so flipping the class re-themes the entire app instantly — no context provider, no per-component work.

The theme logic lives in [`src/lib/theme.ts`](../../src/lib/theme.ts):

- `applyTheme(theme)` toggles `.dark` and also sets `document.documentElement.style.colorScheme` inline. Setting `color-scheme` paints the browser canvas dark immediately — even before the stylesheet loads — which is what kills the white flash (FOUC).
- `setTheme(theme)` persists the choice to `localStorage` and applies it with all CSS transitions momentarily disabled, so the switch is instant rather than a flickery cross-fade of every `transition-colors` element.
- `THEME_INIT_SCRIPT` is a dependency-free inline script injected into `<head>` before paint. It reads the stored preference and sets `.dark` before the first render, so a returning dark-mode user never sees a light flash on load. It is emitted from the root document shell.

The user-facing switcher is `ThemeToggle` (`src/components/theme-toggle.tsx`) — a Light / Dark / System dropdown that lives in the sidebar header of `AdminShell`. On "System" it subscribes to the OS `prefers-color-scheme` media query and re-applies live.

## The `cn()` utility

`cn()` (from `@/lib/utils`) merges class names with `clsx` and resolves Tailwind conflicts with `tailwind-merge` (last class wins). Every component uses it for its `className` prop so callers can override styles safely: `cn("rounded-xl border bg-background", className)`. Reach for it any time you conditionally compose classes.

## Next / Related

[Building a page](building-a-page.md) · [Getting started](getting-started.md) · [Branding](branding.md) · [Configuration](configuration.md) · [Frontend rules](../rules/frontend.md) · [Code standards](../rules/code-standards.md) · [Docs home](README.md)
