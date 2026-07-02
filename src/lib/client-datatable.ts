import type {
	Connection,
	QueryArgs,
} from "@/components/ui/server-data-table/types"

// ─────────────────────────────────────────────────────────────────────────
// True server-side helpers — for queries whose BACKEND does the paging.
//
// ServerDataTable speaks the Relay cursor contract, but this repo's cursors
// are just base64-encoded absolute offsets (see clientConnection below). These
// two helpers let an OFFSET-paginated backend ({items,total}) plug into the
// table without a cursor backend: decode the cursor → offset for the request,
// then re-encode the returned page as a Connection. The cursor scheme is kept
// byte-for-byte identical to clientConnection so forward/back navigation and
// page-size changes behave the same whether paging is client- or server-side.
// ─────────────────────────────────────────────────────────────────────────

/** Decode the table's pagination args into a backend {limit, offset}.
 *  Only reads the cursor/page-size fields, so it's agnostic to the Where type. */
export function offsetPaging(
	args: QueryArgs<unknown>,
	defaultSize = 25,
): { limit: number; offset: number } {
	const limit = args.first ?? args.last ?? defaultSize
	let offset = 0
	if (args.after) offset = Number.parseInt(atob(args.after), 10) || 0
	// Going backward: `before` is the current page's start offset; step back one page.
	else if (args.before)
		offset = Math.max(0, (Number.parseInt(atob(args.before), 10) || 0) - limit)
	return { limit, offset }
}

/** Wrap a server offset page (already filtered/sorted/sliced server-side) in
 *  the Connection contract. `offset`/`limit` are what offsetPaging produced. */
export function offsetConnection<T>(
	items: T[],
	total: number,
	offset: number,
	_limit: number,
): Connection<T> {
	return {
		totalCount: total,
		pageInfo: {
			hasNextPage: offset + items.length < total,
			hasPreviousPage: offset > 0,
			startCursor: btoa(String(offset)),
			endCursor: btoa(String(offset + items.length)),
		},
		edges: items.map((node, i) => ({ node, cursor: btoa(String(offset + i)) })),
	}
}

// clientConnection adapts an in-memory array to the ServerDataTable Connection
// contract (filter → sort → offset/cursor paginate, all client-side). Used by
// catalog pages whose GraphQL query returns the full list (no server paging).
export function clientConnection<T>(
	all: T[],
	args: QueryArgs<Record<string, unknown>>,
	opts: {
		filter?: (row: T, where: Record<string, unknown> | undefined) => boolean
		sorters?: Record<string, (row: T) => string | number | boolean>
	} = {},
): Connection<T> {
	let rows = all
	if (opts.filter && args.where)
		rows = rows.filter((r) => opts.filter?.(r, args.where))
	const o = args.orderBy?.[0]
	if (o && opts.sorters?.[o.field]) {
		const acc = opts.sorters[o.field]
		rows = [...rows].sort((a, b) => {
			const av = acc(a)
			const bv = acc(b)
			const c = av < bv ? -1 : av > bv ? 1 : 0
			return o.direction === "DESC" ? -c : c
		})
	}
	const size = args.first ?? args.last ?? 25
	let offset = 0
	if (args.after) offset = Number.parseInt(atob(args.after), 10) || 0
	else if (args.before)
		offset = Math.max(0, (Number.parseInt(atob(args.before), 10) || 0) - size)
	const slice = rows.slice(offset, offset + size)
	return {
		totalCount: rows.length,
		pageInfo: {
			hasNextPage: offset + size < rows.length,
			hasPreviousPage: offset > 0,
			startCursor: btoa(String(offset)),
			endCursor: btoa(String(offset + slice.length)),
		},
		edges: slice.map((node, i) => ({ node, cursor: btoa(String(offset + i)) })),
	}
}
