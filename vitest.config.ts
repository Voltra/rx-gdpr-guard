// @ts-expect-error TS1479
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// @ts-expect-error TS1470
const here = (uri = "") => fileURLToPath(new URL(uri, import.meta.url));

export default defineConfig({
	clearScreen: true,
	test: {
		include: ['./tests/**/*.{test,spec}.ts'],
		includeSource: ['./src/**/*.ts'],
		open: false,
		restoreMocks: true,
		unstubEnvs: true,
		unstubGlobals: true,
		typecheck: {
			enabled: true,
			tsconfig: "./tsconfig.tests.json",
		},
		// isolate: false,
	},
	resolve: {
		alias: {
			"@": here("./src"),
			"@tests": here("./tests"),
		},
	},
});
