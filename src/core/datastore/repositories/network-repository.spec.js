import nock from 'nock';
import expect from 'expect';
import { NetworkRack } from '../../request/rack';
import { randomString } from '../../utils';
import { init } from '../../kinvey';
import { User } from '../../user';
import { Query } from '../../query';
import { NodeHttpMiddleware } from '../../../node/http';
import { NetworkRepository } from './network-repository';

const collection = 'books';

describe('NetworkRepository', () => {
  let client;

  before(() => {
    NetworkRack.useHttpMiddleware(new NodeHttpMiddleware({}));
  });

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString()
    });
  });

  before(() => {
    const username = randomString();
    const password = randomString();
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

    nock(client.apiHostname)
      .post(`/user/${client.appKey}/login`, { username: username, password: password })
      .reply(200, reply);

    return User.login(username, password);
  });

  describe('deltaSet()', () => {
    it('should send a delta set request', () => {
      const entity1 = {
        _id: randomString(),
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        },
        title: 'entity1'
      };
      const entity2 = {
        _id: randomString(),
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        },
        title: 'entity2'
      };

      const since = new Date().toISOString();
      const repo = new NetworkRepository();

      // API response
      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
        .query({ since })
        .reply(200, { changed: [entity2], deleted: [{ _id: entity1._id }] });

      return repo.deltaSet(collection, null, since)
        .then((data) => {
          const { changed, deleted } = data;
          expect(changed).toBeA(Array);
          expect(changed).toEqual([entity2]);
          expect(deleted).toBeA(Array);
          expect(deleted).toEqual([{ _id: entity1._id }]);
        });
    });

    it('should send a delta set request with a query', () => {
      const entity1 = {
        _id: randomString(),
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        },
        title: 'entity1'
      };
      const entity2 = {
        _id: randomString(),
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        },
        title: 'entity2'
      };

      const since = new Date().toISOString();
      const query = new Query().equalTo('_id', randomString());
      const repo = new NetworkRepository();

      // API response
      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
        .query(Object.assign({}, { since }, query.toQueryString()))
        .reply(200, { changed: [entity2], deleted: [{ _id: entity1._id }] });

      return repo.deltaSet(collection, query, since)
        .then((data) => {
          const { changed, deleted } = data;
          expect(changed).toBeA(Array);
          expect(changed).toEqual([entity2]);
          expect(deleted).toBeA(Array);
          expect(deleted).toEqual([{ _id: entity1._id }]);
        });
    });
  });
});
