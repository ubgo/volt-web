import { keepPreviousData } from "@tanstack/react-query"
import * as React from "react"
import { useGqlQuery } from "@/lib/gql-hooks"
import type { Connection, QueryFn, TableState } from "../types"

type UseServerQueryOpts<TNode, TWhere> = {
	queryKey: string
	queryFn: QueryFn<TNode, TWhere>
	state: TableState
	where: TWhere | undefined
	pageSize: number
}

/**
 * Wires table state → useGqlQuery. Builds pagination args from state,
 * maps sort rules to the orderBy input shape, runs the caller's queryFn.
 */
export function useServerQuery<TNode, TWhere>({
	queryKey,
	queryFn,
	state,
	where,
	pageSize,
}: UseServerQueryOpts<TNode, TWhere>) {
	const { direction, cursor } = state.pagination

	const orderBy = React.useMemo(
		() =>
			state.sort.map((s) => ({
				direction:
					s.direction === "desc" ? ("DESC" as const) : ("ASC" as const),
				field: s.fieldId,
			})),
		[state.sort],
	)

	const paginationArgs = React.useMemo(() => {
		if (direction === "forward") {
			return { first: pageSize, after: cursor, last: null, before: null }
		}
		return { last: pageSize, before: cursor, first: null, after: null }
	}, [direction, cursor, pageSize])

	const query = useGqlQuery<Connection<TNode>>(
		[queryKey, { where, orderBy, ...paginationArgs }],
		() => queryFn({ where, orderBy, ...paginationArgs }),
		{
			placeholderData: keepPreviousData,
		},
	)

	// Flatten edges → node[] for the table body
	const nodes = React.useMemo<TNode[]>(() => {
		const edges = query.data?.edges ?? []
		const out: TNode[] = []
		for (const edge of edges) {
			const node = edge?.node
			if (node) out.push(node)
		}
		return out
	}, [query.data])

	return {
		...query,
		nodes,
		pageInfo: query.data?.pageInfo ?? null,
		totalCount: query.data?.totalCount ?? null,
	}
}
