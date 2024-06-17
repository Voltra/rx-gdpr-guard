import { defineConfig } from "vitest/config";

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
		},
		// isolate: false,
	},
});
