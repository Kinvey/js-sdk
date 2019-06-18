import { expect } from 'chai';
import nock from 'nock';
import { init } from '../../src/init';
import { formatKinveyBaasUrl, KinveyBaasNamespace } from '../../src/http';
import { login, getActiveUser } from '../../src/user';
import { register as registerHttp } from '../http';

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
