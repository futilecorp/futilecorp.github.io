// const paths = require('./paths');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ThreeMinifierPlugin = require("@yushijinhun/three-minifier-webpack");
const threeMinifier = new ThreeMinifierPlugin();

module.exports = {
	plugins: [
		threeMinifier,
		new HtmlWebpackPlugin()
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
};
