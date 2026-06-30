import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { FilterFieldDef, FilterOperator } from "../types"
import { ControlSwitch, needsApplyButton } from "./ControlSwitch"
import { operatorArity, operatorLabel, operatorsForField } from "./operators"

type Props<TWhere> = {
	field: FilterFieldDef<TWhere>
	initialOperator: FilterOperator
	initialValue: unknown
	/** When true, caller controls open state via `open`/`onOpenChange`. */
	controlled?: boolean
	open?: boolean
	onOpenChange?: (open: boolean) => void
	trigger?: React.ReactNode
	onApply: (cond: {
		operator: FilterOperator
		value: unknown
		labels?: Record<string, string>
	}) => void
	onCancel?: () => void
}

/**
 * Standalone operator + value editor popover. Used to edit an existing
 * filter pill (the pill itself is the trigger).
 *
 * For the "new filter" flow, `FilterPicker` does the same job inline
 * within its own popover so it can show the field-picker first.
 */
export function FilterValuePopover<TWhere>({
	field,
	initialOperator,
	initialValue,
	controlled = false,
	open: openProp,
	onOpenChange,
	trigger,
	onApply,
	onCancel,
}: Props<TWhere>) {
	const [internalOpen, setInternalOpen] = React.useState(!controlled)
	const open = controlled ? (openProp ?? false) : internalOpen
	const setOpen = (o: boolean) => {
		if (controlled) {
			onOpenChange?.(o)
		} else {
			setInternalOpen(o)
			if (!o) onCancel?.()
		}
	}

	const [operator, setOperator] =
		React.useState<FilterOperator>(initialOperator)
	const [value, setValue] = React.useState<unknown>(initialValue)
	const [labels, setLabels] = React.useState<Record<string, string>>({})

	// Reset value when an operator with arity 0 is picked
	React.useEffect(() => {
		if (operatorArity[operator] === 0 && value !== undefined) {
			setValue(undefined)
		}
	}, [operator])

	const operators = operatorsForField(field.type, field.operators)
	const showOperatorPicker = operators.length > 1
	const arity = operatorArity[operator]

	const commit = (overrideValue?: unknown) => {
		const v = overrideValue !== undefined ? overrideValue : value
		if (arity === 0 || isValidValue(arity, v)) {
			onApply({
				operator,
				value: v,
				...(Object.keys(labels).length > 0 ? { labels } : {}),
			})
			setOpen(false)
		}
	}

	const widthClass =
		field.type === "date" || field.type === "date-range" ? "w-auto" : "w-72"

	return (
		<Popover open={open} onOpenChange={setOpen}>
			{trigger && (
				// FilterPill renders a styled <div> (not a <button>). base-ui's
				// default `nativeButton: true` warns about lost button semantics —
				// pass `false` so it knows the non-button is intentional.
				<PopoverTrigger asChild nativeButton={false}>
					{trigger}
				</PopoverTrigger>
			)}
			<PopoverContent align="start" className={cn("p-0 shadow-lg", widthClass)}>
				<div className="flex items-center justify-between gap-2 border-b px-3 py-2">
					<div className="flex items-center gap-2 truncate">
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
									className="text-muted-foreground h-6 px-2 text-xs"
								>
									{operatorLabel[operator]}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuGroup>
									<DropdownMenuLabel>Operator</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{operators.map((op) => (
										<DropdownMenuItem key={op} onClick={() => setOperator(op)}>
											{operatorLabel[op]}
										</DropdownMenuItem>
									))}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<span className="text-muted-foreground text-xs">
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
					<div className="flex justify-end border-t p-2">
						<Button
							type="button"
							size="sm"
							onClick={() => commit()}
							className="h-7"
						>
							Apply
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	)
}

function isValidValue(arity: 0 | 1 | 2, value: unknown): boolean {
	if (arity === 0) return true
	if (value === undefined || value === null || value === "") return false
	if (Array.isArray(value) && value.length === 0) return false
	return true
}
