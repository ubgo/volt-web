// Pins for the env-favicon detection: the whole point is telling prod tabs
// from stag tabs, so a mis-detection (stag shown as prod or vice versa) is a
// real operator hazard — every branch of the heuristic is pinned here.

import { describe, expect, it } from "vitest"
import {
	APP_ENVS,
	detectAppEnv,
	ENV_ICON_COLOR,
	envFaviconHref,
	isAppEnv,
} from "./app-env"

describe("detectAppEnv", () => {
	it("maps localhost shapes to local", () => {
		expect(detectAppEnv("localhost")).toBe("local")
		expect(detectAppEnv("volt.localhost")).toBe("local")
		expect(detectAppEnv("127.0.0.1")).toBe("local")
	})

	it("maps dev/stag hostname segments", () => {
		expect(detectAppEnv("volt-app-dev.example.app")).toBe("dev")
		expect(detectAppEnv("dev.volt.example.com")).toBe("dev")
		expect(detectAppEnv("volt-app-stag.example.app")).toBe("stag")
		expect(detectAppEnv("staging.volt.example.com")).toBe("stag")
	})

	it("does not substring-match env words inside real domains", () => {
		// "devonshire" contains dev, "stagram" contains stag — both are prod.
		expect(detectAppEnv("devonshire.com")).toBe("prod")
		expect(detectAppEnv("instagram-feeds.com")).toBe("prod")
	})

	it("defaults unknown real domains to prod (fail-safe: show the careful icon)", () => {
		expect(detectAppEnv("volt-app.example.app")).toBe("prod")
	})

	it("honors a VALID override and ignores an invalid one", () => {
		expect(detectAppEnv("volt-app.example.app", "stag")).toBe("stag")
		// Typo'd override falls through to hostname detection, never a 5th env.
		expect(detectAppEnv("volt.localhost", "production")).toBe("local")
	})

	it("isAppEnv accepts exactly the closed set", () => {
		for (const env of APP_ENVS) expect(isAppEnv(env)).toBe(true)
		expect(isAppEnv("production")).toBe(false)
		expect(isAppEnv("")).toBe(false)
	})
})

describe("favicon assets", () => {
	it("has a valid tint color for every env in the closed set", () => {
		for (const env of APP_ENVS) {
			expect(ENV_ICON_COLOR[env]).toMatch(/^#[0-9a-fA-F]{6}$/)
		}
	})

	it("prod keeps the shipped brand violet — the production tab never changes", () => {
		expect(ENV_ICON_COLOR.prod).toBe("#7C3AED")
	})

	it("maps every env to its static public/ asset path", () => {
		for (const env of APP_ENVS) {
			expect(envFaviconHref(env)).toBe(`/favicon-${env}.svg`)
		}
	})
})
