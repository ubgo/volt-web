# Building a page

A guided tour of assembling a real admin page in Volt: the app shell, a list/CRUD table, forms, per-route titles, and dialogs. This page walks you through it end to end. For the verbatim className patterns and the enforced "building a page" playbook, see [`../rules/frontend.md`](../rules/frontend.md) — this doc is the tour, that file is the rulebook.

## The app shell

Every top-level page wraps its content in `AdminShell` and opens with a `PageHeader`. Both live in [`src/components/admin-shell.tsx`](../../src/components/admin-shell.tsx).

`AdminShell` renders the persistent chrome: a sticky sidebar (logo, grouped nav, `ThemeToggle`, and a bottom user menu) on desktop, a scrollable top nav on mobile, and your page as `children` in the main column. You do not configure it per page — you nest inside it:

```tsx
import { AdminShell, PageHeader } from "@/components/admin-shell"

function MyPage() {
  return (
    <AdminShell>
      <div className="px-6 py-6 max-w-[1280px]">
        <PageHeader title="My page" subtitle="What this page is for" />
        {/* page body */}
      </div>
    </AdminShell>
  )
}
```

`PageHeader` is the standard title row, with five slots so the rhythm is identical on every page:

| Prop | Purpose |
|---|---|
| `icon` | Leading icon (a lucide icon element, sized to 18px automatically) |
| `title` | Page title (required) |
| `subtitle` | Optional one-line description under the title |
| `primaryAction` | The main CTA, rendered on the right |
| `secondaryActions` | Secondary buttons, rendered left of the primary action |
| `right` | An escape-hatch slot for anything else on the right |

For grouped content inside the body, wrap sections in `Surface` — a rounded, bordered, shadowed card (`rounded-xl border bg-background shadow-sm overflow-hidden`) that accepts a `className`. Use it to frame tables and panels. The file also exports `Thumb` (a square thumbnail with a fallback for missing images); the shared status pill `StatusBadge` lives in `@/demo/form/form-kit`, not here.

## A list / CRUD page with ServerDataTable

For any page that lists rows, use `ServerDataTable` rather than a bare `<table>`. It is the bespoke component in `src/components/ui/server-data-table/` and gives you, in one config object: cursor pagination, sorting, a filter bar, full-text search, column show/hide + resize + reorder, saved views, CSV export, row actions, pluggable layouts, and URL state sync. The full working example is [`src/routes/demo/server-table.tsx`](../../src/routes/demo/server-table.tsx); the complete type surface is `ServerDataTableConfig` in `server-data-table/types.ts`. See [`../rules/frontend.md`](../rules/frontend.md) §11 for the verbatim usage rules.

### The shape of it

You describe the table declaratively. Import the pieces from the barrel `@/components/ui/server-data-table`:

```tsx
import {
  type DataTableColumn,
  defineFilterFields,
  defineSortOptions,
  ServerDataTable,
} from "@/components/ui/server-data-table"
```

**Columns** are a plain array — no `@tanstack/react-table` involved; this component owns its own column model. Each column has an `id`, a `header`, a `cell(row, rowIndex)` renderer, an optional `size`, and a `meta` that links the column to its sort field, filter field, and alignment class:

```tsx
const columns: DataTableColumn<Row>[] = [
  {
    id: "name",
    header: "Customer",
    size: 220,
    cell: (r) => <div className="font-medium truncate">{r.name}</div>,
    meta: { sortFieldId: "name", filterFieldId: "search" },
  },
  {
    id: "mrr",
    header: "MRR",
    cell: (r) => <span className="tabular-nums">${r.mrr}</span>,
    meta: { sortFieldId: "mrr", className: "text-right" },
  },
]
```

**Filters** are declared with `defineFilterFields<Where>()([...])`, which gives you type-safe field ids. Each field has a `type` (`text`, `number`, `select`, `multi-select`, `boolean`, `date`, `date-range`, `relation`, `relation-multi`), a `label`, and a `toWhere(condition)` that maps the user's input into a partial of your backend's `Where` input:

```tsx
const filterFields = defineFilterFields<Where>()([
  { id: "search", type: "text", label: "Search", toWhere: (c) => ({ search: c.value ?? undefined }) },
  { id: "status", type: "select", label: "Status", options: [...], toWhere: (c) => ({ status: c.value }) },
])
```

**Sort options** come from `defineSortOptions()([...])`, each `{ fieldId, label }`.

### Wiring it up

`ServerDataTable` takes those pieces plus a `queryFn`. Key props (all in `ServerDataTableConfig`):

| Prop | What it does |
|---|---|
| `queryKey` | Stable cache-key prefix for the query |
| `queryFn` | `async (args) => Connection<Row>` — receives `{ where, orderBy, first/last, after/before }`, returns edges + `pageInfo` + `totalCount` |
| `columns`, `filterFields`, `sortOptions` | The declarations above |
| `defaultSort` | Initial sort, type-checked against `sortOptions` |
| `getRowId` | Stable id for React keys and Copy-ID |
| `pageSize` / `pageSizeOptions` | Cursor page size (default 20) and the selector options |
| `search` | The always-on prominent search input (`{ placeholder, toWhere }`) |
| `views` | Saved views (localStorage by default; pass `builtinViews` for shipped presets) |
| `rowActions` | `(row, ctx) => ActionItem[]` — the per-row menu (see below) |
| `toolbar` | Extra toolbar slot; as a function it receives live ctx incl. `fetchAll` for export |
| `urlState` | Sync state to the URL query string (on by default) |
| `density`, `stickyHeader`, `enableColumnResize`, `enableColumnReorder`, `layouts` | Visual + interaction tuning |

