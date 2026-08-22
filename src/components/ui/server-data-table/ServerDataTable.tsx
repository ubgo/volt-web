import * as React from "react"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { RowActions } from "./actions/RowActions"
import { useRowContextMenu } from "./actions/RowContextMenu"
import { ColumnHeaderMenu } from "./columns/ColumnHeaderMenu"
import { ColumnVisibilityMenu } from "./columns/ColumnVisibilityMenu"
import { useColumnResize } from "./columns/useColumnResize"
import { buildWhere } from "./filters/buildWhere"
import { FilterBar } from "./filters/FilterBar"
import { ShortcutsHelp } from "./keyboard/ShortcutsHelp"
import { useShortcuts } from "./keyboard/useShortcuts"
import { LayoutSelector } from "./layouts/LayoutSelector"
import { CursorPaginationBar } from "./pagination/CursorPaginationBar"
import { PageSizeSelect } from "./pagination/PageSizeSelect"
import { useServerQuery } from "./query/useServerQuery"
import { SortDropdown } from "./sort/SortDropdown"
import { initialTableState } from "./state/reducer"
import { useSearchParams } from "./state/router-compat"
import { decodeUrlState } from "./state/urlCodec"
import { useTableState } from "./state/useTableState"
import { useUrlSync } from "./state/useUrlSync"
import { EmptyState } from "./table/EmptyState"
import { ErrorBanner } from "./table/ErrorBanner"
import { SkeletonRows } from "./table/SkeletonRows"
import type {
	ActionItem,
	DataTableColumn,
	DataTableLayout,
	FilterFieldDef,
	LayoutCtx,
	QueryOrderBy,
	ServerDataTableConfig,
	SortOption,
	SortRule,
	TableCtx,
	ToolbarCtx,
} from "./types"
import { useSavedViews } from "./views/useSavedViews"
import { ViewSelector } from "./views/ViewSelector"

const DEFAULT_COL_SIZE = 160
const ACTIONS_COL_ID = "__actions"

/**
 * ServerDataTable
 * ─────────────────────────────────────────────────────────────────────
 * Plug-and-play server-side data table for gqlkit-style query builders.
 * Self-contained — no @tanstack/react-table dependency. Owns its own
 * column / row / state model.
 *
 * Capabilities (v1 complete):
 *   • cursor pagination (server)
 *   • single-field sort (extensible to multi)
 *   • filters: text, number, boolean, select, multi-select, relation,
 *     relation-multi, date, date-range, full-text search
 *   • saved views (localStorage default, pluggable storage)
 *   • shareable URL state (?q=&f=&s=&v=)
 *   • row actions with built-in mutation+confirm
 *   • column visibility / order / resize
 *   • column header menu (sort/filter/hide)
 *   • row context menu (copy id / json + actions)
 *   • keyboard shortcuts (/, f, v, c)
 *   • Excel-style grid lines, sticky header, polished density
 *
 * State flow:
 *   URL search params  ─┐
 *                       ├─→  TableState (reducer) ─→ useServerQuery ─→ DOM
 *   localStorage views  ─┘                          (gqlkit + useGqlQuery)
 *                       ↓
 *                   on every change → URL replaceState
 */
export function ServerDataTable<
	TNode,
	TWhere = unknown,
	/**
	 * `const` modifier preserves literal ids/types of the caller's
	 * `filterFields` tuple — enables narrow typing on `views.builtinViews`
	 * filters without requiring `as const` at the call site.
	 */
	const FFields extends
		readonly FilterFieldDef<TWhere>[] = readonly FilterFieldDef<TWhere>[],
	/** Same treatment for `sortOptions` — narrows `defaultSort` + view sort. */
	const SOpts extends readonly SortOption[] = readonly SortOption[],
