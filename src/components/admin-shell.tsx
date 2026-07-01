import { Link } from "@tanstack/react-router"
import {
	ArrowLeftRight,
	BadgeCheck,
	BookOpen,
	Boxes,
	ChevronsUpDown,
	Code2,
	Database,
	FileText,
	FormInput,
	Globe,
	ImageOff,
	KeyRound,
	LayoutDashboard,
	LayoutGrid,
	LogOut,
	type LucideIcon,
	Network,
	PackagePlus,
	Palette,
	Server,
	Settings,
	ShieldAlert,
	Sparkles,
	Table2,
	UserCircle,
	Zap,
} from "lucide-react"
import type { ReactNode } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// ──────────────────────────────────────────────────────────────────────────
// Navigation model
//
// Each section is a labeled group of links. `to` values are the boilerplate's
// real TanStack file-based routes (verified against createFileRoute ids). The
// dashboard root uses `exact` so it doesn't stay highlighted on every child.
// ──────────────────────────────────────────────────────────────────────────

type NavItem = {
	to: string
	label: string
	icon: LucideIcon
	/** Match only the exact path (used for the "/" dashboard link). */
	exact?: boolean
}

type NavSection = {
	label: string
	items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
	{
		label: "Overview",
		items: [
			{ to: "/demo", label: "Dashboard", icon: LayoutDashboard, exact: true },
			{ to: "/demo/components", label: "Components", icon: LayoutGrid },
			{ to: "/demo/branding", label: "Branding & favicon", icon: Palette },
		],
	},
	{
		label: "Data",
		items: [
			{ to: "/demo/server-table", label: "Server data table", icon: Table2 },
			{ to: "/demo/table", label: "Table (TanStack)", icon: Table2 },
			{ to: "/demo/tanstack-query", label: "TanStack Query", icon: Database },
			{ to: "/demo/store", label: "Store", icon: Boxes },
		],
	},
	{
		label: "Forms",
		items: [
			{ to: "/demo/form/kitchen-sink", label: "Field showcase", icon: LayoutGrid },
			{ to: "/demo/form/account", label: "Account form", icon: UserCircle },
			{ to: "/demo/form/product", label: "Product form", icon: PackagePlus },
			{ to: "/demo/form/simple", label: "Simple form", icon: FormInput },
			{ to: "/demo/form/address", label: "Address form", icon: FileText },
		],
	},
	{
		label: "RPC & server",
		items: [
			{ to: "/demo/start/server-funcs", label: "Server functions", icon: Server },
			{ to: "/demo/start/api-request", label: "API request", icon: Network },
			{ to: "/demo/trpc-todo", label: "tRPC todos", icon: Code2 },
			{ to: "/demo/orpc-todo", label: "oRPC todos", icon: ArrowLeftRight },
			{ to: "/demo/gqlkit", label: "GraphQL (gqlkit)", icon: Database },
			{ to: "/demo/mcp-todos", label: "MCP todos", icon: Sparkles },
		],
	},
	{
		label: "Rendering",
		items: [
			{ to: "/demo/start/ssr/", label: "SSR overview", icon: Globe },
			{ to: "/demo/start/ssr/full-ssr", label: "Full SSR", icon: Zap },
			{ to: "/demo/start/ssr/spa-mode", label: "SPA mode", icon: Zap },
			{ to: "/demo/start/ssr/data-only", label: "Data only", icon: Zap },
		],
	},
	{
		label: "System",
		items: [{ to: "/demo/sentry/testing", label: "Sentry test", icon: ShieldAlert }],
	},
]

// Flattened list reused by the mobile top nav bar.
const ALL_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items)

const NAV_LINK_CLASS =
	"group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
const NAV_LINK_ACTIVE = "bg-muted text-foreground font-semibold"

export function AdminShell({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-muted/40 text-foreground">
			<div className="flex">
				{/* Sidebar */}
				<aside className="hidden md:flex w-[248px] shrink-0 flex-col border-r border-border bg-background h-screen sticky top-0 self-start">
					<div className="h-[60px] flex items-center gap-2.5 px-4 border-b border-border shrink-0">
						<img
							src="/icon.svg"
							alt="Volt"
							className="size-8 rounded-lg shadow-sm"
						/>
						<div className="leading-tight">
							<div className="text-sm font-semibold tracking-tight">
								Volt
							</div>
							<div className="text-[11px] text-muted-foreground">
								React starter
							</div>
						</div>
						<div className="ml-auto">
							<ThemeToggle />
						</div>
					</div>
					<nav className="flex-1 overflow-y-auto p-2">
						{NAV_SECTIONS.map((section, i) => (
							<div key={section.label}>
								<div
									className={cn(
										"px-2 pb-1 text-[12px] font-semibold text-foreground/70",
										i === 0 ? "pt-1" : "pt-4",
									)}
								>
									{section.label}
								</div>
								<div className="space-y-px">
									{section.items.map((n) => (
										<Link
											key={n.to}
											to={n.to}
											className={NAV_LINK_CLASS}
											activeProps={{ className: NAV_LINK_ACTIVE }}
											activeOptions={{ exact: n.exact ?? false }}
										>
											<n.icon className="size-[16px] shrink-0" />
											{n.label}
										</Link>
									))}
								</div>
							</div>
						))}
					</nav>
					<UserMenu />
				</aside>

				{/* Main */}
				<main className="flex-1 min-w-0">
					{/* Mobile top nav */}
					<div className="md:hidden flex items-center gap-4 overflow-x-auto border-b bg-background px-4 h-12">
						{ALL_ITEMS.map((n) => (
							<Link
								key={n.to}
								to={n.to}
								className="text-sm whitespace-nowrap text-muted-foreground"
								activeProps={{ className: "text-foreground font-medium" }}
								activeOptions={{ exact: n.exact ?? false }}
							>
								{n.label}
							</Link>
						))}
					</div>
					{children}
				</main>
			</div>
		</div>
	)
}

