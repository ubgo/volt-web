import { LayoutGrid } from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"
import { RowActions } from "../actions/RowActions"
import type { DataTableColumn, DataTableLayout, LayoutCtx } from "../types"

type CardsLayoutOptions<TNode> = {
	/** id used for state. Default "cards". */
	id?: string
	/** Display label in the layout switcher. Default "Cards". */
	label?: string
	/** Tile title (top of card). Defaults to the first non-actions column. */
	title?: (row: TNode) => React.ReactNode
	/** Optional subtitle below the title. */
	subtitle?: (row: TNode) => React.ReactNode
	/** Body content. Defaults to label/value list of remaining columns. */
	body?: (row: TNode, columns: DataTableColumn<TNode>[]) => React.ReactNode
	/** Top-right adornment — by default renders RowActions. Pass null to hide. */
	corner?: ((row: TNode) => React.ReactNode) | null
	/** Tailwind grid template. Default: responsive 1/2/3 columns. */
	gridClassName?: string
	/** Min card height in px. Default 120. */
	minHeight?: number
	/** Override the leading icon shown in the layout dropdown. */
	icon?: React.ComponentType<{ className?: string }>
}

/**
 * Returns a `DataTableLayout` that renders rows as a responsive grid of cards.
 *
 * Defaults pull from the column definitions:
 *   - Title  = first visible non-actions column's `cell(row)` output
 *   - Body   = label/value rows for the remaining visible columns
 *   - Corner = the standard `<RowActions>` dropdown (when rowActions is set)
 *
 * Override any slot for a fully bespoke card.
 */
export function cardsLayout<TNode>(
	opts: CardsLayoutOptions<TNode> = {},
): DataTableLayout<TNode> {
	const {
		id = "cards",
		label = "Cards",
		title,
		subtitle,
		body,
		corner,
		gridClassName = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
		minHeight = 120,
		icon = LayoutGrid,
	} = opts

	return {
		id,
		label,
		icon,
		render: (ctx: LayoutCtx<TNode>) => {
			// Loading / empty paths reuse the same elements the table layout
			// uses, so look-and-feel stays consistent across switches.
			if (ctx.isLoading && ctx.nodes.length === 0) {
				return (
					<div className={gridClassName}>
						{Array.from({ length: 6 }).map((_, i) => (
							<div
								key={i}
								style={{ minHeight }}
								className="bg-muted/30 animate-pulse rounded-md border"
							/>
						))}
					</div>
				)
			}
			if (ctx.nodes.length === 0) {
				return <div className="rounded-md border">{ctx.emptyState}</div>
			}

			const nonActionsCols = ctx.columns.filter((c) => c.id !== "__actions")
			const titleCol = nonActionsCols[0]
			const bodyCols = nonActionsCols.slice(1)

			return (
				<div className={gridClassName}>
					{ctx.nodes.map((row, i) => {
						const rowId = ctx.getRowId(row)
						const items = ctx.rowActions ? ctx.rowActions(row) : []
						const cornerNode =
							corner === null ? null : corner ? (
								corner(row)
							) : items.length > 0 ? (
								<RowActions actions={items} />
							) : null

						return (
							<div
								key={rowId}
								style={{ minHeight }}
								className={cn(
									"bg-background hover:bg-muted/30 group rounded-md border p-3 transition-colors",
									"flex flex-col gap-2",
								)}
							>
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<div className="text-foreground truncate text-sm font-medium">
											{title ? title(row) : titleCol?.cell(row, i)}
										</div>
										{subtitle && (
											<div className="text-muted-foreground truncate text-xs">
												{subtitle(row)}
											</div>
										)}
									</div>
									{cornerNode && <div className="shrink-0">{cornerNode}</div>}
								</div>

								{body ? (
									body(row, ctx.columns)
								) : (
									<dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
										{bodyCols.map((c) => (
											<React.Fragment key={c.id}>
												<dt className="text-muted-foreground truncate">
													{c.meta?.label ??
														(typeof c.header === "string" ? c.header : c.id)}
												</dt>
												<dd className="text-foreground min-w-0 truncate">
													{c.cell(row, i)}
												</dd>
											</React.Fragment>
										))}
									</dl>
								)}
							</div>
						)
					})}
				</div>
			)
		},
	}
}
