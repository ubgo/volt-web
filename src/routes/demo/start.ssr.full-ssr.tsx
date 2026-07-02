import { createFileRoute } from "@tanstack/react-router"
import { Zap } from "lucide-react"
import { AdminShell, PageHeader } from "@/components/admin-shell"
import { getPunkSongs } from "@/demo/data/punk-songs"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/demo/start/ssr/full-ssr")({
	component: RouteComponent,
	head: () => seo({ title: "Full SSR" }),
	loader: async () => await getPunkSongs(),
})

function RouteComponent() {
	const punkSongs = Route.useLoaderData()

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<Zap />}
					title="Full SSR"
					subtitle="The whole document is rendered on the server, including this list"
				/>
				<div className="mb-2 text-[11px] text-muted-foreground tabular-nums">
					{punkSongs.length} songs
				</div>
				<div className="rounded-md border border-border bg-background overflow-hidden">
					<table className="w-full text-[13px]">
						<thead className="bg-muted/50 text-[12px] text-foreground">
							<tr className="border-b border-border">
								<th className="text-left font-semibold px-3 py-2">Song</th>
								<th className="text-left font-semibold px-3 py-2 w-[40%]">
									Artist
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{punkSongs.map((song) => (
								<tr key={song.id} className="hover:bg-muted/60">
									<td className="px-3 py-(--row-padding-y) font-medium text-foreground">
										{song.name}
									</td>
									<td className="px-3 py-(--row-padding-y) text-muted-foreground">
										{song.artist}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</AdminShell>
	)
}
