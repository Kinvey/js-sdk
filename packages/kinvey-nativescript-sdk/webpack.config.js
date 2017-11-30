const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const path = require('path');
const fs = require('fs');
const pkg = require('./package.json');

module.exports = {
  entry: {
    'secure/secure.ios': './src/secure/secure.ios.ts',
    'secure/secure.android': './src/secure/secure.android.ts'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist',
    libraryTarget: 'umd'
  },
  externals: {
    'utils/utils': 'utils/utils'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: { transpileOnly: true }
          }
        ]
      },
      { test: /\.json$/, use: 'json-loader' }
    ]
  },
  plugins: [
    // new UglifyJSPlugin({
    //   sourceMap: true,
    //   uglifyOptions: {
    //     output: {
    //       comments: false
    //     }
    //   }
    // })
  ]
}
