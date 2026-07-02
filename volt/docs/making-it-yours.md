# Making it yours

How to go from the Volt demo to your own app. The demos are isolated on purpose, so this is mostly deletion and a few edits — follow the steps in order and you'll have a clean foundation with the UI kit, dashboard shell, theming, and all the integrations intact.

## 1. Delete the demos

Everything demo-related lives in exactly two folders. Remove both:

```bash
rm -rf src/routes/demo src/demo
```

That deletes every showcase page and the demo-only helpers (the form kit and mock data). Nothing else imports from these folders, so this is safe — the only two references to them are handled in the next two steps. See [project-structure.md](project-structure.md#demo-isolation) for why this is clean.

## 2. Replace the `/` redirect

`src/routes/index.tsx` currently redirects `/` to the (now-deleted) `/demo` dashboard. Replace it with your own landing route. For example, to redirect to a new `/dashboard`:

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" })
  },
})
```

Or make `/` render a real page component instead of redirecting. See [building-a-page.md](building-a-page.md) for the routing conventions.

## 3. Update the navigation

The sidebar is driven by the `NAV_SECTIONS` array in `src/components/admin-shell.tsx`. It still points at the deleted demo routes, so edit it to list your app's sections and pages. Keep the `admin-shell.tsx` layout itself — that's your dashboard shell (sidebar, `PageHeader`, `Surface`); you're only changing the links inside `NAV_SECTIONS`.

## 4. Rebrand

Swap Volt's identity for yours:

1. Drop your square logo (≥512×512) at `public/logo-source.png`.
2. Run `task branding:gen` to regenerate the PWA/favicon icon set.
3. Update `public/manifest.json` and `SITE_NAME` in `src/lib/seo.ts`.

The full rebrand walkthrough — every icon, where it's wired, colors, and OG image — is in [branding.md](branding.md).

## 5. Make the repo yours

- Replace the root `README.md` with your app's own — the current one is Volt's product landing page.
- Replace `LICENSE` with your license.
- Update the `name` field in `package.json` (it ships as `volt-web`).

Anything at the repo root that's app-facing is now yours; the Volt-specific reference stays isolated under `volt/` (see the next step). If you want your own contributing or security docs at the repo root, add them there.

## 6. Keep or delete the `volt/` folder

Everything Volt-specific lives in `volt/` — this doc set, the product overview, the brand kit, and the engineering rules ([../rules/code-standards.md](../rules/code-standards.md), [../rules/frontend.md](../rules/frontend.md)). You have two options:

- **Keep it** as a reference you can return to (setup notes, integration guides, standards). It's fully separate from your app code, so it won't get in the way.
- **Delete it** once you don't need the reference: `rm -rf volt`. Nothing in `src/` depends on it.

## What you keep

After all this, your foundation is everything that made Volt worth starting from: the basecn/Base UI component kit and `ServerDataTable`, the dashboard shell and theming, the tRPC/oRPC/Drizzle/GraphQL integrations, typesafe env, and the design tokens. Build on top of it — start with [building-a-page.md](building-a-page.md).

## Next / Related

[getting-started.md](getting-started.md) · [project-structure.md](project-structure.md) · [branding.md](branding.md) · [building-a-page.md](building-a-page.md) · [deployment.md](deployment.md) · docs home: [README.md](README.md)
