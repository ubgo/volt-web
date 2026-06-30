import type { FilterCondition, FilterFieldDef, SearchConfig } from "../types"

type BuildWhereOpts<TWhere> = {
	filters: FilterCondition[]
	fields: FilterFieldDef<TWhere>[]
	search?: { value: string; config?: SearchConfig<TWhere> }
}

/**
 * Merge per-field WhereInput partials into a single WhereInput.
 *
 * Strategy: shallow merge — later partials win for conflicting keys.
 * For v1 (flat AND at root) this works for the common case where each
 * filter targets a different field. Conflicting filters on the same
 * field are caller's responsibility (use a single combined operator).
 *
 * Returns `undefined` when there are no filters and no search query, so
 * callers can omit `.where(...)` from the query builder cleanly.
 */
export function buildWhere<TWhere>({
	filters,
	fields,
	search,
}: BuildWhereOpts<TWhere>): TWhere | undefined {
	const partials: Partial<TWhere>[] = []

	if (search?.value && search.config) {
		partials.push(search.config.toWhere(search.value))
	}

	for (const cond of filters) {
		const field = fields.find((f) => f.id === cond.fieldId)
		if (!field) continue
		// The UI stores a loose `FilterCondition` but each field declares a
		// narrow condition union for its `toWhere`. We bridge the two here —
		// single cast at the engine boundary keeps call sites fully typed.
		const toWhere = field.toWhere as (c: FilterCondition) => Partial<TWhere>
		const partial = toWhere(cond)
		if (partial && Object.keys(partial).length > 0) {
			partials.push(partial)
		}
	}

	if (partials.length === 0) return undefined
	return Object.assign({}, ...partials) as TWhere
}
