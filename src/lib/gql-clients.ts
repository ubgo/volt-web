// GraphQL client factories over the gqlkit-ts runtime. Every call to the
// generated SDK (`src/generated/sdk`) is wired through one of these clients.
//
// - `createAnonClient()` — no auth headers (login/register/public queries).
// - `createApiClient()`  — injects Authorization + X-Workspace-Id from
//   localStorage on every request.
//
// The endpoint defaults to the Volt API dashboard endpoint. Override with
// `VITE_GRAPHQL_URL`. (When you wire real auth, add a refresh-on-401 retry to
// the `fetch` override below — see the reference project.)

import { GraphQLClient } from "gqlkit-ts"

const GRAPHQL_ENDPOINT =
	import.meta.env.VITE_GRAPHQL_URL ?? "https://volt-api.localhost/api/query"

/** SSR-safe localStorage read — returns null on the server or on error. */
function lsGet(key: string): string | null {
	try {
		const ls = (globalThis as { localStorage?: Storage }).localStorage
		if (!ls || typeof ls.getItem !== "function") return null
		return ls.getItem(key)
	} catch {
		return null
	}
}

/** Unauthenticated client — no Authorization header. */
export function createAnonClient(): GraphQLClient {
	return new GraphQLClient(GRAPHQL_ENDPOINT, {})
}

/**
 * Authenticated client. Reads the access token + workspace id from
 * localStorage at request time (not module-load), so tokens set after login
 * are always picked up.
 */
export function createApiClient(): GraphQLClient {
	return new GraphQLClient(GRAPHQL_ENDPOINT, {
		fetch: async (url, init) => {
			const at = lsGet("authmgr.access")
			const ws = lsGet("authmgr.workspace")
			const headers = new Headers(init?.headers)
			if (at && !headers.has("Authorization")) {
				headers.set("Authorization", `Bearer ${at}`)
			}
			if (ws && !headers.has("X-Workspace-Id")) {
				headers.set("X-Workspace-Id", ws)
			}
			// Browser never sends X-Internal-Key: any VITE_* value is baked into
			// the public JS bundle, so it can never be a transport secret. The
			// real gate is the Bearer token + X-Workspace-Id above; server-only
			// internal auth stays in src/lib/middleware.ts (env.INTERNAL_KEY,
			// which never reaches the client build).
			return globalThis.fetch(url, { ...init, headers })
		},
	})
}
