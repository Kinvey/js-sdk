import { Promise } from 'es6-promise';
import assign = require('lodash/assign');
import isEmpty = require('lodash/isEmpty');
import cloneDeep = require('lodash/cloneDeep');
import isArray = require('lodash/isArray');
import keyBy = require('lodash/keyBy');
import values = require('lodash/values');
import url = require('url');
import qs = require('qs');
import UrlPattern = require('url-pattern');

import { Request, RequestMethod, RequestOptions, RequestObject } from './';
import { KinveyResponse, StatusCode } from './response';
import { Properties } from './properties';
import { Header } from './headers';
import { CacheRack, NetworkRack } from '../rack';
import { Client } from '../client';
import { Query } from '../query';
import { Aggregation } from '../aggregation';
import { isDefined } from '../utils/object';
import { appendQuery } from '../utils/url';
import { Entity } from '../entity';
import { ActiveUserHelper } from '../entity/activeUserHelper';
import {
    KinveyError,
    InvalidCredentialsError,
    NoActiveUserError,
    NotFoundError
} from '../errors';

export const enum AuthType {
  All,
  App,
  Basic,
  Default,
  Master,
  None,
  Session
}

export interface KinveyRequestOptions extends RequestOptions {
  client?: Client;
  authType?: AuthType;
  query?: Query;
  aggregation?: Aggregation;
  properties?: Properties;
  skipBL?: boolean;
  trace?: boolean;
}

export interface KinveyRequestObject extends RequestObject {
  appKey?: string;
  encryptionKey?: string;
  collection?: string;
  entityId?: string;
}

export interface AuthObject {
  scheme: string;
  username?: string;
  password?: string;
  credentials?: string;
}

const Auth = {
    all(client: Client): Promise<AuthObject> {
        return Auth.session(client)
            .catch(() => Auth.basic(client));
    },

    app(client: Client): Promise<AuthObject> {
        if (isDefined(client.appKey) === false || isDefined(client.appSecret) === false) {
            return Promise.reject(
                new Error('Missing client appKey and/or appSecret.'
                    + ' Use Kinvey.init() to set the appKey and appSecret for the client.')
            );
        }

        return Promise.resolve({
            scheme: 'Basic',
            username: client.appKey,
            password: client.appSecret
        });
    },

    basic(client: Client): Promise<AuthObject> {
        return Auth.master(client)
            .catch(() => Auth.app(client));
    },

    master(client: Client): Promise<AuthObject> {
        if (isDefined(client.appKey) === false || isDefined(client.appSecret) === false) {
            return Promise.reject(
                new Error('Missing client appKey and/or masterSecret.'
                    + ' Use Kinvey.init() to set the appKey and masterSecret for the client.')
            );
        }

        return Promise.resolve({
            scheme: 'Basic',
            username: client.appKey,
            password: client.masterSecret
        });
    },

    none(): Promise<null> {
        return Promise.resolve(null);
    },

    session(client: Client): Promise<AuthObject> {
        const activeUser = ActiveUserHelper.get(client);

        if (isDefined(activeUser) === false) {
            return Promise.reject(
                new NoActiveUserError('There is not an active user. Please login a user and retry the request.')
            );
        }

        return Promise.resolve({
            scheme: 'Kinvey',
            credentials: activeUser._kmd.authtoken
        });
    }
};

function byteCount(str) {
  if (str) {
    let count = 0;
    const stringLength = str.length;
    str = String(str || '');

    for (let i = 0; i < stringLength; i += 1) {
      const partCount = encodeURI(str[i]).split('%').length;
      count += partCount === 1 ? 1 : partCount - 1;
    }

    return count;
  }

  return 0;
}

class KinveyRequest extends Request {
    authType: AuthType;
    skipBL = false;
    trace = false;
    private _client?: Client;
    private _query?: Query;
    private _aggregation?: Aggregation;
    private _properties?: Properties;

    constructor(options: KinveyRequestOptions) {
        super(options);

        options = assign({
            skipBL: false,
            trace: false
        }, options);

        this.client = options.client;
        this.authType = options.authType || AuthType.None;
        this.query = options.query;
        this.aggregation = options.aggregation;
        this.properties = options.properties || new Properties();
        this.skipBL = options.skipBL === true;
        this.trace = options.trace === true;
    }

    get appVersion() {
        return this.client.appVersion;
    }

    get client() {
        return this._client || Client.sharedInstance();
    }

    set client(client) {
        if (client) {
            if ((client instanceof Client) === false) {
                throw new KinveyError('client must be an instance of the Client class.');
            }
        }

        this._client = client;
    }

    get query() {
        return this._query;
    }

