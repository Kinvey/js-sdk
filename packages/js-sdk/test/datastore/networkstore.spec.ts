import chai from 'chai';
import nock from 'nock';
import { URL } from 'url';
import { formatKinveyBaasUrl, KinveyBaasNamespace, KinveyHttpRequest, HttpRequestMethod, KinveyHttpAuth, KinveyHttpHeaders } from '../../src/http';
import { init } from '../../src/init';
import { collection, DataStoreType } from '../../src/datastore';
import { setSession, removeSession } from '../../src/http/session';
import { KinveyError } from '../../src/errors';
import * as httpAdapter from '../http';
import * as memoryStorageAdapter from '../memory';
import * as sessionStore from '../sessionStore';

chai.use(require('chai-as-promised'));
const expect = chai.expect;

const APP_KEY = 'appKey';
const APP_SECRET = 'appSecret';
const COLLECTION_NAME = 'testCollection';
const BATCH_SIZE = 100;

const multiInsertErrorMessage = 'Unable to create an array of entities. Please create entities one by one or use API version 5 or newer.';

describe('NetworkStore', function() {
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
    });
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
    return nock.cleanAll();
  });

  afterEach(function() {
    const syncStore = collection(COLLECTION_NAME, DataStoreType.Sync);
    return syncStore.clear();
  });

  describe('with API Version 4', function () {
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
      it('create should throw an error', function() {
        const docs = [{}, {}];
        const store = collection(COLLECTION_NAME, DataStoreType.Network);

        expect(store.create(docs)).to.be.rejectedWith(KinveyError, multiInsertErrorMessage);
      });

      it('save should throw an error', function() {
        const docs = [{}, {}];
        const store = collection(COLLECTION_NAME, DataStoreType.Network);

        expect(store.save(docs)).to.be.rejectedWith(KinveyError, multiInsertErrorMessage);
      });
    });

    describe('with a single doc', function() {
      it('create should send a POST request', async function() {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        expect(await store.create(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });

      it('save should send a POST request', async function() {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });

      it('save should send a PUT request', async function () {
        const doc = { _id: '1' };
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
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
      it('create should send a multi insert request', async function () {
        const docs = [];
        for (let i = 0; i < 50; i++) {
          docs.push({ data: i });
        }
        const response = { entities: docs, errors: [] };
        response.entities[5] = null;
        response.entities[42] = null;
        response.errors.push({ index: 5 });
        response.errors.push({ index: 42 });

        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(207, response);
        expect(await store.create(docs)).to.deep.equal(response);
        expect(scope.isDone()).to.equal(true);
      });

      it('create should send 3 multi insert requests if the length of the array is 250', async function () {
        const docs = [];
        for (let i = 0; i < 250; i++) {
          docs.push({ data: i });
        }

        const firstBatchResponse = { entities: docs.slice(0, BATCH_SIZE), errors: [] };
        firstBatchResponse.entities[5] = null;
        firstBatchResponse.errors.push({ index: 5 });

        const secondBatchResponse = { entities: docs.slice(BATCH_SIZE, BATCH_SIZE * 2), errors: [] };
        secondBatchResponse.entities[42] = null;
        secondBatchResponse.errors.push({ index: 42 });

        const thirdBatchResponse = { entities: docs.slice(BATCH_SIZE * 2, docs.length), errors: [] };
        thirdBatchResponse.entities[12] = null;
        thirdBatchResponse.errors.push({ index: 12 });

        const expectedResult = { entities: docs, errors: [{ index: 5 }, { index: 142 }, { index: 212 }]};
        expectedResult.entities[5] = null;
        expectedResult.entities[142] = null;
        expectedResult.entities[212] = null;

        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope1 = nock(url.origin)
          .post(url.pathname)
          .reply(207, firstBatchResponse);
        const scope2 = nock(url.origin)
          .post(url.pathname)
          .reply(207, secondBatchResponse);
        const scope3 = nock(url.origin)
          .post(url.pathname)
          .reply(207, thirdBatchResponse);
        expect(await store.create(docs)).to.deep.eql(expectedResult);
        expect(scope1.isDone()).to.eql(true);
        expect(scope2.isDone()).to.eql(true);
        expect(scope3.isDone()).to.eql(true);
      });

      it('create should throw an error for empty array', async function() {
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        await expect(store.create([])).to.be.rejectedWith(KinveyError, 'Unable to create an array of entities. The array must not be empty.');
      });

      it('save should throw an error', function() {
        const docs = [{}, {}];
        const store = collection(COLLECTION_NAME, DataStoreType.Network);

        const errMessage = 'Unable to save an array of entities. Use "create" method to insert multiple entities.'
        expect(store.save(docs)).to.be.rejectedWith(KinveyError, errMessage);
      });
    });

    describe('with a single doc', function () {
      it('create should send a POST request', async function () {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        expect(await store.create(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });

      it('save should send a POST request', async function () {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });

      it('save should send a PUT request', async function () {
        const doc = { _id: '1' };
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
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
