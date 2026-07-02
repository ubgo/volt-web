import { useQuery } from "@tanstack/react-query"

import { createFileRoute } from "@tanstack/react-router"
import { Network } from "lucide-react"

import { AdminShell, PageHeader } from "@/components/admin-shell"
import { seo } from "@/lib/seo"

function getNames() {
	return fetch("/demo/api/names").then((res) => res.json() as Promise<string[]>)
}

export const Route = createFileRoute("/demo/start/api-request")({
	component: Home,
	head: () => seo({ title: "API request" }),
})

function Home() {
	const { data: names = [], isLoading } = useQuery({
		queryKey: ["names"],
		queryFn: getNames,
	})

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<Network />}
					title="API request"
					subtitle="Fetch from a typed API route with TanStack Query"
				/>
				<div className="mb-2 text-[11px] text-muted-foreground tabular-nums">
					{isLoading ? "…" : `${names.length} names`}
				</div>
				{isLoading ? (
					<div className="rounded-md border border-border bg-background px-3 py-2 text-[11px] text-muted-foreground">
						Loading…
					</div>
				) : (
					<div className="rounded-md border border-border bg-background overflow-hidden divide-y divide-border">
						{names.map((name) => (
							<div
								key={name}
								className="px-3 py-(--row-padding-y) text-(length:--row-font-size) text-foreground hover:bg-muted/60 transition-colors"
							>
								{name}
							</div>
						))}
					</div>
				)}
			</div>
		</AdminShell>
	)
}