    set query(query: Query) {
        if (isDefined(query) && (query instanceof Query) === false) {
            throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        this._query = query;
    }

    get aggregation() {
        return this._aggregation;
    }

    set aggregation(aggregation) {
        if (isDefined(aggregation) && (aggregation instanceof Aggregation) === false) {
            throw new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');
        }

        if (isDefined(aggregation)) {
            this.body = aggregation.toPlainObject();
        }

        this._aggregation = aggregation;
    }

    get headers() {
        const headers = this._headers;

        // Add the Accept header
        if (headers.has('Accept') === false) {
            headers.set('Accept', 'application/json; charset=utf-8');
        }

        // Add the Content-Type header
        if (headers.has('Content-Type') === false) {
            headers.set('Content-Type', 'application/json; charset=utf-8');
        }

        // Add the X-Kinvey-API-Version header
        if (headers.has('X-Kinvey-Api-Version') === false) {
            headers.set('X-Kinvey-Api-Version', 4);
        }


        // Add or remove the X-Kinvey-Skip-Business-Logic header
        if (this.skipBL === true) {
            headers.set('X-Kinvey-Skip-Business-Logic', true);
        } else {
            headers.remove('X-Kinvey-Skip-Business-Logic');
        }

        // Add or remove the X-Kinvey-Include-Headers-In-Response and X-Kinvey-ResponseWrapper headers
        if (this.trace === true) {
            headers.set('X-Kinvey-Include-Headers-In-Response', 'X-Kinvey-Request-Id');
            headers.set('X-Kinvey-ResponseWrapper', true);
        } else {
            headers.remove('X-Kinvey-Include-Headers-In-Response');
            headers.remove('X-Kinvey-ResponseWrapper');
        }

        // Add or remove the X-Kinvey-Client-App-Version header
        if (this.appVersion) {
            headers.set('X-Kinvey-Client-App-Version', this.appVersion);
        } else {
            headers.remove('X-Kinvey-Client-App-Version');
        }

        // Add or remove X-Kinvey-Custom-Request-Properties header
        if (this.properties) {
            const customPropertiesHeader = this.properties.toString();

            if (isEmpty(customPropertiesHeader) === false) {
                const customPropertiesByteCount = byteCount(customPropertiesHeader);

                if (customPropertiesByteCount >= 2000) {
                    throw new Error(
                        `The custom properties are ${customPropertiesByteCount} bytes.`
                        + ' It must be less then 2000 bytes.');
                }

                headers.set('X-Kinvey-Custom-Request-Properties', customPropertiesHeader);
            } else {
                headers.remove('X-Kinvey-Custom-Request-Properties');
            }
        } else {
            headers.remove('X-Kinvey-Custom-Request-Properties');
        }

        // Return the headers
        return headers;
    }

    get url() {
        const urlString = this._url;
        const queryString = this.query ? this.query.toQueryString() : {};

        if (isEmpty(queryString)) {
            return urlString;
        }

        return appendQuery(urlString, qs.stringify(queryString));
    }

    set url(urlString) {
        this._url = urlString;
    }

    get properties() {
        return this._properties;
    }

    set properties(properties) {
        if (properties && (properties instanceof Properties) === false) {
            properties = new Properties(properties);
        }

        this._properties = properties;
    }

    getAuthorizationHeader(): Promise<Header> {
        let promise = Promise.resolve(undefined);

        if (isDefined(this.authType)) {
            switch (this.authType) {
                case AuthType.All:
                    promise = Auth.all(this.client);
                    break;
                case AuthType.App:
                    promise = Auth.app(this.client);
                    break;
                case AuthType.Basic:
                    promise = Auth.basic(this.client);
                    break;
                case AuthType.Master:
                    promise = Auth.master(this.client);
                    break;
                case AuthType.None:
                    promise = Auth.none();
                    break;
                case AuthType.Session:
                    promise = Auth.session(this.client);
                    break;
                default:
                    promise = Auth.session(this.client)
                        .catch((error) => {
                            return Auth.master(this.client)
                                .catch(() => {
                                    throw error;
                                });
                        });
            }
        }

        return promise
            .then((authInfo) => {
                // Add the auth info to the Authorization header
                if (isDefined(authInfo)) {
                    let credentials = authInfo.credentials;

                    if (isDefined(authInfo.username)) {
                        credentials = btoa(`${authInfo.username}:${authInfo.password}`);
                    }

                    return {
                        name: 'Authorization',
                        value: `${authInfo.scheme} ${credentials}`
                    };
                }

                return undefined;
            });
    }

    execute(): Promise<KinveyResponse> {
        return this.getAuthorizationHeader()
            .then((authorizationHeader) => {
                if (isDefined(authorizationHeader)) {
                    this.headers.add(authorizationHeader);
                } else {
                    this.headers.remove('Authorization');
                }

                return super.execute();
            })
            .then((response) => {
                if ((response instanceof KinveyResponse) === false) {
                    response = new KinveyResponse(response);
                }

                if (response.isSuccess() === false) {
                    throw response.error;
                }

                return response;
            });
    }
}

export class KinveyCacheRequest extends KinveyRequest {
  private appKey?: string;
  private collection?: string;
  private entityId?: string;

  constructor(options: KinveyRequestOptions) {
    super(options);
    this.rack = CacheRack;
  }

  set body(body) {
    this.body = cloneDeep(body);
  }

