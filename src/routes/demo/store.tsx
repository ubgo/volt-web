import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { Boxes } from 'lucide-react'

import { AdminShell, PageHeader } from '@/components/admin-shell'
import { ReadonlyValue } from '@/demo/form/form-kit'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fullName, store } from '@/demo/data/store'

export const Route = createFileRoute('/demo/store')({
  component: DemoStore,
})

function FirstName() {
  const firstName = useStore(store, (state) => state.firstName)
  return (
    <Input
      id="firstName"
      value={firstName}
      onChange={(e) =>
        store.setState((state) => ({ ...state, firstName: e.target.value }))
      }
    />
  )
}

function LastName() {
  const lastName = useStore(store, (state) => state.lastName)
  return (
    <Input
      id="lastName"
      value={lastName}
      onChange={(e) =>
        store.setState((state) => ({ ...state, lastName: e.target.value }))
      }
    />
  )
}

function FullName() {
  const fName = useStore(fullName)
  return (
    <ReadonlyValue>{fName || '—'}</ReadonlyValue>
  )
}

function DemoStore() {
  return (
    <AdminShell>
      <div className="px-6 py-6 max-w-3xl">
        <PageHeader
          icon={<Boxes />}
          title="Store"
          subtitle="Reactive client state with TanStack Store — full name derives live"
        />
        <div className="rounded-md border border-border bg-background p-4 space-y-3 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <FirstName />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <LastName />
          </div>
          <div className="space-y-1.5">
            <Label>Full name (derived)</Label>
            <FullName />
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
