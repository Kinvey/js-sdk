import { expect } from 'chai';
import nock from 'nock';
import { URL } from 'url';
import { formatKinveyBaasUrl, KinveyBaasNamespace, KinveyHttpRequest, HttpRequestMethod, KinveyHttpAuth, KinveyHttpHeaders } from '../../src/http';
import { init } from '../../src/init';
import { collection, DataStoreType } from '../../src/datastore';
import { setSession, removeSession } from '../../src/http/session';
import * as httpAdapter from '../http';
import * as memoryStorageAdapter from '../memory';
import * as sessionStore from '../sessionStore';
import { KinveyError } from '../../src/errors';

const APP_KEY = 'appKey';
const APP_SECRET = 'appSecret';
const COLLECTION_NAME = 'testCollection'

describe('Autostore', function() {
  beforeAll(function() {
    return init({
      kinveyConfig: {
        appKey: APP_KEY,
        appSecret: APP_SECRET
      },
      httpAdapter,
      sessionStore: sessionStore,
      popup: null,
      storageAdapter: memoryStorageAdapter,
      pubnub: null
    })
  });

  beforeAll(function() {
    return setSession({
      _id: '1',
      _kmd: {
        authtoken: 'authtoken'
      }
    });
  });

  afterAll(function() {
    return removeSession();
  });

  afterEach(function() {
    const syncStore = collection(COLLECTION_NAME, DataStoreType.Sync);
    return syncStore.clear();
  });

  describe('with invalid data and network interruptions', function () {
    it('should return locally stored data if connectivity error', async function() {
      // Save some local items with sync store
      const syncStore = collection(COLLECTION_NAME, DataStoreType.Sync);
      const docs = await Promise.all([
        syncStore.save({}),
        syncStore.save({})
      ]);
      await syncStore.clearSync();

      // Find with auto store
      const autoStore = collection(COLLECTION_NAME, DataStoreType.Auto);
      const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, autoStore.pathname));
      const scope = nock(url.origin)
        .get(url.pathname)
        .replyWithError({ code: 'ECONNREFUSED' });

      // Verify
      expect(await autoStore.find()).to.deep.equal(docs);
      expect(scope.isDone()).to.equal(true);
    });

    it('should return locally stored data if connectivity error with tagged store', async function() {
      const tag = 'foo';

      // Save some local items with sync store
      const taggedSyncStore = collection(COLLECTION_NAME, DataStoreType.Sync, { tag });
      const docs = await Promise.all([
        taggedSyncStore.save({}),
        taggedSyncStore.save({})
      ]);
      await taggedSyncStore.clearSync();

      // Find with auto store
      const autoStore = collection(COLLECTION_NAME, DataStoreType.Auto);
      const taggedAutoStore = collection(COLLECTION_NAME, DataStoreType.Auto, { tag });
      const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, taggedAutoStore.pathname));
      const scope = nock(url.origin)
        .get(url.pathname)
        .replyWithError({ code: 'ECONNREFUSED' });

      // Verify
      expect(await autoStore.find()).to.deep.equal([]);
      expect(await taggedAutoStore.find()).to.deep.equal(docs);
      expect(scope.isDone()).to.equal(true);
    });
  });

  describe('with API Version 4', function() {
    beforeAll(function () {
      return init({
        kinveyConfig: {
          appKey: APP_KEY,
          appSecret: APP_SECRET,
          apiVersion: 4
        },
        httpAdapter,
        sessionStore: sessionStore,
        popup: null,
        storageAdapter: memoryStorageAdapter,
        pubnub: null
      })
    });

    describe('with an array of docs', function() {
      it('create should throw an error', async function() {
        const docs = [{}, {}];
        const store = collection(COLLECTION_NAME, DataStoreType.Auto);

        try {
          await store.create(docs);
        } catch (error) {
          expect(error).to.be.instanceOf(KinveyError);
          expect(error.message).to.equal('Unable to create an array of entities. Please create entities one by one or use API version 5 or newer.');
        }
      });

      it('save should throw an error', async function() {
        const docs = [{}, {}];
        const store = collection(COLLECTION_NAME, DataStoreType.Auto);

        try {
          await store.save(docs);
        } catch (error) {
          expect(error).to.be.instanceOf(KinveyError);
          expect(error.message).to.equal('Unable to create an array of entities. Please create entities one by one or use API version 5 or newer.');
        }
      });
    });

    describe('with a single doc', function() {
      it('create should send a POST request', async function() {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Auto);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        expect(await store.create(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });

      it('save should send a POST request', async function() {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Auto);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });

      it('save should send a PUT request', async function () {
        const doc = { _id: '1' };
        const store = collection(COLLECTION_NAME, DataStoreType.Auto);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${store.pathname}/${doc._id}`));
        const scope = nock(url.origin)
          .put(url.pathname)
          .reply(200, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });
    });
  });

  describe('with API Version 5', function() {
    beforeAll(function () {
      return init({
        kinveyConfig: {
          appKey: APP_KEY,
          appSecret: APP_SECRET,
          apiVersion: 5
        },
        httpAdapter,
        sessionStore: sessionStore,
        popup: null,
        storageAdapter: memoryStorageAdapter,
        pubnub: null
      })
    });

    describe('with an array of docs', function () {
      it('create should send separate insert requests', async function () {
        const docs = [];
        for (let i = 0; i < 3; i++) {
          docs.push({ data: i });
        }

        const store = collection(COLLECTION_NAME, DataStoreType.Auto);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope1 = nock(url.origin)
          .post(url.pathname)
          .reply(201, docs[0]);
        const scope2 = nock(url.origin)
          .post(url.pathname)
          .reply(400, { message: 'test' });
        const scope3 = nock(url.origin)
          .post(url.pathname)
          .reply(201, docs[2]);

        const result = await store.create(docs);
        expect(scope1.isDone()).to.eql(true);
        expect(scope2.isDone()).to.eql(true);
        expect(scope3.isDone()).to.eql(true);
        expect(result).to.have.keys(['entities', 'errors']);
        expect(result.entities).to.deep.eql([docs[0], null, docs[2]]);
        expect(result.errors).to.be.an('Array').of.length(1);
        expect(result.errors[0].message).to.eql('test');
        expect(result.errors[0].index).to.eql(1);
      });

      it('save should throw an error', async function() {
        const docs = [{}, {}];
        const store = collection(COLLECTION_NAME, DataStoreType.Auto);

        try {
          await store.save(docs);
        } catch (error) {
          expect(error).to.be.instanceOf(KinveyError);
          expect(error.message).to.eql('Unable to save an array of entities. Use "create" method to insert multiple entities.');
        }
      });
    });

    describe('with a single doc', function () {
      it('create should send a POST request', async function () {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Auto);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        expect(await store.create(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });

      it('save should send a POST request', async function () {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Auto);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });

      it('save should send a PUT request', async function () {
        const doc = { _id: '1' };
        const store = collection(COLLECTION_NAME, DataStoreType.Auto);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${store.pathname}/${doc._id}`));
        const scope = nock(url.origin)
          .put(url.pathname)
          .reply(200, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });
    });
  });
});
