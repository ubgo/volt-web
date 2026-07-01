import { createFileRoute } from "@tanstack/react-router"
import { LayoutGrid } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { AdminShell, PageHeader } from "@/components/admin-shell"
import { seo } from "@/lib/seo"
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
import { NativeSelect } from "@/components/ui/native-select"
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

export const Route = createFileRoute("/demo/form/kitchen-sink")({
	component: KitchenSink,
	head: () => seo({ title: "Field showcase" }),
})

const FRAMEWORKS = [
	{ value: "react", label: "React" },
	{ value: "solid", label: "Solid" },
	{ value: "svelte", label: "Svelte" },
	{ value: "vue", label: "Vue" },
	{ value: "angular", label: "Angular" },
	{ value: "qwik", label: "Qwik" },
]

function KitchenSink() {
	const [select, setSelect] = useState("")
	const [combo, setCombo] = useState<string | null>(null)
	const [native, setNative] = useState("us")
	const [date, setDate] = useState<Date | undefined>(undefined)
	const [volume, setVolume] = useState(40)
	const [toggle, setToggle] = useState(true)

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<LayoutGrid />}
					title="Field showcase"
					subtitle="Every control type the UI kit ships, plus field states"
				/>

				<div className="space-y-6">
					<FormSection
						title="Text inputs"
						description="The Input primitive across HTML types"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<Field label="Text" htmlFor="f-text">
								<Input id="f-text" placeholder="Plain text" />
							</Field>
							<Field label="Email" htmlFor="f-email" hint="We never share it.">
								<Input id="f-email" type="email" placeholder="you@example.com" />
							</Field>
							<Field label="Password" htmlFor="f-pass">
								<Input id="f-pass" type="password" placeholder="••••••••" />
							</Field>
							<Field label="Number" htmlFor="f-num">
								<Input id="f-num" type="number" placeholder="0" />
							</Field>
							<Field label="URL" htmlFor="f-url">
								<Input id="f-url" type="url" placeholder="https://" />
							</Field>
							<Field label="Phone" htmlFor="f-tel">
								<Input id="f-tel" type="tel" placeholder="+1 555 000 1234" />
							</Field>
						</div>
						<Field label="Textarea" htmlFor="f-area" hint="Auto-grows with content.">
							<Textarea id="f-area" placeholder="Write something…" />
						</Field>
					</FormSection>

					<FormSection
						title="Selection"
						description="Single-select, searchable, and native variants"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<Field label="Select (Base UI)" hint="Styled popup select.">
								<Select value={select} onValueChange={(v) => setSelect(v ?? "")}>
									<SelectTrigger>
										<SelectValue placeholder="Pick a framework" />
									</SelectTrigger>
									<SelectPositioner>
										<SelectContent>
											{FRAMEWORKS.map((f) => (
												<SelectItem key={f.value} value={f.value}>
													{f.label}
												</SelectItem>
											))}
										</SelectContent>
									</SelectPositioner>
								</Select>
							</Field>
							<Field label="Combobox" hint="Type to filter options.">
								<Combobox
									items={FRAMEWORKS}
									value={combo}
									onValueChange={setCombo}
									placeholder="Search frameworks…"
								/>
							</Field>
							<Field label="Native select" hint="Plain styled <select>.">
								<NativeSelect
									value={native}
									onChange={(e) => setNative(e.target.value)}
								>
									<option value="us">United States</option>
									<option value="ca">Canada</option>
									<option value="uk">United Kingdom</option>
									<option value="de">Germany</option>
								</NativeSelect>
							</Field>
							<Field label="Date" hint="Calendar in a popover.">
								<DateField value={date} onChange={setDate} />
							</Field>
						</div>
					</FormSection>

					<FormSection title="Toggles & ranges">
						<SwitchRow
							label="Enable feature"
							description="A boolean toggle with a description."
						>
							<Switch checked={toggle} onCheckedChange={setToggle} />
						</SwitchRow>
						<Field label={`Volume — ${volume}%`}>
							<Slider
								value={[volume]}
								onValueChange={(v) =>
									setVolume(Array.isArray(v) ? (v[0] ?? 0) : v)
								}
								max={100}
								step={1}
							/>
						</Field>
					</FormSection>

					<FormSection
						title="States"
						description="Required, helper, error, and disabled"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<Field label="Required" htmlFor="f-req" required>
								<Input id="f-req" placeholder="Must be filled" />
							</Field>
							<Field
								label="With helper"
								htmlFor="f-help"
								hint="Helper text sits under the field."
							>
								<Input id="f-help" placeholder="Has a hint" />
							</Field>
							<Field
								label="With error"
								htmlFor="f-err"
								error="This field is required."
							>
								<Input
									id="f-err"
									aria-invalid
									defaultValue="bad value"
								/>
							</Field>
							<Field label="Disabled" htmlFor="f-dis">
								<Input id="f-dis" disabled placeholder="Can't edit" />
							</Field>
						</div>
					</FormSection>

					<FormActions>
						<Button variant="outline">Reset</Button>
						<Button onClick={() => toast.success("Submitted")}>Submit</Button>
					</FormActions>
				</div>
			</div>
		</AdminShell>
	)
}
