/**
 * app-env — which deployment environment this frontend build is running in,
 * and the per-environment favicon that makes browser tabs distinguishable.
 *
 * Why it exists: with local + dev + stag + prod tabs open side by side the
 * favicons are identical, and "which tab is prod?" is exactly the question
 * you don't want to answer by reading URLs mid-incident. Every env shows the
 * SAME Volt bolt mark, on an env-colored tile — prod keeps the untouched
 * brand violet gradient, so the production tab looks exactly like the icon
 * always has.
 *
 * The icons are static files at public/favicon-<env>.svg (one per env, same
 * bolt path as public/icon.svg, different tile fill). If the icon mark ever
 * changes, regenerate those four files from the new glyph path.
 */

// APP_ENVS — the closed set of deployment environments, ordered from least to
// most production-like. `AppEnv` derives from it so adding an env here updates
// every consumer through tsc (and requires adding its public/favicon-<env>.svg).
export const APP_ENVS = ["local", "dev", "stag", "prod"] as const
export type AppEnv = (typeof APP_ENVS)[number]

// isAppEnv — type guard for validating the VITE_APP_ENV override; a typo'd
// value falls through to hostname detection instead of silently minting a
// fifth environment.
export function isAppEnv(v: string): v is AppEnv {
	return (APP_ENVS as readonly string[]).includes(v)
}

// ENV_ICON_COLOR — the tile tint each env's favicon uses: muted gray for
// local, blue for dev, amber for stag, and the shipped brand violet (#7C3AED,
// the middle stop of icon.svg's gradient) for prod. Kept in code even though
// the SVGs are static files so UI chrome (a future env badge, tab accents)
// can reuse the exact colors — and so a test pins that prod stays brand
// violet.
export const ENV_ICON_COLOR: Record<AppEnv, string> = {
	local: "#64748b",
	dev: "#3b82f6",
	stag: "#f59e0b",
	prod: "#7C3AED",
}

// detectAppEnv — resolve the environment for a given hostname + optional
// VITE_APP_ENV override. Precedence: a VALID override wins (deploys can pin
// their env explicitly), else the hostname heuristic:
//   localhost / *.localhost / 127.0.0.1  → local
//   "dev" segment  (-dev suffix or dev. label)   → dev
//   "stag" segment (-stag suffix or stag. label) → stag
//   anything else                                → prod
// Defaulting the unknown case to prod is deliberate fail-safe: an unmapped
// real domain gets the plain brand icon rather than a "safe to poke" tint.
export function detectAppEnv(hostname: string, override?: string): AppEnv {
	if (override !== undefined && isAppEnv(override)) return override
	const h = hostname.toLowerCase()
	if (h === "localhost" || h.endsWith(".localhost") || h === "127.0.0.1") {
		return "local"
	}
	// Match "dev"/"stag" as a hostname segment (label or -suffix), not as a
	// substring — a customer domain like "devonshire.com" must NOT read as dev.
	const segments = h.split(/[.-]/)
	if (segments.includes("dev")) return "dev"
	if (segments.includes("stag") || segments.includes("staging")) return "stag"
	return "prod"
}

// envFaviconHref — the static asset path for an env's favicon. The files live
// in public/ (favicon-local.svg, favicon-dev.svg, favicon-stag.svg,
// favicon-prod.svg) so they're plain cacheable assets, not runtime-built URIs.
export function envFaviconHref(env: AppEnv): string {
	return `/favicon-${env}.svg`
}

// currentAppEnv — the running browser tab's environment (override + hostname
// detection). Outside the browser (SSR pass, tests) it returns "prod" — the
// plain brand icon — so server-rendered chrome never guesses a tint; client
// code that must be exact re-resolves after mount.
export function currentAppEnv(): AppEnv {
	if (typeof window === "undefined") return "prod"
	return detectAppEnv(
		window.location.hostname,
		import.meta.env.VITE_APP_ENV as string | undefined,
	)
}

// applyEnvFavicon — detect the current env in the browser and point every
// rel=icon link at its tinted icon (replacing the static /images/favicon.ico
// the shell ships). Called once from the root component on mount; a no-op
// outside the browser so SSR/tests never touch document.
export function applyEnvFavicon(): AppEnv | null {
	if (typeof document === "undefined") return null
	const env = currentAppEnv()
	const href = envFaviconHref(env)
	const links = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')
	if (links.length === 0) {
		const link = document.createElement("link")
		link.rel = "icon"
		link.type = "image/svg+xml"
		link.href = href
		document.head.appendChild(link)
	} else {
		for (const link of links) {
			link.type = "image/svg+xml"
			link.href = href
		}
	}
	return env
}
