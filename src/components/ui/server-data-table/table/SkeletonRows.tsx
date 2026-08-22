import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { stableKeys } from "@/lib/react-keys"

type Props = {
	rows?: number
	cols: number
}

export function SkeletonRows({ rows = 8, cols }: Props) {
	const rowKeys = stableKeys("skrow", rows)
	const cellKeys = stableKeys("skcell", cols)
	return (
		<TableBody>
			{rowKeys.map((rowKey) => (
				<TableRow
					key={rowKey}
					className="border-border/70 animate-pulse border-b last:border-b-0"
				>
					{cellKeys.map((cellKey) => (
						<TableCell key={cellKey} className="h-9 px-3 py-1.5">
							<Skeleton className="h-3.5 w-3/4" />
						</TableCell>
					))}
				</TableRow>
			))}
		</TableBody>
	)
}
