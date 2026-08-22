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

	// Hold the URL read/write handles in a ref so the effect can use the latest
	// values WITHOUT listing them as dependencies. This is deliberate: the effect
	// must react to TableState changes only — depending on searchParams would make
	// our own writes re-trigger it and loop. The ref keeps the dep list exhaustive
	// (everything it references is either a state field or ref-stable).
	const urlIoRef = React.useRef({ searchParams, setSearchParams })
	urlIoRef.current = { searchParams, setSearchParams }

	React.useEffect(() => {
		if (!enabled) return
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		const { searchParams: current, setSearchParams: write } = urlIoRef.current
		const next = encodeUrlState(
			{
				search: state.search,
				filters: state.filters,
				sort: state.sort,
				viewId: state.viewId,
			},
			current,
			namespace,
		)
		// Only write if something actually changed
		if (next.toString() !== current.toString()) {
			write(next, { replace: true })
		}
	}, [
		state.search,
		state.filters,
		state.sort,
		state.viewId,
		enabled,
		namespace,
	])
}
