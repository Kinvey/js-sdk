import { expect } from 'chai';
import nock from 'nock';
import { URL } from 'url';
import { formatKinveyBaasUrl, KinveyBaasNamespace, kinveySessionAuth, KinveyHttpResponse } from '../../src/http';
import { setSession, removeSession } from '../../src/session';
import { Query } from '../../src/query';
import { DataStoreNetwork } from '../../src/datastore';

const COLLECTION_NAME = 'collectionName';

describe('DataStore Network', function() {
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

  describe('find()', function() {
    describe('without a query', function() {
      it('should send the correct GET request', async function() {
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope = nock(url.origin, {
          reqheaders: {
            Authorization: await kinveySessionAuth()
          }
        })
          .get(url.pathname)
          .query(false)
          .reply(200);
        const network = new DataStoreNetwork(COLLECTION_NAME);
        const response = await network.find();
        expect(response).to.be.instanceOf(KinveyHttpResponse);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send the correct GET request with kinveyFileTTL', async function() {
        const kinveyFileTTL = 1;
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope = nock(url.origin, {
          reqheaders: {
            Authorization: await kinveySessionAuth()
          }
        })
          .get(url.pathname)
          .query({ kinveyfile_ttl: kinveyFileTTL })
          .reply(200);
        const network = new DataStoreNetwork(COLLECTION_NAME);
        const response = await network.find(null, { kinveyFileTTL });
        expect(response).to.be.instanceOf(KinveyHttpResponse);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send the correct GET request with kinveyFileTLS', async function() {
        const kinveyFileTLS = true;
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope = nock(url.origin, {
          reqheaders: {
            Authorization: await kinveySessionAuth()
          }
        })
          .get(url.pathname)
          .query({ kinveyfile_tls: kinveyFileTLS })
          .reply(200);
        const network = new DataStoreNetwork(COLLECTION_NAME);
        const response = await network.find(null, { kinveyFileTLS });
        expect(response).to.be.instanceOf(KinveyHttpResponse);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send the correct GET request with trace', async function() {
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope = nock(url.origin, {
          reqheaders: {
            Authorization: await kinveySessionAuth(),
            'X-Kinvey-Include-Headers-In-Response': 'X-Kinvey-Request-Id',
            'X-Kinvey-ResponseWrapper': 'true'
          }
        })
          .get(url.pathname)
          .reply(200);
        const network = new DataStoreNetwork(COLLECTION_NAME);
        const response = await network.find(null, { trace: true });
        expect(response).to.be.instanceOf(KinveyHttpResponse);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send the correct GET request with skipBL', async function() {
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope = nock(url.origin, {
          reqheaders: {
            Authorization: await kinveySessionAuth(),
            'X-Kinvey-Skip-Business-Logic': 'true'
          }
        })
          .get(url.pathname)
          .reply(200);
        const network = new DataStoreNetwork(COLLECTION_NAME);
        const response = await network.find(null, { skipBL: true });
        expect(response).to.be.instanceOf(KinveyHttpResponse);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send the correct GET request with properties');
    });

    describe('with a query', function() {
      it('should send the correct GET request', async function() {
        const query = new Query().equalTo('title', 'Kinvey');
        const url = new URL(
          formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`, query.toHttpQueryObject())
        );
        const scope = nock(url.origin, {
          reqheaders: {
            Authorization: await kinveySessionAuth()
          }
        })
          .get(url.pathname)
          .query(query.toHttpQueryObject())
          .reply(200);
        const network = new DataStoreNetwork(COLLECTION_NAME);
        const response = await network.find(query);
        expect(response).to.be.instanceOf(KinveyHttpResponse);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send the correct GET request with kinveyFileTTL', async function() {
        const kinveyFileTTL = 1;
        const query = new Query().equalTo('title', 'Kinvey');
        const url = new URL(
          formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`, query.toHttpQueryObject())
        );
        const scope = nock(url.origin, {
          reqheaders: {
            Authorization: await kinveySessionAuth()
          }
        })
          .get(url.pathname)
          .query(Object.assign(query.toHttpQueryObject(), { kinveyfile_ttl: kinveyFileTTL }))
          .reply(200);
        const network = new DataStoreNetwork(COLLECTION_NAME);
        const response = await network.find(query, { kinveyFileTTL });
        expect(response).to.be.instanceOf(KinveyHttpResponse);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send the correct GET request with kinveyFileTLS', async function() {
        const kinveyFileTLS = true;
        const query = new Query().equalTo('title', 'Kinvey');
        const url = new URL(
          formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`, query.toHttpQueryObject())
        );
        const scope = nock(url.origin, {
          reqheaders: {
            Authorization: await kinveySessionAuth()
          }
        })
          .get(url.pathname)
          .query(Object.assign(query.toHttpQueryObject(), { kinveyfile_tls: kinveyFileTLS }))
          .reply(200);
        const network = new DataStoreNetwork(COLLECTION_NAME);
        const response = await network.find(query, { kinveyFileTLS });
        expect(response).to.be.instanceOf(KinveyHttpResponse);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send the correct GET request with trace', async function() {
        const query = new Query().equalTo('title', 'Kinvey');
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope = nock(url.origin, {
          reqheaders: {
            Authorization: await kinveySessionAuth(),
            'X-Kinvey-Include-Headers-In-Response': 'X-Kinvey-Request-Id',
            'X-Kinvey-ResponseWrapper': 'true'
          }
        })
          .get(url.pathname)
          .query(query.toHttpQueryObject())
          .reply(200);
        const network = new DataStoreNetwork(COLLECTION_NAME);
        const response = await network.find(query, { trace: true });
        expect(response).to.be.instanceOf(KinveyHttpResponse);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send the correct GET request with skipBL', async function() {
        const query = new Query().equalTo('title', 'Kinvey');
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${COLLECTION_NAME}`));
        const scope = nock(url.origin, {
          reqheaders: {
            Authorization: await kinveySessionAuth(),
            'X-Kinvey-Skip-Business-Logic': 'true'
          }
        })
          .get(url.pathname)
          .query(query.toHttpQueryObject())
          .reply(200);
        const network = new DataStoreNetwork(COLLECTION_NAME);
        const response = await network.find(query, { skipBL: true });
        expect(response).to.be.instanceOf(KinveyHttpResponse);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send the correct GET request with properties');
    });
  });
});
