const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintPrettier = require("eslint-config-prettier");

module.exports = tseslint.config(
	{
		files: ['src/**/*.ts', 'tests/**/*.ts'],
		extends: [
			eslint.configs.recommended,
			...tseslint.configs.strictTypeChecked,
			...tseslint.configs.stylisticTypeChecked,
			eslintPrettier,
		],
		languageOptions: {
			parserOptions: {
				// debugLevel: ['eslint', 'typescript-eslint', 'typescript'],
				project: './tsconfig.eslint.json',
				tsconfigRootDir: __dirname,
				EXPERIMENTAL_useProjectService: false,
			},
		}
	}
);
