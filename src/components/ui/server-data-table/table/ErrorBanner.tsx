import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
	message?: string
	onRetry?: () => void
}

export function ErrorBanner({
	message = "Failed to load. Please try again.",
	onRetry,
}: Props) {
	return (
		<div className="border-destructive/30 bg-destructive/5 flex items-center gap-3 rounded-md border px-4 py-3">
			<AlertCircle className="text-destructive h-4 w-4 shrink-0" />
			<p className="text-destructive flex-1 text-sm">{message}</p>
			{onRetry && (
				<Button
					variant="outline"
					size="sm"
					onClick={onRetry}
					className="gap-1.5"
				>
					<RefreshCw className="h-3.5 w-3.5" />
					Retry
				</Button>
			)}
		</div>
	)
}
