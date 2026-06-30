import { useCallback, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Database } from 'lucide-react'

import { AdminShell, PageHeader } from '@/components/admin-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/demo/tanstack-query')({
  component: TanStackQueryDemo,
})

type Todo = {
  id: number
  name: string
}

function TanStackQueryDemo() {
  const { data = [], isLoading, refetch } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: () => fetch('/demo/api/tq-todos').then((res) => res.json()),
    initialData: [],
  })

  const { mutate: addTodo, isPending } = useMutation({
    mutationFn: (todo: string) =>
      fetch('/demo/api/tq-todos', {
        method: 'POST',
        body: JSON.stringify(todo),
      }).then((res) => res.json()),
    onSuccess: () => refetch(),
  })

  const [todo, setTodo] = useState('')

  const submitTodo = useCallback(async () => {
    if (!todo.trim()) return
    await addTodo(todo)
    setTodo('')
  }, [addTodo, todo])

  return (
    <AdminShell>
      <div className="px-6 py-6 max-w-3xl">
        <PageHeader
          icon={<Database />}
          title="TanStack Query"
          subtitle="Async state, caching, and request dedup"
        />
        <div className="mb-2 text-[11px] text-muted-foreground tabular-nums">
          {isLoading ? '…' : `${data.length} todos`}
        </div>
        {data.length > 0 && (
          <div className="rounded-md border border-border bg-background overflow-hidden divide-y divide-border">
            {data.map((t) => (
              <div
                key={t.id}
                className="px-3 py-(--row-padding-y) text-(length:--row-font-size) text-foreground hover:bg-muted/60 transition-colors"
              >
                {t.name}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Input
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTodo()
            }}
            placeholder="Add a todo…"
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            disabled={todo.trim().length === 0 || isPending}
            onClick={submitTodo}
          >
            {isPending ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </div>
    </AdminShell>
  )
}
