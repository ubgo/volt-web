import { createFileRoute } from "@tanstack/react-router"
import {
	Bold,
	Boxes,
	Info,
	Italic,
	LayoutGrid,
	Search,
	TriangleAlert,
	Underline,
} from "lucide-react"
import { useState } from "react"
import { AdminShell, PageHeader } from "@/components/admin-shell"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import {
	HoverCard,
	HoverCardContent,
	HoverCardPositioner,
	HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
	Tooltip,
	TooltipContent,
	TooltipPositioner,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { FormSection } from "@/demo/form/form-kit"
import { stableKeys } from "@/lib/react-keys"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/demo/components")({
	component: ComponentsGallery,
	head: () => seo({ title: "Components" }),
})

function ComponentsGallery() {
	const [cmdOpen, setCmdOpen] = useState(false)

	return (
		<AdminShell>
			<div className="px-6 py-6 max-w-3xl">
				<PageHeader
					icon={<LayoutGrid />}
					title="Components"
					subtitle="The basecn (Base UI) components in this kit — light + dark ready"
				/>

				<div className="space-y-6">
					<FormSection title="Selection controls">
						<div className="flex items-center gap-2">
							<Checkbox id="c-1" defaultChecked />
							<Label htmlFor="c-1">Accept terms</Label>
						</div>
						<RadioGroup
							defaultValue="comfortable"
							className="flex flex-col gap-2"
						>
							<div className="flex items-center gap-2">
								<RadioGroupItem value="default" id="r-1" />
								<Label htmlFor="r-1">Default</Label>
							</div>
							<div className="flex items-center gap-2">
								<RadioGroupItem value="comfortable" id="r-2" />
								<Label htmlFor="r-2">Comfortable</Label>
							</div>
						</RadioGroup>
						<div className="flex items-center gap-2">
							<Toggle aria-label="Italic">
								<Italic className="size-3.5" />
							</Toggle>
							<ToggleGroup defaultValue={["bold"]}>
								<ToggleGroupItem value="bold" aria-label="Bold">
									<Bold className="size-3.5" />
								</ToggleGroupItem>
								<ToggleGroupItem value="italic" aria-label="Italic">
									<Italic className="size-3.5" />
								</ToggleGroupItem>
								<ToggleGroupItem value="underline" aria-label="Underline">
									<Underline className="size-3.5" />
								</ToggleGroupItem>
							</ToggleGroup>
						</div>
					</FormSection>

					<FormSection title="Disclosure">
						<Tabs defaultValue="overview">
							<TabsList>
								<TabsTrigger value="overview">Overview</TabsTrigger>
								<TabsTrigger value="activity">Activity</TabsTrigger>
							</TabsList>
							<TabsContent
								value="overview"
								className="text-[13px] text-muted-foreground pt-2"
							>
								Tabbed content — overview panel.
							</TabsContent>
							<TabsContent
								value="activity"
								className="text-[13px] text-muted-foreground pt-2"
							>
								Tabbed content — activity panel.
							</TabsContent>
						</Tabs>
						<Accordion>
							<AccordionItem value="a-1">
								<AccordionTrigger>What is this?</AccordionTrigger>
								<AccordionContent>
									An accordion item body, from basecn.
								</AccordionContent>
							</AccordionItem>
							<AccordionItem value="a-2">
								<AccordionTrigger>Is it accessible?</AccordionTrigger>
								<AccordionContent>Yes — Base UI handles a11y.</AccordionContent>
							</AccordionItem>
						</Accordion>
						<Collapsible className="space-y-2">
							<CollapsibleTrigger
								render={
									<Button variant="outline" size="sm">
										Toggle details
									</Button>
								}
							/>
							<CollapsibleContent className="text-[13px] text-muted-foreground">
								Hidden content revealed by the collapsible.
							</CollapsibleContent>
						</Collapsible>
					</FormSection>

					<FormSection title="Overlays">
						<div className="flex flex-wrap items-center gap-2">
							<Tooltip>
								<TooltipTrigger
									render={
										<Button variant="outline" size="sm">
											Hover for tooltip
										</Button>
									}
								/>
								<TooltipPositioner>
									<TooltipContent>A helpful hint</TooltipContent>
								</TooltipPositioner>
							</Tooltip>

							<HoverCard>
								<HoverCardTrigger
									render={
										<Button variant="outline" size="sm">
											Hover card
										</Button>
									}
								/>
								<HoverCardPositioner>
									<HoverCardContent className="text-[13px]">
										Rich preview content on hover.
									</HoverCardContent>
								</HoverCardPositioner>
							</HoverCard>

							<Sheet>
								<SheetTrigger
									render={
										<Button variant="outline" size="sm">
											Open sheet
										</Button>
									}
								/>
								<SheetContent>
									<SheetHeader>
										<SheetTitle>Side sheet</SheetTitle>
										<SheetDescription>
											A slide-in panel for details or forms.
										</SheetDescription>
									</SheetHeader>
								</SheetContent>
							</Sheet>

							<Button
								variant="outline"
								size="sm"
								onClick={() => setCmdOpen(true)}
							>
								<Search className="size-3.5" />
								Command (⌘K)
							</Button>
							<CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
								<CommandInput placeholder="Type a command…" />
								<CommandList>
									<CommandEmpty>No results.</CommandEmpty>
									<CommandGroup heading="Suggestions">
										<CommandItem>
											<Boxes className="size-3.5" />
											Dashboard
										</CommandItem>
										<CommandItem>
											<Search className="size-3.5" />
											Search
										</CommandItem>
									</CommandGroup>
								</CommandList>
							</CommandDialog>
						</div>
					</FormSection>

					<FormSection title="Feedback">
						<Alert>
							<Info />
							<AlertTitle>Heads up</AlertTitle>
							<AlertDescription>
								An informational alert using the token palette.
							</AlertDescription>
						</Alert>
						<Alert variant="destructive">
							<TriangleAlert />
							<AlertTitle>Something failed</AlertTitle>
							<AlertDescription>A destructive alert variant.</AlertDescription>
						</Alert>
						<div className="space-y-1.5">
							<Label>Progress — 60%</Label>
							<Progress value={60} />
						</div>
					</FormSection>

					<FormSection title="Display & navigation">
						<div className="flex items-center gap-3">
							<Avatar>
								<AvatarImage src="https://github.com/shadcn.png" alt="@user" />
								<AvatarFallback>DU</AvatarFallback>
							</Avatar>
							<Avatar>
								<AvatarFallback>AB</AvatarFallback>
							</Avatar>
						</div>
						<Separator />
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink href="#">Home</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbLink href="#">Components</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>Gallery</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
						<div>
							<Label className="mb-1.5 block">Scroll area</Label>
							<ScrollArea className="h-28 rounded-md border border-border p-3">
								<div className="space-y-2 text-[13px] text-muted-foreground">
									{stableKeys("scroll-demo-row", 12).map((key, i) => (
										<div key={key}>Scrollable row {i + 1}</div>
									))}
								</div>
							</ScrollArea>
						</div>
					</FormSection>
				</div>
			</div>
		</AdminShell>
	)
}
