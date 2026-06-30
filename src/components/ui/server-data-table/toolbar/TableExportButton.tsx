import { Download, Loader2 } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ToolbarCtx } from "../types"
import { type CsvField, downloadCsv } from "./csv"

type Props<TNode, TWhere = unknown> = {
	/** Toolbar context handed by `<ServerDataTable toolbar={(ctx) => ...}>`. */
	ctx: ToolbarCtx<TNode, TWhere>
	/** Filename for the downloaded file. Default `"export.csv"`.
	 *  Can be a function for dynamic naming (e.g. include timestamp). */
	filename?: string | (() => string)
	/** CSV column definitions: tuples of [header, getValue]. */
	fields: ReadonlyArray<CsvField<TNode>>
	/** Show only one option ("page" or "all") — default both. */
	mode?: "page" | "all" | "both"
	/** Override the trigger button label. Default "Export". */
	label?: string
	/** Hide the leading icon. */
	hideIcon?: boolean
	/** Hard cap on rows for the "All matching" option. Default 1000. The
	 *  underlying fetchAll respects this and stops paging once reached. */
	maxAllRows?: number
}

/**
 * Generic, reusable Export button for ServerDataTable.
 *
 * Drops into the `toolbar` slot:
 *   <ServerDataTable
 *     toolbar={(ctx) => (
 *       <TableExportButton ctx={ctx} fields={[…]} />
 *     )}
 *   />
 *
 * Renders a dropdown with two options when mode="both":
 *   - **Current page** — exports `ctx.nodes` (free, no extra request)
 *   - **All matching rows** — calls `ctx.fetchAll()` (paginated)
 */
export function TableExportButton<TNode, TWhere = unknown>({
	ctx,
	filename = "export.csv",
	fields,
	mode = "both",
	label = "Export",
	hideIcon,
	maxAllRows = 1000,
}: Props<TNode, TWhere>) {
	const [busy, setBusy] = React.useState(false)

	const resolveName = React.useCallback(
		() => (typeof filename === "function" ? filename() : filename),
		[filename],
	)

	// Single-mode shortcut — render a plain button, no dropdown.
	if (mode === "page") {
		return (
			<TriggerButton
				label={label}
				hideIcon={hideIcon}
				disabled={busy || ctx.isFetching}
				onClick={() => downloadCsv(resolveName(), ctx.nodes, fields)}
			/>
		)
	}
	if (mode === "all") {
		return (
			<TriggerButton
				label={label}
				hideIcon={hideIcon}
				disabled={busy || ctx.isFetching}
				loading={busy}
				onClick={async () => {
					setBusy(true)
					try {
						// Match the batch size to the cap so we only need a single
						// network round trip in the common case. fetchAll right-sizes
						// the last `first` arg, so the actual GraphQL request will
						// ask for exactly `maxAllRows` rows.
						const rows = await ctx.fetchAll({
							batchSize: maxAllRows,
							maxRows: maxAllRows,
						})
						downloadCsv(resolveName(), rows, fields)
					} finally {
						setBusy(false)
					}
				}}
			/>
		)
	}

	// mode === "both"
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<TriggerButton
					label={label}
					hideIcon={hideIcon}
					disabled={busy || ctx.isFetching}
					loading={busy}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-44 p-0.5">
				<DropdownMenuItem
					className="h-7 gap-1.5 px-2 py-0 text-xs"
					onClick={() => downloadCsv(resolveName(), ctx.nodes, fields)}
				>
					Current page ({ctx.nodes.length})
				</DropdownMenuItem>
				<DropdownMenuItem
					className="h-7 gap-1.5 px-2 py-0 text-xs"
					onClick={async () => {
						setBusy(true)
						try {
							const rows = await ctx.fetchAll({
								batchSize: maxAllRows,
								maxRows: maxAllRows,
							})
							downloadCsv(resolveName(), rows, fields)
						} finally {
							setBusy(false)
						}
					}}
				>
					{/* When the filtered set is bigger than the cap, label the
              limit explicitly so the user knows they're getting a slice. */}
					{typeof ctx.totalCount === "number" && ctx.totalCount > maxAllRows
						? `First ${maxAllRows.toLocaleString()} of ${ctx.totalCount.toLocaleString()}`
						: `All matching rows${
								typeof ctx.totalCount === "number"
									? ` (${ctx.totalCount.toLocaleString()})`
									: ""
							}`}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

// ── Internal trigger button ──────────────────────────────────────────────
// React 19 + basecn pass `ref` as a regular prop and base-ui's
// DropdownMenuTrigger `asChild` handles ref injection — no forwardRef
// wrapper needed.

function TriggerButton({
	label,
	hideIcon,
	loading,
	disabled,
	onClick,
}: {
	label: string
	hideIcon?: boolean
	loading?: boolean
	disabled?: boolean
	onClick?: () => void
}) {
	return (
		<Button
			variant="outline"
			size="sm"
			className="h-7 gap-1.5 px-2 text-xs"
			disabled={disabled}
			onClick={onClick}
		>
			{!hideIcon &&
				(loading ? (
					<Loader2 className="h-3 w-3 animate-spin" />
				) : (
					<Download className="h-3 w-3" />
				))}
			{label}
		</Button>
	)
}
