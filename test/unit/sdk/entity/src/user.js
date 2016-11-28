import { User } from 'src/entity';
import { randomString } from 'src/utils';
import Promise from 'es6-promise';
import nock from 'nock';

export default class User extends SDKUser {

  static loadActiveUser(client) {
    return super.loadActiveUser(client)
      .then((activeUser) => {
        if (isDefined(activeUser)) {
          return new User(activeUser.data, { client: client });
        }

        return activeUser;
      });
  }

  static getActiveUser(client) {
    const activeUser = super.getActiveUser(client);

    if (activeUser) {
      return new User(activeUser.data);
    }

    return Promise.resolve(null);
  }

  login(username, password, options) {
    const reply = {
      _id: randomString(),
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString(),
        authtoken: randomString()
      },
      username: username,
      _acl: {
        creator: randomString()
      }
    };

    // Setup nock response
    nock(this.client.apiHostname, { encodedQueryParams: true })
      .post(`${this.pathname}/login`, { username: username, password: password })
      .reply(200, reply, {
        'content-type': 'application/json; charset=utf-8'
      });

    // Login
    return super.login(username, password, options);
  }

  logout(options) {
    // Setup nock response
    nock(this.client.apiHostname, { encodedQueryParams: true })
      .post(`${this.pathname}/_logout`)
      .reply(204, '', {});

    // Logout
    return super.logout(options);
  }

  me(options) {
    const reply = {
      _id: randomString(),
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString(),
        authtoken: randomString()
      },
      _acl: {
        creator: randomString()
      }
    };

    // Setup nock response
    nock(this.client.apiHostname, { encodedQueryParams: true })
      .get(`${this.pathname}/_me`)
      .reply(200, reply, {
        'content-type': 'application/json; charset=utf-8'
      });

    return super.me(options);
  }
}
