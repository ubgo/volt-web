import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"

type Props = {
	rows?: number
	cols: number
}

export function SkeletonRows({ rows = 8, cols }: Props) {
	return (
		<TableBody>
			{Array.from({ length: rows }).map((_, r) => (
				<TableRow
					key={r}
					className="border-border/70 animate-pulse border-b last:border-b-0"
				>
					{Array.from({ length: cols }).map((_, c) => (
						<TableCell key={c} className="h-9 px-3 py-1.5">
							<Skeleton className="h-3.5 w-3/4" />
						</TableCell>
					))}
				</TableRow>
			))}
		</TableBody>
	)
}
