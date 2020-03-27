import chai from 'chai';
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

chai.use(require('chai-as-promised'));
const expect = chai.expect;

const APP_KEY = 'appKey';
const APP_SECRET = 'appSecret';
const COLLECTION_NAME = 'testCollection';

const multiInsertErrorMessage = 'Unable to create an array of entities. Please create entities one by one or use API version 5 or newer.';

describe('Syncstore', function() {
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
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);

        expect(store.create(docs)).to.be.rejectedWith(KinveyError, multiInsertErrorMessage);
      });

      it('save should throw an error', async function() {
        const docs = [{}, {}];
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);

        expect(store.save(docs)).to.be.rejectedWith(KinveyError, multiInsertErrorMessage);
      });
    });

    describe('with a single doc', function() {
      it('create should store a local object and not send a POST request', async function() {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        const result = await store.create(doc);
        expect(result).to.have.property('_id').that.is.not.empty;
        expect(result).to.have.deep.property('_kmd', { local: true });
        expect(scope.isDone()).to.equal(false);
      });

      it('save should store a local object and not send a POST request', async function() {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        const result = await store.save(doc);
        expect(result).to.have.property('_id').that.is.not.empty;
        expect(result).to.have.deep.property('_kmd', { local: true });
        expect(scope.isDone()).to.equal(false);
      });

      it('save should not send a PUT request', async function () {
        const doc = { _id: '1' };
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${store.pathname}/${doc._id}`));
        const scope = nock(url.origin)
          .put(url.pathname)
          .reply(200, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(false);
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
      it('create should store local objects and not send insert requests', async function () {
        const docs = [];
        for (let i = 0; i < 3; i++) {
          docs.push({ data: i });
        }

        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, docs[0]);
        const result = await store.create(docs);
        expect(result).to.have.keys(['entities', 'errors']);
        expect(result.entities).to.be.an('Array').of.length(3);
        expect(result.errors).to.be.an('Array').of.length(0);

        result.entities.forEach((entity) => {
          expect(entity).to.have.property('_id').that.is.not.empty;
          expect(entity).to.have.deep.property('_kmd', { local: true });
        });
      });

      it('save should throw an error', async function() {
        const docs = [{}, {}];
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);

        const errMessage = 'Unable to save an array of entities. Use "create" method to insert multiple entities.'
        expect(store.save(docs)).to.be.rejectedWith(KinveyError, errMessage);
      });
    });

    describe('with a single doc', function () {
      it('create should store a local object and not send a POST request', async function() {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        const result = await store.create(doc);
        expect(result).to.have.property('_id').that.is.not.empty;
        expect(result).to.have.deep.property('_kmd', { local: true });
        expect(scope.isDone()).to.equal(false);
      });

      it('save should store a local object and not send a POST request', async function() {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        const result = await store.save(doc);
        expect(result).to.have.property('_id').that.is.not.empty;
        expect(result).to.have.deep.property('_kmd', { local: true });
        expect(scope.isDone()).to.equal(false);
      });

      it('save should not send a PUT request', async function () {
        const doc = { _id: '1' };
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${store.pathname}/${doc._id}`));
        const scope = nock(url.origin)
          .put(url.pathname)
          .reply(200, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(false);
      });
    });
  });
});