>(props: ServerDataTableConfig<TNode, TWhere, FFields, SOpts>) {
	// ── Destructure config ───────────────────────────────────────────────
	const {
		queryKey,
		queryFn,
		refetchInterval,
		columns: userColumns,
		filterFields,
		search,
		sortOptions,
		defaultSort,
		pageSize: defaultPageSize = 20,
		pageSizeOptions = [10, 20, 50, 100],
		rowActions,
		emptyMessage,
		emptyDescription,
		emptyAction,
		density = "comfortable",
		stickyHeader = true,
		className,
		getRowId,
		rowClassName,
		views: viewsConfig,
		urlState: urlStateProp = true,
		enableColumnResize = true,
		enableColumnReorder = true,
		toolbar,
		layouts: extraLayouts,
		defaultLayout = "table",
	} = props

	// URL sync config: boolean shorthand or object with namespace
	const urlState = !!urlStateProp
	const urlNamespace =
		typeof urlStateProp === "object" ? urlStateProp.namespace : undefined

	// ── Hydrate from URL on first render only ────────────────────────────
	// Subsequent URL writes are pushed by useUrlSync. We never re-read the
	// URL on later renders to avoid clobbering user state.
	const [searchParams] = useSearchParams()
	// Hydrate-once: a lazy useState initializer runs exactly on first render and
	// never again, so later URL writes from useUrlSync can't clobber user state.
	// (This is the exhaustive-deps-clean form of a `useMemo(…, [])` — the
	// initializer's captures aren't a reactive dependency list.)
	const [urlInitial] = React.useState(() =>
		urlState ? decodeUrlState(searchParams, urlNamespace) : null,
	)

	// ── Single source of truth for table state ───────────────────────────
	// Narrow prop types carry `readonly` from `const` generic inference;
	// internal reducer holds a mutable snapshot, so we cast at the boundary.
	const { state, actions } = useTableState({
		defaultSort: defaultSort as SortRule[] | undefined,
		initial: {
			pageSize: defaultPageSize,
			layoutId: defaultLayout,
			...(urlInitial ?? {}),
		},
	})

	// Push state changes back into the URL (replaceState — no history spam)
	useUrlSync({ state, enabled: urlState, namespace: urlNamespace })

	// ── Saved views ──────────────────────────────────────────────────────
	const {
		views,
		save: saveView,
		remove: removeView,
		setDefault: setDefaultView,
		setFavorite: setViewFavorite,
	} = useSavedViews({
		scope: viewsConfig?.scope ?? queryKey,
		storage: viewsConfig?.storage,
		builtinViews: viewsConfig?.builtinViews,
	})

	// Apply default view on mount when URL didn't seed state.
	// Run-once guard so we don't override user changes after the initial load.
	const didApplyDefaultRef = React.useRef(false)
	React.useEffect(() => {
		if (didApplyDefaultRef.current) return
		if (urlInitial) {
			didApplyDefaultRef.current = true
			return
		}
		const def = views.find((v) => v.isDefault)
		if (def) {
			didApplyDefaultRef.current = true
			actions.replaceState(
				initialTableState({
					search: def.state.search,
					filters: def.state.filters,
					sort: def.state.sort,
					viewId: def.id,
				}),
			)
		} else if (views.length > 0) {
			// Storage loaded, no default — mark applied so we skip later passes
			didApplyDefaultRef.current = true
		}
	}, [views, urlInitial, actions])

	// ── Build WhereInput from filter conditions + full-text search ───────
	// Each FilterFieldDef.toWhere() returns a partial; we merge them.
	const where = React.useMemo(
		() =>
			buildWhere<TWhere>({
				filters: state.filters,
				fields: (filterFields ?? []) as FilterFieldDef<TWhere>[],
				search: search ? { value: state.search, config: search } : undefined,
			}),
		[state.filters, state.search, filterFields, search],
	)

	// ── Run the gqlkit query (wraps useGqlQuery + connection flattening) ─
	const { nodes, pageInfo, totalCount, isLoading, isFetching, error, refetch } =
		useServerQuery<TNode, TWhere>({
			queryKey,
			queryFn,
			state,
			where,
			pageSize: state.pageSize,
			refetchInterval,
		})

	// Mirror of the orderBy useServerQuery builds — exposed via toolbar ctx.
	const orderBy = React.useMemo<QueryOrderBy[]>(
		() =>
			state.sort.map((s) => ({
				direction: s.direction === "desc" ? "DESC" : "ASC",
				field: s.fieldId,
			})),
		[state.sort],
	)

	// ── Imperative fetchAll for export-style toolbar plugins ───────────
	// Pages through the cursor connection until exhausted, returning a
	// flat list of nodes. Honors current filters/sort.
	const fetchAll = React.useCallback(
		async ({
			batchSize = 100,
			maxRows,
			signal,
		}: {
			batchSize?: number
			/** Hard cap on how many rows are returned. Iteration stops as soon
			 *  as the accumulator hits this length, so we don't pay for pages
			 *  the caller will throw away. */
			maxRows?: number
			signal?: AbortSignal
		} = {}) => {
			const all: TNode[] = []
			let after: string | null = null
			// Cap iterations so a runaway connection can't infinite-loop.
			for (let i = 0; i < 10_000; i++) {
				if (signal?.aborted) throw new Error("aborted")
				// Right-size the next page so we never overshoot maxRows.
				const remaining =
					typeof maxRows === "number" ? maxRows - all.length : Infinity
				if (remaining <= 0) break
				const first = Math.min(batchSize, remaining)
				const conn = await queryFn({
					where,
					orderBy,
					first,
					after,
					last: null,
					before: null,
				})
				const edges = conn.edges ?? []
				for (const e of edges) {
					const node = e?.node
					if (node) all.push(node)
					if (typeof maxRows === "number" && all.length >= maxRows) break
				}
				if (typeof maxRows === "number" && all.length >= maxRows) break
				if (!conn.pageInfo?.hasNextPage) break
				const nextCursor = conn.pageInfo.endCursor ?? null
				if (!nextCursor || nextCursor === after) break
				after = nextCursor
			}
			return all
		},
		[queryFn, where, orderBy],
	)

	// Context handed to row-action factories (for refetch after mutations).
	const ctx: TableCtx = React.useMemo(
		() => ({ refetch: () => void refetch() }),
		[refetch],
	)

	// ── Compose final column list ────────────────────────────────────────
	// 1. Append a synthetic Actions column when rowActions is defined.
	// 2. Apply user-defined column order (from saved view / drag-reorder).
	// 3. Filter out hidden columns.
	const allColumns = React.useMemo<DataTableColumn<TNode>[]>(() => {
		if (!rowActions) return userColumns
		return [
			...userColumns,
			{
				id: ACTIONS_COL_ID,
				header: "",
				size: 44,
				meta: {
					className: "w-11 text-right",
					hideable: false,
					resizable: false,
					draggable: false,
				},
				// Per-row actions are rendered through the dropdown trigger.
				cell: (row) => <RowActions actions={rowActions(row, ctx)} />,
			},
		]
	}, [userColumns, rowActions, ctx])

	/**
	 * effectiveOrder: explicit column order applied to user-defined columns.
	 * - If state.columnOrder is set, use it (sort allColumns to match).
	 * - Newly-added columns not in state.columnOrder are appended at the end.
	 * - Actions column is forced to the rightmost position.
	 */
	const effectiveOrder = React.useMemo(() => {
		if (state.columnOrder.length === 0) {
			return allColumns
		}
		const known = new Set(state.columnOrder)
		const indexOf = (id: string) => state.columnOrder.indexOf(id)
		const ordered = [...allColumns]
			.filter((c) => c.id !== ACTIONS_COL_ID && known.has(c.id))
			.sort((a, b) => indexOf(a.id) - indexOf(b.id))
		const newcomers = allColumns.filter(
			(c) => c.id !== ACTIONS_COL_ID && !known.has(c.id),
		)
		const actionsCol = allColumns.find((c) => c.id === ACTIONS_COL_ID)
		return [...ordered, ...newcomers, ...(actionsCol ? [actionsCol] : [])]
	}, [allColumns, state.columnOrder])

	// Visible columns (effectiveOrder minus hidden), dedup'd by id as a
	// safety net — guarantees the actions column can never appear twice.
	const visibleColumns = React.useMemo(() => {
		const seen = new Set<string>()
		return effectiveOrder.filter((c) => {
			if (state.hiddenColumns.includes(c.id)) return false
			if (seen.has(c.id)) return false
			seen.add(c.id)
			return true
		})
	}, [effectiveOrder, state.hiddenColumns])

	// Column width helpers
	const widthFor = React.useCallback(
		(col: DataTableColumn<TNode>) =>
			state.columnSizes[col.id] ?? col.size ?? DEFAULT_COL_SIZE,
		[state.columnSizes],
	)
	const totalWidth = React.useMemo(
		() => visibleColumns.reduce((sum, c) => sum + widthFor(c), 0),
		[visibleColumns, widthFor],
	)

	// ── Resize handler ───────────────────────────────────────────────────
	const { startResize } = useColumnResize({
		sizes: state.columnSizes,
		onSizesChange: actions.setColumnSizes,
		defaultSize: DEFAULT_COL_SIZE,
	})

	// ── Indexes used by the column-header menu ───────────────────────────
	const sortFieldIds = React.useMemo(
		() => new Set((sortOptions ?? []).map((s) => s.fieldId)),
		[sortOptions],
	)
	const filterFieldIds = React.useMemo(
		() => new Set((filterFields ?? []).map((f) => f.id)),
		[filterFields],
	)

	// ── Filter picker imperative open ────────────────────────────────────
	// Used by the column header "Filter…" item AND keyboard shortcut `f`.
	const [pickerOpen, setPickerOpen] = React.useState(false)
	const [pickerInitialField, setPickerInitialField] = React.useState<
		string | null
	>(null)
	const handleColumnFilter = React.useCallback((filterFieldId: string) => {
		setPickerInitialField(filterFieldId)
		setPickerOpen(true)
	}, [])

	// ── Refs for keyboard shortcuts ─────────────────────────────────────
	const searchInputRef = React.useRef<HTMLInputElement | null>(null)
	const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
	useShortcuts({
		onSlash: () => searchInputRef.current?.focus(),
		onF: () => setPickerOpen(true),
		onV: () =>
			(
				document.querySelector(
					'[data-server-data-table-views-trigger="true"]',
				) as HTMLElement | null
			)?.click(),
		onC: () =>
			(
				document.querySelector(
					'[data-server-data-table-columns-trigger="true"]',
				) as HTMLElement | null
			)?.click(),
		onS: () =>
			(
				document.querySelector(
					'[data-server-data-table-sort-trigger="true"]',
				) as HTMLElement | null
			)?.click(),
		onQuestion: () => setShortcutsOpen(true),
	})

	// ── Derived UI state ─────────────────────────────────────────────────
	const colCount = visibleColumns.length
	const showSkeleton = isLoading && nodes.length === 0
	const isFiltered = state.filters.length > 0 || state.search.length > 0
	const enableViews = !!viewsConfig

	// ── Layouts ──────────────────────────────────────────────────────────
	// The "table" layout is implicit. Caller-provided layouts append to it.
	// The LayoutSelector is shown only when callers ship at least one extra.
	const allLayouts = React.useMemo<DataTableLayout<TNode>[]>(
		() => [
			// The built-in table layout sentinel — its render function is
			// never used (we render the table inline below), but having it in
			// the list lets the LayoutSelector show "Table" as an option.
			{ id: "table", label: "Table", render: () => null },
			...(extraLayouts ?? []),
		],
		[extraLayouts],
	)
	const enableLayouts = (extraLayouts?.length ?? 0) > 0
	const activeLayout =
		allLayouts.find((l) => l.id === state.layoutId) ?? allLayouts[0]
	const isTableLayout = activeLayout.id === "table"

	const showFilterBar =
		!!filterFields ||
		!!search ||
		!!sortOptions ||
		enableViews ||
		enableLayouts ||
		!!toolbar

	// Supabase-density rows
	const rowSizing =
		density === "compact" ? "h-7 py-1 text-[13px]" : "h-9 py-1.5 text-[13px]"

	// ── Build the toolbar ctx exposed to the `toolbar` slot ─────────────
	const toolbarCtx: ToolbarCtx<TNode, TWhere> = React.useMemo(
		() => ({
			nodes,
			totalCount,
			where,
			orderBy,
			state,
			refetch: () => void refetch(),
			fetchAll,
			isFetching,
		}),
		[nodes, totalCount, where, orderBy, state, refetch, fetchAll, isFetching],
	)

	const renderedToolbar =
		typeof toolbar === "function" ? toolbar(toolbarCtx) : toolbar

	// Apply a saved view's stored state to the table.
	const handleSelectView = React.useCallback(
		(v: {
			id: string
			state: {
				search: string
				filters: typeof state.filters
				sort: typeof state.sort
				hiddenColumns?: string[]
				columnOrder?: string[]
				columnSizes?: Record<string, number>
			}
		}) => {
			actions.replaceState(
				initialTableState({
					search: v.state.search,
					filters: v.state.filters,
					sort: v.state.sort,
					// Column layout — restore if the view stored them; falling back to
					// empty/undefined means "use the columns prop's natural order/sizes".
					hiddenColumns: v.state.hiddenColumns ?? [],
					columnOrder: v.state.columnOrder ?? [],
					columnSizes: v.state.columnSizes ?? {},
					viewId: v.id || null,
				}),
			)
		},
		[actions],
	)

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			{/* ── Toolbar: search + filters + sort + columns + views ───────── */}
			{showFilterBar && (
				<FilterBar<TWhere>
					fields={(filterFields ?? []) as FilterFieldDef<TWhere>[]}
					conditions={state.filters}
					search={search}
					searchValue={state.search}
					onSearchChange={actions.setSearch}
					onAddFilter={actions.addFilter}
					onUpdateFilter={actions.updateFilter}
					onRemoveFilter={actions.removeFilter}
					onClearFilters={actions.clearFilters}
					pickerOpen={pickerOpen}
					onPickerOpenChange={setPickerOpen}
					pickerInitialField={pickerInitialField}
					onPickerInitialFieldConsumed={() => setPickerInitialField(null)}
					searchInputRef={searchInputRef}
					rightSlot={
						<div className="flex items-center gap-2">
							{renderedToolbar}
							{sortOptions && sortOptions.length > 0 && (
								<SortDropdown
									// sortOptions is the readonly generic `SOpts`; SortDropdown
									// wants a mutable SortOption[]. Spread into a fresh mutable
									// copy (it only reads them) instead of casting.
									options={[...sortOptions]}
									value={state.sort}
									onChange={actions.setSort}
								/>
							)}
							{enableLayouts && (
								<LayoutSelector
									layouts={allLayouts}
									activeId={state.layoutId}
									onChange={actions.setLayout}
								/>
							)}
							{isTableLayout && (
								<ColumnVisibilityMenu
									columns={effectiveOrder}
									hiddenColumns={state.hiddenColumns}
									onToggle={actions.toggleColumn}
									onShowAll={() => actions.setHiddenColumns([])}
								/>
							)}
							{enableViews && (
								<ViewSelector
									views={views}
									activeViewId={state.viewId}
									state={state}
									onSelectView={handleSelectView}
									onCreateView={async (name) => {
										const v = await saveView({
											id: makeViewId(),
											name,
											state: {
												search: state.search,
												filters: state.filters,
												sort: state.sort,
												// Persist current column layout — visibility,
												// ordering, resized widths — so toggling between
												// views restores the user's exact grid shape.
												hiddenColumns: state.hiddenColumns,
												columnOrder: state.columnOrder,
												columnSizes: state.columnSizes,
											},
											createdAt: new Date().toISOString(),
											updatedAt: new Date().toISOString(),
										})
										actions.setViewId(v.id)
										return v
									}}
									onUpdateView={async (v) => saveView(v)}
									onDeleteView={async (id) => {
										await removeView(id)
										if (state.viewId === id) actions.setViewId(null)
									}}
									onSetDefault={setDefaultView}
									onSetFavorite={setViewFavorite}
								/>
							)}
						</div>
					}
				/>
			)}

			{/* ── Error banner ─────────────────────────────────────────────── */}
			{error ? (
				<ErrorBanner
					message={(error as Error).message}
					onRetry={() => void refetch()}
				/>
			) : null}

			{/* ── Body: table layout (default) OR caller-provided layout ──── */}
			{!isTableLayout && (
				<div
					className={cn(
						isFetching && !isLoading && "opacity-95 transition-opacity",
					)}
				>
					{activeLayout.render({
						nodes,
						columns: visibleColumns,
						isLoading,
						isFetching,
						isFiltered,
						getRowId: (row) =>
							getRowId ? getRowId(row) : String(nodes.indexOf(row)),
						rowActions: rowActions ? (row) => rowActions(row, ctx) : undefined,
						emptyState: (
							<EmptyState
								message={emptyMessage}
								description={emptyDescription}
								action={emptyAction}
								filtered={isFiltered}
								onClearFilters={
									isFiltered
										? () => {
												actions.clearFilters()
												actions.setSearch("")
											}
										: undefined
								}
							/>
						),
						loadingState: null,
						density,
					} satisfies LayoutCtx<TNode>)}
				</div>
			)}

			{/* Built-in Excel-grid table — renders only when the active
          layout is "table". Caller layouts replace this entirely. */}
			{isTableLayout && (
				<div
					className={cn(
						"bg-background overflow-x-auto rounded-md border",
						// Subtle dim while refetching to hint that data is reloading.
						isFetching && !isLoading && "opacity-95 transition-opacity",
					)}
				>
					<Table
						// tableLayout: fixed makes column widths actually stick.
						// width = sum of column widths so horizontal scroll works when
						// the table is wider than its container.
						style={{ tableLayout: "fixed", width: totalWidth }}
						className={cn(
							// Excel-style grid lines: visible horizontal + vertical lines
							"[&_tr]:border-b [&_tr]:border-border",
							"[&_th:not(:last-child)]:border-r [&_td:not(:last-child)]:border-r",
							"[&_th]:border-border [&_td]:border-border",
						)}
					>
						<TableHeader
							className={cn(
								"bg-muted/40 border-b",
								stickyHeader &&
									"bg-background/95 supports-[backdrop-filter]:bg-muted/50 sticky top-0 z-10 backdrop-blur",
							)}
						>
							<TableRow className="hover:bg-transparent">
								{visibleColumns.map((col) => {
									const isActions = col.id === ACTIONS_COL_ID
									// Per-column override beats table-level setting.
									const reorderable =
										!isActions &&
										enableColumnReorder &&
										col.meta?.draggable !== false
									const resizable =
										!isActions &&
										enableColumnResize &&
										col.meta?.resizable !== false
									const hideable = !isActions && col.meta?.hideable !== false

									return (
										<TableHead
											key={col.id}
											style={{ width: widthFor(col) }}
											data-col-id={col.id}
											className={cn(
												"group/header text-muted-foreground relative h-8 px-3 text-[10px] font-semibold uppercase tracking-wider",
												col.meta?.className,
											)}
											// Drop target lives on the whole th so the user can
											// drop anywhere on a column header.
											onDragOver={
												reorderable
													? (e: React.DragEvent) => {
															e.preventDefault()
															e.dataTransfer.dropEffect = "move"
														}
													: undefined
											}
											onDrop={
												reorderable
													? (e: React.DragEvent) => {
															e.preventDefault()
															const dragged =
																e.dataTransfer.getData("text/plain")
															if (!dragged || dragged === col.id) return
															// Compute new order by removing the dragged
															// column and re-inserting it at the drop target.
															const ids = effectiveOrder.map((c) => c.id)
															const from = ids.indexOf(dragged)
															const to = ids.indexOf(col.id)
															if (from < 0 || to < 0) return
															const next = [...ids]
															next.splice(from, 1)
															next.splice(to, 0, dragged)
															actions.setColumnOrder(next)
														}
													: undefined
											}
										>
											{/* Header label = the drag handle. Resize handle is a
                        sibling, so it doesn't get treated as part of the
                        draggable area. */}
											<div className="flex items-center gap-1">
												{reorderable ? (
													// Drag handle as a real <button> — semantic and
													// keyboard-focusable, with the column menu as a SIBLING
													// so no interactive element nests inside another. The
													// label text is the button's accessible name; native
													// HTML5 DnD stays a pointer-only enhancement.
													<button
														type="button"
														draggable
														onDragStart={(e: React.DragEvent) => {
															e.dataTransfer.setData("text/plain", col.id)
															e.dataTransfer.effectAllowed = "move"
														}}
														title="Drag to reorder column"
														className="flex min-w-0 cursor-grab items-center gap-1 text-left active:cursor-grabbing"
													>
														<span className="truncate">
															{renderHeader(col)}
														</span>
													</button>
												) : (
													<span className="truncate">{renderHeader(col)}</span>
												)}
												<ColumnHeaderMenu
													column={col}
													sortFieldIds={sortFieldIds}
													filterFieldIds={filterFieldIds}
													hideable={hideable}
													currentSort={state.sort}
													onSort={(rule) => actions.setSort(rule ? [rule] : [])}
													onFilter={handleColumnFilter}
													onHide={() => actions.toggleColumn(col.id)}
												/>
											</div>

											{/* Resize handle — sibling of label, not draggable */}
											{resizable && (
												<button
													type="button"
													onMouseDown={(e) => startResize(col.id, e)}
													onTouchStart={(e) => startResize(col.id, e)}
													onClick={(e) => e.stopPropagation()}
													className={cn(
														"absolute right-0 top-0 h-full w-1 cursor-col-resize select-none",
														"bg-transparent hover:bg-primary/40 active:bg-primary",
													)}
													aria-label="Resize column"
												/>
											)}
										</TableHead>
									)
								})}
							</TableRow>
						</TableHeader>

						{showSkeleton ? (
							<SkeletonRows cols={colCount} />
						) : (
							<TableBody>
								{nodes.length === 0 ? (
									<TableRow className="hover:bg-transparent">
										<TableCell colSpan={colCount} className="p-0">
											<EmptyState
												message={emptyMessage}
												description={emptyDescription}
												action={emptyAction}
												filtered={isFiltered}
												onClearFilters={
													isFiltered
														? () => {
																actions.clearFilters()
																actions.setSearch("")
															}
														: undefined
												}
											/>
										</TableCell>
									</TableRow>
								) : (
									nodes.map((row, i) => (
										<BodyRow<TNode>
											key={getRowId ? getRowId(row) : i}
											row={row}
											rowIndex={i}
											rowId={getRowId ? getRowId(row) : String(i)}
											actions={rowActions ? rowActions(row, ctx) : []}
											columns={visibleColumns}
											widthFor={widthFor}
											rowSizing={rowSizing}
											rowClassName={rowClassName?.(row, i)}
										/>
									))
								)}
							</TableBody>
						)}
					</Table>
				</div>
			)}

			{/* ── Status bar: counts left, pagination right ─────────────────── */}
			<div className="flex items-center justify-between gap-2 px-1">
				<div className="text-muted-foreground flex items-center gap-2 text-[11px]">
					<span>
						{typeof totalCount === "number"
							? `${nodes.length} of ${totalCount}`
							: nodes.length > 0
								? `${nodes.length} ${nodes.length === 1 ? "row" : "rows"}`
								: ""}
					</span>
					{isFiltered && nodes.length > 0 && (
						<>
							<span className="text-border">·</span>
							<span>
								{state.filters.length + (state.search ? 1 : 0)} filter
								{state.filters.length + (state.search ? 1 : 0) === 1 ? "" : "s"}
							</span>
						</>
					)}
					<span className="text-border">·</span>
					<button
						type="button"
						onClick={() => setShortcutsOpen(true)}
						className="text-muted-foreground hover:text-foreground inline-flex h-4 min-w-4 items-center justify-center rounded font-mono text-[10px] transition-colors"
						title="Keyboard shortcuts (?)"
						aria-label="Show keyboard shortcuts"
					>
						?
					</button>
				</div>
				<div className="flex items-center gap-2">
					<PageSizeSelect
						value={state.pageSize}
						options={pageSizeOptions}
						onChange={actions.setPageSize}
					/>
					<CursorPaginationBar
						pagination={state.pagination}
						pageInfo={pageInfo}
						loading={isFetching}
						onNext={() => actions.pageNext(pageInfo?.endCursor ?? null)}
						onPrev={() => actions.pagePrev(pageInfo?.startCursor ?? null)}
					/>
				</div>
			</div>

			<ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
		</div>
	)
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

