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


function deleteEntitiesOneByOne(entityPath, items) {
  return Promise.all(items.map(item => {
    return new Promise(resolve => 
      setTimeout(() =>  {
        return axios({
          method: 'DELETE',
          url: `/${entityPath}/${item.id}`,
        })
        .then(resolve)
        .catch((err) => console.error(err.message));
      }, 500 * items.indexOf(item)));
  }));
}

function getApps() {
  return axios({
    method: 'GET',
    url: '/apps',
  }).then(({ data }) => {
    return data.filter(app => app.name.startsWith(`JSSDK-${target}`) && app.organizationId === process.env.TEST_ORG_ID);
  }).catch((err) => {
    console.error(err.response.data);
  });
}

function getAuthServices() {
  return axios({
    method: 'GET',
    url: '/auth-services',
  }).then(({ data }) => {
    return data.filter(i => i.name.startsWith(`JSSDK-${target}`));
  }).catch((err) => {
    console.error(err.response.data);
  });
}

function getIdentityStores() {
  return axios({
    method: 'GET',
    url: '/identity-stores',
  }).then(({ data }) => {
    return data.filter(i => i.name.startsWith(`JSSDK-${target}`));
  }).catch((err) => {
    console.error(err.response.data);
  });
}


async.waterfall([
  callbackify(login),
  callbackify(getApps),
  callbackify(async.apply(deleteEntitiesOneByOne, 'apps')),
  callbackify(getAuthServices),
  callbackify(async.apply(deleteEntitiesOneByOne, 'auth-services')),
  callbackify(getIdentityStores),
  callbackify(async.apply(deleteEntitiesOneByOne, 'identity-stores'))
]);
