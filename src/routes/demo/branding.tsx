import { createFileRoute } from "@tanstack/react-router"
import { Image, Palette } from "lucide-react"
import { AdminShell, PageHeader } from "@/components/admin-shell"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/demo/branding")({
	component: BrandingDemo,
	head: () => seo({ title: "Branding & favicon" }),
})

// Every icon asset the app ships, with where it lives and what consumes it.
// Keep this list in sync with public/manifest.json + src/routes/__root.tsx.
const ASSETS: Array<{
	src: string
	label: string
	spec: string
	usedBy: string
	dark?: boolean
}> = [
	{
		src: "/favicon.ico",
		label: "favicon.ico",
		spec: "multi-size .ico",
		usedBy: "Legacy browser tab fallback",
	},
	{
		src: "/images/favicon.ico",
		label: "images/favicon.ico",
		spec: "16–64px .ico",
		usedBy: "<link rel=icon> + manifest",
	},
	{
		src: "/images/icon-192.png",
		label: "images/icon-192.png",
		spec: "192×192 PNG",
		usedBy: "PWA manifest (any maskable)",
	},
	{
		src: "/images/icon-512.png",
		label: "images/icon-512.png",
		spec: "512×512 PNG",
		usedBy: "PWA install / splash",
	},
	{
		src: "/images/icon-180x180.png",
		label: "images/icon-180x180.png",
		spec: "180×180 PNG",
		usedBy: "Apple touch icon (iOS home screen)",
	},
	{
		src: "/icon.svg",
		label: "icon.svg",
		spec: "vector mark",
		usedBy: "Sidebar logo (admin-shell.tsx)",
	},
	{
		src: "/logo.svg",
		label: "logo.svg",
		spec: "vector wordmark",
		usedBy: "Marketing / full lockup (light bg)",
	},
	{
		src: "/logo-white.svg",
		label: "logo-white.svg",
		spec: "vector wordmark",
		usedBy: "Same lockup for dark backgrounds",
		dark: true,
	},
	{
		src: "/logo-source.png",
		label: "logo-source.png",
		spec: "1024×1024 PNG",
		usedBy: "Source for task branding:gen",
	},
]

function BrandingDemo() {
	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<Palette />}
					title="Branding & favicon"
					subtitle="Every icon the app ships, and exactly how to swap in your own"
				/>

				<div className="space-y-6">
					{/* Current assets */}
					<section>
						<h2 className="text-[13px] font-medium mb-2">Shipped assets</h2>
						<div className="rounded-md border border-border bg-background divide-y divide-border">
							{ASSETS.map((a) => (
								<div key={a.label} className="flex items-center gap-4 p-3">
									<div
										className={
											"size-12 shrink-0 grid place-items-center rounded-md border border-border overflow-hidden " +
											(a.dark ? "bg-neutral-900" : "bg-muted/40")
										}
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={a.src}
											alt={a.label}
											className="max-w-full max-h-full object-contain p-1"
										/>
									</div>
									<div className="min-w-0 flex-1">
										<code className="font-mono text-[12px]">{a.label}</code>
										<div className="text-[11px] text-muted-foreground mt-0.5">
											{a.spec} · {a.usedBy}
										</div>
									</div>
								</div>
							))}
						</div>
					</section>

					{/* Where things are wired */}
					<section>
						<h2 className="text-[13px] font-medium mb-2">Where it's wired</h2>
						<div className="rounded-md border border-border bg-background p-4 space-y-2 text-[12px]">
							<WiredRow
								file="public/"
								what="All raw assets live here — served from the site root as-is."
							/>
							<WiredRow
								file="public/manifest.json"
								what="PWA metadata: name, theme color, and the icon set (favicon + 192/512)."
							/>
							<WiredRow
								file="src/routes/__root.tsx"
								what="<link> tags: rel=icon, apple-touch-icon (180×180), and manifest."
							/>
							<WiredRow
								file="src/components/admin-shell.tsx"
								what="The sidebar <img> (/icon.svg) — swap for your logo mark."
							/>
							<WiredRow
								file="src/lib/seo.ts"
								what="SITE_NAME — the title suffix on every page. Rename it here."
							/>
						</div>
					</section>

					{/* How to replace */}
					<section>
						<h2 className="text-[13px] font-medium mb-2">Replace with your brand</h2>
						<ol className="rounded-md border border-border bg-background p-4 space-y-3 text-[13px] list-decimal list-inside marker:text-muted-foreground marker:text-[12px]">
							<li>
								Prepare one square source image (≥512×512, PNG or SVG).
							</li>
							<li>
								Generate the icon set — drop your source in and run{" "}
								<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
									task branding:gen
								</code>
								, or use a tool like{" "}
								<a
									href="https://realfavicongenerator.net"
									target="_blank"
									rel="noreferrer"
									className="text-primary underline underline-offset-2"
								>
									realfavicongenerator.net
								</a>
								.
							</li>
							<li>
								Replace the files in{" "}
								<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
									public/images/
								</code>{" "}
								and{" "}
								<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
									public/logo.svg
								</code>{" "}
								(keep the same filenames — no code change needed).
							</li>
							<li>
								Update names in{" "}
								<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
									public/manifest.json
								</code>{" "}
								(<code className="font-mono">short_name</code>,{" "}
								<code className="font-mono">name</code>,{" "}
								<code className="font-mono">theme_color</code>) and{" "}
								<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
									SITE_NAME
								</code>{" "}
								in <code className="font-mono">src/lib/seo.ts</code>.
							</li>
							<li>
								Swap the sidebar logo <code className="font-mono">src</code> in{" "}
								<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
									src/components/admin-shell.tsx
								</code>
								.
							</li>
							<li>
								Hard-refresh (favicons cache aggressively — ⌘⇧R / Ctrl-F5).
							</li>
						</ol>
					</section>

					{/* Generate command */}
					<section>
						<h2 className="text-[13px] font-medium mb-2">
							One-command icon set
						</h2>
						<pre className="rounded-md border border-border bg-muted/40 p-4 text-[12px] font-mono overflow-x-auto leading-relaxed">
							{`# put a square source at public/logo-source.png, then:
task branding:gen

# generates from the source (macOS sips):
#   public/images/icon-192.png
#   public/images/icon-512.png
#   public/images/icon-180x180.png`}
						</pre>
						<p className="mt-2 text-[11px] text-muted-foreground">
							<Image className="inline size-3 mr-1 -mt-0.5" />
							The <code className="font-mono">.ico</code> is best generated by a
							dedicated tool — <code className="font-mono">sips</code> doesn't
							write multi-size <code className="font-mono">.ico</code> files.
						</p>
					</section>
				</div>
			</div>
		</AdminShell>
	)
}

function WiredRow({ file, what }: { file: string; what: string }) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3">
			<code className="font-mono text-[12px] text-foreground/90 sm:w-56 shrink-0">
				{file}
			</code>
			<span className="text-muted-foreground">{what}</span>
		</div>
	)
}