/** Generate a stable id for a newly-saved view. */
function makeViewId(): string {
	return `v_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
}

/** Render a column header — string or function returning ReactNode. */
function renderHeader<TNode>(col: DataTableColumn<TNode>): React.ReactNode {
	return typeof col.header === "function" ? col.header() : col.header
}

// ──────────────────────────────────────────────────────────────────────────
// BodyRow — owns its context-menu state so opening the menu doesn't
// re-render the entire table body.
// ──────────────────────────────────────────────────────────────────────────

function BodyRow<TNode>({
	row,
	rowIndex,
	rowId,
	actions,
	columns,
	widthFor,
	rowSizing,
	rowClassName,
}: {
	row: TNode
	rowIndex: number
	rowId: string
	actions: ActionItem[]
	columns: DataTableColumn<TNode>[]
	widthFor: (col: DataTableColumn<TNode>) => number
	rowSizing: string
	rowClassName?: string
}) {
	// Right-click context menu (portal'd, self-contained — see RowContextMenu)
	const { triggerProps, menu } = useRowContextMenu({
		row,
		rowId,
		actions,
	})

	return (
		<>
			<TableRow
				{...triggerProps}
				className={cn(
					"border-border hover:bg-muted/40 group border-b transition-colors last:border-b-0",
					"focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
					rowClassName,
				)}
				tabIndex={-1}
			>
				{columns.map((col) => (
					<TableCell
						key={col.id}
						style={{ width: widthFor(col) }}
						// overflow-hidden + whitespace-nowrap protects the column
						// width without text-overflow:ellipsis. The ellipsis would
						// render `…` even for cells whose only content is a Menu
						// trigger button (because the trigger has aria/SR text the
						// browser treats as overflowing inline content).
						// Cell renderers can add `truncate` to their own span
						// when they actually want ellipsis on overflow.
						className={cn(
							rowSizing,
							"overflow-hidden whitespace-nowrap px-3 align-middle",
							col.meta?.className,
						)}
					>
						{col.cell(row, rowIndex)}
					</TableCell>
				))}
			</TableRow>
			{menu}
		</>
	)
}
