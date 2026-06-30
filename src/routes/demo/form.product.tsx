import { createFileRoute } from "@tanstack/react-router"
import { Package } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { AdminShell, PageHeader } from "@/components/admin-shell"
import {
	DateField,
	Field,
	FormActions,
	FormSection,
	SwitchRow,
} from "@/demo/form/form-kit"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectPositioner,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export const Route = createFileRoute("/demo/form/product")({
	component: ProductForm,
})

const BRANDS = [
	{ value: "acme", label: "Acme" },
	{ value: "globex", label: "Globex" },
	{ value: "initech", label: "Initech" },
	{ value: "umbrella", label: "Umbrella" },
	{ value: "wayne", label: "Wayne Enterprises" },
]

function ProductForm() {
	const [category, setCategory] = useState("")
	const [brand, setBrand] = useState<string | null>(null)
	const [launch, setLaunch] = useState<Date | undefined>(undefined)
	const [discount, setDiscount] = useState(0)
	const [published, setPublished] = useState(false)
	const [featured, setFeatured] = useState(false)

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<Package />}
					title="New product"
					subtitle="A multi-section create form with pricing, organization, and visibility"
					secondaryActions={
						<Button
							variant="outline"
							onClick={() => toast.success("Draft saved")}
						>
							Save draft
						</Button>
					}
					primaryAction={
						<Button onClick={() => toast.success("Product published")}>
							Publish
						</Button>
					}
				/>

				<div className="space-y-6">
					<FormSection title="Details">
						<Field label="Title" htmlFor="p-title" required>
							<Input id="p-title" placeholder="e.g. Aeron Chair" />
						</Field>
						<Field
							label="Slug"
							htmlFor="p-slug"
							hint="Lowercase, hyphenated. Used in the URL."
						>
							<Input id="p-slug" className="font-mono" placeholder="aeron-chair" />
						</Field>
						<Field label="Description" htmlFor="p-desc">
							<Textarea id="p-desc" rows={4} placeholder="Describe the product…" />
						</Field>
					</FormSection>

					<FormSection title="Pricing & stock">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<Field label="Price" htmlFor="p-price" required>
								<Input id="p-price" type="number" placeholder="0.00" />
							</Field>
							<Field label="Compare-at" htmlFor="p-compare">
								<Input id="p-compare" type="number" placeholder="0.00" />
							</Field>
							<Field label="Stock" htmlFor="p-stock">
								<Input id="p-stock" type="number" placeholder="0" />
							</Field>
						</div>
						<Field label={`Discount — ${discount}%`}>
							<Slider
								value={[discount]}
								onValueChange={(v) =>
									setDiscount(Array.isArray(v) ? (v[0] ?? 0) : v)
								}
								max={100}
								step={5}
							/>
						</Field>
					</FormSection>

					<FormSection title="Organization">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<Field label="Category">
								<Select
									value={category}
									onValueChange={(v) => setCategory(v ?? "")}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectPositioner>
										<SelectContent>
											<SelectItem value="furniture">Furniture</SelectItem>
											<SelectItem value="electronics">Electronics</SelectItem>
											<SelectItem value="apparel">Apparel</SelectItem>
											<SelectItem value="home">Home & garden</SelectItem>
										</SelectContent>
									</SelectPositioner>
								</Select>
							</Field>
							<Field label="Brand">
								<Combobox
									items={BRANDS}
									value={brand}
									onValueChange={setBrand}
									placeholder="Search brands…"
								/>
							</Field>
							<Field label="Tags" htmlFor="p-tags" hint="Comma-separated.">
								<Input id="p-tags" placeholder="ergonomic, office" />
							</Field>
							<Field label="Launch date">
								<DateField value={launch} onChange={setLaunch} />
							</Field>
						</div>
					</FormSection>

					<FormSection title="Visibility">
						<SwitchRow
							label="Published"
							description="Visible in the storefront when on."
						>
							<Switch checked={published} onCheckedChange={setPublished} />
						</SwitchRow>
						<SwitchRow
							label="Featured"
							description="Pin to the homepage collection."
						>
							<Switch checked={featured} onCheckedChange={setFeatured} />
						</SwitchRow>
					</FormSection>

					<FormActions>
						<Button
							variant="outline"
							onClick={() => toast.success("Draft saved")}
						>
							Save draft
						</Button>
						<Button onClick={() => toast.success("Product published")}>
							Publish
						</Button>
					</FormActions>
				</div>
			</div>
		</AdminShell>
	)
}
