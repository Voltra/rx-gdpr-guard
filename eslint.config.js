/* eslint-disable @typescript-eslint/no-require-imports */

const eslint = require("@eslint/js");
const eslintPrettier = require("eslint-config-prettier");
const vitest = require("eslint-plugin-vitest");
const stylisticTs = require("@stylistic/eslint-plugin-ts");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
	{
		files: ["src/**/*.ts", "tests/**/*.ts", "*.config.js", "*.config.ts"],
		plugins: {
			"@stylistic/ts": stylisticTs,
		},
		extends: [
			eslint.configs.recommended,
			...tseslint.configs.strictTypeChecked,
			...tseslint.configs.stylisticTypeChecked,
			eslintPrettier,
		],
		languageOptions: {
			parserOptions: {
				// debugLevel: ['eslint', 'typescript-eslint', 'typescript'],
				project: "./tsconfig.eslint.json",
				tsconfigRootDir: __dirname,
				EXPERIMENTAL_useProjectService: false,
			},
		},
		rules: {
			"lines-around-comment": [
				"error",
				{
					beforeBlockComment: true,
					allowObjectStart: true,
					allowArrayStart: true,
				},
			],
			"lines-between-class-members": ["error", "always"],
			"no-trailing-spaces": "error",
			quotes: "error",
			"@typescript-eslint/no-unnecessary-qualifier": "error",
			"@typescript-eslint/prefer-as-const": "error",
		},
	},
	{
		files: ["**/*.js"],
		extends: [tseslint.configs.disableTypeChecked],
		rules: {
			"@typescript-eslint/no-var-requires": "off",
		},
	},
	{
		files: ["tests/**/*.test.ts"],
		plugins: {
			vitest,
		},
		rules: {
			...vitest.configs.recommended.rules,

			/*"vitest/assertion-type": ["error", {
				type: "jest",
			}],*/
			"vitest/consistent-test-it": [
				"error",
				{
					fn: "it",
				},
			],
			"vitest/expect-expect": [
				"error",
				{
					assertFunctionNames: ["expect*", "*Tests"],
					additionalTestBlockFunctions: ["describe", "*Tests"],
				},
			],
			"vitest/no-alias-methods": "error",
			"vitest/no-commented-out-tests": "off",
			"vitest/no-conditional-expect": "error",
			"vitest/no-conditional-in-test": "error",
			"vitest/no-conditional-tests": "error",
			"vitest/no-duplicate-hooks": "error",
			"vitest/no-focused-tests": "error",
			"vitest/no-identical-title": "error",
			"vitest/no-test-prefixes": "error",
			"vitest/prefer-each": "error",
			"vitest/prefer-expect-resolves": "error",
			"vitest/prefer-hooks-in-order": "error",
			"vitest/prefer-hooks-on-top": "error",
			"vitest/prefer-lowercase-title": "error",
			"vitest/prefer-mock-promise-shorthand": "error",
			"vitest/prefer-strict-equal": "error",
			"vitest/prefer-to-be-falsy": "error",
			"vitest/prefer-to-be-truthy": "error",
			"vitest/prefer-to-be": "error",
			"vitest/prefer-to-contain": "error",
			"vitest/prefer-to-have-length": "error",
			"vitest/prefer-todo": "error",
			"vitest/valid-describe-callback": "error",
			"vitest/valid-expect": [
				"error",
				{
					alwaysAwait: true,
				},
			],
		},
		settings: {
			vitest: {
				typecheck: true,
			},
		},
	},
);

/* eslint-enable @typescript-eslint/no-require-imports */
