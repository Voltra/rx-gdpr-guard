/* eslint-env node */

module.exports = {
	presets: [
		[
			"@babel/preset-typescript",
			{
				onlyRemoveTypeImports: true,
				optimizeConstEnums: true,
				rewriteImportExtensions: true,
			},
		],
		[
			"@babel/preset-env",
			{
				useBuiltIns: "usage", // polyfills on use
				corejs: 3, // use core-js@3
			},
		],
	],
	plugins: [
		"@babel/plugin-transform-typescript",
		// "@babel/plugin-transform-class-properties",
	],
};
