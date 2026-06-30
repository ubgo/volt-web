import { ArrowRight, Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { DateRangeValue } from "../../types"
import { datePresets, rangeToValue, valueToRange } from "./datePresets"
import type { ControlProps } from "./types"

type Props = ControlProps<DateRangeValue | undefined> & {
	showPresets?: boolean
}

const fmtDate = (d: Date | undefined) =>
	d
		? d.toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: ""

type Step = "awaiting-from" | "awaiting-to"

export function DateRangeControl({
	value,
	onChange,
	onCommit,
	showPresets = true,
}: Props) {
	// Local in-progress range. Separate from `value` so first-click
	// doesn't trigger an upstream commit (which would close the popover).
	const initial = valueToRange(value)
	const [pending, setPending] = React.useState<{
		from: Date | undefined
		to: Date | undefined
	}>({ from: initial.from, to: initial.to })

	// Explicit click-step tracking, because react-day-picker v9 sometimes
	// returns { from: X, to: X } on the FIRST click (treating single click
	// as a complete same-day range) — we don't want to commit then.
	const [step, setStep] = React.useState<Step>(() =>
		initial.from && initial.to ? "awaiting-from" : "awaiting-to",
	)

	const [defaultMonth] = React.useState(() => initial.from ?? new Date())

	const handlePreset = (presetId: string) => {
		const preset = datePresets.find((p) => p.id === presetId)
		if (!preset) return
		const r = preset.range()
		setPending({ from: r.from, to: r.to })
		setStep("awaiting-from")
		const next = rangeToValue(r, presetId)
		onChange(next)
		onCommit?.(next)
	}

	const handleSelect = (
		_r: { from?: Date; to?: Date } | undefined,
		triggerDate: Date,
	) => {
		// We ignore v9's `r` interpretation and drive selection from the
		// single date the user actually clicked + our explicit step state.
		if (step === "awaiting-from") {
			// First click — record `from`, wait for second click
			setPending({ from: triggerDate, to: undefined })
			setStep("awaiting-to")
			return
		}

		// Second click — complete the range (ordering both ends)
		const from = pending.from
		if (!from) {
			// Defensive: shouldn't happen, but if it does, treat as new start
			setPending({ from: triggerDate, to: undefined })
			setStep("awaiting-to")
			return
		}

		const a = from
		const b = triggerDate
		const earlier = a < b ? a : b
		const later = a < b ? b : a

		setPending({ from: earlier, to: later })
		setStep("awaiting-from")

		const next: DateRangeValue = {
			from: earlier.toISOString(),
			to: later.toISOString(),
			preset: null,
		}
		onChange(next)
		onCommit?.(next)
	}

	return (
		<div className="flex">
			{showPresets && (
				<div className="w-32 shrink-0 border-r p-1.5">
					<div className="flex flex-col gap-0.5">
						{datePresets.map((p) => (
							<button
								key={p.id}
								type="button"
								onClick={() => handlePreset(p.id)}
								className={cn(
									"hover:bg-accent rounded-sm px-2 py-1 text-left text-xs",
									value?.preset === p.id && "bg-accent font-medium",
								)}
							>
								{p.label}
							</button>
						))}
					</div>
				</div>
			)}
			<div className="flex flex-col">
				{/* Read-out header */}
				<div className="text-muted-foreground flex items-center gap-2 border-b px-3 py-2 text-xs">
					<CalendarIcon className="h-3.5 w-3.5" />
					<span className={cn(pending.from && "text-foreground font-medium")}>
						{fmtDate(pending.from) || "Start date"}
					</span>
					<ArrowRight className="h-3 w-3" />
					<span className={cn(pending.to && "text-foreground font-medium")}>
						{fmtDate(pending.to) || "End date"}
					</span>
				</div>
				<Calendar
					mode="range"
					selected={
						pending.from ? { from: pending.from, to: pending.to } : undefined
					}
					onSelect={handleSelect}
					numberOfMonths={2}
					defaultMonth={defaultMonth}
					autoFocus
				/>
			</div>
		</div>
	)
}
