import { Search, X } from "lucide-react"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Kbd } from "../keyboard/Kbd"

type Props = {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	/** Debounce ms before firing onChange. Default 300. */
	debounce?: number
	className?: string
	/** Forwarded ref so callers can imperatively focus (keyboard shortcut). */
	inputRef?: React.Ref<HTMLInputElement>
}

/**
 * Debounced full-text search input. Keeps the on-screen value snappy while
 * deferring the upstream `onChange` so we don't refetch on every keystroke.
 */
export function SearchInput({
	value,
	onChange,
	placeholder = "Search…",
	debounce = 300,
	className,
	inputRef,
}: Props) {
	const [local, setLocal] = React.useState(value)

	// Sync if external value changes (e.g. cleared by URL state)
	React.useEffect(() => {
		setLocal(value)
	}, [value])

	// Debounce push to upstream
	React.useEffect(() => {
		if (local === value) return
		const t = setTimeout(() => onChange(local), debounce)
		return () => clearTimeout(t)
	}, [local, value, debounce, onChange])

	return (
		<div className={cn("relative w-56 max-w-full", className)}>
			<Search className="text-muted-foreground pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2" />
			<Input
				ref={inputRef}
				value={local}
				onChange={(e) => setLocal(e.target.value)}
				placeholder={placeholder}
				className="h-7 pl-7 pr-8 text-xs"
			/>
			{local ? (
				<button
					type="button"
					onClick={() => {
						setLocal("")
						onChange("")
					}}
					className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2"
					aria-label="Clear search"
				>
					<X className="h-3 w-3" />
				</button>
			) : (
				<span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">
					<Kbd>/</Kbd>
				</span>
			)}
		</div>
	)
}
