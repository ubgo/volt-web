import { useRender } from "@base-ui/react/use-render"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import type * as React from "react"

import { cn } from "@/lib/utils"

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
	return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
	return (
		<ol
			data-slot="breadcrumb-list"
			className={cn(
				"text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
				className,
			)}
			{...props}
		/>
	)
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="breadcrumb-item"
			className={cn("inline-flex items-center gap-1.5", className)}
			{...props}
		/>
	)
}

function BreadcrumbLink({
	className,
	render,
	...props
}: React.ComponentProps<"a"> & {
	render?: useRender.RenderProp
}) {
	// Default render is <a {...props}> (not a bare <a />): the caller's href +
	// children flow into the literal, so the anchor is verifiably valid at
	// this site — pass render={<Link …/>} to swap in a router link.
	return useRender({
		render: render ?? <a {...props} />,
		props: {
			"data-slot": "breadcrumb-link",
			className: cn("hover:text-foreground transition-colors", className),
			...props,
		},
	})
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
	return (
		// The current page is NOT a link (WAI-ARIA breadcrumb pattern): a plain
		// span with aria-current is the correct semantic — no role, no disabled.
		<span
			data-slot="breadcrumb-page"
			aria-current="page"
			className={cn("text-foreground font-normal", className)}
			{...props}
		/>
	)
}

function BreadcrumbSeparator({
	children,
	className,
	...props
}: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="breadcrumb-separator"
			role="presentation"
			aria-hidden="true"
			className={cn("[&>svg]:size-3.5", className)}
			{...props}
		>
			{children ?? <ChevronRight />}
		</li>
	)
}

function BreadcrumbEllipsis({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="breadcrumb-ellipsis"
			role="presentation"
			aria-hidden="true"
			className={cn("flex size-9 items-center justify-center", className)}
			{...props}
		>
			<MoreHorizontal className="size-4" />
			<span className="sr-only">More</span>
		</span>
	)
}

export {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
}
