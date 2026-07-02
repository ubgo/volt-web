# Volt — brand guidelines & handover

The complete brand decision record for **Volt**, so any repo in the family (starting with the **Volt API** Go backend) uses the *same* name, colors, logo, and typography. This is the source of truth for the identity; the concrete assets and generator live alongside it in this `brand/` directory.

## 1. Name & family

- **Product name:** **Volt** (capitalized in prose; lowercase `volt` as a slug/package id).
- **Concept:** a lightning bolt — "Volt = powered-up, fast to start." The name reinforces the mark and vice-versa.
- **Handle (technical identity):** **`usevolt`** — use this wherever a unique string is needed:
  - Domain: `usevolt.dev`
  - GitHub org: `usevolt`
  - npm scope: `@usevolt/*`
- **Family / naming convention:** Volt is an umbrella over multiple starters. Suffix the surface:
  - **Volt Web** — the TanStack Start React frontend (this repo). Package `volt-web` / `@usevolt/web`.
  - **Volt API** — the Go backend starter. Package/repo `volt-api` / `@usevolt/api`.
  - Extend the same way for anything else (`Volt CLI`, `Volt UI`, …).

> Note: the bare npm package `volt` is taken by an unrelated project, so never publish a bare `volt` — always use the `@usevolt/*` scope or a `volt-<surface>` name. The **brand** name "Volt" is still ours to use as the product name.

## 2. Taglines

