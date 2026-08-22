/**
 * query-keys — React Query cache keys used by MORE THAN ONE FILE (the
 * no-hardcoded-strings rule applied to cache identity: a typo'd key means a
 * mutation silently stops invalidating a list — the worst kind of stale-UI
 * bug). Single-file keys may stay local; a key graduates HERE the moment a
 * second file reads or invalidates it.
 *
 * Shape: functions returning arrays, so parameterized keys stay typed and
 * prefix-invalidation works — `invalidateQueries({ queryKey: QK.todos.list() })`
 * also matches ["todos", "list", "archived", …] because React Query matches
 * key prefixes.
 *
 * The `todos` group below is the worked example (it backs the demo pages);
 * replace it with your first real domain and keep the same shape.
 */

export const QK = {
	todos: {
		/** The todo list root — filtered views append their own suffixes. */
		list: () => ["todos", "list"] as const,
		item: (id: string) => ["todos", "item", id] as const,
	},
} as const
