import { fileURLToPath, URL } from "node:url"
import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"

const config = defineConfig({
	// allowedHosts: vite blocks unknown Host headers by default (DNS-rebinding
	// protection). When the dev server is fronted by a reverse-proxy vhost
	// (portless custom domain, a remote dev box's public Caddy host), set
	// VITE_ALLOWED_HOSTS to a comma-separated hostname list in .env; unset =
	// vite's safe default, zero behavior change.
	server: {
		allowedHosts: process.env.VITE_ALLOWED_HOSTS
			? process.env.VITE_ALLOWED_HOSTS.split(",")
			: [],
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	nitro: {
		rollupConfig: {
			external: [
				/^@sentry\//,
				/^@opentelemetry\//,
				/^@prisma\/instrumentation/,
			],
		},
	},
	plugins: [
		devtools(),
		nitro(),
		tailwindcss(),
		tanstackStart({
			spa: {
				enabled: true,
			},
		}),
		viteReact(),
		// React Compiler — plugin-react v6 is oxc-based and no longer takes a
		// `babel` option, so the compiler now runs as a separate rolldown babel
		// pass via the exported preset (see plugin-react v6 docs).
		babel({ presets: [reactCompilerPreset()] }),
	],
})

export default config
