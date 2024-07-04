const eslint = require("@eslint/js");
const eslintPrettier = require("eslint-config-prettier");
const stylisticTs = require("@stylistic/eslint-plugin-ts");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
	{
		files: [
			"src/**/*.ts",
			"tests/**/*.ts",
			"*.config.js",
			"*.config.ts",
		],
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
			"lines-around-comment": ["error", {
				"beforeBlockComment": true,
				"allowObjectStart": true,
				"allowArrayStart": true,
			}],
			"quotes": "error",
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
);
