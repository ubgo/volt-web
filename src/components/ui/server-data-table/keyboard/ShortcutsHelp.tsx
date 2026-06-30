import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Kbd } from "./Kbd"

type Props = {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Sections rendered in the dialog. Each section has a title and rows. */
	sections?: ShortcutSection[]
}

export type ShortcutRow = {
	/** Array so multi-key combos can render: [`Cmd`, `K`]. */
	keys: string[]
	label: string
}

export type ShortcutSection = {
	title: string
	rows: ShortcutRow[]
}

/** Defaults match the shortcuts wired in `useShortcuts`. */
export const defaultShortcuts: ShortcutSection[] = [
	{
		title: "Navigation",
		rows: [
			{ keys: ["/"], label: "Focus search" },
			{ keys: ["f"], label: "Open filter picker" },
			{ keys: ["s"], label: "Open sort menu" },
			{ keys: ["v"], label: "Open views menu" },
			{ keys: ["c"], label: "Open columns menu" },
			{ keys: ["?"], label: "Show this help" },
			{ keys: ["Esc"], label: "Close popovers" },
		],
	},
	{
		title: "Within dropdowns",
		rows: [
			{ keys: ["↑", "↓"], label: "Move highlight" },
			{ keys: ["Enter"], label: "Select / toggle" },
			{ keys: ["Home", "End"], label: "Jump to first / last" },
		],
	},
]

/**
 * Modal listing all keyboard shortcuts. Triggered by `?`.
 * Pass `sections` to add page-specific shortcuts on top of the defaults.
 */
export function ShortcutsHelp({
	open,
	onOpenChange,
	sections = defaultShortcuts,
}: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Keyboard shortcuts</DialogTitle>
					<DialogDescription>
						Press these keys anywhere outside an input field.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					{sections.map((section) => (
						<div key={section.title}>
							<div className="text-muted-foreground mb-1.5 text-[10px] font-semibold uppercase tracking-wider">
								{section.title}
							</div>
							<div className="flex flex-col">
								{section.rows.map((row) => (
									<div
										key={row.label}
										className="flex items-center justify-between gap-3 py-1.5 text-xs"
									>
										<span className="text-foreground">{row.label}</span>
										<span className="flex items-center gap-1">
											{row.keys.map((k, i) => (
												<span
													key={`${k}-${i}`}
													className="flex items-center gap-1"
												>
													{i > 0 && (
														<span className="text-muted-foreground text-[10px]">
															+
														</span>
													)}
													<Kbd>{k}</Kbd>
												</span>
											))}
										</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
