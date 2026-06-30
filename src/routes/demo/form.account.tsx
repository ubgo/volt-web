import { createFileRoute } from "@tanstack/react-router"
import { UserCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { AdminShell, PageHeader } from "@/components/admin-shell"
import {
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

export const Route = createFileRoute("/demo/form/account")({
	component: AccountForm,
})

const LANGUAGES = [
	{ value: "en", label: "English" },
	{ value: "es", label: "Spanish" },
	{ value: "fr", label: "French" },
	{ value: "de", label: "German" },
	{ value: "ja", label: "Japanese" },
	{ value: "hi", label: "Hindi" },
]

function AccountForm() {
	const [role, setRole] = useState("member")
	const [language, setLanguage] = useState<string | null>("en")
	const [timezone, setTimezone] = useState("utc")
	const [emailNotif, setEmailNotif] = useState(true)
	const [pushNotif, setPushNotif] = useState(false)
	const [digest, setDigest] = useState(2)

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<UserCircle />}
					title="Account"
					subtitle="A realistic profile + preferences form"
					primaryAction={
						<Button onClick={() => toast.success("Account saved")}>
							Save changes
						</Button>
					}
				/>

				<div className="space-y-6">
					<FormSection title="Profile">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<Field label="First name" htmlFor="a-first" required>
								<Input id="a-first" defaultValue="Ada" />
							</Field>
							<Field label="Last name" htmlFor="a-last" required>
								<Input id="a-last" defaultValue="Lovelace" />
							</Field>
						</div>
						<Field label="Email" htmlFor="a-email" hint="Used for sign-in and receipts.">
							<Input id="a-email" type="email" defaultValue="ada@example.com" />
						</Field>
						<Field label="Bio" htmlFor="a-bio" hint="Max 280 characters.">
							<Textarea id="a-bio" placeholder="Tell us about yourself…" />
						</Field>
						<Field label="Website" htmlFor="a-web">
							<Input id="a-web" type="url" placeholder="https://" />
						</Field>
					</FormSection>

					<FormSection title="Preferences">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<Field label="Role">
								<Select value={role} onValueChange={(v) => setRole(v ?? "")}>
									<SelectTrigger>
										<SelectValue placeholder="Select role" />
									</SelectTrigger>
									<SelectPositioner>
										<SelectContent>
											<SelectItem value="owner">Owner</SelectItem>
											<SelectItem value="admin">Admin</SelectItem>
											<SelectItem value="member">Member</SelectItem>
											<SelectItem value="viewer">Viewer</SelectItem>
										</SelectContent>
									</SelectPositioner>
								</Select>
							</Field>
							<Field label="Language">
								<Combobox
									items={LANGUAGES}
									value={language}
									onValueChange={setLanguage}
									placeholder="Search languages…"
								/>
							</Field>
							<Field label="Timezone">
								<NativeSelect
									value={timezone}
									onChange={(e) => setTimezone(e.target.value)}
								>
									<option value="utc">UTC</option>
									<option value="est">America/New_York</option>
									<option value="pst">America/Los_Angeles</option>
									<option value="cet">Europe/Berlin</option>
									<option value="ist">Asia/Kolkata</option>
								</NativeSelect>
							</Field>
						</div>
					</FormSection>

					<FormSection title="Notifications">
						<SwitchRow
							label="Email notifications"
							description="Product updates and security alerts."
						>
							<Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
						</SwitchRow>
						<SwitchRow
							label="Push notifications"
							description="Real-time alerts on your devices."
						>
							<Switch checked={pushNotif} onCheckedChange={setPushNotif} />
						</SwitchRow>
						<Field label={`Weekly digest — ${digest}× per week`}>
							<Slider
								value={[digest]}
								onValueChange={(v) =>
									setDigest(Array.isArray(v) ? (v[0] ?? 0) : v)
								}
								max={7}
								step={1}
							/>
						</Field>
					</FormSection>

					<FormActions>
						<Button variant="outline">Cancel</Button>
						<Button onClick={() => toast.success("Account saved")}>
							Save changes
						</Button>
					</FormActions>
				</div>
			</div>
		</AdminShell>
	)
}
