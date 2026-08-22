# Sync → Volt Web backport proposal

Mistakes made (and fixed) on `sync_tanstack` (built on Volt Web) that `volt-web` still carries, plus hardening the fork accumulated that the boilerplate lacks. Compiled 2026-08-21 by diffing the shared infra (`src/lib`, `src/components/ui`, `biome.json`, build scripts, CI) and mining sync's 77-commit history. **Proposal only — nothing has been applied.**

**Implementation status (2026-08-22): items 1–9 + 11 are APPLIED to the working tree** (biome zero findings with all rules on, tsc clean, vitest 12/12, production build green). Deltas vs the plan: item 2 also removed the biome `overrides` block entirely and the remediation adopted sync's fixed `server-data-table` + `slider` + `label` wholesale (which completed item 3 in the same stroke; volt-web-only `breadcrumb.tsx` was fixed by hand — real `<a {...props}>` default render, `aria-current` span without `role="link"`); item 1 additionally fixed stale `sync-api.localhost` endpoints to `volt-api.localhost/api/query` across `.env.example`/`gql-clients.ts`/`Taskfile.yml`/demo; item 6 (auth port) is BLOCKED on the backend — volt-api's dashboard schema has no auth operations — so the three hard-won behaviors are captured in `volt/docs/auth-checklist.md` for when authmgr lands; item 10 (density defaults) deliberately not applied — a taste choice, not a mistake; sync's `page-title.ts` skipped because volt-web's `seo.ts` + route `head()` already own titles.

Noise filtering: sync's app features (runs, files, addons, datasets, prism builder, shopify, taxonomy, appkv), HyperDX deep-links, and deploy topology are excluded — only fixes and patterns that apply to the boilerplate are listed. Some sync work already flowed back to volt-web and needs nothing: the gitleaks pre-commit + CI backstop, the native-`confirm()` → AlertDialog fix, and both build incidents (`volt/docs/incidents/001`, `002`) are present.

## P1 — mistakes volt-web still ships

### 1. `X-Internal-Key` sent from the browser (security)

