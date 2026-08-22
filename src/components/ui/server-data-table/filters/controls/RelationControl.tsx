import { Check, Loader2, Search } from "lucide-react"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useListNavigation } from "../../keyboard/useListNavigation"
import type { FilterOption, LoadOptionsFn } from "../../types"
import type { ControlProps } from "./types"

type Mode = "single" | "multi"

type Props<TValue> = ControlProps<TValue> & {
	loadOptions: LoadOptionsFn
	mode: Mode
	searchPlaceholder?: string
	/** Render an item in the picker. Default: label only. */
	renderOption?: (option: FilterOption) => React.ReactNode
	/** Report value→label map so the parent can persist on the condition. */
	onLabelsChange?: (labels: Record<string, string>) => void
}

/**
 * Server-side combobox shared between single and multi relation pickers.
 * - 300ms debounced search query → calls loadOptions(query)
 * - Caches results per query string for the lifetime of the picker
 * - Single mode: click → onChange(value) + onCommit(value), closes picker
 * - Multi mode: click → toggle, Apply commits the array
 */
function RelationControlBase<TValue>({
	value,
	onChange,
	onCommit,
	loadOptions,
	mode,
	searchPlaceholder = "Search…",
	onLabelsChange,
}: Props<TValue>) {
	const [query, setQuery] = React.useState("")
	const [debounced, setDebounced] = React.useState("")
	const [options, setOptions] = React.useState<FilterOption[]>([])
	const [loading, setLoading] = React.useState(true)
	// Accumulates value→label as user picks options. Reported to parent via
	// onLabelsChange so labels can be persisted on the FilterCondition.
	const labelsRef = React.useRef<Record<string, string>>({})
	const cacheRef = React.useRef(new Map<string, FilterOption[]>())
	// In-flight promise map — dedupes concurrent requests for the same query
	// (handles React 18 StrictMode double-mount without double-fetching).
	const inflightRef = React.useRef(new Map<string, Promise<FilterOption[]>>())

	// Stable ref for loadOptions so the fetch effect only re-fires on
	// debounced query changes, not on identity changes of the callback
	// (e.g. when `useAdminClient()` creates a new GraphQLClient per render).
	const loadOptionsRef = React.useRef(loadOptions)
	loadOptionsRef.current = loadOptions

	// Debounce search query
	React.useEffect(() => {
		const t = setTimeout(() => setDebounced(query), 300)
		return () => clearTimeout(t)
	}, [query])

	// Fetch options on debounced change.
	React.useEffect(() => {
		let cancelled = false
		const cached = cacheRef.current.get(debounced)
		if (cached) {
			setOptions(cached)
			setLoading(false)
			return
		}
		setLoading(true)

		// Reuse an in-flight promise for the same query so React 18 StrictMode
		// double-mount sends only one network request.
		let promise = inflightRef.current.get(debounced)
		if (!promise) {
			promise = loadOptionsRef.current(debounced)
			inflightRef.current.set(debounced, promise)
			promise.finally(() => inflightRef.current.delete(debounced))
		}

		promise
			.then((opts) => {
				cacheRef.current.set(debounced, opts)
				if (cancelled) return
				setOptions(opts)
			})
			.catch(() => {
				if (cancelled) return
				setOptions([])
			})
			.finally(() => {
				if (cancelled) return
				setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [debounced])

	// TValue is a per-mode runtime shape the generic parameter can't encode:
	// `string` in single mode, `string[]` in multi. Read it via `unknown` (a
	// safe widening — no cast) and narrow by shape; `selectedValues` is the
	// multi-mode array (empty in single mode).
	const rawValue: unknown = value
	const selectedValues: string[] = Array.isArray(rawValue)
		? rawValue.map(String)
		: []

	// emit is the ONE irreducible bridge: producing the opaque generic TValue
	// from a concrete string / string[] has no safe assignment form (a plain
	// `as TValue` doesn't compile for an unconstrained generic), so the single
	// documented `as unknown as TValue` lives here and nowhere else.
	const emit = (next: string | string[], commit = false) => {
		const tv = next as unknown as TValue
		onChange(tv)
		if (commit) onCommit?.(tv)
	}

	const isSelected = (optValue: string) => {
		if (mode === "single") return rawValue === optValue
		return selectedValues.includes(optValue)
	}

	const handlePick = (opt: FilterOption) => {
		// Track the label for this value.
		labelsRef.current[opt.value] = opt.label
		onLabelsChange?.({ ...labelsRef.current })

		if (mode === "single") {
			emit(opt.value, true)
			return
		}
		// multi: toggle
		const next = selectedValues.includes(opt.value)
			? selectedValues.filter((v) => v !== opt.value)
			: [...selectedValues, opt.value]
		emit(next)
	}

	const selectedCount = mode === "multi" ? selectedValues.length : 0

	// Arrow nav: in multi mode, Enter = apply (commit), Space = toggle.
	// In single mode, Enter = pick (already commits via handlePick).
	const nav = useListNavigation({
		count: options.length,
		onSelect: (i) => {
			// Enter in single mode → pick & commit. In multi mode this is
			// overridden by the keydown handler below (Enter → apply).
			if (mode === "single") {
				const opt = options[i]
				if (opt) handlePick(opt)
			} else {
				// Multi: Enter → commit the current selection.
				onCommit?.()
			}
		},
		resetKey: debounced,
	})

	// Forward keyboard nav (arrows + Enter + Esc) from the search input.
	// We deliberately do NOT intercept Space — the input must be able to
	// accept spaces in multi-word queries like "iphone 17". Toggling
	// individual options happens via mouse click; Enter commits the
	// current multi selection (handled by nav.onSelect above).
	const handleKeyDown = nav.onKeyDown

	return (
		<div className="flex flex-col">
			<div className="border-b px-2 py-1.5">
				<div className="flex items-center gap-2">
					<Search className="text-muted-foreground h-3.5 w-3.5" />
					<Input
						autoFocus
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={searchPlaceholder}
						className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
						onKeyDown={handleKeyDown}
					/>
					{loading && (
						<Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
					)}
				</div>
			</div>
			<div className="max-h-64 overflow-y-auto p-1">
				{!loading && options.length === 0 ? (
					<div className="text-muted-foreground px-2 py-3 text-center text-sm">
						{debounced ? "No matches" : "Type to search…"}
					</div>
				) : (
					options.map((opt, i) => {
						const Icon = opt.icon
						const isSel = isSelected(opt.value)
						const isActive = nav.activeIndex === i
						return (
							<button
								key={opt.value}
								ref={nav.getItemRef(i)}
								type="button"
								onClick={() => handlePick(opt)}
								onMouseMove={() => nav.setActiveIndex(i)}
								className={cn(
									"hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
									isActive && "bg-accent",
								)}
							>
								{mode === "multi" ? (
									<span
										className={cn(
											"border-input flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border",
											isSel && "bg-primary border-primary",
										)}
									>
										{isSel && (
											<Check className="text-primary-foreground h-3 w-3" />
										)}
									</span>
								) : null}
								{Icon && <Icon className="h-4 w-4" />}
								<span className="flex-1 truncate">{opt.label}</span>
								{mode === "single" && isSel && (
									<Check className="h-3.5 w-3.5" />
								)}
							</button>
						)
					})
				)}
			</div>
			{/* Apply button is rendered by the parent (FilterPicker / FilterValuePopover)
          via needsApplyButton — no need to duplicate it here. We only show the
          selection count as a hint. */}
			{mode === "multi" && selectedCount > 0 && (
				<div className="border-t px-2 py-1.5">
					<span className="text-muted-foreground text-xs">
						{selectedCount} selected
					</span>
				</div>
			)}
		</div>
	)
}

export function RelationControl({
	value,
	onChange,
	onCommit,
	loadOptions,
	searchPlaceholder,
	onLabelsChange,
}: ControlProps<string | undefined> & {
	loadOptions: LoadOptionsFn
	searchPlaceholder?: string
	onLabelsChange?: (labels: Record<string, string>) => void
}) {
	return (
		<RelationControlBase
			mode="single"
			value={value}
			onChange={onChange}
			onCommit={onCommit}
			loadOptions={loadOptions}
			searchPlaceholder={searchPlaceholder}
			onLabelsChange={onLabelsChange}
			operator={"eq"}
		/>
	)
}

export function RelationMultiControl({
	value,
	onChange,
	onCommit,
	loadOptions,
	searchPlaceholder,
	onLabelsChange,
}: ControlProps<string[]> & {
	loadOptions: LoadOptionsFn
	searchPlaceholder?: string
	onLabelsChange?: (labels: Record<string, string>) => void
}) {
	return (
		<RelationControlBase
			mode="multi"
			value={value}
			onChange={onChange}
			onCommit={onCommit}
			loadOptions={loadOptions}
			onLabelsChange={onLabelsChange}
			searchPlaceholder={searchPlaceholder}
			operator={"in"}
		/>
	)
}