// PageHeader — the Shopify-grade page title row. Used on every top-level
// page so the visual rhythm is identical across the SPA: icon · title ·
// optional subtitle on the left, secondary actions + primary CTA on the
// right, a bottom border separating it from the page body.
export function PageHeader({
	icon,
	title,
	subtitle,
	primaryAction,
	secondaryActions,
	right,
}: {
	icon?: ReactNode
	title: string
	subtitle?: string
	primaryAction?: ReactNode
	secondaryActions?: ReactNode
	right?: ReactNode
}) {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-border pb-3 mb-4">
			<div className="flex items-center gap-2 min-w-0">
				{icon ? (
					<span className="text-foreground/80 [&_svg]:size-[18px]">{icon}</span>
				) : null}
				<div className="min-w-0">
					<h1 className="text-[18px] font-semibold tracking-tight leading-tight truncate">
						{title}
					</h1>
					{subtitle ? (
						<p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
					) : null}
				</div>
			</div>
			{primaryAction || secondaryActions || right ? (
				<div className="flex items-center gap-2 shrink-0">
					{secondaryActions}
					{primaryAction}
					{right}
				</div>
			) : null}
		</div>
	)
}

// Surface — rounded card used to wrap tables/sections.
export function Surface({
	className,
	children,
}: {
	className?: string
	children: ReactNode
}) {
	return (
		<div
			className={cn(
				"rounded-xl border border-border bg-background shadow-sm overflow-hidden",
				className,
			)}
		>
			{children}
		</div>
	)
}

// StatusBadge lives in `@/demo/form/form-kit` (the single, tone-based
// status pill used across every table/list). Import it from there.

// UserMenu — bottom-of-sidebar dropdown. Static demo identity in the
// boilerplate (no auth wired); swap the values + handlers for a real session.
function UserMenu() {
	const display = "Demo User"
	const email = "demo@example.com"
	const initials = "DU"

	return (
		<div className="mt-auto border-t border-border p-2">
			<DropdownMenu>
				<DropdownMenuTrigger className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/70 transition-colors text-left">
					<div className="size-8 rounded-full bg-muted grid place-items-center text-xs font-semibold shrink-0">
						{initials}
					</div>
					<div className="min-w-0 flex-1">
						<div className="text-sm font-medium truncate">{display}</div>
						<div className="text-[11px] text-muted-foreground truncate">
							{email}
						</div>
					</div>
					<ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" side="top" className="min-w-[14rem]">
					<DropdownMenuLabel className="font-normal">
						<div className="text-sm font-medium">{display}</div>
						<div className="text-xs text-muted-foreground">{email}</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<BadgeCheck className="size-4 mr-2" />
						Account
					</DropdownMenuItem>
					<DropdownMenuItem>
						<Settings className="size-4 mr-2" />
						Settings
					</DropdownMenuItem>
					<DropdownMenuItem>
						<KeyRound className="size-4 mr-2" />
						API keys
					</DropdownMenuItem>
					<DropdownMenuItem>
						<BookOpen className="size-4 mr-2" />
						Documentation
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<LogOut className="size-4 mr-2" />
						Sign out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

// Thumb — square thumbnail with referrerPolicy (CDN hotlink) + fallback.
export function Thumb({
	url,
	size = 40,
}: {
	url?: string | null
	size?: number
}) {
	if (!url)
		return (
			<div
				className="rounded-lg bg-muted border border-border grid place-items-center text-muted-foreground/50"
				style={{ width: size, height: size }}
			>
				<ImageOff className="size-4" />
			</div>
		)
	return (
		<img
			src={url}
			alt=""
			loading="lazy"
			referrerPolicy="no-referrer"
			className="rounded-lg object-cover border border-border bg-white"
			style={{ width: size, height: size }}
		/>
	)
}
