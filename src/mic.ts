import { Promise } from 'es6-promise';
import { EventEmitter } from 'eventemitter3';
import isString = require('lodash/isString');
import url = require('url');
import urljoin = require('url-join');

import { RequestMethod } from './request';
import { Headers } from './request/headers';
import { AuthType, KinveyNetworkRequest, KinveyRequestOptions } from './request/kinvey';
import { KinveyError, MobileIdentityConnectError, PopupError } from './errors';
import { isDefined } from './utils/object';
import { Client } from './client';


class DefaultPopup extends EventEmitter {
  static open(url: string): Promise<DefaultPopup> {
    return Promise.reject(
      new PopupError('Unable to open a popup on this platform.')
    );
  }

  close(): Promise<this> {
    this.removeAllListeners();
    return Promise.resolve(this);
  }
}
let Popup = DefaultPopup;

export enum AuthorizationGrant {
  AuthorizationCodeLoginPage,
  AuthorizationCodeAPI
}

export interface MobileIdentityConnectRequestOptions extends KinveyRequestOptions {
  version?: string;
  username?: string;
  password?: string;
}


export interface MobileIdentityConnectSession {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  identity: string;
  clientId: string;
  redirectUri: string;
  protocol: string;
  host: string;
}

export function login(redirectUri: string, authorizationGrant = AuthorizationGrant.AuthorizationCodeLoginPage, options = <MobileIdentityConnectRequestOptions>{}): Promise<MobileIdentityConnectSession> {
  const client = options.client || Client.sharedInstance();
  const clientId = client.appKey;
  const promise = Promise.resolve()
    .then(() => {
      if (authorizationGrant === AuthorizationGrant.AuthorizationCodeLoginPage) {
        // Step 1: Request a code
        return requestCodeWithPopup(clientId, redirectUri, options);
      } else if (authorizationGrant === AuthorizationGrant.AuthorizationCodeAPI) {
        // Step 1a: Request a temp login url
        return requestTempLoginUrl(clientId, redirectUri, options)
          .then(url => requestCodeWithUrl(url, clientId, redirectUri, options)); // Step 1b: Request a code
      }

      throw new MobileIdentityConnectError(`The authorization grant ${authorizationGrant} is unsupported. ` +
        'Please use a supported authorization grant.');
    })
    .then(code => requestToken(code, clientId, redirectUri, options)) // Step 3: Request a token
    .then((session) => {
      session.identity = 'kinveyAuth';
      session.clientId = clientId;
      session.redirectUri = redirectUri;
      session.protocol = client.micProtocol;
      session.host = client.micHost;
      return session;
    });

  return promise;
}

function requestTempLoginUrl(clientId: string, redirectUri: string, options = <MobileIdentityConnectRequestOptions>{}): Promise<string> {
  const client = options.client || Client.sharedInstance();
  let pathname = '/oauth/auth';

  if (options.version) {
    let version = options.version;

    if (isString(version) === false) {
      version = String(version);
    }

    pathname = urljoin(version.indexOf('v') === 0 ? version : `v${version}`, pathname);
  }

  const request = new KinveyNetworkRequest({
    method: RequestMethod.POST,
    headers: new Headers({
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
    url: url.format({
      protocol: client.micProtocol,
      host: client.micHost,
      pathname: pathname
    }),
    properties: options.properties,
    body: {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code'
    }
  });
  return request.execute()
    .then(response => response.data.temp_login_uri);
}

function requestCodeWithPopup(clientId: string, redirectUri: string, options = <MobileIdentityConnectRequestOptions>{}): Promise<string> {
  const client = options.client || Client.sharedInstance();
  let pathname = '/oauth/auth';

  if (options.version) {
    let version = options.version;

    if (!isString(version)) {
      version = String(version);
    }

    pathname = urljoin(version.indexOf('v') === 0 ? version : `v${version}`, pathname);
  }

  return Popup.open(url.format({
    protocol: client.micProtocol,
    host: client.micHost,
    pathname: pathname,
    query: {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code'
    }
  }))
    .then((popup) => {
      return new Promise((resolve, reject) => {
        let redirected = false;

        function loadCallback(event) {
          try {
            if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
              redirected = true;
              popup.removeAllListeners();
              popup.close()
                .then(() => {
                  resolve(url.parse(event.url, true).query.code);
                });
            }
          } catch (error) {
            reject(error);
          }
        }

        function errorCallback(event) {
          try {
            if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
              redirected = true;
              popup.close()
                .then(() => {
                  resolve(url.parse(event.url, true).query.code);
                });
            } else if (redirected === false) {
              popup.close()
                .then(() => {
                  reject(new MobileIdentityConnectError(event.message, '', event.code));
                });
            }
          } catch (error) {
            reject(error);
          }
        }

        function exitCallback() {
          if (redirected === false) {
            reject(new MobileIdentityConnectError('Mobile Identity Connect has been cancelled.'));
          }
        }

        popup.on('load', loadCallback);
        popup.on('error', errorCallback);
        popup.on('exit', exitCallback);
      });
    });
}

function requestCodeWithUrl(loginUrl: string, clientId: string, redirectUri: string, options = <MobileIdentityConnectRequestOptions>{}): Promise<string> {
  if (isDefined(loginUrl) === false) {
    return Promise.reject(
      new MobileIdentityConnectError(`Unable to authorize user with username ${options.username}.`,
        'A login url was not provided to request a code.')
    );
  }

  const request = new KinveyNetworkRequest({
    method: RequestMethod.POST,
    headers: new Headers({
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
    url: loginUrl,
    properties: options.properties,
    body: {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      username: options.username,
      password: options.password
    },
    followRedirect: false
  });
  return request.execute()
    .then((response) => {
      const location = response.headers.get('location');

      if (isDefined(location)) {
        return url.parse(location, true).query.code;
      }

      throw new MobileIdentityConnectError(`Unable to authorize user with username ${options.username}.`,
        'A location header was not provided with a code to exchange for an auth token.');
    });
}

function requestToken(code: string, clientId: string, redirectUri: string, options = <MobileIdentityConnectRequestOptions>{}): Promise<MobileIdentityConnectSession> {
  const client = options.client || Client.sharedInstance();
  const request = new KinveyNetworkRequest({
    method: RequestMethod.POST,
    headers: new Headers({
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
    authType: AuthType.App,
    url: url.format({
      protocol: client.micProtocol,
      host: client.micHost,
      pathname: '/oauth/token'
    }),
    properties: options.properties,
    body: {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code: code
    }
  });
  return request.execute().then(response => response.data);
}

export function logout(userId: string, options = <KinveyRequestOptions>{}): Promise<void> {
  const client = options.client || Client.sharedInstance();
  const request = new KinveyNetworkRequest({
    method: RequestMethod.GET,
    headers: new Headers({
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
    authType: AuthType.App,
    url: url.format({
      protocol: client.micProtocol,
      host: client.micHost,
      pathname: '/oauth/invalidate',
      query: {
        user: userId
      }
    }),
    properties: options.properties
  });
  return request.execute().then(response => response.data);
}

export function usePopup(_popup: any): void {
  if (isDefined(_popup)) {
    Popup = _popup;
  }
}
