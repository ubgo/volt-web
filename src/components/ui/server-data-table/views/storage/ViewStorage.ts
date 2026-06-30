import type { FilterCondition, SortRule } from "../../types"

export type SavedView = {
	id: string
	name: string
	/** Optional emoji or lucide icon name */
	icon?: string
	isDefault?: boolean
	isFavorite?: boolean
	/** Built-in views shipped via config — can't be deleted, can be duplicated */
	isBuiltin?: boolean
	state: {
		search: string
		filters: FilterCondition[]
		sort: SortRule[]
		/** Hidden column ids. Empty array = all columns visible. */
		hiddenColumns?: string[]
		/** Column display order. Omit / empty = use the columns prop order. */
		columnOrder?: string[]
		/** Per-column user-resized widths in px. Omit = use the column's `size`. */
		columnSizes?: Record<string, number>
	}
	createdAt: string
	updatedAt: string
}

/**
 * Pluggable storage for saved views.
 *
 * Default: `LocalStorageViewStorage` — per-browser, per-device.
 * Future: `ServerViewStorage` — per-user or per-workspace.
 *
 * All methods are async so a server implementation is a drop-in swap.
 */
export interface ViewStorage {
	list(): Promise<SavedView[]>
	get(id: string): Promise<SavedView | null>
	save(view: SavedView): Promise<SavedView>
	delete(id: string): Promise<void>
	setDefault(id: string | null): Promise<void>
	setFavorite(id: string, favorite: boolean): Promise<void>
}
