import expect = require('expect');
import nock = require('nock');
import { EventEmitter } from 'eventemitter3';
import merge = require('lodash/merge');
import url = require('url');

import { login, logout, usePopup, AuthorizationGrant } from '../src/mic';
import { Client } from '../src/client';
import { randomString } from '../src/utils/string';
import { MobileIdentityConnectError } from '../src/errors';

const redirectUri = 'http://localhost';
const code = randomString();

class Popup extends EventEmitter {
  static open(url: string): Promise<Popup> {
    const popup = new Popup();
    setTimeout(function() {
      popup.emit('load', { url: `${redirectUri}?code=${code}` });
    }, 10);
    return Promise.resolve(popup);
  }

  close(): Promise<this> {
    this.removeAllListeners();
    return Promise.resolve(this);
  }
}
usePopup(Popup);

describe('Mobile Identity Connect', () => {
  let client;

  before(() => {
    client = Client.sharedInstance();
  });

  describe('login()', () => {
    describe('AuthorizationGrant.AuthorizationCodeLoginPage', () => {
      it('should login a user', () => {
        const response = {
          access_token: randomString(),
          refresh_token: randomString(),
          token_type: 'bearer',
          expires_in: 3600
        };

        nock(client.micHostname)
          .post('/oauth/token', {
            grant_type: 'authorization_code',
            client_id: client.appKey,
            redirect_uri: redirectUri,
            code: code
          })
          .reply(200, response);

        return login(redirectUri)
          .then((session) => {
            expect(session).toEqual(merge({
              clientId: client.appKey,
              identity: 'kinveyAuth',
              protocol: client.micProtocol,
              host: client.micHost,
              redirectUri: redirectUri
            }, response));
          });
      });
    });

    describe('AuthorizationGrant.AuthorizationCodeAPI', () => {
      it('should throw and error if a temp_login_uri is not provided', () => {
        const username = randomString();
        const password = randomString();
        const tempLoginUri = `/${randomString()}`;
        const response = {
          access_token: randomString(),
          refresh_token: randomString(),
          token_type: 'bearer',
          expires_in: 3600
        };

        nock(client.micHostname)
          .post('/oauth/auth', {
            client_id: client.appKey,
            redirect_uri: redirectUri,
            response_type: 'code'
          })
          .reply(200);

        return login(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, { username: username, password: password })
          .catch((error) => {
            expect(error).toBeA(MobileIdentityConnectError);
          });
      });

      it('should throw an error if a Location header is not provided', function() {
        const username = randomString();
        const password = randomString();
        const tempLoginUri = `/${randomString()}`;
        const response = {
          access_token: randomString(),
          refresh_token: randomString(),
          token_type: 'bearer',
          expires_in: 3600
        };

        nock(client.micHostname)
          .post('/oauth/auth', {
            client_id: client.appKey,
            redirect_uri: redirectUri,
            response_type: 'code'
          })
          .reply(200, {
            temp_login_uri: url.format({
              protocol: client.micProtocol,
              host: client.micHost,
              pathname: tempLoginUri
            })
          });

        nock(client.micHostname)
          .post(tempLoginUri)
          .reply(302);

        return login(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, { username: username, password: password })
          .catch((error) => {
            expect(error).toBeA(MobileIdentityConnectError);
          });
      });

      it('should login a user', () => {
        const username = randomString();
        const password = randomString();
        const tempLoginUri = `/${randomString()}`;
        const response = {
          access_token: randomString(),
          refresh_token: randomString(),
          token_type: 'bearer',
          expires_in: 3600
        };

        nock(client.micHostname)
          .post('/oauth/auth', {
            client_id: client.appKey,
            redirect_uri: redirectUri,
            response_type: 'code'
          })
          .reply(200, {
            temp_login_uri: url.format({
              protocol: client.micProtocol,
              host: client.micHost,
              pathname: tempLoginUri
            })
          });

        nock(client.micHostname)
          .post(tempLoginUri)
          .reply(302, null, {
            'Location': `${redirectUri}?code=${code}`
          });

        nock(client.micHostname)
          .post('/oauth/token', {
            grant_type: 'authorization_code',
            client_id: client.appKey,
            redirect_uri: redirectUri,
            code: code
          })
          .reply(200, response);

        return login(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, { username: username, password: password })
          .then((session) => {
            expect(session).toEqual(merge({
              clientId: client.appKey,
              identity: 'kinveyAuth',
              protocol: client.micProtocol,
              host: client.micHost,
              redirectUri: redirectUri
            }, response));
          });
      });
    });
  });

  describe('logout()', () => {
    it('should logout a user', () => {
      const userId = randomString();
      const response = {};

      nock(client.micHostname)
        .get('/oauth/invalidate')
        .query({ user: userId })
        .reply(204);

      return logout(userId)
        .then((response) => {
          expect(response).toEqual('');
        });
    });
  });
});