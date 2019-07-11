import { expect } from 'chai';
import nock from 'nock';
import { URL } from 'url';
import { formatKinveyBaasUrl, KinveyBaasNamespace } from '../../src/http';
import { setSession, removeSession } from '../../src/session';
import { KinveyError } from '../../src/errors';
import { AutoStore, DataStoreCache } from '../../src/datastore';
import { randomString } from '../utils';

const COLLECTION_NAME = 'collectionName';
// const BATCH_SIZE = 100;

describe('AutoStore', function() {
  beforeEach(function() {
    return setSession({
      _id: '1',
      _kmd: {
        authtoken: 'authtoken'
      }
    });
  });

  afterEach(function() {
    return removeSession();
  });

  afterEach(function() {
    return nock.cleanAll();
  });

  it('should throw an error if a collection name is not provided', function() {
    try {
      // @ts-ignore
      new AutoStore(); /* eslint-disable-line no-new */
    } catch (error) {
      expect(error).to.be.instanceOf(KinveyError);
      expect(error.message).to.equal('A collectionName is required and must be a string.');
    }
  });

  it('should throw an error if the collection name is not a string', function() {
    try {
      // @ts-ignore
      new AutoStore({}); /* eslint-disable-line no-new */
    } catch (error) {
      expect(error).to.be.instanceOf(KinveyError);
      expect(error.message).to.equal('A collectionName is required and must be a string.');
    }
  });

  describe('find()', function() {
    it('should return all the docs', async function() {
      const docs = [{ _id: randomString() }, { _id: randomString() }];
      const store = new AutoStore(COLLECTION_NAME);
      const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
      const scope = nock(url.origin)
        .get(url.pathname)
        .reply(200, docs, { 'Content-Type': 'application/json' });

      // Assert that docs are returned
      expect(await store.find()).to.deep.equal(docs);
      expect(scope.isDone()).to.equal(true);

      // Assert that the docs are saved to the cache
      const cache = new DataStoreCache(COLLECTION_NAME);
      expect(await cache.find()).to.deep.equal(docs);
    });
  });
});
