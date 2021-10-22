const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const async = require('async');
const argv = require('yargs').argv;
const { callbackify } = require('util');
const { login } = require('./shared');

let target = argv.target;
if (process.env.CIRRUS_BRANCH) {
  target += `-${process.env.CIRRUS_BRANCH}`;
} else {
  target += `-${os.hostname()}`;
}

const dotenvPath = path.join(__dirname, '.env');

function updateDotEnv() {
  let env = '';

  if (fs.existsSync(dotenvPath)) {
    env = fs.readFileSync(dotenvPath, { encoding: 'utf-8' });
  }

  envLines = env.split('\n').slice(0, 8);
  envLines.push(`APP_KEY=${process.env.APP_KEY}`);
  envLines.push(`APP_SECRET=${process.env.APP_SECRET}`);
  envLines.push(`MASTER_SECRET=${process.env.MASTER_SECRET}`);
  envLines.push(`AUTH_SERVICE_ID=${process.env.AUTH_SERVICE_ID}`);
  envLines.push(`NO_REFRESH_AUTH_SERVICE_ID=${process.env.NO_REFRESH_AUTH_SERVICE_ID}`);
  envLines.push(`WRONG_AUTH_SERVICE_ID=${process.env.WRONG_AUTH_SERVICE_ID}`);
  envLines.push(`OFFLINE_STORAGE=${process.env.OFFLINE_STORAGE}`);
  envLines.push('');

  fs.writeFileSync(dotenvPath, envLines.join('\n'));
}

function createApp() {
  return axios({
    method: 'POST',
    url: '/apps',
    data: {
      name: `JSSDK-${target}-${new Date().getTime()}`,
      organizationId: process.env.TEST_ORG_ID,
      realtime: { enabled: true }
    }
  }).then(({ data }) => {
    const { id, appSecret, masterSecret } = data.environments[0];
    process.env.APP_KEY = id;
    process.env.APP_SECRET = appSecret;
    process.env.MASTER_SECRET = masterSecret;
  }).catch((err) => {
    console.error(err.response.data);
    throw new Error('...');
  });
}

function createTestEndpoint() {
  return axios({
    method: 'POST',
    url: `/environments/${process.env.APP_KEY}/business-logic/endpoints`,
    data: {
      name: 'testEndpoint',
      code: 'function onRequest(request, response, modules) {\n  response.body = { property1: "value1", property2: "value2" };\n  response.complete();\n}',
    }
  }).catch((err) => {
    console.error(err.response.data);
    throw new Error('...');
  });
}

function createTestEndpointReturnsArgs() {
  return axios({
    method: 'POST',
    url: `/environments/${process.env.APP_KEY}/business-logic/endpoints`,
    data: {
      name: 'testEndpointReturnsArgs',
      code: 'function onRequest(request, response, modules) {\n  response.body = request.body;\n  response.complete();\n}',
    }
  }).catch((err) => {
    console.error(err.response.data);
    throw new Error('...');
  });
}

function createDeltaCollection(name) {
  return axios({
    method: 'POST',
    url: `/environments/${process.env.APP_KEY}/collections`,
    data: {
      name,
      deltaSet: {enabled: true, deletedTTLInDays: 15},
    }
  }).catch((err) => {
    console.error(err.response.data);
    throw new Error('...');
  });
}

function createIdStore(name) {
  return axios({
    method: 'POST',
    url: `/identity-stores`,
    data: {
      name: `JSSDK-${target}-${name} Store`,
      access: {
        writers: {
          organizations: [process.env.TEST_ORG_ID]
        }
      },
    }
  }).then(({ data }) => {
    return data.id;
  }).catch((err) => {
    console.error(err.response.data);
    throw new Error('...');
  });
}

function createAuth(identityStoreId, name, refresh, wrongConfig=false) {
  const data = {
    name: `JSSDK-${target}-${name}-${new Date().getTime()}`,
    redirectUri: ['http://localhost:9876/callback'],
    grantTtl: 10,
    tokenTtl: 3600,
    refresh: refresh,
    refreshTtl: 1209600,
    provider: {
      datalinkHeaderMapping: {
        client_token: 'X-Kinvey-Auth'
      },
      allowedAttributes: ['id', 'audience'],
      type:'facebook',
      options: {
        clientId: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
      }
    },
    identityStoreId
  };

  if (wrongConfig) {
    data.provider.options.userIdAttribute = 'adminbob';
  }

  return axios({
    method: 'POST',
    url: `/auth-services`,
    data
  }).catch((err) => {
    console.error(err.response.data);
    throw new Error('...');
  });
}

function setDefaultAuth(identityStoreId) {
  return axios({
    method: 'PUT',
    url: `/environments/${process.env.APP_KEY}`,
    data: {
      name: "Development",
      apiVersion: 3,
      appSecret: process.env.APP_SECRET,
      defaultAuthServiceId: process.env.AUTH_SERVICE_ID,
      emailVerification: {
        required: false,
        auto: false
      },
      identityStoreId,
      masterSecret: process.env.MASTER_SECRET,
    }
  }).catch((err) => {
    console.error(err.response.data);
    throw new Error('...');
  });
}

async.waterfall([
  callbackify(login),
  callbackify(createApp),
  callbackify(createTestEndpoint),
  callbackify(createTestEndpointReturnsArgs),
  callbackify(() => createDeltaCollection('BooksDelta')),
  callbackify(() => createDeltaCollection('NewsDelta')),
  callbackify(() => createIdStore()),
  callbackify((identityStoreId) => createAuth(identityStoreId, 'FBAuth', true)
    .then(({ data }) => { process.env.AUTH_SERVICE_ID = data.id; })
    .then(() => setDefaultAuth(identityStoreId))),
  callbackify(() => createIdStore()),
  callbackify((identityStoreId) => createAuth(identityStoreId, 'FBAuthNoRefresh', false)
    .then(({ data }) => { process.env.NO_REFRESH_AUTH_SERVICE_ID = data.id; })),
  callbackify(() => createIdStore()),
  callbackify((identityStoreId) => createAuth(identityStoreId, 'FBAuthWrongConfig', true, true)
    .then(({ data }) => { process.env.WRONG_AUTH_SERVICE_ID = data.id; })),
], () => updateDotEnv());
