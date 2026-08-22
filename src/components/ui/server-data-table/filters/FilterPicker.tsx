import { ArrowLeft, Plus, Search } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Kbd } from "../keyboard/Kbd"
import { useListNavigation } from "../keyboard/useListNavigation"
import type { FilterCondition, FilterFieldDef, FilterOperator } from "../types"
import {
	ControlSwitch,
	defaultValueForType,
	needsApplyButton,
} from "./ControlSwitch"
import {
	operatorArity,
	operatorLabel,
	operatorsForField,
	smartDefaultOperator,
} from "./operators"

type Props<TWhere> = {
	fields: FilterFieldDef<TWhere>[]
	onAdd: (cond: FilterCondition) => void
	/** Controlled open state (used when triggered from a column-header menu) */
	open?: boolean
	onOpenChange?: (open: boolean) => void
	/** When the picker opens with this set, jump straight to the value editor
	 *  for the matching field. Resets to null after the picker closes. */
	initialField?: string | null
	onInitialFieldConsumed?: () => void
}

type View<TWhere> =
	| { mode: "fields" }
	| {
			mode: "value"
			field: FilterFieldDef<TWhere>
			operator: FilterOperator
			value: unknown
	  }

/**
 * Single popover with two stages:
 * 1. Field picker (fuzzy-searchable, grouped)
 * 2. Inline value editor for the picked field
 *
 * Anchored to the "+ Filter" button, so the popover stays in place
 * while transitioning between stages.
 */
export function FilterPicker<TWhere>({
	fields,
	onAdd,
	open: openProp,
	onOpenChange,
	initialField,
	onInitialFieldConsumed,
}: Props<TWhere>) {
	const isControlled = openProp !== undefined
	const [internalOpen, setInternalOpen] = React.useState(false)
	const open = isControlled ? openProp : internalOpen
	const [view, setView] = React.useState<View<TWhere>>({ mode: "fields" })
	const [query, setQuery] = React.useState("")

	// Reset state whenever the popover closes
	const handleOpenChange = (o: boolean) => {
		if (isControlled) onOpenChange?.(o)
		else setInternalOpen(o)
		if (!o) {
			setView({ mode: "fields" })
			setQuery("")
		}
	}

	// `fields` and the consume callback held in refs so the effect fires only on
	// the intended triggers (open / initialField) while still using their latest
	// values — depending on `fields` directly would re-jump whenever the column
	// set is rebuilt.
	const fieldsRef = React.useRef(fields)
	fieldsRef.current = fields
	const onInitialFieldConsumedRef = React.useRef(onInitialFieldConsumed)
	onInitialFieldConsumedRef.current = onInitialFieldConsumed

	// Consume initialField → jump to value editor for that field
	React.useEffect(() => {
		if (!open || !initialField) return
		const field = fieldsRef.current.find((f) => f.id === initialField)
		if (!field) return
		setView({
			mode: "value",
			field,
			operator: smartDefaultOperator[field.type],
			value: defaultValueForType(field.type, smartDefaultOperator[field.type]),
		})
		onInitialFieldConsumedRef.current?.()
	}, [open, initialField])

	const handlePickField = (field: FilterFieldDef<TWhere>) => {
		setView({
			mode: "value",
			field,
			operator: smartDefaultOperator[field.type],
			value: defaultValueForType(field.type, smartDefaultOperator[field.type]),
		})
	}

	const handleApply = (
		field: FilterFieldDef<TWhere>,
		operator: FilterOperator,
		value: unknown,
		labels?: Record<string, string>,
	) => {
		onAdd({
			id: makeId(),
			fieldId: field.id,
			operator,
			value,
			...(labels ? { labels } : {}),
		})
		handleOpenChange(false)
	}

	const widthClass =
		view.mode === "value" &&
		(view.field.type === "date" || view.field.type === "date-range")
			? "w-auto"
			: "w-72"

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-7 gap-1.5 border-dashed px-2 text-xs"
				>
					<Plus className="h-3 w-3" />
					Filter
					<Kbd className="ml-0.5">f</Kbd>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className={cn("p-0 shadow-lg", widthClass)}>
				{view.mode === "fields" ? (
					<FieldPicker
						fields={fields}
						query={query}
						onQueryChange={setQuery}
						onPick={handlePickField}
					/>
				) : (
					<ValueEditor
						field={view.field}
						initialOperator={view.operator}
						initialValue={view.value}
						onBack={() => setView({ mode: "fields" })}
						onApply={(operator, value, labels) =>
							handleApply(view.field, operator, value, labels)
						}
					/>
				)}
			</PopoverContent>
		</Popover>
	)
}

