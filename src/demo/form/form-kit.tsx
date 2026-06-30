import { CalendarIcon } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// ──────────────────────────────────────────────────────────────────────────
// Shared form scaffolding for the demo showcase pages. Everything here is
// styled to the project's control-density tokens (see styles.css) so all
// three showcase forms read identically: compact cards, 11px hint/error text,
// tight 1.5-gap fields.
// ──────────────────────────────────────────────────────────────────────────

/** A labelled field wrapper: label · control · optional hint/error. */
export function Field({
	label,
	htmlFor,
	hint,
	error,
	required,
	children,
	className,
}: {
	label: string
	htmlFor?: string
	hint?: string
	error?: string
	required?: boolean
	children: ReactNode
	className?: string
}) {
	return (
		<div className={cn("space-y-1.5", className)}>
			<Label htmlFor={htmlFor}>
				{label}
				{required ? <span className="text-destructive ml-0.5">*</span> : null}
			</Label>
			{children}
			{error ? (
				<p className="text-[11px] text-destructive">{error}</p>
			) : hint ? (
				<p className="text-[11px] text-muted-foreground">{hint}</p>
			) : null}
		</div>
	)
}

/** Compact bordered form card. */
export function FormCard({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<div
			className={cn(
				"rounded-md border border-border bg-background p-4 space-y-3",
				className,
			)}
		>
			{children}
		</div>
	)
}

/** Section label + card. */
export function FormSection({
	title,
	description,
	children,
}: {
	title: string
	description?: string
	children: ReactNode
}) {
	return (
		<section>
			<div className="mb-2">
				<h2 className="text-[13px] font-medium">{title}</h2>
				{description ? (
					<p className="text-[11px] text-muted-foreground">{description}</p>
				) : null}
			</div>
			<FormCard>{children}</FormCard>
		</section>
	)
}

/** Right-aligned action row. */
export function FormActions({ children }: { children: ReactNode }) {
	return <div className="flex justify-end gap-2 pt-1">{children}</div>
}

/**
 * Read-only value display that sits inline with form inputs. Reads the SAME
 * control-density tokens as Input, so it can never drift taller/shorter than
 * the editable fields next to it.
 */
export function ReadonlyValue({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<div
			className={cn(
				"flex h-(--control-height) items-center rounded-md border border-border bg-muted/50 px-(--control-padding-x) text-(length:--control-font-size) text-foreground",
				className,
			)}
		>
			{children}
		</div>
	)
}

/**
 * The single status-pill used across every table/list in the app. Tone maps to
 * a dot color; the pill shell is identical everywhere so "Active" on the
 * dashboard, "Done" on a todo, and "Relationship" in a data table all read the
 * same. Map your domain status → tone at the call site.
 */
export type StatusTone = "success" | "warning" | "neutral" | "danger" | "info"

const STATUS_TONE_DOT: Record<StatusTone, string> = {
	success: "bg-emerald-500",
	warning: "bg-amber-500",
	neutral: "bg-zinc-400",
	danger: "bg-destructive",
	info: "bg-blue-500",
}

export function StatusBadge({
	label,
	tone = "neutral",
}: {
	label: string
	tone?: StatusTone
}) {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-0.5 text-(length:--control-font-size) font-medium capitalize">
			<span className={cn("size-1.5 rounded-full", STATUS_TONE_DOT[tone])} />
			{label}
		</span>
	)
}

/** A switch row: label + description on the left, control on the right. */
export function SwitchRow({
	label,
	description,
	children,
}: {
	label: string
	description?: string
	children: ReactNode
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="min-w-0">
				<div className="text-[13px] font-medium">{label}</div>
				{description ? (
					<div className="text-[11px] text-muted-foreground">{description}</div>
				) : null}
			</div>
			{children}
		</div>
	)
}

/** Date-picker field — outline trigger button + calendar in a popover. */
export function DateField({
	value,
	onChange,
	placeholder = "Pick a date",
	disabled,
}: {
	value: Date | undefined
	onChange: (date: Date | undefined) => void
	placeholder?: string
	disabled?: boolean
}) {
	const [open, setOpen] = useState(false)
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						disabled={disabled}
						className={cn(
							"w-full justify-start gap-2 font-normal",
							!value && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="size-3.5" />
						{value ? value.toLocaleDateString() : placeholder}
					</Button>
				}
			/>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					onSelect={(d) => {
						onChange(d)
						setOpen(false)
					}}
				/>
			</PopoverContent>
		</Popover>
	)
}
