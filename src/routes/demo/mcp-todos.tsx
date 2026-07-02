import { createFileRoute } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { AdminShell, PageHeader } from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { seo } from "@/lib/seo"

type Todo = {
	id: number
	title: string
}

export const Route = createFileRoute("/demo/mcp-todos")({
	component: MCPTodos,
	head: () => seo({ title: "MCP todos" }),
})

function MCPTodos() {
	const [todos, setTodos] = useState<Todo[]>([])

	useEffect(() => {
		const eventSource = new EventSource("/demo/api/mcp-todos")
		eventSource.onmessage = (event) => {
			setTodos(JSON.parse(event.data))
		}
		return () => eventSource.close()
	}, [])

	const [todo, setTodo] = useState("")

	const submitTodo = useCallback(async () => {
		if (!todo.trim()) return
		await fetch("/demo/api/mcp-todos", {
			method: "POST",
			body: JSON.stringify({ title: todo }),
		})
		setTodo("")
	}, [todo])

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<Sparkles />}
					title="MCP todos"
					subtitle="Live todo list streamed over Server-Sent Events from an MCP server"
				/>
				<div className="mb-2 text-[11px] text-muted-foreground tabular-nums">
					{todos.length} todos · live
				</div>
				{todos.length > 0 && (
					<div className="rounded-md border border-border bg-background overflow-hidden divide-y divide-border">
						{todos.map((t) => (
							<div
								key={t.id}
								className="px-3 py-(--row-padding-y) text-(length:--row-font-size) text-foreground hover:bg-muted/60 transition-colors"
							>
								{t.title}
							</div>
						))}
					</div>
				)}
				<div className="mt-3 flex gap-2">
					<Input
						value={todo}
						onChange={(e) => setTodo(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") submitTodo()
						}}
						placeholder="Add a todo…"
						className="flex-1"
					/>
					<Button
						type="button"
						size="sm"
						disabled={todo.trim().length === 0}
						onClick={submitTodo}
					>
						Add
					</Button>
				</div>
			</div>
		</AdminShell>
	)
}
