"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
	// Boxed accordion: each item is its own bordered card with a gap between
	// them (`space-y-2`), rather than a flat underline-separated list.
	return (
		<AccordionPrimitive.Root
			data-slot="accordion"
			keepMounted
			className={cn("space-y-1.5", className)}
			{...props}
		/>
	)
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn(
				"overflow-hidden rounded-md border border-border bg-card transition-colors",
				"data-[panel-open]:border-foreground/20",
				className,
			)}
			{...props}
		/>
	)
}

function AccordionTrigger({
	className,
	children,
	...props
}: AccordionPrimitive.Trigger.Props) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(
					"focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 px-3 py-2 text-left text-[13px] font-medium outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 data-[panel-open]:bg-muted/40 [&[data-panel-open]>svg]:rotate-180",
					className,
				)}
				{...props}
			>
				{children}
				<ChevronDownIcon className="text-muted-foreground pointer-events-none size-3.5 shrink-0 transition-transform duration-200" />
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	)
}

function AccordionContent({
	className,
	children,
	...props
}: AccordionPrimitive.Panel.Props) {
	return (
		<AccordionPrimitive.Panel
			data-slot="accordion-content"
			className="data-[closed]:animate-accordion-collapse data-[open]:animate-accordion-expand overflow-hidden border-t border-border text-[13px]"
			{...props}
		>
			<div className={cn("px-3 py-2 text-muted-foreground", className)}>
				{children}
			</div>
		</AccordionPrimitive.Panel>
	)
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
