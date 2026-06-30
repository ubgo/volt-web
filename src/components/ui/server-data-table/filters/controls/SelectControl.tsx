import { Check, Search } from "lucide-react"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useListNavigation } from "../../keyboard/useListNavigation"
import type { FilterOption } from "../../types"
import type { ControlProps } from "./types"

type SelectControlProps = ControlProps<string | undefined> & {
	options: FilterOption[]
	searchable?: boolean
}

export function SelectControl({
	value,
	onChange,
	onCommit,
	options,
	searchable,
}: SelectControlProps) {
	const [query, setQuery] = React.useState("")
	// Always show search when there are 4+ options (down from 7) so users
	// can filter even short lists; can also be forced via `searchable`.
	const showSearch = (searchable ?? options.length > 3) && options.length > 0

	const filtered = React.useMemo(() => {
		if (!query) return options
		const q = query.toLowerCase()
		return options.filter((o) => o.label.toLowerCase().includes(q))
	}, [options, query])

	const nav = useListNavigation({
		count: filtered.length,
		onSelect: (i) => {
			const opt = filtered[i]
			if (!opt) return
			onChange(opt.value)
			onCommit?.(opt.value)
		},
		resetKey: query,
	})

	// Auto-focus the list container when there's no search input so
	// arrow keys work immediately. With search, the input itself is
	// autoFocused and forwards keydowns to nav via onKeyDown.
	const containerRef = React.useRef<HTMLDivElement>(null)
	React.useEffect(() => {
		if (!showSearch) containerRef.current?.focus({ preventScroll: true })
		// mount-only — don't refocus on subsequent renders
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
							onKeyDown={nav.onKeyDown}
						/>
					</div>
				</div>
			)}
			{/* When there's no search input, the container catches arrow keys. */}
			<div
				ref={containerRef}
				className="max-h-64 overflow-y-auto p-1 outline-none"
				tabIndex={showSearch ? -1 : 0}
				onKeyDown={showSearch ? undefined : nav.onKeyDown}
			>
				{filtered.length === 0 ? (
					<div className="text-muted-foreground px-2 py-3 text-center text-sm">
						No options
					</div>
				) : (
					filtered.map((opt, i) => {
						const Icon = opt.icon
						const isSelected = value === opt.value
						const isActive = nav.activeIndex === i
						return (
							<button
								key={opt.value}
								ref={nav.getItemRef(i)}
								type="button"
								onClick={() => {
									onChange(opt.value)
									onCommit?.(opt.value)
								}}
								onMouseMove={() => nav.setActiveIndex(i)}
								className={cn(
									"hover:bg-accent flex h-7 w-full items-center gap-1.5 rounded-sm px-2 text-left text-xs",
									isActive && "bg-accent",
									isSelected && !isActive && "bg-accent/50",
								)}
							>
								{Icon && <Icon className="h-3 w-3" />}
								<span className="flex-1 truncate">{opt.label}</span>
								{isSelected && <Check className="h-2.5 w-2.5" />}
							</button>
						)
					})
				)}
			</div>
		</div>
	)
}
