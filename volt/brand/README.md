# Volt — brand kit

The single, regenerable source of Volt's visual identity. Everything here is derived from `brand.json` via `gen-brand.mjs` — edit the generator (or the manifest), never the output SVGs by hand.

## Regenerate

```bash
task -t volt/brand/Taskfile.yml all      # regenerate SVGs + tokens, then rasterize
# or, from this dir:
node gen-brand.mjs && task raster
```

## The mark

A lightning bolt on a violet gradient tile — **Volt** = powered-up, fast to start. The bolt is the only per-brand art; tiles, variants, favicon, wordmark, lockups, OG covers, and tokens all reflow from the manifest.

## Colors

| Token | Hex | Use |
|---|---|---|
| tile start | `#6366F1` | gradient tile (indigo) |
| tile end | `#8B5CF6` | gradient tile (violet) |
| accent | `#7C3AED` | wordmark accent, links, highlights |
| foreground | `#FFFFFF` | glyph on the color tile |

Full scale + light/dark maps are in `palette.json` and `tokens.css` (CSS variables, `.dark` / `[data-theme="dark"]` flip).

## Typography

Display/wordmark declares **Space Grotesk** with an **Inter → system-ui** fallback, so installs without the webfont still render cleanly (the shipped rasters use the Inter fallback). The app UI itself uses the system font stack. Stacks live in `tokens.json` → `font`.

## Files

| File | What |
|---|---|
| `icon.svg` / `volt-icon.svg` | primary color-tile icon (512 master) |
| `volt-icon-dark.svg` / `-light.svg` | tile variants for bright / dark surfaces |
| `volt-glyph.svg` | bolt only, no tile (on white) |
| `volt-mono.svg` | single-color via `currentColor` (terminals/print) |
| `favicon.svg` + `favicon.ico` | favicon (16/32/48 multi-res `.ico`) |
| `volt-wordmark.svg` | the name in the display font |
| `volt-lockup.svg` / `-dark.svg` | icon + wordmark, horizontal |
| `og-cover.svg` / `-light.svg` | 1200×630 social card (dark + light) |
| `png/` | rasterized icons, apple-touch, 512/1024, OG covers, `og-social-1280.png` |
| `palette.json` · `tokens.json` · `tokens.css` | design tokens |

## Don'ts

- Don't recolor outside the palette — add a tile variant instead.
- Don't stretch, rotate, or add shadows/bevels to the mark; it's flat by design.
- Don't ship the full icon below ~24px — use `favicon.svg`.
- Keep clearspace ≥ 25% of the icon width.

## Where it's used

The app's runtime assets live in `../../public/` (favicon, PWA icons, `logo.svg`). This `brand/` dir is the canonical identity and the source for repo-facing images: the README header (`png/icon-512.png`) and the GitHub social preview (`png/og-social-1280.png`).