// ──────────────────────────────────────────────────────────────────────────
// Stage 1 — field picker
// ──────────────────────────────────────────────────────────────────────────

function FieldPicker<TWhere>({
	fields,
	query,
	onQueryChange,
	onPick,
}: {
	fields: FilterFieldDef<TWhere>[]
	query: string
	onQueryChange: (q: string) => void
	onPick: (f: FilterFieldDef<TWhere>) => void
}) {
	// Filter the field set then group it. We also keep a flat list in
	// selection order — that's what arrow-key navigation indexes into.
	const { grouped, flat } = React.useMemo(() => {
		const q = query.toLowerCase()
		const matches = q
			? fields.filter((f) => f.label.toLowerCase().includes(q))
			: fields
		const groups = new Map<string, FilterFieldDef<TWhere>[]>()
		const flatList: FilterFieldDef<TWhere>[] = []
		for (const f of matches) {
			const g = f.group ?? "Filters"
			const arr = groups.get(g) ?? []
			arr.push(f)
			groups.set(g, arr)
		}
		// Flatten in group-first order so arrow nav matches what the eye sees.
		for (const [, items] of groups) flatList.push(...items)
		return {
			grouped: Array.from(groups.entries()),
			flat: flatList,
		}
	}, [fields, query])

	// Arrow-key navigation across the flat list.
	const nav = useListNavigation({
		count: flat.length,
		onSelect: (i) => {
			const f = flat[i]
			if (f) onPick(f)
		},
		resetKey: query,
	})

	return (
		<>
			<div className="border-b px-2 py-1.5">
				<div className="flex items-center gap-2">
					<Search className="text-muted-foreground h-3.5 w-3.5" />
					<Input
						autoFocus
						value={query}
						onChange={(e) => onQueryChange(e.target.value)}
						placeholder="Filter by…"
						className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
						onKeyDown={nav.onKeyDown}
					/>
				</div>
			</div>
			<div className="max-h-72 overflow-y-auto p-1">
				{grouped.length === 0 ? (
					<div className="text-muted-foreground px-2 py-3 text-center text-sm">
						No fields
					</div>
				) : (
					// Render groups in display order; flatIndex tracks position in
					// the flat list so arrow-key highlights match.
					(() => {
						let flatIndex = -1
						return grouped.map(([groupName, items]) => (
							<div key={groupName} className="mb-2 last:mb-0">
								<div className="text-muted-foreground px-2 py-1 text-xs font-medium uppercase tracking-wide">
									{groupName}
								</div>
								{items.map((f) => {
									flatIndex += 1
									const idx = flatIndex
									const active = nav.activeIndex === idx
									return (
										<button
											key={f.id}
											ref={nav.getItemRef(idx)}
											type="button"
											onClick={() => onPick(f)}
											onMouseMove={() => nav.setActiveIndex(idx)}
											className={cn(
												"hover:bg-accent flex h-7 w-full items-center gap-1.5 rounded-sm px-2 text-left text-xs",
												active && "bg-accent",
											)}
										>
											{f.icon && <f.icon className="h-3 w-3" />}
											<span className="truncate">{f.label}</span>
										</button>
									)
								})}
							</div>
						))
					})()
				)}
			</div>
		</>
	)
}

