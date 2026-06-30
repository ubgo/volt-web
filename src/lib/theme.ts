// Theme system — a thin wrapper over the `.dark` class on <html>. The whole
// color system is token-driven (see styles.css :root / .dark), so flipping the
// class is all that's needed; every component re-themes for free.

export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "theme"

/** Read the persisted preference (defaults to "system"). SSR-safe. */
export function getStoredTheme(): Theme {
	if (typeof localStorage === "undefined") return "system"
	const value = localStorage.getItem(STORAGE_KEY)
	return value === "light" || value === "dark" || value === "system"
		? value
		: "system"
}

/** Resolve a preference to a concrete light/dark boolean. */
export function prefersDark(theme: Theme): boolean {
	if (theme === "dark") return true
	if (theme === "light") return false
	return (
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	)
}

/**
 * Apply a preference to <html>: toggle the `.dark` class AND set `color-scheme`
 * inline. `color-scheme` controls the browser's default canvas background, so
 * the page paints dark immediately — even before the stylesheet loads — which
 * is what kills the white flash (FOUC) on load and on toggle.
 */
export function applyTheme(theme: Theme): void {
	if (typeof document === "undefined") return
	const dark = prefersDark(theme)
	const root = document.documentElement
	root.classList.toggle("dark", dark)
	root.style.colorScheme = dark ? "dark" : "light"
}

/**
 * Run a DOM mutation with ALL CSS transitions/animations disabled, then
 * re-enable them on the next frame. Without this, flipping the palette makes
 * every element with `transition-colors` animate between themes at slightly
 * different times — a flickery in-between state. We want the switch to be
 * instant, not animated.
 */
function withoutTransitions(mutate: () => void): void {
	if (typeof document === "undefined") {
		mutate()
		return
	}
	const style = document.createElement("style")
	style.appendChild(
		document.createTextNode(
			"*,*::before,*::after{transition:none!important;animation:none!important}",
		),
	)
	document.head.appendChild(style)
	mutate()
	// Force a reflow so the no-transition rule is committed before we remove it.
	void window.getComputedStyle(document.body).opacity
	requestAnimationFrame(() => {
		requestAnimationFrame(() => style.remove())
	})
}

/** Persist + apply a preference (instant, no transition flicker). */
export function setTheme(theme: Theme): void {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem(STORAGE_KEY, theme)
	}
	withoutTransitions(() => applyTheme(theme))
}

/**
 * Inline script string injected into <head> before paint to set the `.dark`
 * class from the persisted preference — prevents a light→dark flash (FOUC) on
 * first load. Kept dependency-free so it can run as a raw <script>.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`
