const path = require("path");
const webpack = require("webpack");

const here = (uri = "") => path.resolve(__dirname, uri);

module.exports = (env, argv) => {
	const mode = argv.mode || "development";
	console.log("running webpack with mode:", mode);

	const config = {
		mode,

		entry: {
			rxGdprGuard: "./src/index.ts",
		},

		output: {
			filename: "[name].js",
			path: here("dist"),
			libraryTarget: "umd",
			library: "rxGdprGuard",
			umdNamedDefine: true,
			globalObject: "typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this",
		},

		resolve: {
			extensions: [".ts", ".tsx", ".js"],
		},

		module: {
			rules: [
				{
					test: /\.tsx?$/,
					loader: "ts-loader",
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
