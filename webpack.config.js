const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const WebpackBarPlugin = require("webpackbar");
const FriendlyErrorsPlugin = require("@nuxt/friendly-errors-webpack-plugin");

const here = (uri = "") => path.resolve(__dirname, uri);

/**
 * @param {import("webpack-cli").Env} env
 * @param {import("webpack-cli").Argv} argv
 * @returns {import("webpack-cli").WebpackConfiguration}
 */
module.exports = (env, argv) => {
	const mode = argv.mode || "development";
	console.log("running webpack with mode:", mode);

	/**
	 * @type {import("webpack-cli").WebpackConfiguration}}
	 */
	const config = {
		mode,

		context: here(),

		entry: {
			rxGdprGuard: "./src/index.ts",
		},

		optimization: {
			nodeEnv: "production",
			usedExports: true, // tree-shaking
			splitChunks: false, // optimize for speed since we don't use code-splitting
			removeAvailableModules: false, // optimize for speed since we don't use code-splitting
			removeEmptyChunks: false, // optimize for speed since we don't use code-splitting
			minimizer: [new TerserPlugin()],
		},
		performance: {
			hints: false,
		},
		stats: "minimal",

		output: {
			filename: "[name].js",
			path: here("dist/umd/"),
			clean: true,
			pathinfo: false,
			environment: {
				arrowFunction: false,
			},
			libraryTarget: "umd",
			library: "rxGdprGuard",
			umdNamedDefine: true,
			globalObject: "typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this",
		},

		resolve: {
			extensions: [".ts", ".tsx", ".js"],
		},

		plugins: [
			new WebpackBarPlugin(),
			new FriendlyErrorsPlugin({}), //cf. https://github.com/geowarin/friendly-errors-webpack-plugin/issues/123
		],

		module: {
			rules: [
				{
					test: /\.js$/,
					use: [
						"babel-loader",
					],
					exclude: /node_modules/,
				},
				{
					test: /\.ts$/,
					use: [
						"babel-loader",
						"ts-loader",
					],
					exclude: /node_modules/,
				},
			],
		},
	};

	if (mode === "development") {
		config.devtool = "inline-source-map";
	} else {
		config.devtool = "source-map";
	}

	return config;
};
