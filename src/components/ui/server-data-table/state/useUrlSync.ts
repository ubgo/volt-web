import * as React from "react"
import type { TableState } from "../types"
import { useSearchParams } from "./router-compat"
import { encodeUrlState } from "./urlCodec"

type Options = {
	state: TableState
	enabled: boolean
	namespace?: string
}

/**
 * Mirrors the relevant parts of TableState into the URL search params
 * via `replaceState` (no history entries spammed). Initial hydration
 * happens at useTableState mount; this hook only writes.
 *
 * Skips the very first render so we don't immediately overwrite the
 * URL with our seed-state on page load.
 */
export function useUrlSync({ state, enabled, namespace }: Options) {
	const [searchParams, setSearchParams] = useSearchParams()
	const isFirstRender = React.useRef(true)

	React.useEffect(() => {
		if (!enabled) return
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		const next = encodeUrlState(
			{
				search: state.search,
				filters: state.filters,
				sort: state.sort,
				viewId: state.viewId,
			},
			searchParams,
			namespace,
		)
		// Only write if something actually changed
		if (next.toString() !== searchParams.toString()) {
			setSearchParams(next, { replace: true })
		}
		// We intentionally do NOT depend on searchParams to avoid loops:
		// we want to react to state changes, not URL changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		state.search,
		state.filters,
		state.sort,
		state.viewId,
		enabled,
		namespace,
	])
}
