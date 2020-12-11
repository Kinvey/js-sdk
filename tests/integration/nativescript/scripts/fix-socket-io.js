module.exports = function () {
  const fs = require('fs');
  const path = require('path');
  fs.copyFileSync(path.join(__dirname, '..', 'socket.io.js'), path.join(__dirname, '..', '..', 'node_modules', '@nativescript', 'unit-test-runner', 'socket.io.js'));
};
