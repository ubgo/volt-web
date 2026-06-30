import { Input } from "@/components/ui/input"
import type { ControlProps } from "./types"

export function TextControl({
	value,
	onChange,
	onCommit,
	autoFocus,
}: ControlProps<string>) {
	return (
		<Input
			autoFocus={autoFocus}
			value={value ?? ""}
			onChange={(e) => onChange(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					e.preventDefault()
					onCommit?.()
				}
			}}
			placeholder="Value…"
			className="h-7 text-xs"
		/>
	)
}
