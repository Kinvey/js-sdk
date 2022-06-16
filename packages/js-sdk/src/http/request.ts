import isString from 'lodash/isString';
import PQueue from 'p-queue';
import { Base64 } from 'js-base64';
import { InvalidCredentialsError } from '../errors/invalidCredentials';
import { getAppSecret} from '../kinvey';
import { logger } from '../log';
import { HttpHeaders, KinveyHttpHeaders, KinveyHttpAuth } from './headers';
import { HttpResponse } from './response';
import { send } from './http';
import { getSession, setSession, removeSession, getKinveyMICSession, setKinveyMICSession } from './session';
import { DataStoreCache, QueryCache, SyncCache } from '../datastore/cache';
import { formatKinveyAuthUrl, formatKinveyBaasUrl, KinveyBaasNamespace } from './utils';

const REQUEST_QUEUE = new PQueue();
let refreshTokenRequestInProgress = false;

export enum HttpRequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
};

export interface HttpRequestConfig {
  headers?: HttpHeaders;
  method: HttpRequestMethod;
  url: string;
  body?: string | object;
  timeout?: number;
}

export function serialize(contentType: string, body?: any) {
  if (body && !isString(body)) {
    if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
      const str: string[] = [];
      Object.keys(body).forEach((key) => {
        str.push(`${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`);
      });
      return str.join('&');
    } else if (contentType.indexOf('application/json') === 0) {
      return JSON.stringify(body);
    }
  }

  return body;
}

export class HttpRequest {
  public headers: HttpHeaders;
  public method: HttpRequestMethod = HttpRequestMethod.GET;
  public url: string;
  public body?: any;
  public timeout?: number;

  constructor(config: HttpRequestConfig) {
    this.headers = new HttpHeaders(config.headers);

    if (config.method) {
      this.method = config.method;
    }

    this.url = config.url;
    this.body = config.body;
    this.timeout = config.timeout;
  }

  async execute(): Promise<HttpResponse> {
    // Make http request
    const response = await send(this.toPlainObject());

    // Return the response if it was successful
    if (response.isSuccess()) {
      return response;
    }

    // Else throw the error
    throw response.error;
  }

  toPlainObject() {
    return {
      headers: this.headers.toPlainObject(),
      method: this.method,
      url: this.url,
      body: this.body ? serialize(this.headers.contentType!, this.body) : undefined,
      timeout: this.timeout
    };
  }
}

function isRefreshTokenRequestInProgress() {
  return refreshTokenRequestInProgress === true;
}

function markRefreshTokenRequestInProgress() {
  REQUEST_QUEUE.pause();
  refreshTokenRequestInProgress = true;
}

function markRefreshTokenRequestComplete() {
  refreshTokenRequestInProgress = false;
  REQUEST_QUEUE.start();
}

export interface KinveyHttpRequestConfig extends HttpRequestConfig {
  headers?: KinveyHttpHeaders;
  auth?: KinveyHttpAuth;
}

async function cleanUp() {
  try {
    // TODO: Unregister from live service

    // Remove the session
    await removeSession();

    // Clear cache's
    await QueryCache.clear();
    await SyncCache.clear();
    await DataStoreCache.clear();
  } catch (error) {
    logger.error(error.message);
  }
}

async function sendSessionRefreshRequest(req) {
  const response = await send(req.toPlainObject());

  if (response.statusCode > 399) {
    if (response.statusCode < 500) {
      await cleanUp();
    }

    return null;
  }

  return response.data;
}

export class KinveyHttpRequest extends HttpRequest {
  public headers: KinveyHttpHeaders;
  public auth?: KinveyHttpAuth;

  constructor(config: KinveyHttpRequestConfig) {
    super(config);
    this.headers = new KinveyHttpHeaders(config.headers);

    if (config.auth) {
      this.auth = config.auth;
    }
  }

  async _refreshMICSession(micSession) {
    const kinveyMICIdentityKey = 'kinveyAuth';

    try {
      // Refresh the MIC session
      const refreshRequest = new KinveyHttpRequest({
        method: HttpRequestMethod.POST,
        headers: new KinveyHttpHeaders({
          'Content-Type': () => 'application/x-www-form-urlencoded',
          Authorization: () => {
            const credentials = Base64.encode(`${micSession.client_id}:${getAppSecret()}`);
            return `Basic ${credentials}`;
          }
        }),
        url: formatKinveyAuthUrl('/oauth/token'),
        body: {
          grant_type: 'refresh_token',
          client_id: micSession.client_id,
          redirect_uri: micSession.redirect_uri,
          refresh_token: micSession.refresh_token
        }
      });

      const refreshData = await sendSessionRefreshRequest(refreshRequest);
      if (!refreshData) {
        return false;
      }

      // Persist the new access and refresh tokens
      await setKinveyMICSession(refreshData);

      const newMICSession = await getKinveyMICSession();

      // Login with the new MIC session
      const loginRequest = new KinveyHttpRequest({
        method: HttpRequestMethod.POST,
        auth: KinveyHttpAuth.App,
        url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'),
        body: {
          _socialIdentity: {
            [kinveyMICIdentityKey]: newMICSession
          }
        }
      });

      const newSession = await sendSessionRefreshRequest(loginRequest);
      if (!newSession) {
        return false;
      }

      newSession._socialIdentity[kinveyMICIdentityKey] = Object.assign({}, newSession._socialIdentity[kinveyMICIdentityKey], newMICSession);

      // Set the new session
      await setSession(newSession);

      return true;
    } catch (error) {
      logger.error(error.message);
      return false;
    }
  }

  async execute(retry = true): Promise<HttpResponse> {
    if (this.auth) {
      await this.headers.setAuthorization(this.auth);
    }

    try {
      return await super.execute();
    } catch (error) {
      if (retry) {
        // Received an InvalidCredentialsError
        if (error instanceof InvalidCredentialsError) {
          if (isRefreshTokenRequestInProgress()) {
            return REQUEST_QUEUE.add(() => {
              const request = new KinveyHttpRequest(this);
              return request.execute(false).catch(() => Promise.reject(error));
            });
          }

          // Mark refresh token request in progress
          markRefreshTokenRequestInProgress();

          // Get existing mic session
          const micSession = await getKinveyMICSession();

          if (micSession) {
            try {
              const isSuccess = await this._refreshMICSession(micSession);

              if (isSuccess) {
                // Redo the original request
                const request = new KinveyHttpRequest(this);
                const response = await request.execute(false);

                // Mark the refresh token as complete
                markRefreshTokenRequestComplete();

                // Return the response
                return response;
              }
            } catch (error) {
              logger.error(error.message);
            }
          } else {
            await cleanUp();
          }

          // Mark the refresh token as complete
          markRefreshTokenRequestComplete();
        }

        // Throw the error
        throw error;
      }
    }
  }
}
