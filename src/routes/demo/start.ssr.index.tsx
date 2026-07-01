import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Zap } from 'lucide-react'
import { AdminShell, PageHeader } from '@/components/admin-shell'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/demo/start/ssr/')({
  component: RouteComponent,
  head: () => seo({ title: 'Rendering modes' }),
})

function RouteComponent() {
  return (
    <AdminShell>
      <div className="px-6 py-6 max-w-[1280px]">
        <PageHeader title="Rendering modes" subtitle="SSR strategies overview" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
          <ModeLink
            to="/demo/start/ssr/spa-mode"
            title="SPA Mode"
            description="Client-only rendering — no server HTML for this route."
          />
          <ModeLink
            to="/demo/start/ssr/full-ssr"
            title="Full SSR"
            description="Full-document server rendering on each request."
          />
          <ModeLink
            to="/demo/start/ssr/data-only"
            title="Data Only"
            description="Loader data on the server, component renders on the client."
          />
        </div>
      </div>
    </AdminShell>
  )
}

function ModeLink({
  to,
  title,
  description,
}: {
  to: string
  title: string
  description: string
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted/40"
    >
      <div className="grid size-9 place-items-center rounded-lg bg-muted text-foreground/80">
        <Zap className="size-5" />
      </div>
      <div className="flex items-center gap-1.5 font-semibold text-sm">
        {title}
        <ArrowRight className="size-3.5 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </div>
    </Link>
  )
}
