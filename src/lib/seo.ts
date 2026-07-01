// Typed helper for per-route document metadata. Returns the exact shape
// TanStack Router's `head` option expects, so `head: () => seo({ title })` is
// fully type-checked. The deepest matched route's title wins, so per-route
// titles override the root default.

const SITE_NAME = "Boilerplate"

export function seo({
	title,
	description,
}: {
	title?: string
	description?: string
}): {
	meta: Array<{ title?: string; name?: string; content?: string }>
} {
	return {
		meta: [
			{ title: title ? `${title} · ${SITE_NAME}` : SITE_NAME },
			...(description ? [{ name: "description", content: description }] : []),
		],
	}
}
