import { Input } from "@/components/ui/input"
import type { ControlProps } from "./types"

export function NumberControl({
	value,
	onChange,
	onCommit,
	autoFocus,
}: ControlProps<number | string>) {
	return (
		<Input
			autoFocus={autoFocus}
			type="number"
			value={value === undefined || value === null ? "" : String(value)}
			onChange={(e) => {
				const v = e.target.value
				onChange(v === "" ? "" : Number(v))
			}}
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
