import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type Props = {
	value: number
	options: number[]
	onChange: (size: number) => void
}

/**
 * Compact rows-per-page selector. Lives next to pagination.
 * Changing the value resets pagination to page 1 (handled by the reducer).
 */
export function PageSizeSelect({ value, options, onChange }: Props) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="text-muted-foreground hover:text-foreground h-6 gap-1 px-1.5 text-[11px] tabular-nums"
					aria-label="Rows per page"
				>
					{value} / page
					<ChevronDown className="h-2.5 w-2.5 opacity-60" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-0 p-0.5">
				<DropdownMenuGroup>
					{options.map((opt) => {
						const active = value === opt
						return (
							<DropdownMenuItem
								key={opt}
								onClick={() => onChange(opt)}
								className={cn(
									"h-7 cursor-pointer gap-1.5 px-2 py-0 text-xs tabular-nums",
									active && "bg-accent",
								)}
							>
								<Check
									className={cn(
										"h-2.5 w-2.5 shrink-0",
										active ? "opacity-100" : "opacity-0",
									)}
								/>
								{opt}
							</DropdownMenuItem>
						)
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
