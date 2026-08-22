import type { RouterUtils } from "@orpc/tanstack-query"
import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { useEffect } from "react"
import { Toaster } from "sonner"
import StoreDevtools from "@/demo/data/store-devtools"
import type { ORPCClient } from "@/integrations/orpc/react"
import type { TRPCRouter } from "@/integrations/trpc/routers"
import { applyEnvFavicon } from "@/lib/app-env"
import { THEME_INIT_SCRIPT } from "@/lib/theme"
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools"
import { Provider } from "../integrations/tanstack-query/root-provider"
import appCss from "../styles.css?url"

interface MyRouterContext {
	queryClient: QueryClient

	trpc: TRPCOptionsProxy<TRPCRouter>

	orpc: RouterUtils<ORPCClient>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Volt",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/x-icon",
				href: "/images/favicon.ico",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/images/icon-180x180.png",
			},
			{
				rel: "manifest",
				href: "/manifest.json",
			},
		],
	}),

	component: RootComponent,
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
})

function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
			<h1 className="text-4xl font-bold">404</h1>
			<p className="text-lg text-gray-600">Page not found</p>
			<Link to="/" className="text-blue-500 hover:underline">
				Go home
			</Link>
		</div>
	)
}

function RootComponent() {
	const { queryClient } = Route.useRouteContext()
	// Swap the static favicon for the environment-tinted one (local/dev/stag
	// each get their own tile color; prod keeps the brand icon) so tabs across
	// environments are tellable apart at a glance. Once on mount — the env
	// can't change mid-tab.
	useEffect(() => {
		applyEnvFavicon()
	}, [])
	return (
		<Provider queryClient={queryClient}>
			<Outlet />
		</Provider>
	)
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* Set the .dark class before paint to avoid a light→dark flash. */}
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted inline theme bootstrap */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body>
				{children}
				<Toaster theme="system" richColors closeButton position="top-right" />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						StoreDevtools,
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	)
}
