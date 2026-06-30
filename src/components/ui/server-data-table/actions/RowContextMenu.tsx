import { Clipboard, Copy } from "lucide-react"
import * as React from "react"
import { createPortal } from "react-dom"
import { useGqlMutation } from "@/lib/gql-hooks"
import { cn } from "@/lib/utils"
import { Link } from "../state/router-compat"
import type { ActionItem, ActionMutationConfig } from "../types"
import { ConfirmDialog } from "./ConfirmDialog"

type Options<TNode> = {
	row: TNode
	rowId?: string
	actions: ActionItem[]
}

/**
 * Right-click context menu for table rows.
 *
 * Self-contained (doesn't use base-ui Menu) because base-ui's Menu has
 * outside-click detection that fights programmatic `open` + virtual-anchor
 * patterns — the menu would dismiss immediately on the same tick it mounts.
 *
 * Returns:
 *   - `triggerProps`: spread on the `<tr>` to capture contextmenu
 *   - `menu`: portal'd to document.body, no DOM presence in the table
 */
export function useRowContextMenu<TNode>({
	row,
	rowId,
	actions,
}: Options<TNode>) {
	const [coords, setCoords] = React.useState<{ x: number; y: number } | null>(
		null,
	)
	const [pendingMutation, setPendingMutation] =
		React.useState<ActionMutationConfig | null>(null)
	const open = coords !== null

	const close = React.useCallback(() => setCoords(null), [])

	const triggerProps = React.useMemo(
		() => ({
			onContextMenu: (e: React.MouseEvent) => {
				e.preventDefault()
				setCoords({ x: e.clientX, y: e.clientY })
			},
		}),
		[],
	)

	// Click outside / Escape to close
	React.useEffect(() => {
		if (!open) return
		const handleMouseDown = (e: MouseEvent) => {
			const target = e.target as Element | null
			if (target?.closest("[data-row-context-menu]")) return
			close()
		}
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close()
		}
		// Use mousedown not click — context menu opens on contextmenu (which
		// doesn't fire click). We want to dismiss on the next mousedown OR
		// a click on a menu item.
		window.addEventListener("mousedown", handleMouseDown)
		window.addEventListener("keydown", handleKey)
		return () => {
			window.removeEventListener("mousedown", handleMouseDown)
			window.removeEventListener("keydown", handleKey)
		}
	}, [open, close])

	const copy = (text: string) => {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			void navigator.clipboard.writeText(text)
		}
		close()
	}

	// Adjust position to keep menu fully on-screen
	const menuRef = React.useRef<HTMLDivElement>(null)
	const [adjusted, setAdjusted] = React.useState<{
		x: number
		y: number
	} | null>(null)
	React.useLayoutEffect(() => {
		if (!coords) {
			setAdjusted(null)
			return
		}
		const el = menuRef.current
		if (!el) {
			setAdjusted(coords)
			return
		}
		const r = el.getBoundingClientRect()
		let x = coords.x
		let y = coords.y
		if (x + r.width > window.innerWidth - 8) x = window.innerWidth - r.width - 8
		if (y + r.height > window.innerHeight - 8)
			y = window.innerHeight - r.height - 8
		setAdjusted({ x, y })
	}, [coords])

	const menuTree = open ? (
		<div
			ref={menuRef}
			data-row-context-menu
			className={cn(
				"bg-popover text-popover-foreground fixed z-50 min-w-40 overflow-hidden rounded-md border p-0.5 shadow-md",
				"animate-in fade-in-0 zoom-in-95",
			)}
			style={{
				left: (adjusted ?? coords).x,
				top: (adjusted ?? coords).y,
				// Hide while we measure to avoid a flash off-screen
				visibility: adjusted ? "visible" : "hidden",
			}}
		>
			{actions.length > 0 && (
				<div className="flex flex-col">
					{actions.map((action, i) => (
						<ContextActionRow
							key={`${action.label}-${i}`}
							action={action}
							onClose={close}
							onRequestMutation={(m) => {
								close()
								setPendingMutation(m)
							}}
						/>
					))}
					<Separator />
				</div>
			)}
			<div className="flex flex-col">
				{rowId && (
					<ItemButton onClick={() => copy(rowId)}>
						<Copy className="h-3 w-3" />
						Copy ID
					</ItemButton>
				)}
				<ItemButton onClick={() => copy(JSON.stringify(row, null, 2))}>
					<Clipboard className="h-3 w-3" />
					Copy as JSON
				</ItemButton>
			</div>
		</div>
	) : null

	const menu = (
		<>
			{typeof document !== "undefined" && menuTree
				? createPortal(menuTree, document.body)
				: null}
			{pendingMutation && (
				<MutationRunner
					mutation={pendingMutation}
					onClose={() => setPendingMutation(null)}
				/>
			)}
		</>
	)

	return { triggerProps, menu }
}

// ── Internal components ──────────────────────────────────────────────────

function Separator() {
	return <div className="bg-border my-1 h-px" />
}

function ItemButton({
	onClick,
	className,
	destructive,
	disabled,
	children,
}: {
	onClick: () => void
	className?: string
	destructive?: boolean
	disabled?: boolean
	children: React.ReactNode
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className={cn(
				"hover:bg-accent focus:bg-accent flex h-7 w-full items-center gap-1.5 rounded-sm px-2 text-xs outline-none",
				"disabled:pointer-events-none disabled:opacity-50",
				destructive &&
					"text-destructive hover:bg-destructive/10 focus:bg-destructive/10",
				className,
			)}
		>
			{children}
		</button>
	)
}

function ContextActionRow({
	action,
	onClose,
	onRequestMutation,
}: {
	action: ActionItem
	onClose: () => void
	onRequestMutation: (m: ActionMutationConfig) => void
}) {
	const Icon = action.icon

	if ("url" in action) {
		return (
			<Link
				to={action.url}
				onClick={onClose}
				className={cn(
					"hover:bg-accent flex h-7 w-full items-center gap-1.5 rounded-sm px-2 text-xs outline-none",
					action.destructive && "text-destructive hover:bg-destructive/10",
					action.disabled && "pointer-events-none opacity-50",
				)}
			>
				{Icon && <Icon className="h-3 w-3" />}
				{action.label}
			</Link>
		)
	}

	if ("mutation" in action) {
		return (
			<ItemButton
				destructive={action.destructive}
				disabled={action.disabled}
				onClick={() => onRequestMutation(action.mutation)}
			>
				{Icon && <Icon className="h-3 w-3" />}
				{action.label}
			</ItemButton>
		)
	}

	return (
		<ItemButton
			destructive={action.destructive}
			disabled={action.disabled}
			onClick={() => {
				action.onAction()
				onClose()
			}}
		>
			{Icon && <Icon className="h-3 w-3" />}
			{action.label}
		</ItemButton>
	)
}

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
