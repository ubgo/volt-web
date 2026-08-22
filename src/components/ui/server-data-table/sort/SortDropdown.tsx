import {
	ArrowDown,
	ArrowDownUp,
	ArrowUp,
	ChevronDown,
	ChevronUp,
	Plus,
	X,
} from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Kbd } from "../keyboard/Kbd"
import { useListNavigation } from "../keyboard/useListNavigation"
import type { SortDirection, SortOption, SortRule } from "../types"

type Props = {
	options: SortOption[]
	value: SortRule[]
	onChange: (sort: SortRule[]) => void
}

/**
 * Multi-column sort dropdown.
 *
 * Active rules render at the top in priority order (1., 2., …).
 * Available fields render below — clicking one appends it as the
 * next-lowest priority. Up/down arrows navigate the entire list
 * (active + available); Enter toggles the highlighted item.
 *
 * Uses Popover (not base-ui Menu) so the unified arrow-key nav
 * driven by `useListNavigation` works across our mixed row types.
 */
export function SortDropdown({ options, value, onChange }: Props) {
	const activeMap = React.useMemo(() => {
		const m = new Map<string, { rule: SortRule; index: number }>()
		value.forEach((rule, index) => {
			m.set(rule.fieldId, { rule, index })
		})
		return m
	}, [value])

	const active = value
	const available = options.filter((o) => !activeMap.has(o.fieldId))

	const primary = active[0]
	const primaryLabel = primary
		? options.find((o) => o.fieldId === primary.fieldId)?.label
		: undefined
	const Icon = primary
		? primary.direction === "asc"
			? ArrowUp
			: ArrowDown
		: ArrowDownUp

	const toggleDirection = (fieldId: string) => {
		onChange(
			value.map((r) =>
				r.fieldId === fieldId
					? { ...r, direction: r.direction === "asc" ? "desc" : "asc" }
					: r,
			),
		)
	}

	const removeRule = (fieldId: string) => {
		onChange(value.filter((r) => r.fieldId !== fieldId))
	}

	const addRule = (fieldId: string, dir: SortDirection = "asc") => {
		onChange([...value, { fieldId, direction: dir }])
	}

	const clearAll = () => onChange([])

	/** Move a rule up or down in the priority order (clamps at edges). */
	const moveRule = (fieldId: string, dir: -1 | 1) => {
		const i = value.findIndex((r) => r.fieldId === fieldId)
		if (i < 0) return
		const j = i + dir
		if (j < 0 || j >= value.length) return
		const next = [...value]
		;[next[i], next[j]] = [next[j], next[i]]
		onChange(next)
	}

	// Flat list for arrow-key nav — interleaves active rules and available
	// options in the order they're displayed. Enter on an active rule
	// toggles its direction; Enter on an available field adds it.
	type FlatItem =
		| { kind: "active"; rule: SortRule; index: number }
		| { kind: "available"; opt: SortOption }
	const flat: FlatItem[] = React.useMemo(() => {
		const out: FlatItem[] = []
		active.forEach((rule, index) => {
			out.push({ kind: "active", rule, index })
		})
		for (const opt of available) out.push({ kind: "available", opt })
		return out
	}, [active, available])

	const nav = useListNavigation({
		count: flat.length,
		onSelect: (i) => {
			const item = flat[i]
			if (!item) return
			if (item.kind === "active") {
				toggleDirection(item.rule.fieldId)
			} else {
				addRule(item.opt.fieldId, item.opt.directions?.[0] ?? "asc")
			}
		},
		// Reset highlight when the underlying list shape changes
		resetKey: `${active.length}:${available.length}`,
	})

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-7 gap-1.5 px-2 text-xs"
					data-server-data-table-sort-trigger="true"
				>
					<Icon className="h-3 w-3" />
					{/* Show first rule's label + direction so changes are visible
              on the trigger even when the table reorder is invisible
              (i.e. when this rule is a tiebreaker secondary sort). */}
					{primary ? (
						<span className="inline-flex items-center gap-0.5">
							{primaryLabel}
							<span className="text-muted-foreground">
								{primary.direction === "asc" ? "↑" : "↓"}
							</span>
						</span>
					) : (
						"Sort"
					)}
					{active.length > 1 && (
						<span className="bg-primary text-primary-foreground inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-sm px-1 text-[9px] tabular-nums">
							+{active.length - 1}
						</span>
					)}
					<Kbd className="ml-0.5">s</Kbd>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="min-w-56 p-0.5"
				// Capture arrow keys at the popover root so navigation works
				// regardless of which child is focused.
				onKeyDown={nav.onKeyDown}
			>
				{active.length === 0 && available.length === 0 ? (
					<div className="text-muted-foreground px-2 py-3 text-center text-xs">
						No sortable fields
					</div>
				) : null}

				{(() => {
					let i = -1
					return (
						<>
							{active.length > 0 && (
								<ul className="flex flex-col">
									{active.map((rule) => {
										i += 1
										const idx = i
										const isActive = nav.activeIndex === idx
										const opt = options.find((o) => o.fieldId === rule.fieldId)
										return (
											<li
												key={rule.fieldId}
												ref={nav.getItemRef(idx)}
												onMouseMove={() => nav.setActiveIndex(idx)}
												className={cn(
													"hover:bg-accent flex h-7 items-center gap-1.5 rounded-sm px-2 text-xs",
													isActive && "bg-accent",
												)}
											>
												<span className="text-muted-foreground w-3 shrink-0 tabular-nums">
													{idx + 1}
												</span>
												{/* Reorder priority — visible only when there's
                            more than one active rule so it doesn't add
                            clutter for the single-sort case. */}
												{active.length > 1 && (
													<span className="flex flex-col -my-1">
														<button
															type="button"
															tabIndex={-1}
															onClick={(e) => {
																e.stopPropagation()
																moveRule(rule.fieldId, -1)
															}}
															disabled={idx === 0}
															className="text-muted-foreground hover:text-foreground inline-flex h-3 w-3 items-center justify-center rounded outline-none disabled:opacity-30"
															aria-label="Move up"
														>
															<ChevronUp className="h-2.5 w-2.5" />
														</button>
														<button
															type="button"
															tabIndex={-1}
															onClick={(e) => {
																e.stopPropagation()
																moveRule(rule.fieldId, 1)
															}}
															disabled={idx === active.length - 1}
															className="text-muted-foreground hover:text-foreground inline-flex h-3 w-3 items-center justify-center rounded outline-none disabled:opacity-30"
															aria-label="Move down"
														>
															<ChevronDown className="h-2.5 w-2.5" />
														</button>
													</span>
												)}
												<button
													type="button"
													onClick={() => toggleDirection(rule.fieldId)}
													className="flex-1 truncate text-left outline-none"
													// Skip in tab order — arrow keys drive selection
													tabIndex={-1}
												>
													{opt?.label ?? rule.fieldId}
												</button>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation()
														toggleDirection(rule.fieldId)
													}}
													className="text-muted-foreground hover:text-foreground inline-flex h-5 w-5 items-center justify-center rounded"
													aria-label="Toggle direction"
													tabIndex={-1}
												>
													{rule.direction === "asc" ? (
														<ArrowUp className="h-3 w-3" />
													) : (
														<ArrowDown className="h-3 w-3" />
													)}
												</button>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation()
														removeRule(rule.fieldId)
													}}
													className="text-muted-foreground hover:text-destructive inline-flex h-5 w-5 items-center justify-center rounded"
													aria-label="Remove sort"
													tabIndex={-1}
												>
													<X className="h-3 w-3" />
												</button>
											</li>
										)
									})}
								</ul>
							)}

							{active.length > 0 && available.length > 0 && (
								<div className="bg-border my-0.5 h-px" />
							)}

							{available.length > 0 && (
								<div className="flex flex-col">
									<div className="text-muted-foreground px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider">
										{active.length > 0 ? "Add sort" : "Sort by"}
									</div>
									{available.map((opt) => {
										i += 1
										const idx = i
										const isActive = nav.activeIndex === idx
										const dirs: SortDirection[] = opt.directions ?? [
											"asc",
											"desc",
										]
										return (
											// Layout row (no handlers → no static-interaction lint). The
											// label and each direction are real <button>s as siblings, so
											// none is nested inside another interactive element.
											<div
												key={opt.fieldId}
												className={cn(
													"hover:bg-accent flex h-7 w-full items-center gap-1.5 rounded-sm px-2 text-xs",
													isActive && "bg-accent",
												)}
											>
												<button
													type="button"
													ref={nav.getItemRef(idx)}
													onMouseMove={() => nav.setActiveIndex(idx)}
													onClick={() => addRule(opt.fieldId, dirs[0] ?? "asc")}
													// Arrow-key driven; don't snare Tab focus or ring.
													tabIndex={-1}
													className="flex min-w-0 flex-1 items-center gap-1.5 text-left outline-none"
												>
													<Plus className="text-muted-foreground h-2.5 w-2.5 shrink-0" />
													<span className="flex-1 truncate">{opt.label}</span>
												</button>
												{dirs.length > 1 && (
													<span className="text-muted-foreground flex items-center gap-0.5">
														<button
															type="button"
															tabIndex={-1}
															onClick={() => addRule(opt.fieldId, "asc")}
															className="hover:text-foreground inline-flex h-5 w-5 items-center justify-center rounded"
															aria-label="Add ascending"
														>
															<ArrowUp className="h-3 w-3" />
														</button>
														<button
															type="button"
															tabIndex={-1}
															onClick={() => addRule(opt.fieldId, "desc")}
															className="hover:text-foreground inline-flex h-5 w-5 items-center justify-center rounded"
															aria-label="Add descending"
														>
															<ArrowDown className="h-3 w-3" />
														</button>
													</span>
												)}
											</div>
										)
									})}
								</div>
							)}

							{active.length > 1 && (
								<>
									<div className="bg-border my-0.5 h-px" />
									<button
										type="button"
										onClick={clearAll}
										className="hover:bg-accent text-muted-foreground hover:text-foreground flex h-7 w-full items-center gap-1.5 rounded-sm px-2 text-xs"
									>
										<X className="h-2.5 w-2.5" />
										Clear all
									</button>
								</>
							)}
						</>
					)
				})()}
			</PopoverContent>
		</Popover>
	)
}
