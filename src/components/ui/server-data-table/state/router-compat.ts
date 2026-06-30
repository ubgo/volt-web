// TanStack Router compatibility shim.
//
// The source package was built against `react-router`'s useSearchParams / Link API.
// This file adapts that surface to `@tanstack/react-router` so the rest of the
// component tree doesn't need to change.

import { useLocation, useRouter } from "@tanstack/react-router"
import { useCallback } from "react"

export { Link } from "@tanstack/react-router"

type SetParamsFn = (
	next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
	opts?: { replace?: boolean },
) => void

export function useSearchParams(): readonly [URLSearchParams, SetParamsFn] {
	const location = useLocation()
	const router = useRouter()

	const searchStr = toSearchString(location.search)
	const params = new URLSearchParams(searchStr)

	const setParams: SetParamsFn = useCallback(
		(next, opts) => {
			const current = new URLSearchParams(searchStr)
			const resolved =
				typeof next === "function"
					? (next as (p: URLSearchParams) => URLSearchParams)(current)
					: next
			const record: Record<string, string> = {}
			for (const [k, v] of resolved.entries()) record[k] = v
			router.navigate({
				to: ".",
				search: () => record,
				replace: opts?.replace ?? false,
			})
		},
		[router, searchStr],
	)

	return [params, setParams] as const
}

function toSearchString(search: unknown): string {
	if (!search) return ""
	if (typeof search === "string")
		return search.startsWith("?") ? search.slice(1) : search
	if (typeof search === "object") {
		const params = new URLSearchParams()
		for (const [k, v] of Object.entries(search as Record<string, unknown>)) {
			if (v == null) continue
			params.set(k, String(v))
		}
		return params.toString()
	}
	return ""
}
