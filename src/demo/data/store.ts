import { Store } from '@tanstack/store'

// @tanstack/store 0.11 removed the `Derived` class — derived values are now
// computed at the consumer via `useStore(store, selector)` (see store.tsx) or
// directly from `store.state` (see store-devtools.tsx). `deriveFullName` keeps
// the formula in one place.
export const store = new Store({
  firstName: 'Jane',
  lastName: 'Smith',
})

export function deriveFullName(state: {
  firstName: string
  lastName: string
}) {
  return `${state.firstName} ${state.lastName}`.trim()
}
