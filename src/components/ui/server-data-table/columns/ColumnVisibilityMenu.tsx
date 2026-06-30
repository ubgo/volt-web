import { Check, Columns3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Kbd } from "../keyboard/Kbd"
import type { DataTableColumn } from "../types"

type Props<TNode> = {
	/** All columns (in caller-defined order). The menu lists only the
	 *  ones whose `meta.hideable` isn't explicitly false. */
	columns: DataTableColumn<TNode>[]
	/** Currently hidden column ids. */
	hiddenColumns: string[]
	/** Toggle a single column's visibility. */
	onToggle: (columnId: string) => void
	/** Reset to "all visible". */
	onShowAll: () => void
}

/**
 * Toolbar dropdown that lists hideable columns with a checkbox each.
 */
export function ColumnVisibilityMenu<TNode>({
	columns,
	hiddenColumns,
	onToggle,
	onShowAll,
}: Props<TNode>) {
	const hideableCols = columns.filter(
		(c) => c.meta?.hideable !== false && c.id !== "__actions",
	)
	const allVisible = hiddenColumns.length === 0

	if (hideableCols.length === 0) return null

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-7 gap-1.5 px-2 text-xs"
					aria-label="Column visibility"
					data-server-data-table-columns-trigger="true"
				>
					<Columns3 className="h-3 w-3" />
					Columns
					{!allVisible && (
						<span className="bg-primary text-primary-foreground inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-sm px-1 text-[9px] tabular-nums">
							{hiddenColumns.length}
						</span>
					)}
					<Kbd className="ml-0.5">c</Kbd>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-44 p-0.5">
				<DropdownMenuGroup>
					{hideableCols.map((col) => {
						const visible = !hiddenColumns.includes(col.id)
						const label =
							col.meta?.label ??
							(typeof col.header === "string" ? col.header : col.id)
						return (
							<DropdownMenuItem
								key={col.id}
								// Keep menu open so users can toggle multiple columns.
								closeOnClick={false}
								onClick={() => onToggle(col.id)}
								className="h-7 gap-1.5 px-2 py-0 text-xs"
							>
								<Check
									className={cn(
										"h-2.5 w-2.5 shrink-0",
										visible ? "opacity-100" : "opacity-0",
									)}
								/>
								<span className="flex-1 truncate">{label}</span>
							</DropdownMenuItem>
						)
					})}
					{!allVisible && (
						<button
							type="button"
							onClick={onShowAll}
							className="hover:bg-accent text-muted-foreground hover:text-foreground mt-0.5 flex h-7 w-full items-center gap-1.5 rounded-sm border-t px-2 text-left text-xs"
						>
							<span className="w-2.5 shrink-0" />
							Show all
						</button>
					)}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
