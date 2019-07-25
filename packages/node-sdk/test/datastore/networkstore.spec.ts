import { expect } from 'chai';
import nock from 'nock';
import { URL } from 'url';
import { init } from '../../src/init';
import { formatKinveyBaasUrl, KinveyBaasNamespace } from '../../src/http';
import { setSession, removeSession } from '../../src/session';
import { KinveyError } from '../../src/errors';
import { NetworkStore } from '../../src/datastore';
import { APP_KEY, APP_SECRET } from '../env';

const COLLECTION_NAME = 'collectionName';
const BATCH_SIZE = 100;

describe('NetworkStore', function() {
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
      new NetworkStore(); /* eslint-disable-line no-new */
    } catch (error) {
      expect(error).to.be.instanceOf(KinveyError);
      expect(error.message).to.equal('A collectionName is required and must be a string.');
    }
  });

  it('should throw an error if the collection name is not a string', function() {
    try {
      // @ts-ignore
      new NetworkStore({}); /* eslint-disable-line no-new */
    } catch (error) {
      expect(error).to.be.instanceOf(KinveyError);
      expect(error.message).to.equal('A collectionName is required and must be a string.');
    }
  });

  describe('find()', function() {
    it('should return all the docs', async function() {
      const docs = [{}, {}];
      const store = new NetworkStore(COLLECTION_NAME);
      const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
      const scope = nock(url.origin)
        .get(url.pathname)
        .reply(200, docs, { 'Content-Type': 'application/json' });
      expect(await store.find()).to.deep.equal(docs);
      expect(scope.isDone()).to.equal(true);
    });
  });

  describe('create()', function() {
    describe('with API version 4', function() {
      it('should throw an error with an array of docs', async function() {
        try {
          const store = new NetworkStore(COLLECTION_NAME);
          await store.create([{}, {}]);
        } catch (error) {
          expect(error).to.be.instanceOf(KinveyError);
          expect(error.message).to.equal('Unable to create an array of docs. Please create docs one by one.');
        }
      });

      it('should send a POST request with a single doc', async function() {
        const doc = {};
        const store = new NetworkStore(COLLECTION_NAME);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc, { 'Content-Type': 'application/json' });
        expect(await store.create(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });
    });

    describe('with API version 5', function() {
      beforeEach(function() {
        init({
          appKey: APP_KEY,
          appSecret: APP_SECRET,
          apiVersion: 5
        });
      });

      it('should send a POST request with an array of docs', async function() {
        const docs = [{}, {}];
        const store = new NetworkStore(COLLECTION_NAME);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(207, { entities: docs, errors: [] }, { 'Content-Type': 'application/json' });
        expect(await store.create(docs)).to.deep.equal({ entities: docs, errors: [] });
        expect(scope.isDone()).to.equal(true);
      });

      it('should batch the POST requests if the length of the array of docs is greater then 100', async function() {
        const docs = [];

        for (let i = 0; i < 150; i += 1) {
          docs.push({});
        }

        const store = new NetworkStore(COLLECTION_NAME);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope1 = nock(url.origin)
          .post(url.pathname)
          .reply(207, { entities: docs.slice(0, BATCH_SIZE), errors: [] }, { 'Content-Type': 'application/json' });
        const scope2 = nock(url.origin)
          .post(url.pathname)
          .reply(
            207,
            { entities: docs.slice(BATCH_SIZE, docs.length), errors: [] },
            { 'Content-Type': 'application/json' }
          );
        expect(await store.save(docs)).to.deep.equal({ entities: docs, errors: [] });
        expect(scope1.isDone()).to.equal(true);
        expect(scope2.isDone()).to.equal(true);
      });

      it('should send a POST request with a single doc', async function() {
        const doc = {};
        const store = new NetworkStore(COLLECTION_NAME);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc, { 'Content-Type': 'application/json' });
        expect(await store.create(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });
    });
  });
});
