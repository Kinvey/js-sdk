/* eslint no-underscore-dangle: "off" */
/* eslint @typescript-eslint/camelcase: "off" */

import isEmpty from 'lodash/isEmpty';
import PQueue from 'p-queue';
import { InvalidCredentialsError, KinveyError } from '@kinveysdk/errors';
import { getMICSession, setMICSession, getSession, setSession } from '@kinveysdk/session';
import { getAppSecret } from '@kinveysdk/app';
import { Base64 } from 'js-base64';
import { HttpHeaders, KinveyHttpHeaders } from './headers';
import { HttpResponse, KinveyHttpResponse } from './response';
import { send } from './http';
import { serialize } from './serialize';
import { kinveyAppAuth } from './auth';
import { formatKinveyAuthUrl, formatKinveyBaasUrl, KinveyBaasNamespace, byteCount } from './utils';

export enum HttpRequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
};

export interface HttpRequestConfig {
  headers?: { [name: string]: string | string[] | (() => string | string[]) };
  method: HttpRequestMethod;
  url: string;
  body?: string | object;
  timeout?: number;
}

export interface HttpRequestObject extends HttpRequestConfig {
  headers?: { [name: string]: string };
}

export class HttpRequest {
  public headers: HttpHeaders;
  public method: HttpRequestMethod = HttpRequestMethod.GET;
  public url: string;
  public body?: any;
  public timeout?: number;

  constructor(config?: HttpRequestConfig) {
    if (config) {
      this.headers = new HttpHeaders(config.headers);

      if (config.method) {
        this.method = config.method;
      }

      this.url = config.url;
      this.body = serialize(this.headers.contentType, config.body);
      this.timeout = config.timeout;
    }
  }

  toPlainObject(): HttpRequestObject {
    return Object.assign({}, {
      headers: this.headers.toPlainObject(),
      method: this.method,
      url: this.url,
      body: this.body,
      timeout: this.timeout
    });
  }

  async execute(): Promise<HttpResponse> {
    const rawResponse = await send(this.toPlainObject());
    return new HttpResponse(rawResponse);
  }
}

export interface KinveyHttpRequestConfig extends HttpRequestConfig {
  auth?: () => Promise<string>;
  skipBL?: boolean;
  trace?: boolean;
  properties?: any;
}

const REQUEST_QUEUE = new PQueue();

function isRefreshRequestInProgress(): boolean {
  return REQUEST_QUEUE.isPaused;
}

function startRefreshProcess(): void {
  REQUEST_QUEUE.pause();
}

function stopRefreshProcess(): void {
  REQUEST_QUEUE.start();
}

export class KinveyHttpRequest extends HttpRequest {
  public headers: KinveyHttpHeaders;
  public auth: () => Promise<string>;

  constructor(config: KinveyHttpRequestConfig) {
    super(config);
    this.headers = new KinveyHttpHeaders(this.headers);
    this.auth = config.auth;
    this.skipBusinessLogic(config.skipBL);
    this.trace(config.trace);
    this.customRequestPropertes(config.properties);
  }

  skipBusinessLogic(value: boolean): KinveyHttpRequest {
    if (value) {
      this.headers.set('X-Kinvey-Skip-Business-Logic', 'true');
    } else {
      this.headers.delete('X-Kinvey-Skip-Business-Logic');
    }
    return this;
  }

  trace(value: boolean): KinveyHttpRequest {
    if (value) {
      this.headers.set('X-Kinvey-Include-Headers-In-Response', 'X-Kinvey-Request-Id');
      this.headers.set('X-Kinvey-ResponseWrapper', 'true');
    } else {
      this.headers.delete('X-Kinvey-Include-Headers-In-Response');
      this.headers.delete('X-Kinvey-ResponseWrapper');
    }
    return this;
  }

  customRequestPropertes(properties: any): KinveyHttpRequest {
    const customRequestPropertiesVal = JSON.stringify(properties);

    if (!isEmpty(customRequestPropertiesVal)) {
      const customRequestPropertiesByteCount = byteCount(customRequestPropertiesVal);

      if (customRequestPropertiesByteCount >= 2000) {
        throw new KinveyError(`The custom properties are ${customRequestPropertiesByteCount} bytes. They must be less then 2000 bytes.`);
      }

      this.headers.set('X-Kinvey-Custom-Request-Properties', customRequestPropertiesVal);
    } else {
      this.headers.delete('X-Kinvey-Custom-Request-Properties');
    }

    return this;
  }

  async execute(refresh = true): Promise<KinveyHttpResponse> {
    this.headers.authorization = await this.auth();

    try {
      const httpResponse = await super.execute();
      const response = new KinveyHttpResponse(httpResponse.toPlainObject());

      if (!response.isSuccess()) {
        throw response.error;
      }

      return response;
    } catch (error) {
      if (refresh && error instanceof InvalidCredentialsError) {
        if (isRefreshRequestInProgress()) {
          return REQUEST_QUEUE.add((): Promise<KinveyHttpResponse> => this.execute());
        }

        const micSession = getMICSession();

        if (micSession && micSession.refresh_token) {
          // Start refresh process
          startRefreshProcess();

          try {
            // Refresh
            const refreshRequest = new KinveyHttpRequest({
              method: HttpRequestMethod.POST,
              auth: async (): Promise<string> => {
                const credentials = Base64.encode(`${micSession.client_id}:${getAppSecret()}`);
                return `Basic ${credentials}`;
              },
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              url: formatKinveyAuthUrl('/oauth/token'),
              body: {
                grant_type: 'refresh_token',
                client_id: micSession.client_id,
                redirect_uri: micSession.redirect_uri,
                refresh_token: micSession.refresh_token
              }
            });
            const refreshResponse = await refreshRequest.execute(false);
            const newMicSession = refreshResponse.data;

            // Login
            const session = getSession();
            const loginRequest = new KinveyHttpRequest({
              method: HttpRequestMethod.POST,
              auth: kinveyAppAuth,
              url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'),
              body: {
                _socialIdentity: {
                  kinveyAuth: {
                    access_token: newMicSession.access_token,
                    id: session._id
                  }
                }
              }
            });
            const loginResponse = await loginRequest.execute(false);
            const newSession = loginResponse.data;

            // Set the new session
            setSession(newSession);
            setMICSession(Object.assign(micSession, newMicSession));
          } catch (refreshError) {
            // TODO: log error
            throw error;
          }

          // Redo the original request
          const origResponse = await this.execute();

          // Stop refresh process
          stopRefreshProcess();

          // Return the original response
          return origResponse;
        }
      }

      throw error;
    }
  }
}
