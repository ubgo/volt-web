import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type Props = {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Pre-fill the input (used by Rename / Save-as) */
	initialName?: string
	title?: string
	description?: string
	confirmLabel?: string
	onSave: (name: string) => Promise<void> | void
}

export function SaveViewDialog({
	open,
	onOpenChange,
	initialName = "",
	title = "Save view",
	description = "Give this view a name. You can switch back to it from the views menu.",
	confirmLabel = "Save view",
	onSave,
}: Props) {
	const [name, setName] = React.useState(initialName)
	const [saving, setSaving] = React.useState(false)

	// Re-seed when reopened
	React.useEffect(() => {
		if (open) setName(initialName)
	}, [open, initialName])

	const submit = async () => {
		const trimmed = name.trim()
		if (!trimmed) return
		setSaving(true)
		try {
			await onSave(trimmed)
			onOpenChange(false)
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<Input
					autoFocus
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="View name…"
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault()
							void submit()
						}
					}}
				/>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={saving}
					>
						Cancel
					</Button>
					<Button onClick={submit} disabled={saving || !name.trim()}>
						{saving ? "Saving…" : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
