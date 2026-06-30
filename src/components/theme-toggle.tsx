import { Check, Monitor, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { applyTheme, getStoredTheme, setTheme, type Theme } from "@/lib/theme"
import { cn } from "@/lib/utils"

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
]

/**
 * Light / Dark / System theme switcher. Flips the `.dark` class on <html>;
 * since the palette is fully token-driven, the whole app re-themes instantly.
 */
export function ThemeToggle() {
	const [theme, setThemeState] = useState<Theme>("system")

	// Read the persisted preference after mount (avoids SSR/client mismatch).
	useEffect(() => {
		setThemeState(getStoredTheme())
	}, [])

	// While on "system", react live to OS scheme changes.
	useEffect(() => {
		if (theme !== "system") return
		const mq = window.matchMedia("(prefers-color-scheme: dark)")
		const handler = () => applyTheme("system")
		mq.addEventListener("change", handler)
		return () => mq.removeEventListener("change", handler)
	}, [theme])

	function choose(next: Theme) {
		setTheme(next)
		setThemeState(next)
	}

	const Active = OPTIONS.find((o) => o.value === theme)?.icon ?? Monitor

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="icon" aria-label="Toggle theme">
						<Active />
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="min-w-[8rem]">
				{OPTIONS.map((opt) => (
					<DropdownMenuItem
						key={opt.value}
						onClick={() => choose(opt.value)}
						className="gap-2"
					>
						<opt.icon className="size-3.5" />
						{opt.label}
						<Check
							className={cn(
								"ml-auto size-3.5",
								theme === opt.value ? "opacity-100" : "opacity-0",
							)}
						/>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
