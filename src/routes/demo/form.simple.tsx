import { createFileRoute } from "@tanstack/react-router"
import { FormInput } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { AdminShell, PageHeader } from "@/components/admin-shell"
import { useAppForm } from "@/demo/form/use-app-form"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/demo/form/simple")({
	component: SimpleForm,
	head: () => seo({ title: "Simple form" }),
})

const schema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().min(1, "Description is required"),
})

function SimpleForm() {
	const form = useAppForm({
		defaultValues: {
			title: "",
			description: "",
		},
		validators: {
			onBlur: schema,
		},
		onSubmit: ({ value }) => {
			toast.success("Form submitted", { description: value.title })
		},
	})

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<FormInput />}
					title="Simple form"
					subtitle="TanStack Form with field-level validation"
				/>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						form.handleSubmit()
					}}
					className="rounded-md border border-border bg-background p-4 space-y-3"
				>
					<form.AppField name="title">
						{(field) => (
							<field.TextField label="Title" placeholder="A short title" />
						)}
					</form.AppField>

					<form.AppField name="description">
						{(field) => <field.TextArea label="Description" />}
					</form.AppField>

					<div className="flex justify-end border-t border-border pt-3">
						<form.AppForm>
							<form.SubscribeButton label="Submit" />
						</form.AppForm>
					</div>
				</form>
			</div>
		</AdminShell>
	)
}
