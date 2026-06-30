import { createFileRoute, redirect } from "@tanstack/react-router"

// The root path redirects to the demo dashboard. All demo/showcase code lives
// under /demo (routes) and src/demo (helpers) — when the real app begins,
// replace this redirect with the app's own landing route and delete the demo.
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({ to: "/demo" })
	},
})
