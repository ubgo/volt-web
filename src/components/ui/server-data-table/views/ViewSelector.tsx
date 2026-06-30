import {
	Bookmark,
	BookmarkCheck,
	Check,
	ChevronDown,
	Pin,
	PinOff,
	Plus,
	Star,
	StarOff,
	Trash2,
} from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Kbd } from "../keyboard/Kbd"
import type { TableState } from "../types"
import { SaveViewDialog } from "./SaveViewDialog"
import type { SavedView } from "./storage/ViewStorage"

type Props = {
	views: SavedView[]
	activeViewId: string | null
	/** Current state — used to detect "modified" badge and to seed Save */
	state: TableState
	onSelectView: (view: SavedView) => void
	onCreateView: (name: string) => Promise<SavedView>
	onUpdateView: (view: SavedView) => Promise<SavedView>
	onDeleteView: (id: string) => Promise<void>
	onSetDefault: (id: string | null) => Promise<void>
	onSetFavorite: (id: string, favorite: boolean) => Promise<void>
}

const ALL_LABEL = "All"

export function ViewSelector({
	views,
	activeViewId,
	state,
	onSelectView,
	onCreateView,
	onUpdateView,
	onDeleteView,
	onSetDefault,
	onSetFavorite,
}: Props) {
	const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)

	const activeView = views.find((v) => v.id === activeViewId) ?? null
	const modified = isModified(state, activeView)

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="h-7 gap-1.5 px-2 text-xs"
						data-server-data-table-views-trigger="true"
					>
						<Bookmark className="h-3 w-3" />
						<span className="max-w-[10rem] truncate">
							{activeView?.name ?? ALL_LABEL}
						</span>
						{modified && (
							<span
								className="bg-primary inline-block h-1.5 w-1.5 rounded-full"
								title="Unsaved changes"
							/>
						)}
						<Kbd className="ml-0.5">v</Kbd>
						<ChevronDown className="h-2.5 w-2.5 opacity-60" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56 p-0.5">
					<DropdownMenuGroup>
						<DropdownMenuItem
							onClick={() =>
								onSelectView({
									id: "",
									name: ALL_LABEL,
									state: { search: "", filters: [], sort: [] },
									createdAt: "",
									updatedAt: "",
								})
							}
							className="h-7 gap-1.5 px-2 py-0 text-xs"
						>
							<Check
								className={cn(
									"h-2.5 w-2.5 shrink-0",
									!activeViewId ? "opacity-100" : "opacity-0",
								)}
							/>
							{ALL_LABEL}
						</DropdownMenuItem>
					</DropdownMenuGroup>

					{views.length > 0 && <DropdownMenuSeparator className="my-0.5" />}
					{views.length > 0 && (
						<DropdownMenuGroup>
							{views.map((v) => (
								<ViewRow
									key={v.id}
									view={v}
									active={activeViewId === v.id}
									onSelect={() => onSelectView(v)}
									onSetDefault={() => onSetDefault(v.isDefault ? null : v.id)}
									onSetFavorite={() => onSetFavorite(v.id, !v.isFavorite)}
									onDelete={() => onDeleteView(v.id)}
								/>
							))}
						</DropdownMenuGroup>
					)}

					<DropdownMenuSeparator className="my-0.5" />
					<DropdownMenuGroup>
						{modified && activeView && !activeView.isBuiltin && (
							<DropdownMenuItem
								onClick={() =>
									void onUpdateView({
										...activeView,
										state: {
											search: state.search,
											filters: state.filters,
											sort: state.sort,
											hiddenColumns: state.hiddenColumns,
											columnOrder: state.columnOrder,
											columnSizes: state.columnSizes,
										},
										updatedAt: new Date().toISOString(),
									})
								}
								className="h-7 gap-1.5 px-2 py-0 text-xs"
							>
								<BookmarkCheck className="h-3 w-3" />
								Save changes
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							onClick={() => setSaveDialogOpen(true)}
							className="h-7 gap-1.5 px-2 py-0 text-xs"
						>
							<Plus className="h-3 w-3" />
							Save as new view…
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<SaveViewDialog
				open={saveDialogOpen}
				onOpenChange={setSaveDialogOpen}
				onSave={async (name) => {
					await onCreateView(name)
				}}
			/>
		</>
	)
}

// ── Single view row ──────────────────────────────────────────────────────