- Sync commit: `cbbc879` — `fix(auth): stop sending X-Internal-Key from the browser`.
- The mistake: `createApiClient` in `src/lib/gql-clients.ts` forwards `VITE_INTERNAL_KEY` as `X-Internal-Key` on every GraphQL request. Any `VITE_*` var is baked into the public JS bundle — a transport secret in cleartext, and a bypass smell (it also made key-set local behave differently from keyless deploys, which 500'd on sync). Volt-web still has the send block, and `VITE_INTERNAL_KEY=` still sits in `.env.example`.
- The fix: delete the `X-Internal-Key` block from `gql-clients.ts` (Bearer + `X-Workspace-Id` are the real gate), drop `VITE_INTERNAL_KEY` from `.env.example`. The SERVER-side `INTERNAL_KEY` (`src/env/server.ts`, `src/lib/middleware.ts`) is fine and stays — it never reaches the client bundle. Pair with the matching volt-api change (drop `@internal` from workspace-scoped fields) if the templates still use the directive.
- Also from this commit: add `.vercel` to `.gitignore` (volt-web ignores `.env*` already but not `.vercel`, which contains project/org ids).

### 2. Lint rules silenced instead of fixed (violates the no-suppression rule)

- Sync commits: `a3e9f70` + `26aa3b8` — biome driven to zero findings with real fixes, zero suppressions, plus `docs/lint-policy.md` recording every non-obvious root-cause pattern.
- The mistake — and volt-web made the OPPOSITE call: `biome.json` `overrides` turn OFF `useExhaustiveDependencies`, `noArrayIndexKey`, `noStaticElementInteractions`, `useKeyWithClickEvents` (commit `8481561` "scope noisy lint rules"). Sync proves each has a real fix; the off-switches hide genuine bug classes (stale closures, state corruption on reorder, broken keyboard a11y).
- The fix: delete the rule-off overrides and remediate using sync's documented patterns — lazy `useState` initializers / functional `setState` / ref-latest for exhaustive-deps; `stableKeys` helper (`src/lib/react-keys.ts`, ~14 lines, port it) for placeholder lists instead of index keys; the stretched-`<button>` pattern for interactive tiles. Port `docs/lint-policy.md` into `volt/docs/` as the standing policy so the next "noisy rule" gets a fix, not an off-switch.

### 3. Type escape hatches in the shared data-table

- Sync commit: `d05d2dc` — "eliminate type escape hatches" (the 100%-type-safety pillar applied).
- The mistake: volt-web's `src/components/ui/server-data-table/` carries 8 `as unknown as` casts (`RelationControl.tsx` ×7, `ServerDataTable.tsx` ×1). Sync's reworked versions of the same files are down to 2 justified boundary casts.
- The fix: port sync's typed rework of `RelationControl` + `ServerDataTable` (files are siblings — direct diff-and-adopt).

### 4. Fatal `cp` in the build script breaks Vercel builds

- Sync commit: `a027f1e` — `fix(build): make instrument.server.mjs copy non-fatal for Vercel builds`.
- The mistake: volt-web's `build` is `vite build && cp instrument.server.mjs .output/server` — on targets where the preset doesn't produce `.output/server` (Vercel), the `cp` fails and kills an otherwise-green build.
- The fix: sync's shape — `vite build && (cp instrument.server.mjs .output/server 2>/dev/null || true)`. Consider echoing a one-line notice when the copy is skipped so a missing server instrumentation is visible, not silent.

## P2 — hardening / patterns volt-web lacks

### 5. Centralized query keys + domain constants

- Sync commits: `1d049cb`, `19b89e5` — `src/lib/query-keys.ts` (typed `QK.*` factories: a typo'd cache key means a mutation silently stops invalidating a list — the worst stale-UI bug) and `src/lib/domain-constants.ts`.
- Volt-web status: no equivalent; pages will hand-roll string keys as soon as a real app grows. Proposal: seed a skeleton `query-keys.ts` with the header comment explaining the graduation rule ("a key moves here the moment a second file reads or invalidates it") + a worked example, and reference it from the frontend rules.

### 6. Auth starter — port sync's `features/auth` with its three hard-won fixes

- Sync commits: `e203112`→`204cc66` arc. Volt-web ships no auth at all (its `gql-clients.ts` comment literally says "when you wire real auth, add a refresh-on-401 retry — see the reference project"). Sync IS that reference now, and its auth carries three fixes that cost real debugging:
  - **Trust-based AuthGate** (`2bf2c6f`): render immediately when a token exists; never bounce to /login on a transient `getMe()` failure (laptop sleep, dev API restart, brief 502 = logged out was the bug).
  - **Multi-tab refresh mutex** (`204cc66`): `navigator.locks` around token refresh + a rotation-race guard — only clear tokens when the STORED refresh token is the one that failed, so a sibling tab's successful rotation doesn't log you out.
  - **Workspace switch remount** (`204cc66`): `useSyncExternalStore` + keyed query-subtree wrapper, because closures captured a stale `workspaceId` and switching showed the previous workspace's data.
- Proposal: port `src/features/auth/` (it's sync's only `features/` dir — cleanly isolated) as the boilerplate's auth module, adapted to volt naming.

### 7. Env-tinted favicons + `app-env` lib

- Sync commits: `905028d`, `5bd63e3` — `src/lib/app-env.ts` (+ unit test): closed `APP_ENVS` set, `VITE_APP_ENV` override validated by a type guard, hostname-segment fallback detection; per-env favicon SVGs (local gray / dev blue / stag amber / prod untouched brand) so "which tab is prod?" is never answered by reading URLs mid-incident.
- Proposal: port `app-env.ts` + test, generate `public/favicon-<env>.svg` variants from the Volt bolt mark (volt/brand has the glyph), wire into the document head.

### 8. Env-driven `allowedHosts` + host-exposed dev script

- Sync commits: `804ee43`, `226bbee` — vite 8 rejects unknown `Host` headers; `VITE_ALLOWED_HOSTS` (comma-separated env) opts specific hostnames in for reverse-proxied dev (portless vhosts, remote dev boxes), unset = vite's safe default. Plus a `dev:devbox` script binding `0.0.0.0`.
- Proposal: small `vite.config.ts` + `package.json` addition; volt-web serves through portless already, so the first custom vhost will hit this.

### 9. CI: lint + test workflows (and actual tests)

- Volt-web has `gitleaks.yml` + deploy templates only — no lint or test workflow, and zero `*.test.*` files despite a `test: vitest run` script (a vacuous green). Sync runs vitest with real pinning tests (e.g. `app-env.test.ts`, wire-bridge inverses).
- Proposal: add `lint.yml` (biome check) + `test.yml` (vitest) mirroring what volt-api just gained, and seed the first unit tests alongside items 5–7 so the suite isn't empty on day one.

## P3 — nice-to-have

### 10. Density defaults from the polaris-grade pass

- Sync commits: `512599c` (compact `h-8` as the Button default for admin surfaces), `f9d7209` (PageHeader rollout + sticky sidebar). Taste-level, but sync arrived at these after real admin screens felt oversized. Optional adopt for the boilerplate's shadcn layer.

### 11. `stableKeys` + small lib helpers

- `src/lib/react-keys.ts` (needed by item 2 anyway), `page-title.ts` (route-driven titles). Cheap, additive.

## Explicitly excluded (checked, not applicable)

- **App features** — runs/files/addons/datasets/prism/shopify/taxonomy/appkv screens, harvest recommendations: sync's product, not boilerplate.
- **HyperDX deep-link config** (`b49c014`, `7a93059`, `608b399`): depends on sync-api's `wfHyperdxDashboard` surface.
- **graphql-codegen retirement** (`968cc83`): volt-web is already gqlkit-only.
- **gitleaks pre-commit + CI, AlertDialog confirm fix, build incidents 001/002**: already in volt-web.
- **Branch/deploy flow docs** (`8081128`), README screenshot gallery: repo-specific.
