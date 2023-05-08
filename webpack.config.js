// const paths = require('./paths');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ThreeMinifierPlugin = require("@yushijinhun/three-minifier-webpack");
const threeMinifier = new ThreeMinifierPlugin();

module.exports = {
	plugins: [
		threeMinifier,
		new HtmlWebpackPlugin({
			publicPath: "/"
		})
	],
	resolve: {
		plugins: [
			threeMinifier.resolver
		]
	},
	output: {
		clean: true
		// publicPath: 'public' // copy over assets from this directory
	},
	optimization: {
		splitChunks: {
			chunks: 'all',
		},
	},
	devServer: {
		headers: {
			'Cache-Control': 'no-store',
		},
		proxy: {
			'/style.css':
			{
				target: 'http://127.0.0.1:4000',
				// target: 'https://futilecorp.github.io',
				// secure: false,
				// changeOrigin: true
			},
			'/about':
			{
				target: 'http://127.0.0.1:4000',
			}
		}
	}
};
