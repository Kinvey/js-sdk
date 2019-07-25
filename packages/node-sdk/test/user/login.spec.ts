import { expect } from 'chai';
import nock from 'nock';
import { URL } from 'url';
import { formatKinveyBaasUrl, KinveyBaasNamespace } from '../../src/http';
import { loginWithUsernameAndPassword } from '../../src/identity';
import { getActiveUser } from '../../src/user';

describe('Login', function() {
  it('should login with correct username and password', async function() {
    const username = 'username';
    const password = 'password';
    const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'));
    const scope = nock(url.origin)
      .post(url.pathname, { username, password })
      .reply(200, { _id: '1', _kmd: { authtoken: 'authtoken' } });
    const user = await loginWithUsernameAndPassword(username, password);
    const activeUser = getActiveUser();
    expect(user).to.deep.equal(activeUser);
    expect(scope.isDone()).to.equal(true);
  });
});
