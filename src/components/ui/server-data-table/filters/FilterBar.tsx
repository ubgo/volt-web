import { Button } from "@/components/ui/button"
import type { FilterCondition, FilterFieldDef, SearchConfig } from "../types"
import { FilterPicker } from "./FilterPicker"
import { FilterPill } from "./FilterPill"
import { SearchInput } from "./SearchInput"

type Props<TWhere> = {
	fields: FilterFieldDef<TWhere>[]
	conditions: FilterCondition[]
	search?: SearchConfig<TWhere>
	searchValue: string
	onSearchChange: (value: string) => void
	onAddFilter: (cond: FilterCondition) => void
	onUpdateFilter: (cond: FilterCondition) => void
	onRemoveFilter: (id: string) => void
	onClearFilters: () => void
	/** Right-side toolbar slot for the sort dropdown / view selector */
	rightSlot?: React.ReactNode
	/** Imperative open of the filter picker (for keyboard / column header) */
	pickerOpen?: boolean
	onPickerOpenChange?: (open: boolean) => void
	pickerInitialField?: string | null
	onPickerInitialFieldConsumed?: () => void
	/** Search input ref for keyboard `/` shortcut */
	searchInputRef?: React.Ref<HTMLInputElement>
}

export function FilterBar<TWhere>({
	fields,
	conditions,
	search,
	searchValue,
	onSearchChange,
	onAddFilter,
	onUpdateFilter,
	onRemoveFilter,
	onClearFilters,
	rightSlot,
	pickerOpen,
	onPickerOpenChange,
	pickerInitialField,
	onPickerInitialFieldConsumed,
	searchInputRef,
}: Props<TWhere>) {
	const hasFilters = conditions.length > 0

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center gap-1.5">
				{search && (
					<SearchInput
						value={searchValue}
						onChange={onSearchChange}
						placeholder={search.placeholder}
						inputRef={searchInputRef}
					/>
				)}

				{fields.length > 0 && (
					<FilterPicker
						fields={fields}
						onAdd={onAddFilter}
						open={pickerOpen}
						onOpenChange={onPickerOpenChange}
						initialField={pickerInitialField}
						onInitialFieldConsumed={onPickerInitialFieldConsumed}
					/>
				)}

				<div className="flex flex-1 flex-wrap items-center gap-1.5">
					{conditions.map((cond) => {
						const field = fields.find((f) => f.id === cond.fieldId)
						if (!field) return null
						return (
							<FilterPill
								key={cond.id}
								field={field}
								condition={cond}
								onUpdate={onUpdateFilter}
								onRemove={() => onRemoveFilter(cond.id)}
							/>
						)
					})}
					{hasFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClearFilters}
							className="text-muted-foreground hover:text-foreground h-6 px-1.5 text-[11px]"
						>
							Clear
						</Button>
					)}
				</div>

				{rightSlot && <div className="ml-auto">{rightSlot}</div>}
			</div>
		</div>
	)
}
