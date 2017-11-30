const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const path = require('path');
const fs = require('fs');
const pkg = require('./package.json');

module.exports = (env) => {
  const platform = getPlatform(env);
  const extensions = getExtensions(platform);

  const config = {
    entry: {},
    output: {
      filename: '[name].js',
      path: __dirname + '/dist',
      libraryTarget: 'umd',
      library: 'Kinvey'
    },
    externals: {
      'globals': 'globals',
      'nativescript-push-notifications': 'nativescript-push-notifications',
      'nativescript-sqlite': 'nativescript-sqlite',
      'tns-core-modules/application': 'application',
      'tns-core-modules/http': 'http',
      'tns-core-modules/file-system': 'file-system',
      'tns-core-modules/ui/frame': 'ui/frame',
      'tns-core-modules/ui/page': 'ui/page',
      'tns-core-modules/ui/layouts/grid-layout': 'ui/layouts/grid-layout',
      'tns-core-modules/ui/layouts/stack-layout': 'ui/layouts/stack-layout',
      'tns-core-modules/ui/web-view': 'tns-core-modules/ui/web-view',
      'tns-core-modules/platform': 'platform',
      'tns-core-modules/utils/utils': 'utils/utils'
    },
    resolve: {
      extensions: extensions
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
      new UglifyJSPlugin({
        sourceMap: true,
        uglifyOptions: {
          output: {
            comments: false
          }
        }
      }),
      new webpack.BannerPlugin({
        banner: `
/**
 * ${pkg.name} - ${pkg.description}
 * @version v${pkg.version}
 * @author ${pkg.author}
 * @link ${pkg.homepage}
 * @license ${pkg.license}
 */
      `.trim(),
        raw: true,
        entryOnly: true
      })
    ]
  };
  config.entry[`kinvey-nativescript-sdk.${platform}.min`] = './src/index.ts';
  return config;
};

function getPlatform(env) {
  if (env) {
    if (env.android) return 'android';
    if (env.ios) return 'ios';
  }

  throw new Error('You need to provide a target platform!');
}

function getExtensions(platform) {
  return Object.freeze([
    `.${platform}.ts`,
    `.${platform}.js`,
    '.ts',
    '.js'
  ]);
}
