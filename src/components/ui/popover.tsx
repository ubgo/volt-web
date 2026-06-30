import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import type * as React from "react"
import { cn } from "@/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
	asChild,
	children,
	...props
}: PopoverPrimitive.Trigger.Props & { asChild?: boolean }) {
	// base-ui defaults `nativeButton: true`, which works when the asChild
	// child is a real `<button>` / shadcn `<Button>`. If a caller renders a
	// non-button (e.g. a styled `<div>` pill), they must pass
	// `nativeButton={false}` themselves — it's forwarded via `{...props}`.
	if (asChild) {
		return (
			<PopoverPrimitive.Trigger
				data-slot="popover-trigger"
				render={children as React.ReactElement}
				{...props}
			/>
		)
	}
	return (
		<PopoverPrimitive.Trigger data-slot="popover-trigger" {...props}>
			{children}
		</PopoverPrimitive.Trigger>
	)
}

function PopoverContent({
	className,
	align,
	side,
	sideOffset = 4,
	...props
}: PopoverPrimitive.Popup.Props & {
	align?: PopoverPrimitive.Positioner.Props["align"]
	side?: PopoverPrimitive.Positioner.Props["side"]
	sideOffset?: PopoverPrimitive.Positioner.Props["sideOffset"]
}) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner
				data-slot="popover-positioner"
				align={align}
				side={side}
				sideOffset={sideOffset}
				className="z-50"
			>
				<PopoverPrimitive.Popup
					data-slot="popover-content"
					className={cn(
						"bg-popover text-popover-foreground data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border p-4 shadow-md outline-hidden",
						className,
					)}
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	)
}

function PopoverAnchor({ ...props }: PopoverPrimitive.Arrow.Props) {
	return <PopoverPrimitive.Arrow data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
