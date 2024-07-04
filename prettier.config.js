/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {Partial<import("prettier").Config>}
 */
const prettierConfig = {
	// editorconfig: true,
	useTabs: true,
	tabWidth: 4,
	endOfLine: "lf",
	trailingComma: "all",
	arrowParens: "avoid",
	singleQuote: false,
	semi: true,
	printWidth: 80,
	experimentalTernaries: false,
};

module.exports = prettierConfig;