- **Volt Web:** "The batteries-included TanStack Start starter."
- **Volt API (suggested parallel):** "The batteries-included Go backend starter." — keep the "batteries-included … starter" cadence across the family.
- **OG / social subline pattern:** short feature list separated by `·`, e.g. `Design system · dual RPC · Drizzle · GraphQL · SSR` (swap for the backend's feature set).

## 3. Logo & mark

**The mark is a lightning bolt on a rounded, violet gradient tile.** It is the only per-product art — everything else (color tiles, favicon, wordmark, lockups, OG) reflows from it.

Geometry (so every surface stays identical):

- **512×512 master**, tile is a `rect` with corner radius **112** (≈ 22%).
- The bolt glyph, drawn in the 0–512 box, is a single path — reuse it verbatim:
  ```
  M286 96 L166 280 H240 L226 416 L346 232 H272 L286 96 Z
  ```
  Filled + stroked with the foreground color, `stroke-width="8"`, `stroke-linejoin="round"`.
- **Variants** swap the tile + foreground, never the geometry:
  - color tile (default) → white bolt
  - dark tile (on bright surfaces) → light bolt
  - light tile (on dark surfaces) → violet bolt
  - glyph-only (no tile, on white) → violet bolt
  - mono → `currentColor` (inherits text color; for terminals/print)
- **Favicon** uses the same bolt (it's legible at 16px — no detail to drop).

Don'ts: don't recolor outside the palette, don't rotate/stretch/skew the mark, don't add shadows or bevels (it's flat), keep clearspace ≥ 25% of the icon width.

## 4. Color

Violet gradient identity. Exact values (also machine-readable in [`palette.json`](palette.json) / [`tokens.json`](tokens.json) / [`tokens.css`](tokens.css)):

| Role | Value(s) | Use |
|---|---|---|
| **Tile gradient** | `#6366F1` → `#8B5CF6` | primary icon tile (indigo → violet) |
| **Accent** | `#7C3AED` | wordmark accent, links, highlights, the OG accent line |
| **Spark / light accent** | `#A78BFA` | subtle highlights on the color tile |
| **Foreground on tile** | `#FFFFFF` | the bolt on the color tile |
| **Dark tile** | `#4C1D95` → `#2E1065` | tile variant for bright surfaces; dark-mode backgrounds |
| **Dark foreground** | `#EDE9FE` | glyph/text on dark tiles |
| **Light tile** | `#EDE9FE` → `#DDD6FE` | tile variant for dark surfaces |

CSS variables (from `tokens.css`, prefix `--volt-`):

```css
--volt-tile-a: #6366F1;  --volt-tile-b: #8B5CF6;
--volt-accent: #A78BFA;  --volt-fg: #FFFFFF;
```

> For the backend, reuse these exact hex values. If a service needs a per-service tint, add a *tile variant* in the same violet family rather than picking a new hue — the family should read as one brand.

## 5. Typography

- **Display / wordmark:** **Space Grotesk**, with an **Inter → system-ui** fallback stack so anything without the webfont still renders cleanly. (The shipped raster assets were generated with the Inter fallback.)
- **Sans (body/UI):** **Inter**.
- **Mono:** **JetBrains Mono**.

Full stacks (from `tokens.css`):

```css
--volt-font-display: 'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif;
--volt-font-sans:    'Inter', ui-sans-serif, system-ui, sans-serif;
--volt-font-mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
```

All three are open-source (OFL), so they're free to self-host. Note: the Volt Web **app UI itself uses the system font stack**; Space Grotesk/Inter/JetBrains Mono are the *brand* fonts (wordmark, marketing, OG). The backend can adopt the same brand fonts for its docs/marketing.

## 6. The asset kit (this directory)

Everything is generated from one script so a color/name change reflows the whole set. **Never hand-edit the output SVG/PNG** — edit the generator or the manifest and regenerate.

| File | What |
|---|---|
| `brand.json` | the manifest (name, tagline, colors, fonts, topics, positioning) |
| `gen-brand.mjs` | the generator — the single source of truth for all art |
| `Taskfile.yml` | `task gen` / `raster` / `all` / `clean` |
| `icon.svg`, `volt-icon.svg` | primary color-tile icon (512 master) |
| `volt-icon-dark.svg`, `volt-icon-light.svg` | tile variants |
| `volt-glyph.svg` | bolt only, no tile |
| `volt-mono.svg` | single-color via `currentColor` |
| `favicon.svg`, `favicon.ico` | favicon (multi-res `.ico`: 16/32/48) |
| `volt-wordmark.svg` | the name in the display font |
| `volt-lockup.svg`, `volt-lockup-dark.svg` | icon + wordmark, horizontal |
| `og-cover.svg`, `og-cover-light.svg` | 1200×630 social cards (dark + light) |
| `palette.json`, `tokens.json`, `tokens.css` | design tokens |
| `png/` | rasters: favicons, apple-touch (180), icon 512/1024, OG covers, `og-social-1280.png` (GitHub social preview, 1280×640) |
| `README.md` | brand usage quick-reference |

Regenerate everything:

```bash
task -t volt/brand/Taskfile.yml all      # gen SVGs + tokens, then rasterize
# needs: node, rsvg-convert (or magick/inkscape/cairosvg), and ImageMagick for the .ico
```

## 7. Reusing Volt branding in another repo (e.g. Volt API)

The fastest, most consistent path — copy the generator, change only the name:

1. **Copy the `brand/` directory** into the backend repo.
2. In `brand/brand.json`, change `name` (e.g. `"volt-api"`), `repo`, `language: "go"`, `kind: "service"`, and the tagline/description/topics for the backend. **Keep the `brand` (colors) and `fonts` blocks identical.**
3. In `brand/gen-brand.mjs`, keep the `M` manifest colors/fonts and the **bolt `GLYPH()` body identical**; only the `name` differs. (If the backend wants a distinguishing accent, add a small secondary mark — but keep the bolt + violet tile so it reads as the same family.)
4. Run `task -t volt/brand/Taskfile.yml all` to emit the backend's own icon/favicon/OG set in the same identity.

If you don't want the generator, the minimum to match by hand:

- **Name:** Volt API · **handle:** `usevolt` (`@usevolt/api`, repo `volt-api`).
- **Mark:** the bolt path in §3 on the `#6366F1 → #8B5CF6` tile, radius 112 on a 512 master, white bolt.
- **Colors:** the table in §4.
- **Fonts:** the stacks in §5.

## 8. Summary of decisions (quick recap)

- Renamed the product to **Volt** (from a generic "Boilerplate"); mark = **lightning bolt**, palette = **violet gradient** (`#6366F1`→`#8B5CF6`, accent `#7C3AED`).
- Technical handle = **`usevolt`** (`usevolt.dev`, `@usevolt/*`, GitHub org `usevolt`); family naming = **Volt Web** / **Volt API** (`volt-web` / `volt-api`).
- Fonts = **Space Grotesk** (display) / **Inter** (sans) / **JetBrains Mono** (mono); app UI uses system fonts, brand fonts for marketing.
- Full regenerable brand kit lives in `brand/`, driven by `brand.json` + `gen-brand.mjs`.
- Distribution = **commercial / private** (proprietary license) — relevant if the backend reuses the same LICENSE model.
