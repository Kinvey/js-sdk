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
import { KinveyError, InsufficientCredentialsError } from '../../src/errors';

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

  afterEach(function() {
    nock.cleanAll();
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
        expect(scope.isDone()).to.equal(false);
        expect(result).to.have.keys(['entities', 'errors']);
        expect(result.entities).to.be.an('Array').of.length(3);
        expect(result.errors).to.be.an('Array').of.length(0);

        result.entities.forEach((entity) => {
          expect(entity).to.have.property('_id').that.is.not.empty;
          expect(entity).to.have.deep.property('_kmd', { local: true });
        });
      });

      it('push should batch objects for create and send them first', async function () {
        const docForUpdate = { _id: '123', data: 123 };
        const docsForInsert = [];
        for (let i = 0; i < 3; i++) {
          docsForInsert.push({ data: i });
        }

        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        await store.save(docForUpdate);
        await store.create(docsForInsert);

        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(207, { entities: docsForInsert, errors: [] })
          .put(url.pathname + '/123')
          .reply(200, docForUpdate);

        const result = await store.push();

        expect(scope.isDone()).to.equal(true);
        expect(result).to.be.an('Array').of.length(4);
        expect(result[0]).to.have.deep.property('entity', docsForInsert[0]);
        expect(result[1]).to.have.deep.property('entity', docsForInsert[1]);
        expect(result[2]).to.have.deep.property('entity', docsForInsert[2]);
        expect(result[3]).to.have.deep.property('entity', docForUpdate);

        result.forEach((entity) => {
          expect(entity).to.have.property('_id').that.is.not.empty;
          expect(entity).to.not.have.property('_kmd');
        });
      });

      it('push should not reject if batch insert fails with a generic error', async function () {
        const docForUpdate = { _id: '123', data: 123 };
        const docsForInsert = [];
        for (let i = 0; i < 3; i++) {
          docsForInsert.push({ data: i });
        }

        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        await store.save(docForUpdate);
        await store.create(docsForInsert);

        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(401, {})
          .put(url.pathname + '/123')
          .reply(200, docForUpdate);

        const result = await store.push();

        expect(scope.isDone()).to.equal(true);
        expect(result).to.be.an('Array').of.length(4);
        expect(result[0].entity).to.have.property('data', docsForInsert[0].data);
        expect(result[1].entity).to.have.property('data', docsForInsert[1].data);
        expect(result[2].entity).to.have.property('data', docsForInsert[2].data);
        expect(result[3]).to.have.deep.property('entity', docForUpdate);

        expect(result[0].error.constructor.name).to.eql(InsufficientCredentialsError.name);
        expect(result[1].error.constructor.name).to.eql(InsufficientCredentialsError.name);
        expect(result[2].error.constructor.name).to.eql(InsufficientCredentialsError.name);
        expect(result[3]).to.not.have.property('error');

        result.forEach((entity) => {
          expect(entity).to.have.property('_id').that.is.not.empty;
          expect(entity).to.not.have.property('_kmd');
        });
      });

      it('create should throw an error for empty array', async function() {
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        await expect(store.create([])).to.be.rejectedWith(KinveyError, 'Unable to create an array of entities. The array must not be empty.');
      });

      it('create should return an error for local object with duplicate id', async function () {
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        const doc = { _id: 1234, data: 1 };

        const result = await store.create(doc);
        expect(result).to.deep.eql(doc);

        // Test single-item create
        await expect(store.create(doc)).to.be.rejectedWith(KinveyError, "An entity with _id '1234' already exists.");

        // Test multi-item create
        await expect(store.create([{}, doc])).to.be.rejectedWith(KinveyError, "An entity with _id '1234' already exists.");

        const pendingSyncEntities = await store.pendingSyncEntities();
        expect(pendingSyncEntities.length).to.eql(1);
        expect(pendingSyncEntities[0].entity).to.eql(doc);
      });

      it('create should return an error for two objects with the same id in the array', async function () {
        const store = collection(COLLECTION_NAME, DataStoreType.Sync);
        const doc1 = { _id: 11, data: 1 };
        const doc2 = { _id: 11, data: 2 };

        await expect(store.create([{}, doc1, {}, doc2])).to.be.rejectedWith(KinveyError, "The array contains more than one entity with _id '11'.");

        const pendingSyncEntities = await store.pendingSyncEntities();
        expect(pendingSyncEntities.length).to.eql(0);
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
