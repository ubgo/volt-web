// NativeSelect — a thin wrapper around the raw HTML <select> styled to
// match the Input primitive (same height / border / padding / focus
// state). `appearance-none` strips the OS chevron + double border;
// a lucide ChevronDown is drawn on the right as a custom indicator.
//
// Use this anywhere you want a dropdown that visually matches Input
// chrome without bringing in the heavier base-ui Listbox-based
// `<Select>` primitive (which is the right choice for searchable /
// async / multi-select cases). For plain "pick one of N options",
// NativeSelect is the right call.

import { ChevronDown } from "lucide-react"
import type { SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function NativeSelect({
	className,
	children,
	...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
	return (
		<div className="relative inline-block w-full">
			<select
				className={cn(
					"appearance-none border-input bg-background flex h-(--control-height) w-full min-w-0 rounded-md border pl-(--control-padding-x) pr-7 py-0.5 text-(length:--control-font-size) transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
					"focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
					"aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30",
					className,
				)}
				{...props}
			>
				{children}
			</select>
			<ChevronDown
				aria-hidden
				className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground"
			/>
		</div>
	)
}
