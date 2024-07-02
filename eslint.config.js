const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
	{
		files: ['src/**/*.ts', 'tests/**/*.ts'],
		extends: [
			eslint.configs.recommended,
			...tseslint.configs.strictTypeChecked,
			...tseslint.configs.stylisticTypeChecked,
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
