import type { RankingInfo } from "@tanstack/match-sorter-utils"
import { compareItems, rankItem } from "@tanstack/match-sorter-utils"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef, FilterFn, SortingFn } from "@tanstack/react-table"
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	sortingFns,
	useReactTable,
} from "@tanstack/react-table"
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ChevronsUpDown,
	ChevronUp,
	RefreshCw,
	Search,
	Table2,
} from "lucide-react"
import React from "react"
import { AdminShell, PageHeader } from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageSizeSelect } from "@/components/ui/server-data-table/pagination/PageSizeSelect"
import type { Person } from "@/demo/data/table-data"
import { makeData } from "@/demo/data/table-data"
import { StatusBadge, type StatusTone } from "@/demo/form/form-kit"
import { seo } from "@/lib/seo"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/demo/table")({
	component: TableDemo,
	head: () => seo({ title: "Data table" }),
})

declare module "@tanstack/react-table" {
	interface FilterFns {
		fuzzy: FilterFn<unknown>
	}
	interface FilterMeta {
		itemRank: RankingInfo
	}
}

// Fuzzy filter — ranks rows via match-sorter, stores rank meta for fuzzy sort.
const fuzzyFilter: FilterFn<Person> = (row, columnId, value, addMeta) => {
	const itemRank = rankItem(row.getValue(columnId), value)
	addMeta({ itemRank })
	return itemRank.passed
}

const fuzzySort: SortingFn<Person> = (rowA, rowB, columnId) => {
	let dir = 0
	if (rowA.columnFiltersMeta[columnId]) {
		dir = compareItems(
			rowA.columnFiltersMeta[columnId]?.itemRank as RankingInfo,
			rowB.columnFiltersMeta[columnId]?.itemRank as RankingInfo,
		)
	}
	return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}

// Domain status → shared StatusTone (the pill shell lives in the kit).
const STATUS_TONE: Record<Person["status"], StatusTone> = {
	relationship: "success",
	complicated: "warning",
	single: "neutral",
}

