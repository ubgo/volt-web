import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PageInfo, PaginationState } from "../types"

type Props = {
	pagination: PaginationState
	pageInfo: PageInfo | null
	loading: boolean
	onNext: () => void
	onPrev: () => void
}

export function CursorPaginationBar({
	pagination,
	pageInfo,
	loading,
	onNext,
	onPrev,
}: Props) {
	const canNext = !!pageInfo?.hasNextPage
	const canPrev = !!pageInfo?.hasPreviousPage || pagination.page > 1

	return (
		<div className="flex items-center gap-1">
			<span className="text-muted-foreground mr-1 text-[11px] tabular-nums">
				Page {pagination.page}
			</span>
			<Button
				variant="outline"
				size="icon-sm"
				className="h-6 w-6"
				onClick={onPrev}
				disabled={!canPrev || loading}
			>
				<ChevronLeft className="h-3 w-3" />
				<span className="sr-only">Previous page</span>
			</Button>
			<Button
				variant="outline"
				size="icon-sm"
				className="h-6 w-6"
				onClick={onNext}
				disabled={!canNext || loading}
			>
				<span className="sr-only">Next page</span>
				<ChevronRight className="h-3 w-3" />
			</Button>
		</div>
	)
}
