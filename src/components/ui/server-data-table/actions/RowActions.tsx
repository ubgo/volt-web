import { MoreHorizontal } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useGqlMutation } from "@/lib/gql-hooks"
import { cn } from "@/lib/utils"
import { Link } from "../state/router-compat"
import type { ActionItem, ActionMutationConfig } from "../types"
import { ConfirmDialog } from "./ConfirmDialog"

type RowActionsProps = {
	actions: ActionItem[]
}

/**
 * Renders a row action dropdown. Actions with a `mutation` field
 * render a confirm dialog → run mutation → call onSuccess, so callers
 * never wire useGqlMutation + DeleteMutationButton by hand.
 */
export function RowActions({ actions }: RowActionsProps) {
	const [pendingMutation, setPendingMutation] =
		React.useState<ActionMutationConfig | null>(null)

	if (actions.length === 0) return null

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						aria-label="Row actions"
					>
						<MoreHorizontal className="h-3.5 w-3.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-32 p-0.5">
					{actions.map((action) => (
						<ActionRow
							key={action.label}
							action={action}
							onRequestMutation={setPendingMutation}
						/>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{pendingMutation && (
				<MutationRunner
					mutation={pendingMutation}
					onClose={() => setPendingMutation(null)}
				/>
			)}
		</>
	)
}

// ── Individual action row ────────────────────────────────────────────────

function ActionRow({
	action,
	onRequestMutation,
}: {
	action: ActionItem
	onRequestMutation: (m: ActionMutationConfig) => void
}) {
	const Icon = action.icon
	const itemCls = cn(
		"h-7 gap-1.5 px-2 py-0 text-xs",
		action.destructive &&
			"text-destructive focus:text-destructive focus:bg-destructive/10",
	)

	if ("url" in action) {
		return (
			<DropdownMenuItem
				disabled={action.disabled}
				className={itemCls}
				render={<Link to={action.url} />}
			>
				{Icon && <Icon className="h-3 w-3" />}
				{action.label}
			</DropdownMenuItem>
		)
	}

	if ("mutation" in action) {
		return (
			<DropdownMenuItem
				disabled={action.disabled}
				className={itemCls}
				onClick={() => onRequestMutation(action.mutation)}
			>
				{Icon && <Icon className="h-3 w-3" />}
				{action.label}
			</DropdownMenuItem>
		)
	}

	return (
		<DropdownMenuItem
			disabled={action.disabled}
			className={itemCls}
			onClick={action.onAction}
		>
			{Icon && <Icon className="h-3 w-3" />}
			{action.label}
		</DropdownMenuItem>
	)
}

// ── Runs the mutation and manages the confirm dialog ─────────────────────

function MutationRunner({
	mutation,
	onClose,
}: {
	mutation: ActionMutationConfig
	onClose: () => void
}) {
	const m = useGqlMutation<unknown, void>(mutation.key, () => mutation.fn(), {
		onSuccess: () => {
			mutation.onSuccess?.()
			onClose()
		},
		onError: (err) => {
			mutation.onError?.(err as Error)
		},
	})

	return (
		<ConfirmDialog
			open
			onOpenChange={(o) => !o && onClose()}
			title={mutation.confirmTitle ?? "Are you sure?"}
			message={mutation.confirmMessage}
			confirmLabel={mutation.confirmButtonLabel ?? "Confirm"}
			destructive
			loading={m.isPending}
			onConfirm={() => m.mutate()}
		/>
	)
}
