import { cn } from "@/lib/utils"

/**
 * Small keyboard-key visual indicator. Drop it next to a label or
 * inside a tooltip to telegraph the shortcut.
 *
 *   <Kbd>/</Kbd>   <Kbd>Esc</Kbd>   <Kbd>Cmd</Kbd>+<Kbd>K</Kbd>
 */
export function Kbd({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<kbd
			className={cn(
				"border-border bg-muted text-muted-foreground inline-flex h-4 min-w-4 items-center justify-center rounded border px-1 font-mono text-[10px] leading-none",
				className,
			)}
		>
			{children}
		</kbd>
	)
}
