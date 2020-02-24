import { expect } from 'chai';
import nock from 'nock';
import { URL } from 'url';
import { formatKinveyAuthUrl } from '../../src/http';
import { init } from '../../src/init';
import { getTokenWithUsernamePassword, getTokenWithCode } from '../../src/user/mic';
import { getVersion, Identity } from '../../src/user/mic/utils';
import { getAuthProtocol, getAuthHost } from '../../src/kinvey';
import * as httpAdapter from '../http';
import * as memoryStorageAdapter from '../memory';
import * as sessionStore from '../sessionStore';

const APP_KEY = 'appKey';
const APP_SECRET = 'appSecret';

describe('Mobile Identity Connect', function () {
  beforeAll(function () {
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

  describe('getTokenWithCode()', function () {
    it('should set the default version', async function () {
      const code = 'code';
      const clientId = 'clientId';
      const redirectUri = 'redirectUri';
      const token = { access_token: 'access_token' };
      const url = new URL(formatKinveyAuthUrl(`/${getVersion()}/oauth/token`));
      const scope = nock(url.origin)
        .post(url.pathname)
        .reply(200, token)
      expect(await getTokenWithCode(code, clientId, redirectUri)).to.deep.equal(Object.assign({
        identity: Identity,
        client_id: clientId,
        redirect_uri: redirectUri,
        protocol: getAuthProtocol(),
        host: getAuthHost()
      }, token));
      expect(scope.isDone()).to.equal(true);
    });

    describe('with version', function () {
      it('should accept the version as a number', async function () {
        const code = 'code';
        const clientId = 'clientId';
        const redirectUri = 'redirectUri';
        const version = 5;
        const token = { access_token: 'access_token' };
        const url = new URL(formatKinveyAuthUrl(`/v${version}/oauth/token`));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(200, token)
        expect(await getTokenWithCode(code, clientId, redirectUri, { version })).to.deep.equal(Object.assign({
          identity: Identity,
          client_id: clientId,
          redirect_uri: redirectUri,
          protocol: getAuthProtocol(),
          host: getAuthHost()
        }, token));
        expect(scope.isDone()).to.equal(true);
      });

      it('should accept the version as a string', async function () {
        const code = 'code';
        const clientId = 'clientId';
        const redirectUri = 'redirectUri';
        const version = '5';
        const token = { access_token: 'access_token' };
        const url = new URL(formatKinveyAuthUrl(`/v${version}/oauth/token`));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(200, token)
        expect(await getTokenWithCode(code, clientId, redirectUri, { version })).to.deep.equal(Object.assign({
          identity: Identity,
          client_id: clientId,
          redirect_uri: redirectUri,
          protocol: getAuthProtocol(),
          host: getAuthHost()
        }, token));
        expect(scope.isDone()).to.equal(true);
      });
    });
  });

  describe('getTokenWithUsernamePassword()', function() {
    it('should set the default version', async function() {
      const username = 'username';
      const password = 'password';
      const clientId = 'clientId';
      const token = { access_token: 'access_token' };
      const url = new URL(formatKinveyAuthUrl(`/${getVersion()}/oauth/token`));
      const scope = nock(url.origin)
        .post(url.pathname)
        .reply(200, token)
      expect(await getTokenWithUsernamePassword(username, password, clientId)).to.deep.equal(Object.assign({
        identity: Identity,
        client_id: clientId,
        protocol: getAuthProtocol(),
        host: getAuthHost()
      }, token));
      expect(scope.isDone()).to.equal(true);
    });

    describe('with version', function() {
      it('should accept the version as a number', async function() {
        const username = 'username';
        const password = 'password';
        const clientId = 'clientId';
        const version = 5;
        const token = { access_token: 'access_token' };
        const url = new URL(formatKinveyAuthUrl(`/v${version}/oauth/token`));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(200, token)
        expect(await getTokenWithUsernamePassword(username, password, clientId, { version })).to.deep.equal(Object.assign({
          identity: Identity,
          client_id: clientId,
          protocol: getAuthProtocol(),
          host: getAuthHost()
        }, token));
        expect(scope.isDone()).to.equal(true);
      });

      it('should accept the version as a string', async function () {
        const username = 'username';
        const password = 'password';
        const clientId = 'clientId';
        const version = '5';
        const token = { access_token: 'access_token' };
        const url = new URL(formatKinveyAuthUrl(`/v${version}/oauth/token`));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(200, token)
        expect(await getTokenWithUsernamePassword(username, password, clientId, { version })).to.deep.equal(Object.assign({
          identity: Identity,
          client_id: clientId,
          protocol: getAuthProtocol(),
          host: getAuthHost()
        }, token));
        expect(scope.isDone()).to.equal(true);
      });
    });
  });
});
