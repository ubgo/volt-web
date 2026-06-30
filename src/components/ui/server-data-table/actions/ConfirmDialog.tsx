import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"

type ConfirmDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	title?: string
	message?: string
	confirmLabel?: string
	destructive?: boolean
	loading?: boolean
	onConfirm: () => void
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title = "Are you sure?",
	message,
	confirmLabel = "Confirm",
	destructive,
	loading,
	onConfirm,
}: ConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{message && <DialogDescription>{message}</DialogDescription>}
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						variant={destructive ? "destructive" : "default"}
						onClick={onConfirm}
						disabled={loading}
					>
						{loading ? "Working…" : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
