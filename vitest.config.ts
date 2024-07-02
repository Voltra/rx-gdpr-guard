// @ts-expect-error TS1479 This file is meant as a standalone and thus can use ES6 syntax
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// @ts-expect-error TS1470 This file is meant as a standalone and thus can use ES6 syntax
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
