/* eslint-disable */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

try {
  // Copy package.json files
  fs.copySync(path.join(__dirname, '../package.json'), path.join(__dirname, '../dist/package.json'));

  // Copy LICENSE files
  fs.copySync(path.join(__dirname, '../LICENSE'), path.join(__dirname, '../dist/LICENSE'));
}
catch (error) {
  console.error(error);
  process.exit(1);
}
