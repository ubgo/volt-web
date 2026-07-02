import { faker } from "@faker-js/faker"
import { createFileRoute } from "@tanstack/react-router"
import { Table2 } from "lucide-react"
import { AdminShell, PageHeader } from "@/components/admin-shell"
import { Badge } from "@/components/ui/badge"
import {
	type DataTableColumn,
	defineFilterFields,
	defineSortOptions,
	ServerDataTable,
} from "@/components/ui/server-data-table"
import { StatusBadge, type StatusTone } from "@/demo/form/form-kit"
import { clientConnection } from "@/lib/client-datatable"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/demo/server-table")({
	component: ServerTableDemo,
	head: () => seo({ title: "Server data table" }),
})

// ──────────────────────────────────────────────────────────────────────────
// Mock dataset — generated once at module load with a fixed seed so rows are
// stable across renders + SSR/hydration. Stands in for a real backend; the
// ServerDataTable below treats it exactly as if it were server-paginated via
// the `clientConnection` adapter (filter → sort → cursor-page, all in memory).
// ──────────────────────────────────────────────────────────────────────────

type Status = "active" | "draft" | "archived"
type Plan = "free" | "pro" | "enterprise"

type Row = {
	id: string
	name: string
	email: string
	status: Status
	plan: Plan
	mrr: number
	createdAt: string
}

type Where = {
	search?: string
	status?: Status
	plan?: Plan
	minMrr?: number
}

const STATUSES: Status[] = ["active", "draft", "archived"]
const STATUS_TONE: Record<Status, StatusTone> = {
	active: "success",
	draft: "warning",
	archived: "neutral",
}
const PLANS: Plan[] = ["free", "pro", "enterprise"]

faker.seed(20260630)
const DATA: Row[] = Array.from({ length: 240 }, () => {
	const name = faker.person.fullName()
	return {
		id: faker.string.uuid(),
		name,
		email: faker.internet
			.email({ firstName: name.split(" ")[0] })
			.toLowerCase(),
		status: faker.helpers.arrayElement(STATUSES),
		plan: faker.helpers.arrayElement(PLANS),
		mrr: faker.number.int({ min: 0, max: 4800 }),
		createdAt: faker.date.past({ years: 2 }).toISOString(),
	}
})

const columns: DataTableColumn<Row>[] = [
	{
		id: "name",
		header: "Customer",
		size: 220,
		cell: (r) => (
			<div className="min-w-0">
				<div className="text-[13px] font-medium truncate">{r.name}</div>
				<div className="text-[11px] text-muted-foreground truncate">
					{r.email}
				</div>
			</div>
		),
		meta: { sortFieldId: "name", filterFieldId: "search" },
	},
	{
		id: "status",
		header: "Status",
		size: 130,
		cell: (r) => <StatusBadge label={r.status} tone={STATUS_TONE[r.status]} />,
		meta: { sortFieldId: "status", filterFieldId: "status" },
	},
	{
		id: "plan",
		header: "Plan",
		size: 130,
		cell: (r) => <Badge tone="default">{r.plan}</Badge>,
		meta: { sortFieldId: "plan", filterFieldId: "plan" },
	},
	{
		id: "mrr",
		header: "MRR",
		size: 110,
		cell: (r) => (
			<span className="tabular-nums text-[13px]">
				${r.mrr.toLocaleString()}
			</span>
		),
		meta: {
			sortFieldId: "mrr",
			filterFieldId: "minMrr",
			className: "text-right",
		},
	},
	{
		id: "createdAt",
		header: "Joined",
		size: 130,
		cell: (r) => (
			<span className="text-[13px] text-muted-foreground tabular-nums">
				{new Date(r.createdAt).toLocaleDateString()}
			</span>
		),
		meta: { sortFieldId: "createdAt" },
	},
]

const filterFields = defineFilterFields<Where>()([
	{
		id: "search",
		type: "text",
		label: "Search",
		placeholder: "name / email",
		toWhere: (c) => ({ search: c.value ?? undefined }),
	},
	{
		id: "status",
		type: "select",
		label: "Status",
		options: STATUSES.map((s) => ({ value: s, label: s })),
		toWhere: (c) => ({
			status: (Array.isArray(c.value) ? c.value[0] : c.value) as Status,
		}),
	},
	{
		id: "plan",
		type: "select",
		label: "Plan",
		options: PLANS.map((p) => ({ value: p, label: p })),
		toWhere: (c) => ({
			plan: (Array.isArray(c.value) ? c.value[0] : c.value) as Plan,
		}),
	},
	{
		id: "minMrr",
		type: "number",
		label: "Min MRR",
		toWhere: (c) => ({ minMrr: Number(c.value) || undefined }),
	},
])

const sortOptions = defineSortOptions()([
	{ fieldId: "name", label: "Customer" },
	{ fieldId: "status", label: "Status" },
	{ fieldId: "plan", label: "Plan" },
	{ fieldId: "mrr", label: "MRR" },
	{ fieldId: "createdAt", label: "Joined" },
])

function ServerTableDemo() {
	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-[1280px]">
				<PageHeader
					icon={<Table2 />}
					title="Server data table"
					subtitle="240 mock rows · cursor pagination, sort, filter, column visibility, saved views — all driven by the client adapter"
				/>
				<ServerDataTable<Row, Where>
					queryKey="demoCustomers"
					columns={columns}
					filterFields={filterFields}
					sortOptions={sortOptions}
					defaultSort={[{ fieldId: "mrr", direction: "desc" }]}
					getRowId={(r) => r.id}
					pageSize={20}
					search={{
						placeholder: "Search customers…",
						toWhere: (q) => ({ search: q }),
					}}
					views={{}}
					queryFn={async (args) =>
						clientConnection(DATA, args, {
							filter: (r, where) => {
								if (
									where?.search &&
									!`${r.name} ${r.email}`
										.toLowerCase()
										.includes(String(where.search).toLowerCase())
								)
									return false
								if (where?.status && r.status !== where.status) return false
								if (where?.plan && r.plan !== where.plan) return false
								if (where?.minMrr != null && r.mrr < Number(where.minMrr))
									return false
								return true
							},
							sorters: {
								name: (r) => r.name.toLowerCase(),
								status: (r) => r.status,
								plan: (r) => r.plan,
								mrr: (r) => r.mrr,
								createdAt: (r) => r.createdAt,
							},
						})
					}
				/>
			</div>
		</AdminShell>
	)
}
