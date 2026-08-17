import fs from "node:fs"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { Server } from "lucide-react"
import { useCallback, useState } from "react"

import { AdminShell, PageHeader } from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { seo } from "@/lib/seo"

/*
const loggingMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    console.log("Request:", request.url);
    return next();
  }
);
const loggedServerFunction = createServerFn({ method: "GET" }).middleware([
  loggingMiddleware,
]);
*/

type Todo = {
	id: number
	name: string
}

const TODOS_FILE = "todos.json"

async function readTodos(): Promise<Todo[]> {
	return JSON.parse(
		await fs.promises.readFile(TODOS_FILE, "utf-8").catch(() =>
			JSON.stringify(
				[
					{ id: 1, name: "Get groceries" },
					{ id: 2, name: "Buy a new phone" },
				],
				null,
				2,
			),
		),
	)
}

const getTodos = createServerFn({
	method: "GET",
}).handler(async () => await readTodos())

const addTodo = createServerFn({ method: "POST" })
	.validator((d: string) => d)
	.handler(async ({ data }) => {
		const todos = await readTodos()
		todos.push({ id: todos.length + 1, name: data })
		await fs.promises.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2))
		return todos
	})

export const Route = createFileRoute("/demo/start/server-funcs")({
	component: Home,
	head: () => seo({ title: "Server functions" }),
	loader: async () => await getTodos(),
})

function Home() {
	const router = useRouter()
	let todos = Route.useLoaderData()

	const [todo, setTodo] = useState("")

	const submitTodo = useCallback(async () => {
		if (!todo.trim()) return
		todos = await addTodo({ data: todo })
		setTodo("")
		router.invalidate()
	}, [todo, router])

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<Server />}
					title="Server functions"
					subtitle="Type-safe server-side calls invoked straight from the client"
				/>
				<div className="mb-2 text-[11px] text-muted-foreground tabular-nums">
					{todos?.length ?? 0} todos
				</div>
				{todos && todos.length > 0 && (
					<div className="rounded-md border border-border bg-background overflow-hidden divide-y divide-border">
						{todos.map((t: Todo) => (
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
