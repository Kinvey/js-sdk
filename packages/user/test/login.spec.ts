/* eslint spaced-comment: "off" */
/* eslint func-names: "off" */
/* eslint no-undef: "off" */
/* eslint @typescript-eslint/explicit-function-return-type: "off" */
/* eslint import/no-extraneous-dependencies: "off" */

/// <reference types="mocha" />

import { expect } from 'chai';
import nock from 'nock';
import { init } from '@kinveysdk/app';
import { formatKinveyBaasUrl, KinveyBaasNamespace } from '@kinveysdk/http';
import { register as registerHttp } from '@kinveysdk/http-node';
import { login } from '../src/login';
import { getActiveUser } from '../src/getActiveUser';

describe('Login', function () {
  const appKey = 'appKey';
  const appSecret = 'appSecret';

  before(function () {
    registerHttp();
  });

  before(function () {
    init({
      appKey,
      appSecret
    });
  });

  it('should login with correct username and password', async function() {
    const username = 'username';
    const password = 'password';
    const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'));
    const scope = nock(url.origin)
      .post(url.pathname, { username, password })
      .reply(200, { _id: '1', _kmd: { authtoken: 'authtoken' }});
    const user = await login(username, password);
    const activeUser = getActiveUser();
    expect(user).to.deep.equal(activeUser);
    expect(scope.isDone()).to.equal(true);
  });
});
