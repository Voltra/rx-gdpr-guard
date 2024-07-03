/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const prettierConfig = {
	useTabs: true,
	tabWidth: 4,
	endOfLine: "lf",
	trailingComma: "all",
	arrowParens: "avoid",
	editorconfig: true,
	singleQuote: false,
	semi: true,
	printWidth: 80,
	experimentalTernaries: false,
};

module.exports = prettierConfig;
