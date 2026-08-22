// Pins for stableKeys — the noArrayIndexKey escape valve for fixed-count
// placeholder lists. If the shape of the generated keys changes, every
// skeleton/slider consumer silently re-keys and remounts.

import { describe, expect, it } from "vitest"
import { stableKeys } from "./react-keys"

describe("stableKeys", () => {
	it("builds count prefixed keys in order", () => {
		expect(stableKeys("row", 3)).toEqual(["row-0", "row-1", "row-2"])
	})

	it("returns an empty array for zero count", () => {
		expect(stableKeys("row", 0)).toEqual([])
	})

	it("keeps keys unique across different prefixes in one parent", () => {
		const a = stableKeys("skeleton", 2)
		const b = stableKeys("thumb", 2)
		expect(new Set([...a, ...b]).size).toBe(4)
	})
})
