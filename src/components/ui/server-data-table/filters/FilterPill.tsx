import { X } from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"
import type { DateRangeValue, FilterCondition, FilterFieldDef } from "../types"
import { formatRangeLabel } from "./controls/datePresets"
import { FilterValuePopover } from "./FilterValuePopover"
import { operatorArity, operatorLabel } from "./operators"

type Props<TWhere> = {
	field: FilterFieldDef<TWhere>
	condition: FilterCondition
	onUpdate: (cond: FilterCondition) => void
	onRemove: () => void
}

export function FilterPill<TWhere>({
	field,
	condition,
	onUpdate,
	onRemove,
}: Props<TWhere>) {
	const [open, setOpen] = React.useState(false)

	const rawLabel = formatValue(field, condition)
	const valueLabel = useResolvedLabel(field, condition, rawLabel)
	const Icon = field.icon

	return (
		<FilterValuePopover
			field={field}
			initialOperator={condition.operator}
			initialValue={condition.value}
			controlled
			open={open}
			onOpenChange={setOpen}
			onApply={(c) =>
				onUpdate({
					...condition,
					operator: c.operator,
					value: c.value,
					labels: c.labels ?? condition.labels,
				})
			}
			trigger={
				<span
					className={cn(
						"bg-background hover:bg-muted/60 text-foreground inline-flex h-7 items-center rounded-md border text-[11px] transition-colors",
					)}
				>
					<button
						type="button"
						onClick={() => setOpen(true)}
						className="flex h-full items-center gap-1.5 pl-2 pr-1.5"
					>
						{Icon && <Icon className="text-muted-foreground h-3 w-3" />}
						<span className="text-foreground font-medium">{field.label}</span>
						<span className="text-muted-foreground">
							{operatorLabel[condition.operator]}
						</span>
						{valueLabel && (
							<span className="text-foreground max-w-[10rem] truncate font-medium">
								{valueLabel}
							</span>
						)}
					</button>
					<span className="bg-border h-3 w-px" />
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							onRemove()
						}}
						className="hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-full w-6 items-center justify-center rounded-r-md transition-colors"
						aria-label="Remove filter"
					>
						<X className="h-3 w-3" />
					</button>
				</span>
			}
		/>
	)
}

function formatValue<TWhere>(
	field: FilterFieldDef<TWhere>,
	cond: FilterCondition,
): string {
	if (operatorArity[cond.operator] === 0) return ""

	if (field.type === "boolean") {
		if (cond.value === true) return field.trueLabel ?? "True"
		if (cond.value === false) return field.falseLabel ?? "False"
		return ""
	}

	if (field.type === "select") {
		const opt = field.options.find((o) => o.value === cond.value)
		return opt?.label ?? String(cond.value ?? "")
	}

	if (field.type === "multi-select") {
		const vals = (cond.value as string[]) ?? []
		if (vals.length === 0) return ""
		if (vals.length === 1) {
			return field.options.find((o) => o.value === vals[0])?.label ?? vals[0]
		}
		return `${vals.length} selected`
	}

	if (field.type === "relation") {
		const id = String(cond.value ?? "")
		// Use persisted label if available, otherwise raw ID (resolved async).
		return cond.labels?.[id] ?? id
	}

	if (field.type === "relation-multi") {
		const vals = (cond.value as string[]) ?? []
		if (vals.length === 0) return ""
		if (vals.length === 1) {
			const id = vals[0]
			return cond.labels?.[id] ?? id
		}
		return `${vals.length} selected`
	}

	if (field.type === "date") {
		if (!cond.value) return ""
		return new Date(cond.value as string).toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
		})
	}

	if (field.type === "date-range") {
		return formatRangeLabel(cond.value as DateRangeValue | undefined)
	}

	return String(cond.value ?? "")
}

/**
 * For `relation` / `relation-multi` fields, resolves raw id(s) to
 * human-readable labels via the field's `resolveLabel` callback.
 * Falls through to the raw label when `resolveLabel` isn't provided.
 */
function useResolvedLabel<TWhere>(
	field: FilterFieldDef<TWhere>,
	cond: FilterCondition,
	fallback: string,
): string {
	const [resolved, setResolved] = React.useState<string | null>(null)

	const resolve =
		(field.type === "relation" || field.type === "relation-multi") &&
		"resolveLabel" in field
			? field.resolveLabel
			: undefined

	React.useEffect(() => {
		if (!resolve) return
		let cancelled = false

		async function run() {
			if (field.type === "relation") {
				const id = cond.value as string | undefined
				if (!id) return
				const label = await resolve?.(id)
				if (!cancelled) setResolved(label ?? null)
			} else if (field.type === "relation-multi") {
				const ids = (cond.value as string[] | undefined) ?? []
				if (ids.length === 0) return
				if (ids.length === 1) {
					const first = ids[0]
					if (!first) return
					const label = await resolve?.(first)
					if (!cancelled) setResolved(label ?? null)
				} else {
					if (!cancelled) setResolved(`${ids.length} selected`)
				}
			}
		}

		setResolved(null)
		run()
		return () => {
			cancelled = true
		}
		// Re-resolve when the value, field type, or resolver changes. cond.value
		// is referentially stable across renders (it lives in filter state), so
		// this doesn't over-fire; the cancelled flag guards stale async results.
	}, [cond.value, field.type, resolve])

	return resolved ?? fallback
}
