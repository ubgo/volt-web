"use client"

// Combobox — a searchable single-select dropdown built on Base UI's Combobox.
// Use for "pick one of N, with typeahead" (vs NativeSelect for short static
// lists, or Select for non-searchable listboxes). Options are plain
// `{ value, label }` objects; Base UI derives the displayed label + the form
// value from that shape and does the filtering. Styled to match the Input
// primitive (h-7, flat border) so it sits inline in dense toolbars.

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
	value: string
	label: string
}

interface ComboboxProps {
	items: ComboboxOption[]
	/** Selected option value, or null when nothing is chosen. */
	value: string | null
	onValueChange: (value: string | null) => void
	placeholder?: string
	emptyText?: string
	className?: string
	disabled?: boolean
	id?: string
}

export function Combobox({
	items,
	value,
	onValueChange,
	placeholder = "Select…",
	emptyText = "No matches.",
	className,
	disabled,
	id,
}: ComboboxProps) {
	// Base UI is controlled by the selected OBJECT; map to/from the value string
	// so callers deal in plain ids.
	const selected = items.find((i) => i.value === value) ?? null

	return (
		<ComboboxPrimitive.Root
			items={items}
			value={selected}
			onValueChange={(next) =>
				onValueChange(next && typeof next === "object" ? next.value : null)
			}
			disabled={disabled}
		>
			<div className={cn("relative inline-block", className)}>
				<ComboboxPrimitive.Input
					id={id}
					placeholder={placeholder}
					className={cn(
						"border-input bg-background flex h-(--control-height) w-full min-w-0 rounded-md border py-0.5 pl-(--control-padding-x) pr-12 text-(length:--control-font-size) transition-colors outline-none",
						"focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-1",
						"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
					)}
				/>
				<div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
					{selected && (
						<ComboboxPrimitive.Clear
							aria-label="Clear selection"
							className="rounded p-0.5 text-muted-foreground hover:text-foreground"
						>
							<X className="size-3.5" />
						</ComboboxPrimitive.Clear>
					)}
					<ComboboxPrimitive.Trigger
						aria-label="Open"
						className="rounded p-0.5 text-muted-foreground hover:text-foreground"
					>
						<ChevronsUpDown className="size-3.5" />
					</ComboboxPrimitive.Trigger>
				</div>
			</div>

			<ComboboxPrimitive.Portal>
				<ComboboxPrimitive.Positioner sideOffset={4} className="z-50">
					<ComboboxPrimitive.Popup
						className={cn(
							"bg-popover text-popover-foreground z-50 max-h-[min(20rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-md border p-1 shadow-md",
							"data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0",
						)}
					>
						{/* Base UI keeps Empty mounted (live region) and only nulls its
						    CHILDREN when there are matches. Padding therefore lives on the
						    child, so the root collapses to 0px (no blank row) when there's
						    a match. */}
						<ComboboxPrimitive.Empty className="text-muted-foreground text-center text-[12px]">
							<div className="px-2 py-3">{emptyText}</div>
						</ComboboxPrimitive.Empty>
						<ComboboxPrimitive.List>
							{(item: ComboboxOption) => (
								<ComboboxPrimitive.Item
									key={item.value}
									value={item}
									className={cn(
										"relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-[12px] outline-none select-none",
										"data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
									)}
								>
									<span className="truncate">{item.label}</span>
									<span className="absolute right-2 flex size-3.5 items-center justify-center">
										<ComboboxPrimitive.ItemIndicator>
											<Check className="size-3.5" />
										</ComboboxPrimitive.ItemIndicator>
									</span>
								</ComboboxPrimitive.Item>
							)}
						</ComboboxPrimitive.List>
					</ComboboxPrimitive.Popup>
				</ComboboxPrimitive.Positioner>
			</ComboboxPrimitive.Portal>
		</ComboboxPrimitive.Root>
	)
}