function TableDemo() {
	const [globalFilter, setGlobalFilter] = React.useState("")
	const [data, setData] = React.useState<Person[]>(() => makeData(200))

	const columns = React.useMemo<ColumnDef<Person, unknown>[]>(
		() => [
			{
				accessorFn: (row) => `${row.firstName} ${row.lastName}`,
				id: "fullName",
				header: "Name",
				cell: (info) => (
					<span className="font-medium text-foreground">
						{info.getValue() as string}
					</span>
				),
				filterFn: "fuzzy",
				sortingFn: fuzzySort,
			},
			{
				accessorKey: "age",
				header: "Age",
				cell: (info) => (
					<span className="tabular-nums text-muted-foreground">
						{info.getValue() as number}
					</span>
				),
			},
			{
				accessorKey: "visits",
				header: "Visits",
				cell: (info) => (
					<span className="tabular-nums">
						{(info.getValue() as number).toLocaleString()}
					</span>
				),
			},
			{
				accessorKey: "progress",
				header: "Progress",
				cell: (info) => {
					const value = info.getValue() as number
					return (
						<div className="flex items-center gap-2">
							<div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
								<div
									className="h-full rounded-full bg-foreground/70"
									style={{ width: `${value}%` }}
								/>
							</div>
							<span className="tabular-nums text-[12px] text-muted-foreground w-8">
								{value}%
							</span>
						</div>
					)
				},
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: (info) => {
					const status = info.getValue() as Person["status"]
					return <StatusBadge label={status} tone={STATUS_TONE[status]} />
				},
			},
		],
		[],
	)

	const table = useReactTable({
		data,
		columns,
		filterFns: { fuzzy: fuzzyFilter },
		state: { globalFilter },
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: "fuzzy",
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 10 } },
	})

	const total = table.getPrePaginationRowModel().rows.length
	const { pageIndex, pageSize } = table.getState().pagination

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-[1280px]">
				<PageHeader
					icon={<Table2 />}
					title="Data table"
					subtitle="TanStack Table — fuzzy search, sort, and client pagination"
					primaryAction={
						<Button
							variant="outline"
							className="gap-1.5"
							onClick={() => setData(makeData(200))}
						>
							<RefreshCw className="size-3.5" />
							Regenerate
						</Button>
					}
				/>

				{/* Toolbar — search + count */}
				<div className="mb-2 flex items-center justify-between gap-3">
					<div className="relative w-72 max-w-full">
						<Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<DebouncedInput
							value={globalFilter ?? ""}
							onChange={(value) => setGlobalFilter(String(value))}
							placeholder="Search all columns…"
							className="pl-7"
						/>
					</div>
					<div className="text-[11px] text-muted-foreground tabular-nums shrink-0">
						{total.toLocaleString()} rows
					</div>
				</div>

				{/* Table */}
				<div className="rounded-md border border-border bg-background overflow-hidden">
					<table className="w-full text-[13px]">
						<thead className="bg-muted/50 text-[12px] text-foreground">
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id} className="border-b border-border">
									{headerGroup.headers.map((header) => {
										const canSort = header.column.getCanSort()
										const sorted = header.column.getIsSorted()
										return (
											<th
												key={header.id}
												colSpan={header.colSpan}
												className="text-left font-semibold px-3 py-2"
											>
												{header.isPlaceholder ? null : (
													<button
														type="button"
														disabled={!canSort}
														onClick={header.column.getToggleSortingHandler()}
														className={cn(
															"flex items-center gap-1",
															canSort &&
																"cursor-pointer select-none hover:text-foreground/70",
														)}
													>
														{flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
														{canSort &&
															(sorted === "asc" ? (
																<ChevronUp className="size-3 text-foreground/70" />
															) : sorted === "desc" ? (
																<ChevronDown className="size-3 text-foreground/70" />
															) : (
																<ChevronsUpDown className="size-3 text-muted-foreground/50" />
															))}
													</button>
												)}
											</th>
										)
									})}
								</tr>
							))}
						</thead>
						<tbody className="divide-y divide-border">
							{table.getRowModel().rows.length === 0 ? (
								<tr>
									<td
										colSpan={columns.length}
										className="px-3 py-8 text-center text-[12px] text-muted-foreground"
									>
										No rows match “{globalFilter}”.
									</td>
								</tr>
							) : (
								table.getRowModel().rows.map((row) => (
									<tr
										key={row.id}
										className="hover:bg-muted/60 transition-colors"
									>
										{row.getVisibleCells().map((cell) => (
											<td
												key={cell.id}
												className="px-3 py-(--row-padding-y) align-middle text-(length:--row-font-size)"
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</td>
										))}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination — mirrors the ServerDataTable bar (PageSizeSelect +
            icon-sm nav buttons) so both tables read identically. */}
				<div className="mt-3 flex items-center justify-between gap-3">
					<PageSizeSelect
						value={pageSize}
						options={[10, 20, 30, 50]}
						onChange={(size) => table.setPageSize(size)}
					/>
					<div className="flex items-center gap-1">
						<span className="text-muted-foreground mr-1 text-[11px] tabular-nums">
							Page {pageIndex + 1} of {table.getPageCount() || 1}
						</span>
						<Button
							variant="outline"
							size="icon-sm"
							className="h-6 w-6"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
							aria-label="First page"
						>
							<ChevronsLeft className="h-3 w-3" />
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							className="h-6 w-6"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
							aria-label="Previous page"
						>
							<ChevronLeft className="h-3 w-3" />
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							className="h-6 w-6"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
							aria-label="Next page"
						>
							<ChevronRight className="h-3 w-3" />
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							className="h-6 w-6"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
							aria-label="Last page"
						>
							<ChevronsRight className="h-3 w-3" />
						</Button>
					</div>
				</div>
			</div>
		</AdminShell>
	)
}

// Debounced search input, styled with the UI-kit Input for consistent density.
function DebouncedInput({
	value: initialValue,
	onChange,
	debounce = 400,
	...props
}: {
	value: string | number
	onChange: (value: string | number) => void
	debounce?: number
} & Omit<React.ComponentProps<typeof Input>, "onChange">) {
	const [value, setValue] = React.useState(initialValue)

	React.useEffect(() => {
		setValue(initialValue)
	}, [initialValue])

	React.useEffect(() => {
		const timeout = setTimeout(() => onChange(value), debounce)
		return () => clearTimeout(timeout)
	}, [value, debounce, onChange])

	return (
		<Input
			{...props}
			value={value}
			onChange={(e) => setValue(e.target.value)}
		/>
	)
}
