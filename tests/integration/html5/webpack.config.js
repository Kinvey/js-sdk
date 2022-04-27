const webpack = require('webpack');

module.exports = {
  // Source maps support ('inline-source-map' also works)
  devtool: 'source-map',
	mode: "development",
	optimization: {
		minimize: false
	},
  resolve: {
    fallback: {
        buffer: require.resolve('buffer/'),
    },
  },
  plugins: [
      new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
      }),
  ],
  stats: {
    errorDetails: true,
  },
};
