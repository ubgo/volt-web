import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
	Check,
	ListChecks,
	MoreHorizontal,
	Pencil,
	Plus,
	RotateCcw,
	Trash2,
} from "lucide-react"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import { AdminShell, PageHeader } from "@/components/admin-shell"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/demo/form/form-kit"
import { useTRPC } from "@/integrations/trpc/react"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/demo/trpc-todo")({
	component: TRPCTodos,
	head: () => seo({ title: "Todos (tRPC)" }),
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			context.trpc.todos.list.queryOptions(),
		)
	},
})

type Todo = { id: number; name: string; completed: boolean }

function TRPCTodos() {
	const trpc = useTRPC()
	const {
		data: todos = [],
		isLoading,
		refetch,
	} = useQuery(trpc.todos.list.queryOptions())

	// One dialog serves both create and edit. `editing` is the discriminator:
	// null → create, a Todo → edit (prefilled).
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editing, setEditing] = useState<Todo | null>(null)
	const [name, setName] = useState("")
	// Pending-delete target. Non-null opens the confirm AlertDialog — never a
	// native confirm(): it blocks the event loop and violates the kit's
	// no-native-dialogs rule.
	const [deleting, setDeleting] = useState<Todo | null>(null)

	const reload = () => refetch()

	const addTodo = useMutation({
		...trpc.todos.add.mutationOptions(),
		onSuccess: () => {
			reload()
			toast.success("Todo created")
			setDialogOpen(false)
		},
		onError: (e) => toast.error(e.message),
	})
	const updateTodo = useMutation({
		...trpc.todos.update.mutationOptions(),
		onSuccess: () => {
			reload()
			toast.success("Todo updated")
			setDialogOpen(false)
		},
		onError: (e) => toast.error(e.message),
	})
	const toggleTodo = useMutation({
		...trpc.todos.toggle.mutationOptions(),
		onSuccess: () => reload(),
		onError: (e) => toast.error(e.message),
	})
	const deleteTodo = useMutation({
		...trpc.todos.delete.mutationOptions(),
		onSuccess: () => {
			reload()
			toast.success("Todo deleted")
		},
		onError: (e) => toast.error(e.message),
	})

	const busy = addTodo.isPending || updateTodo.isPending

	function openCreate() {
		setEditing(null)
		setName("")
		setDialogOpen(true)
	}
	function openEdit(todo: Todo) {
		setEditing(todo)
		setName(todo.name)
		setDialogOpen(true)
	}

	function onSubmit(e: FormEvent) {
		e.preventDefault()
		const trimmed = name.trim()
		if (!trimmed) return
		if (editing) updateTodo.mutate({ id: editing.id, name: trimmed })
		else addTodo.mutate({ name: trimmed })
	}

	function onDelete(todo: Todo) {
		setDeleting(todo)
	}

	const remaining = todos.filter((t) => !t.completed).length

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<ListChecks />}
					title="Todos"
					subtitle="End-to-end typesafe CRUD over tRPC v11 + React Query"
					primaryAction={
						<Button onClick={openCreate} className="gap-1">
							<Plus className="size-3" />
							New todo
						</Button>
					}
				/>

				{/* Sub-toolbar — counters */}
				<div className="mb-2 text-[11px] text-muted-foreground tabular-nums">
					{isLoading ? "…" : `${todos.length} todos · ${remaining} open`}
				</div>

				{/* Table */}
				{isLoading ? (
					<div className="rounded-md border border-border bg-background px-3 py-2 text-[11px] text-muted-foreground">
						Loading…
					</div>
				) : todos.length === 0 ? (
					<div className="rounded-md border border-dashed border-border bg-background py-8 text-[12px] text-muted-foreground text-center">
						No todos yet. Click <span className="font-medium">New todo</span> to
						add one.
					</div>
				) : (
					<div className="rounded-md border border-border bg-background overflow-hidden">
						<table className="w-full text-[13px]">
							<thead className="bg-muted/50 text-[12px] text-foreground">
								<tr className="border-b border-border">
									<th className="text-left font-semibold px-3 py-2">Todo</th>
									<th className="text-left font-semibold px-3 py-2 w-[110px]">
										Status
									</th>
									<th className="px-3 py-2 w-[40px]" />
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{todos.map((t) => (
									<tr key={t.id} className="group hover:bg-muted/60">
										<td
											className={`px-3 py-(--row-padding-y) font-medium truncate max-w-[420px] ${
												t.completed
													? "text-muted-foreground line-through"
													: "text-foreground"
											}`}
										>
											{t.name}
										</td>
										<td className="px-3 py-(--row-padding-y)">
											<StatusBadge
												label={t.completed ? "Done" : "Open"}
												tone={t.completed ? "success" : "warning"}
											/>
										</td>
										<td className="px-1 py-1">
											<DropdownMenu>
												<DropdownMenuTrigger className="cursor-pointer rounded p-1 text-foreground/70 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[popup-open]:opacity-100">
													<MoreHorizontal className="size-3.5" />
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => openEdit(t)}>
														<Pencil className="size-3.5 mr-2" />
														Edit
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => toggleTodo.mutate({ id: t.id })}
													>
														{t.completed ? (
															<>
																<RotateCcw className="size-3.5 mr-2" />
																Mark open
															</>
														) : (
															<>
																<Check className="size-3.5 mr-2" />
																Mark done
															</>
														)}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														variant="destructive"
														onClick={() => onDelete(t)}
													>
														<Trash2 className="size-3.5 mr-2" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Create / edit dialog — Polaris 3-zone (header / body / footer) */}
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogContent>
						<form onSubmit={onSubmit} className="contents">
							<DialogHeader>
								<DialogTitle>
									{editing ? "Edit todo" : "Create todo"}
								</DialogTitle>
							</DialogHeader>
							<DialogBody>
								<div className="space-y-1.5">
									<Label htmlFor="todo-name">Name</Label>
									<Input
										id="todo-name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="e.g. Ship the dashboard"
										autoFocus
										autoComplete="off"
										spellCheck={false}
									/>
								</div>
							</DialogBody>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={busy || !name.trim()}>
									{busy ? "Saving…" : editing ? "Save changes" : "Create todo"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>

				{/* Delete confirmation — AlertDialog (accessible, non-blocking)
				    instead of the browser's native confirm(). */}
				<AlertDialog
					open={deleting !== null}
					onOpenChange={(open) => {
						if (!open) setDeleting(null)
					}}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete todo</AlertDialogTitle>
							<AlertDialogDescription>
								Delete “{deleting?.name}”? This can't be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								className={buttonVariants({ variant: "destructive" })}
								onClick={() => {
									if (deleting) deleteTodo.mutate({ id: deleting.id })
								}}
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</AdminShell>
	)
}
