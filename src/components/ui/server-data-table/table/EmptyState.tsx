import { Inbox } from "lucide-react"
import type { ReactNode } from "react"

type Props = {
	message?: string
	description?: string
	action?: ReactNode
	filtered?: boolean
	onClearFilters?: () => void
}

export function EmptyState({
	message,
	description,
	action,
	filtered,
	onClearFilters,
}: Props) {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
			<div className="bg-muted/50 text-muted-foreground mb-4 flex h-12 w-12 items-center justify-center rounded-full">
				<Inbox className="h-6 w-6" />
			</div>
			<h3 className="text-foreground text-base font-medium">
				{message ?? (filtered ? "No results" : "Nothing to show")}
			</h3>
			{description && (
				<p className="text-muted-foreground mt-1 max-w-sm text-sm">
					{description}
				</p>
			)}
			{filtered && onClearFilters && (
				<button
					type="button"
					onClick={onClearFilters}
					className="text-primary mt-4 text-sm hover:underline"
				>
					Clear filters
				</button>
			)}
			{!filtered && action && <div className="mt-4">{action}</div>}
		</div>
	)
}
