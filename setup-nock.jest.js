const { upgradeJasmine } = require('jest-nock');

if (process.env.CI) {
  global.it.nock = global.it;
  global.beforeAll.nock = global.beforeAll;
  global.afterAll.nock = global.afterAll;
} else {
  upgradeJasmine(jasmine, global);
}