function ViewRow({
	view,
	active,
	onSelect,
	onSetDefault,
	onSetFavorite,
	onDelete,
}: {
	view: SavedView
	active: boolean
	onSelect: () => void
	onSetDefault: () => void
	onSetFavorite: () => void
	onDelete: () => void
}) {
	return (
		<>
			<DropdownMenuItem
				onClick={onSelect}
				className="group h-7 gap-1.5 px-2 py-0 text-xs"
			>
				<Check
					className={cn(
						"h-2.5 w-2.5 shrink-0",
						active ? "opacity-100" : "opacity-0",
					)}
				/>
				{view.isFavorite && (
					<Star className="text-amber-500 h-2.5 w-2.5 shrink-0 fill-amber-500" />
				)}
				<span className="flex-1 truncate">{view.name}</span>
				{view.isDefault && (
					<span className="text-muted-foreground text-[10px]">default</span>
				)}
				{view.isBuiltin && (
					<span className="text-muted-foreground text-[10px]">built-in</span>
				)}
			</DropdownMenuItem>
			{!view.isBuiltin && (
				<div className="text-muted-foreground flex items-center gap-1 px-6 pb-1 text-[10px]">
					<button
						type="button"
						className="hover:text-foreground transition-colors"
						onClick={(e) => {
							e.stopPropagation()
							onSetFavorite()
						}}
					>
						{view.isFavorite ? (
							<span className="inline-flex items-center gap-0.5">
								<StarOff className="h-2.5 w-2.5" />
								Unfavorite
							</span>
						) : (
							<span className="inline-flex items-center gap-0.5">
								<Star className="h-2.5 w-2.5" />
								Favorite
							</span>
						)}
					</button>
					<span>·</span>
					<button
						type="button"
						className="hover:text-foreground transition-colors"
						onClick={(e) => {
							e.stopPropagation()
							onSetDefault()
						}}
					>
						{view.isDefault ? (
							<span className="inline-flex items-center gap-0.5">
								<PinOff className="h-2.5 w-2.5" />
								Unpin
							</span>
						) : (
							<span className="inline-flex items-center gap-0.5">
								<Pin className="h-2.5 w-2.5" />
								Pin
							</span>
						)}
					</button>
					<span>·</span>
					<button
						type="button"
						className="hover:text-destructive transition-colors"
						onClick={(e) => {
							e.stopPropagation()
							onDelete()
						}}
					>
						<span className="inline-flex items-center gap-0.5">
							<Trash2 className="h-2.5 w-2.5" />
							Delete
						</span>
					</button>
				</div>
			)}
		</>
	)
}

// ── Modified detection ───────────────────────────────────────────────────

function isModified(state: TableState, view: SavedView | null): boolean {
	if (!view) {
		// No view active — "modified" if anything is set
		return (
			state.search !== "" || state.filters.length > 0 || state.sort.length > 0
		)
	}
	const viewHidden = view.state.hiddenColumns ?? []
	const viewOrder = view.state.columnOrder ?? []
	const viewSizes = view.state.columnSizes ?? {}
	return (
		state.search !== view.state.search ||
		!arraysShallowEq(state.filters, view.state.filters, condEq) ||
		!arraysShallowEq(state.sort, view.state.sort, sortEq) ||
		!arraysShallowEq(state.hiddenColumns, viewHidden, strEq) ||
		!arraysShallowEq(state.columnOrder, viewOrder, strEq) ||
		!sizesEq(state.columnSizes, viewSizes)
	)
}

function strEq(a: string, b: string): boolean {
	return a === b
}

function sizesEq(
	a: Record<string, number>,
	b: Record<string, number>,
): boolean {
	const ak = Object.keys(a)
	const bk = Object.keys(b)
	if (ak.length !== bk.length) return false
	for (const k of ak) if (a[k] !== b[k]) return false
	return true
}

function arraysShallowEq<T>(
	a: T[],
	b: T[],
	eq: (x: T, y: T) => boolean,
): boolean {
	if (a.length !== b.length) return false
	for (let i = 0; i < a.length; i++) {
		if (!eq(a[i], b[i])) return false
	}
	return true
}

function condEq(
	a: { fieldId: string; operator: string; value: unknown },
	b: { fieldId: string; operator: string; value: unknown },
): boolean {
	return (
		a.fieldId === b.fieldId &&
		a.operator === b.operator &&
		JSON.stringify(a.value) === JSON.stringify(b.value)
	)
}

function sortEq(
	a: { fieldId: string; direction: string },
	b: { fieldId: string; direction: string },
): boolean {
	return a.fieldId === b.fieldId && a.direction === b.direction
}