The `queryFn` is a **connection adapter**. Against a real backend you return a GraphQL/RPC cursor connection directly. For local data (and the demo), `clientConnection` from `@/lib/client-datatable` takes an in-memory array plus `{ filter, sorters }` and does filter → sort → cursor-page in memory, presenting the exact same `Connection` shape — so you can build the whole page before the backend exists and swap the `queryFn` later with no other changes:

```tsx
<ServerDataTable<Row, Where>
  queryKey="demoCustomers"
  columns={columns}
  filterFields={filterFields}
  sortOptions={sortOptions}
  defaultSort={[{ fieldId: "mrr", direction: "desc" }]}
  getRowId={(r) => r.id}
  pageSize={20}
  search={{ placeholder: "Search customers…", toWhere: (q) => ({ search: q }) }}
  views={{}}
  queryFn={async (args) => clientConnection(DATA, args, { filter, sorters })}
/>
```

### Row actions

Add a per-row menu with the `rowActions` prop rather than a custom column. Each `ActionItem` is one of three shapes: an `onAction` callback, a `url` link, or a `mutation` (a React Query mutation config with optional confirm dialog). The factory receives a `ctx` with `refetch()` so an action can refresh the table after it runs.

## Forms with TanStack Form

Forms use **TanStack Form** with **Zod** validation, wrapped by a small form-kit. The canonical minimal example is [`src/routes/demo/form.simple.tsx`](../../src/routes/demo/form.simple.tsx); the field kit is in `src/demo/form/`. See [`../rules/frontend.md`](../rules/frontend.md) §6 for the rules.

`useAppForm` (from `@/demo/form/use-app-form`) is a `createFormHook` instance pre-bound with field components (`TextField`, `TextArea`, `Select`) and a `SubscribeButton` that disables itself while submitting. You give it default values, validators, and an `onSubmit`:

```tsx
const form = useAppForm({
  defaultValues: { title: "", description: "" },
  validators: { onBlur: schema },        // a Zod schema
  onSubmit: ({ value }) => { /* … */ },
})

<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
  <form.AppField name="title">
    {(field) => <field.TextField label="Title" placeholder="A short title" />}
  </form.AppField>
  <form.AppField name="description">
    {(field) => <field.TextArea label="Description" />}
  </form.AppField>
  <form.AppForm>
    <form.SubscribeButton label="Submit" />
  </form.AppForm>
</form>
```

Validation errors surface as quiet 11px destructive text under each field once it's touched. For richer layouts, the form-kit (`src/demo/form/form-kit.tsx`) supplies the visual scaffolding — all styled to the control-density tokens so fields never drift in height:

| Helper | Purpose |
|---|---|
| `Field` | A labelled wrapper: label · control · optional hint or error, with a required marker |
| `FormSection` | A titled section (heading + description) wrapping a `FormCard` |
| `FormCard` | A compact bordered card for a group of fields |
| `FormActions` | A right-aligned action row for the submit / cancel buttons |
| `SwitchRow` | Label + description on the left, a control on the right |
| `DateField` | An outline trigger button that opens the `Calendar` in a `Popover` |
| `ReadonlyValue` | A read-only display sized to match editable inputs |

Browse `/demo/form/kitchen-sink` in the running app to see the field kit in full.

## Per-route document titles

Set the browser title per route with `seo()` from [`src/lib/seo.ts`](../../src/lib/seo.ts) inside the route's `head` option. `seo()` returns exactly the shape TanStack Router's `head` expects, so it is fully type-checked, and the deepest matched route wins (per-route titles override the root default). Titles are suffixed with the site name automatically:

```tsx
export const Route = createFileRoute("/demo/server-table")({
  component: ServerTableDemo,
  head: () => seo({ title: "Server data table" }),  // → "Server data table · Volt"
})
```

Pass an optional `description` to also emit a meta description.

## Dialogs

Use the basecn `dialog` (`@/components/ui/dialog`) for modals — never a native `<dialog>` or a hand-rolled overlay; the component handles focus trap, escape, and scroll lock for you. It exports a three-zone structure — header, body, footer — plus the trigger/close parts:

```tsx
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter, DialogClose,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger render={<Button>Edit</Button>} />
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit customer</DialogTitle>
      <DialogDescription>Update the details below.</DialogDescription>
    </DialogHeader>
    <DialogBody>{/* form fields */}</DialogBody>
    <DialogFooter>
      <DialogClose render={<Button variant="outline">Cancel</Button>} />
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Note the Base UI `render` prop on the trigger and close (not `asChild`). For a side panel instead of a centered modal, reach for `sheet` — and set its width with an inline `style`, per [`../rules/frontend.md`](../rules/frontend.md) §10.

## Next / Related

[Design system](design-system.md) · [Getting started](getting-started.md) · [oRPC / tRPC](data/rpc.md) · [GraphQL](data/graphql.md) · [Configuration](configuration.md) · [Frontend rules](../rules/frontend.md) · [Code standards](../rules/code-standards.md) · [Docs home](README.md)
