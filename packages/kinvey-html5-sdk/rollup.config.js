const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const pkg = require('./package.json');

module.exports = [
  {
    entry: 'src/index.js',
    dest: pkg.browser,
    format: 'umd',
    moduleName: 'kinvey',
    plugins: [
      resolve(),
      commonjs()
    ]
  }
];
