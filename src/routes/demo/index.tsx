import { createFileRoute, Link } from "@tanstack/react-router"
import {
	ArrowRight,
	ArrowLeftRight,
	BookOpen,
	Boxes,
	Code2,
	Database,
	FileText,
	FormInput,
	Globe,
	Network,
	Server,
	Table2,
} from "lucide-react"
import type { ReactNode } from "react"
import { AdminShell, PageHeader } from "@/components/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/demo/")({
	component: Dashboard,
	head: () => seo({ title: "Dashboard" }),
})

function Dashboard() {
	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-[1280px]">
				<PageHeader
					title="Dashboard"
					subtitle="TanStack Start boilerplate — design system showcase"
					right={
						<a
							href="https://tanstack.com/start"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
						>
							Documentation
							<ArrowRight className="size-3.5" />
						</a>
					}
				/>

				{/* KPI tiles — counts of demos wired into the boilerplate, by area. */}
				<div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
					<KpiTile
						to="/demo/table"
						icon={<Table2 className="size-4" />}
						label="Data demos"
						value={3}
					/>
					<KpiTile
						to="/demo/form/simple"
						icon={<FormInput className="size-4" />}
						label="Form demos"
						value={2}
					/>
					<KpiTile
						to="/demo/trpc-todo"
						icon={<Code2 className="size-4" />}
						label="RPC demos"
						value={4}
					/>
					<KpiTile
						to="/demo/start/ssr/"
						icon={<Globe className="size-4" />}
						label="Render modes"
						value={4}
					/>
					<KpiTile
						to="/demo/table"
						icon={<Boxes className="size-4" />}
						label="UI components"
						value={17}
					/>
				</div>

				{/* Stack status */}
				<div className="mt-6">
					<SectionHeader title="Stack" hint="Wired and ready in this boilerplate" />
					<Card>
						<CardContent className="p-4">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
								<StatusTile label="TanStack Start" tone="active" />
								<StatusTile label="Base UI + Tailwind v4" tone="active" />
								<StatusTile label="Drizzle + Postgres" tone="active" />
								<StatusTile label="tRPC + oRPC" tone="active" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Quick links */}
				<div className="mt-6">
					<SectionHeader title="Browse demos" />
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						<QuickLink
							to="/demo/table"
							icon={<Table2 className="size-5" />}
							title="Data table"
							description="Server-driven data grid — pagination, sort, filter, column visibility, saved views."
						/>
						<QuickLink
							to="/demo/tanstack-query"
							icon={<Database className="size-5" />}
							title="TanStack Query"
							description="Async state, caching, and request dedup against the demo API routes."
						/>
						<QuickLink
							to="/demo/store"
							icon={<Boxes className="size-5" />}
							title="Store"
							description="Reactive client state with TanStack Store + devtools."
						/>
						<QuickLink
							to="/demo/form/simple"
							icon={<FormInput className="size-5" />}
							title="Forms"
							description="TanStack Form with field + form-level validation and submit states."
						/>
						<QuickLink
							to="/demo/start/server-funcs"
							icon={<Server className="size-5" />}
							title="Server functions"
							description="Type-safe server-side calls invoked straight from client components."
						/>
						<QuickLink
							to="/demo/start/api-request"
							icon={<Network className="size-5" />}
							title="API request"
							description="Hit a typed API route and render the response."
						/>
						<QuickLink
							to="/demo/trpc-todo"
							icon={<Code2 className="size-5" />}
							title="tRPC todos"
							description="End-to-end typesafe RPC with tRPC v11 + React Query."
						/>
						<QuickLink
							to="/demo/orpc-todo"
							icon={<ArrowLeftRight className="size-5" />}
							title="oRPC todos"
							description="The same todo flow built on oRPC with TanStack Query integration."
						/>
						<QuickLink
							to="/demo/start/ssr/"
							icon={<Globe className="size-5" />}
							title="Rendering modes"
							description="Full SSR, SPA mode, and data-only rendering side by side."
						/>
						<QuickLink
							to="/demo/form/address"
							icon={<FileText className="size-5" />}
							title="Address form"
							description="A larger multi-field form demonstrating nested validation."
						/>
						<QuickLink
							to="https://tanstack.com/start"
							external
							icon={<BookOpen className="size-5" />}
							title="Documentation"
							description="TanStack Start guides, API reference, and deployment recipes."
						/>
					</div>
				</div>
			</div>
		</AdminShell>
	)
}

// --- subcomponents ----------------------------------------------------------

function KpiTile({
	to,
	icon,
	label,
	value,
}: {
	to: string
	icon: ReactNode
	label: string
	value: number
}) {
	return (
		<Link
			to={to}
			className="group rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted/40"
		>
			<div className="flex items-center gap-2 text-muted-foreground">
				{icon}
				<span className="text-[11px] uppercase tracking-wider font-semibold">
					{label}
				</span>
			</div>
			<div className="mt-2 text-2xl font-semibold tabular-nums">
				{value.toLocaleString()}
			</div>
		</Link>
	)
}

function StatusTile({
	label,
	tone,
}: {
	label: string
	tone: "default" | "active" | "draft" | "archived"
}) {
	const dotClass =
		tone === "active"
			? "bg-emerald-500"
			: tone === "draft"
				? "bg-amber-500"
				: tone === "archived"
					? "bg-muted-foreground/60"
					: "bg-foreground/60"
	return (
		<div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2.5">
			<div className="flex items-center gap-2 text-sm">
				<span className={`inline-block size-2 rounded-full ${dotClass}`} />
				<span className="font-medium">{label}</span>
			</div>
			<Badge tone="active">ready</Badge>
		</div>
	)
}

function QuickLink({
	to,
	external,
	icon,
	title,
	description,
}: {
	to: string
	external?: boolean
	icon: ReactNode
	title: string
	description: string
}) {
	const inner = (
		<>
			<div className="mt-0.5 grid size-9 place-items-center rounded-lg bg-muted text-foreground/80">
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5 font-semibold text-sm">
					{title}
					<ArrowRight className="size-3.5 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
				</div>
				<div className="mt-1 text-xs text-muted-foreground leading-relaxed">
					{description}
				</div>
			</div>
		</>
	)
	const className =
		"group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted/40"
	if (external) {
		return (
			<a href={to} target="_blank" rel="noopener noreferrer" className={className}>
				{inner}
			</a>
		)
	}
	return (
		<Link to={to} className={className}>
			{inner}
		</Link>
	)
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
	return (
		<div className="mb-2.5 flex items-baseline gap-2">
			<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				{title}
			</h2>
			{hint ? (
				<span className="text-[11px] text-muted-foreground/70">{hint}</span>
			) : null}
		</div>
	)
}