  execute(): Promise<KinveyResponse> {
    const pathname = encodeURI(url.parse(this.url).pathname);
    const pattern = new UrlPattern('(/:namespace)(/)(:appKey)(/)(:collection)(/)(:entityId)(/)');
    const { appKey, collection, entityId } = pattern.match(pathname) || { appKey: undefined, collection: undefined, entityId: undefined };
    this.appKey = appKey;
    this.collection = collection;
    this.entityId = entityId;

    return super.execute()
      .then((response: KinveyResponse) => {
        // If a query was provided then process the data with the query
        if (isDefined(this.query) && isDefined(response.data)) {
          response.data = this.query.process(response.data);
        }

        // If an aggregation was provided then process the data with the aggregation
        if (isDefined(this.aggregation) && isDefined(response.data)) {
          response.data = this.aggregation.process(response.data);
        }

        return response;
      });
  }

  toPlainObject(): KinveyRequestObject {
    const obj = <KinveyRequestObject>super.toPlainObject();
    obj.appKey = this.appKey;
    obj.collection = this.collection;
    obj.entityId = this.entityId;
    obj.encryptionKey = this.client ? this.client.encryptionKey : undefined;
    return obj;
  }
}

export class KinveyNetworkRequest extends KinveyRequest {
    constructor(options: KinveyRequestOptions) {
        super(options);
        this.rack = NetworkRack;
    }
}

export class KinveyDeltaFetchRequest extends KinveyNetworkRequest {
  execute(): Promise<KinveyResponse> {
    const request = new KinveyCacheRequest({
      method: RequestMethod.GET,
      url: this.url,
      headers: this.headers,
      query: this.query,
      timeout: this.timeout,
      client: this.client
    });
    return request.execute()
      .then(response => response.data)
      .catch((error: Error) => {
        if ((error instanceof NotFoundError) === false) {
          throw error;
        }

        return [];
      })
      .then((cacheData: Entity[]) => {
        if (isArray(cacheData) && cacheData.length > 0) {
          const cacheDocuments = keyBy(cacheData, '_id');
          const query = new Query(this.query);
          query.fields = ['_id', '_kmd.lmt'];
          const request = new KinveyNetworkRequest({
            method: RequestMethod.GET,
            url: this.url,
            headers: this.headers,
            authType: this.authType,
            query: query,
            timeout: this.timeout,
            client: this.client,
            properties: this.properties,
            skipBL: this.skipBL,
            trace: this.trace,
            followRedirect: this.followRedirect
          });

          return request.execute()
            .then(response => response.data)
            .then((networkData: Entity[]) => {
              const networkDocuments = keyBy(networkData, '_id');
              const deltaSet = networkDocuments;
              const cacheDocumentIds = Object.keys(cacheDocuments);

              cacheDocumentIds.forEach((id) => {
                const cacheDocument = cacheDocuments[id];
                const networkDocument = networkDocuments[id];

                if (networkDocument) {
                  if (isDefined(networkDocument._kmd) && isDefined(cacheDocument._kmd)
                      && networkDocument._kmd.lmt === cacheDocument._kmd.lmt) {
                    delete deltaSet[id];
                  } else {
                    delete cacheDocuments[id];
                  }
                } else {
                  delete cacheDocuments[id];
                }
              });

              const deltaSetIds = Object.keys(deltaSet);
              const promises = [];
              let i = 0;

              while (i < deltaSetIds.length) {
                const query = new Query(this.query);
                const ids = deltaSetIds.slice(i, deltaSetIds.length > 200 + i ? 200 : deltaSetIds.length);
                query.contains('_id', ids);

                const request = new KinveyNetworkRequest({
                  method: RequestMethod.GET,
                  url: this.url,
                  headers: this.headers,
                  authType: this.authType,
                  query: query,
                  timeout: this.timeout,
                  client: this.client,
                  properties: this.properties,
                  skipBL: this.skipBL,
                  trace: this.trace,
                  followRedirect: this.followRedirect
                });

                const promise = request.execute();
                promises.push(promise);
                i += 200;
              }

              return Promise.all(promises);
            })
            .then((responses: KinveyResponse[]) => {
              const response = responses.reduce((result, response) => {
                if (response.isSuccess()) {
                  const headers = result.headers;
                  headers.addAll(response.headers);
                  result.headers = headers;
                  result.data = result.data.concat(response.data);
                }

                return result;
              }, new KinveyResponse({
                statusCode: StatusCode.Ok,
                data: []
              }));

              response.data = response.data.concat(values(cacheDocuments));

              if (isDefined(this.query)) {
                const query = new Query(this.query);
                query.skip = 0;
                query.limit = 0;
                response.data = query.process(response.data);
              }

              return response;
            });
        }

        const request = new KinveyNetworkRequest({
          method: RequestMethod.GET,
          url: this.url,
          headers: this.headers,
          authType: this.authType,
          query: this.query,
          timeout: this.timeout,
          client: this.client,
          properties: this.properties,
          skipBL: this.skipBL,
          trace: this.trace,
          followRedirect: this.followRedirect
        });
        return request.execute();
      });
  }
}