// ──────────────────────────────────────────────────────────────────────────
// Stage 2 — inline value editor
// ──────────────────────────────────────────────────────────────────────────

function ValueEditor<TWhere>({
	field,
	initialOperator,
	initialValue,
	onBack,
	onApply,
}: {
	field: FilterFieldDef<TWhere>
	initialOperator: FilterOperator
	initialValue: unknown
	onBack: () => void
	onApply: (
		operator: FilterOperator,
		value: unknown,
		labels?: Record<string, string>,
	) => void
}) {
	const [operator, setOperatorRaw] =
		React.useState<FilterOperator>(initialOperator)
	const [value, setValue] = React.useState<unknown>(initialValue)
	// Relation labels (value→display name) reported by RelationControl.
	const [labels, setLabels] = React.useState<Record<string, string>>({})

	// Switching between single (eq/neq) and multi (in/notIn) operators
	// invalidates the current value shape — reseed with the right default.
	const setOperator = (next: FilterOperator) => {
		setOperatorRaw(next)
		if (
			(field.type === "select" || field.type === "relation") &&
			shapeChanges(operator, next)
		) {
			setValue(defaultValueForType(field.type, next))
		}
	}

	const operators = operatorsForField(field.type, field.operators)
	const showOperatorPicker = operators.length > 1
	const arity = operatorArity[operator]

	const commit = (overrideValue?: unknown) => {
		const v = overrideValue !== undefined ? overrideValue : value
		if (arity === 0 || isValidValue(arity, v)) {
			onApply(operator, v, Object.keys(labels).length > 0 ? labels : undefined)
		}
	}

	return (
		<>
			<div className="flex items-center justify-between gap-2 border-b px-2 py-1.5">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="text-muted-foreground h-7 gap-1 px-1.5 text-xs"
					onClick={onBack}
				>
					<ArrowLeft className="h-3.5 w-3.5" />
				</Button>
				<div className="flex flex-1 items-center gap-1.5 truncate">
					{field.icon && <field.icon className="h-3.5 w-3.5 shrink-0" />}
					<span className="truncate text-sm font-medium">{field.label}</span>
				</div>
				{showOperatorPicker ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="text-muted-foreground h-7 px-1.5 text-xs"
							>
								{operatorLabel[operator]}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-32 p-0.5">
							<DropdownMenuGroup>
								{operators.map((op) => (
									<DropdownMenuItem
										key={op}
										onClick={() => setOperator(op)}
										className="h-7 px-2 py-0 text-xs"
									>
										{operatorLabel[op]}
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<span className="text-muted-foreground px-1.5 text-xs">
						{operatorLabel[operator]}
					</span>
				)}
			</div>

			{arity > 0 && (
				<div className="p-2">
					<ControlSwitch
						field={field}
						operator={operator}
						value={value}
						onChange={setValue}
						onCommit={commit}
						onLabelsChange={setLabels}
					/>
				</div>
			)}

			{(arity === 0 || needsApplyButton(field.type, operator)) && (
				<div className="flex justify-end border-t p-1.5">
					<Button
						type="button"
						size="sm"
						onClick={() => commit()}
						className="h-7 px-3 text-xs"
					>
						Apply
					</Button>
				</div>
			)}
		</>
	)
}

function isValidValue(arity: 0 | 1 | 2, value: unknown): boolean {
	if (arity === 0) return true
	if (value === undefined || value === null || value === "") return false
	if (Array.isArray(value) && value.length === 0) return false
	return true
}

function makeId(): string {
	return Math.random().toString(36).slice(2, 10)
}

/** True when switching operators changes the value shape between
 *  single (`eq`/`neq`) and multi (`in`/`notIn`). */
function shapeChanges(prev: FilterOperator, next: FilterOperator): boolean {
	const prevMulti = prev === "in" || prev === "notIn"
	const nextMulti = next === "in" || next === "notIn"
	return prevMulti !== nextMulti
}
