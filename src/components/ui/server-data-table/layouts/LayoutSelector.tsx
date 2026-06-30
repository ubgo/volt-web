import { Check, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { DataTableLayout } from "../types"

type Props<TNode> = {
	layouts: DataTableLayout<TNode>[]
	activeId: string
	onChange: (id: string) => void
}

/**
 * Toolbar dropdown that switches between the built-in "table" layout
 * and any caller-provided layouts (cards, kanban, list, etc.).
 */
export function LayoutSelector<TNode>({
	layouts,
	activeId,
	onChange,
}: Props<TNode>) {
	const active = layouts.find((l) => l.id === activeId)
	const ActiveIcon = active?.icon ?? LayoutGrid

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-7 gap-1.5 px-2 text-xs"
					aria-label="Layout"
				>
					<ActiveIcon className="h-3 w-3" />
					{active?.label ?? "Layout"}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-40 p-0.5">
				<DropdownMenuGroup>
					{layouts.map((l) => {
						const Icon = l.icon
						const isActive = l.id === activeId
						return (
							<DropdownMenuItem
								key={l.id}
								onClick={() => onChange(l.id)}
								className="h-7 gap-1.5 px-2 py-0 text-xs"
							>
								<Check
									className={cn(
										"h-2.5 w-2.5 shrink-0",
										isActive ? "opacity-100" : "opacity-0",
									)}
								/>
								{Icon && <Icon className="h-3 w-3 shrink-0" />}
								<span className="flex-1 truncate">{l.label}</span>
							</DropdownMenuItem>
						)
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
