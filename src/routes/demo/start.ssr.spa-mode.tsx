import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Zap } from 'lucide-react'
import { AdminShell, PageHeader } from '@/components/admin-shell'
import { getPunkSongs } from '@/demo/data/punk-songs'
import { seo } from '@/lib/seo'

type Song = {
  id: number
  name: string
  artist: string
}

export const Route = createFileRoute('/demo/start/ssr/spa-mode')({
  ssr: false,
  component: RouteComponent,
  head: () => seo({ title: 'SPA mode' }),
})

function RouteComponent() {
  const [punkSongs, setPunkSongs] = useState<Song[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getPunkSongs().then((songs) => {
      setPunkSongs(songs)
      setLoaded(true)
    })
  }, [])

  return (
    <AdminShell>
      <div className="px-6 py-6 max-w-3xl">
        <PageHeader
          icon={<Zap />}
          title="SPA mode"
          subtitle="No server HTML for this route — everything renders on the client"
        />
        <div className="mb-2 text-[11px] text-muted-foreground tabular-nums">
          {loaded ? `${punkSongs.length} songs` : 'Loading…'}
        </div>
        {loaded && (
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
        )}
      </div>
    </AdminShell>
  )
}
