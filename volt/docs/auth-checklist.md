# Auth wiring checklist — lessons paid for on the sync fork

Volt Web ships without an auth feature because Volt API's dashboard schema has no auth operations yet (its schema is ping + User CRUD). When you wire real auth — or when an authmgr-style module lands in the backend — port the reference implementation from the sync fork (`sync_tanstack/src/features/auth/`, its only `features/` directory, cleanly isolated) and keep these three behaviors. Each one was a production bug before it was a rule.

## 1. Trust-based AuthGate — never auto-logout on transient errors

The naive gate calls `getMe()` on every navigation and bounces to `/login` whenever it returns null. Result: any transient network failure — laptop sleep, dev API restart, a brief 502 from the proxy — signed the user out. The fix (sync `2bf2c6f`): if a token exists in storage, render immediately and let real auth failures surface as request-level GraphQL errors at the page that needs the data; the user signs out explicitly via the menu. A gate may verify in the background, but a failed *verification attempt* is not a failed *authentication*.

## 2. Multi-tab refresh mutex + rotation-race guard

With refresh-token rotation, two tabs refreshing concurrently make one tab's token invalid — the naive client clears storage and logs BOTH tabs out. The fix (sync `204cc66`): wrap token refresh in a `navigator.locks` mutex, and on refresh failure only clear tokens **when the STORED refresh token is the one that failed** — if storage now holds a different token, a sibling tab rotated successfully and this tab should just retry with it. Pair with a server-side refresh-reuse grace window.

## 3. Workspace switch must remount the query subtree

Switching the active workspace while React Query closures hold the old `workspaceId` shows the previous workspace's data under the new workspace's header. The fix (sync `204cc66`): expose the active workspace via `useSyncExternalStore` and key a wrapper around the query-consuming subtree on it, so a switch remounts consumers and every query refires with the new id. Persist the last active workspace and restore it on login only after membership confirms.

## Also

- The refresh-on-401 retry belongs in the `fetch` override of `createApiClient` (`src/lib/gql-clients.ts`) — one place, not per-page.
- Never send internal/bypass headers from the browser; the Bearer token + `X-Workspace-Id` are the whole client-side story (see the note in `gql-clients.ts`).
- Regenerate the gqlkit SDK against YOUR backend before porting: the checked-in SDK reflects whatever schema it was last generated from, and auth pages compiling against stale operations fail only at runtime.
