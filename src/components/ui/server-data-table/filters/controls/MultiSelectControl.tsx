import { Check, Search } from "lucide-react"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useListNavigation } from "../../keyboard/useListNavigation"
import type { FilterOption } from "../../types"
import type { ControlProps } from "./types"

type MultiSelectControlProps = ControlProps<string[]> & {
	options: FilterOption[]
	searchable?: boolean
}

export function MultiSelectControl({
	value,
	onChange,
	onCommit,
	options,
	searchable,
}: MultiSelectControlProps) {
	const [query, setQuery] = React.useState("")
	// Always show search when there are 4+ options.
	const showSearch = (searchable ?? options.length > 3) && options.length > 0
	const selected = value ?? []

	const filtered = React.useMemo(() => {
		if (!query) return options
		const q = query.toLowerCase()
		return options.filter((o) => o.label.toLowerCase().includes(q))
	}, [options, query])

	// useCallback so the memoized keydown handler below has a stable `toggle`
	// dependency (otherwise it'd be rebuilt on every render).
	const toggle = React.useCallback(
		(val: string) => {
			if (selected.includes(val)) {
				onChange(selected.filter((v) => v !== val))
			} else {
				onChange([...selected, val])
			}
		},
		[selected, onChange],
	)

	// Arrow nav: Space toggles the highlighted option, Enter applies.
	const nav = useListNavigation({
		count: filtered.length,
		onSelect: () => {
			// Enter → commit the current multi-selection.
			onCommit?.()
		},
		resetKey: query,
	})

	// Two handlers because Space means different things in different
	// focus contexts:
	//   • search input → spaces are part of multi-word queries like
	//     "iphone 17"; intercepting them here would block the user from
	//     typing. So this handler only forwards arrows / Enter / Esc.
	//   • list container (no search) → arrow-key navigation is the only
	//     way to move highlight, and Space-to-toggle is the standard
	//     listbox shortcut, so we intercept it.
	const handleInputKeyDown = nav.onKeyDown
	const handleListKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === " ") {
				e.preventDefault()
				const opt = filtered[nav.activeIndex]
				if (opt) toggle(opt.value)
				return
			}
			nav.onKeyDown(e)
		},
		[filtered, nav, toggle],
	)

	// Auto-focus the list container when there's no search input so
	// arrows + Space/Enter work immediately.
	const containerRef = React.useRef<HTMLDivElement>(null)
	// Snapshot showSearch so the mount-only focus doesn't re-fire on later
	// renders — a ref read keeps the empty dep list exhaustive.
	const showSearchRef = React.useRef(showSearch)
	React.useEffect(() => {
		if (!showSearchRef.current)
			containerRef.current?.focus({ preventScroll: true })
	}, [])

	return (
		<div className="flex flex-col">
			{showSearch && (
				<div className="border-b px-2 py-1.5">
					<div className="flex items-center gap-2">
						<Search className="text-muted-foreground h-3.5 w-3.5" />
						<Input
							autoFocus
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search…"
							className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
							onKeyDown={handleInputKeyDown}
						/>
					</div>
				</div>
			)}
			<div
				ref={containerRef}
				role="listbox"
				aria-label="Options"
				aria-multiselectable="true"
				className="max-h-64 overflow-y-auto p-1 outline-none"
				tabIndex={showSearch ? -1 : 0}
				onKeyDown={showSearch ? undefined : handleListKeyDown}
			>
				{filtered.length === 0 ? (
					<div className="text-muted-foreground px-2 py-3 text-center text-sm">
						No options
					</div>
				) : (
					filtered.map((opt, i) => {
						const Icon = opt.icon
						const isSelected = selected.includes(opt.value)
						const isActive = nav.activeIndex === i
						return (
							<button
								key={opt.value}
								ref={nav.getItemRef(i)}
								type="button"
								onClick={() => toggle(opt.value)}
								onMouseMove={() => nav.setActiveIndex(i)}
								className={cn(
									"hover:bg-accent flex h-7 w-full items-center gap-1.5 rounded-sm px-2 text-left text-xs",
									isActive && "bg-accent",
								)}
							>
								<span
									className={cn(
										"border-input flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border",
										isSelected && "bg-primary border-primary",
									)}
								>
									{isSelected && (
										<Check className="text-primary-foreground h-2 w-2" />
									)}
								</span>
								{Icon && <Icon className="h-3 w-3" />}
								<span className="flex-1 truncate">{opt.label}</span>
							</button>
						)
					})
				)}
			</div>
			{/* Apply button is rendered by the parent (FilterPicker / FilterValuePopover)
          via needsApplyButton — only show selection count here. */}
			{selected.length > 0 && (
				<div className="border-t px-2 py-1.5">
					<span className="text-muted-foreground text-xs">
						{selected.length} selected
					</span>
				</div>
			)}
		</div>
	)
}
