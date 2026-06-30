import type { FilterCondition, SortRule, TableState } from "../types"

/**
 * URL state shape:
 *   q  search query
 *   f  filters (URL-safe base64 of compact JSON)
 *   s  sort (comma-separated "fieldId.direction")
 *   v  active view id
 *
 * Pagination cursor and UI prefs (column visibility, density) are
 * intentionally NOT synced — they're ephemeral / per-device.
 */

const PARAM = {
	search: "q",
	filters: "f",
	sort: "s",
	viewId: "v",
}

// ── Compact filter encoding ──────────────────────────────────────────────
//
// Each condition is { i: id, f: fieldId, o: operator, v: value }
// We then JSON.stringify and URL-safe base64.

type CompactCondition = {
	i: string
	f: string
	o: string
	v: unknown
	/** Relation display labels (value→label). Omitted when empty. */
	l?: Record<string, string>
}

function utf8ToBase64Url(s: string): string {
	const bytes = new TextEncoder().encode(s)
	let bin = ""
	for (const b of bytes) bin += String.fromCharCode(b)
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlToUtf8(s: string): string {
	// Pad to multiple of 4
	const padded = s.replace(/-/g, "+").replace(/_/g, "/")
	const pad = padded.length % 4
	const fixed = pad ? padded + "=".repeat(4 - pad) : padded
	const bin = atob(fixed)
	const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
	return new TextDecoder().decode(bytes)
}

function encodeFilters(filters: FilterCondition[]): string {
	const compact: CompactCondition[] = filters.map((c) => ({
		i: c.id,
		f: c.fieldId,
		o: c.operator,
		v: c.value,
		...(c.labels && Object.keys(c.labels).length > 0 ? { l: c.labels } : {}),
	}))
	return utf8ToBase64Url(JSON.stringify(compact))
}

function decodeFilters(encoded: string): FilterCondition[] {
	try {
		const parsed = JSON.parse(base64UrlToUtf8(encoded)) as CompactCondition[]
		if (!Array.isArray(parsed)) return []
		return parsed
			.filter(
				(c): c is CompactCondition =>
					typeof c?.i === "string" &&
					typeof c?.f === "string" &&
					typeof c?.o === "string",
			)
			.map((c) => ({
				id: c.i,
				fieldId: c.f,
				operator: c.o as FilterCondition["operator"],
				value: c.v,
				...(c.l ? { labels: c.l } : {}),
			}))
	} catch {
		return []
	}
}

// ── Sort encoding ────────────────────────────────────────────────────────

function encodeSort(sort: SortRule[]): string {
	return sort.map((s) => `${s.fieldId}.${s.direction}`).join(",")
}

function decodeSort(encoded: string): SortRule[] {
	return encoded
		.split(",")
		.map((part) => {
			const lastDot = part.lastIndexOf(".")
			if (lastDot < 0) return null
			const fieldId = part.slice(0, lastDot)
			const direction = part.slice(lastDot + 1)
			if (direction !== "asc" && direction !== "desc") return null
			if (!fieldId) return null
			return { fieldId, direction } as SortRule
		})
		.filter((s): s is SortRule => s !== null)
}

// ── Public API ───────────────────────────────────────────────────────────

export type DecodedUrlState = Partial<
	Pick<TableState, "search" | "filters" | "sort">
> & {
	viewId?: string | null
}

const k = (key: string, namespace?: string) =>
	namespace ? `${namespace}.${key}` : key

export function decodeUrlState(
	params: URLSearchParams,
	namespace?: string,
): DecodedUrlState | null {
	const out: DecodedUrlState = {}
	let any = false

	const q = params.get(k(PARAM.search, namespace))
	if (q) {
		out.search = q
		any = true
	}
	const f = params.get(k(PARAM.filters, namespace))
	if (f) {
		out.filters = decodeFilters(f)
		any = true
	}
	const s = params.get(k(PARAM.sort, namespace))
	if (s) {
		out.sort = decodeSort(s)
		any = true
	}
	const v = params.get(k(PARAM.viewId, namespace))
	if (v) {
		out.viewId = v
		any = true
	}

	return any ? out : null
}

/**
 * Returns a NEW URLSearchParams with our params updated; preserves any
 * unrelated params from the input. Removes our params when their value
 * is empty so the URL stays clean.
 */
export function encodeUrlState(
	state: Pick<TableState, "search" | "filters" | "sort"> & {
		viewId?: string | null
	},
	current: URLSearchParams,
	namespace?: string,
): URLSearchParams {
	const next = new URLSearchParams(current)

	// search
	if (state.search) next.set(k(PARAM.search, namespace), state.search)
	else next.delete(k(PARAM.search, namespace))

	// filters
	if (state.filters && state.filters.length > 0) {
		next.set(k(PARAM.filters, namespace), encodeFilters(state.filters))
	} else {
		next.delete(k(PARAM.filters, namespace))
	}

	// sort
	if (state.sort && state.sort.length > 0) {
		next.set(k(PARAM.sort, namespace), encodeSort(state.sort))
	} else {
		next.delete(k(PARAM.sort, namespace))
	}

	// view
	if (state.viewId) next.set(k(PARAM.viewId, namespace), state.viewId)
	else next.delete(k(PARAM.viewId, namespace))

	return next
}
