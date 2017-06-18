import { Promise } from 'es6-promise';
import url = require('url');
import isString = require('lodash/isString');
import differenceBy = require('lodash/differenceBy');
import keyBy = require('lodash/keyBy');
import isArray = require('lodash/isArray');
import remove = require('lodash/remove');

import { CacheRequest } from '../request/cache';
import { KinveyError } from '../errors/kinvey';
import { SyncError } from '../errors/sync';
import { NotFoundError } from '../errors/notFound';
import { isDefined } from '../utils/object';
import { Client } from '../client';
import { KinveyObservable } from '../utils/observable';
import { RequestOptions, RequestMethod } from '../request';
import { AuthType, KinveyCacheRequest, KinveyNetworkRequest, KinveyDeltaFetchRequest } from '../request/kinvey';
import { Query } from '../query';
import { Aggregation } from '../aggregation';
import { Entity } from '../entity';
import { Metadata } from '../entity/metadata';

const pushInProgress = new Map();

/**
 * @typedef   {Object}    DataStoreType
 * @property  {string}    Cache           Cache datastore type
 * @property  {string}    Network         Network datastore type
 * @property  {string}    Sync            Sync datastore type
 */
export enum DataStoreType {
  Cache,
  Network,
  Sync
}

interface SyncEntity extends Entity {
  collection: string;
  state: {
    method?: RequestMethod
    operation?: RequestMethod
  },
  entityId: string;
}

export interface PushSyncResult<T extends Entity> {
  _id: string;
  operation: RequestMethod;
  entity?: T;
  error?: Error;
}

export interface DataStoreConfig {
  client?: Client;
  useDeltaFetch?: boolean;
  ttl?: number;
}

export interface DataStoreRequestOptions extends RequestOptions {
  useDeltaFetch?: boolean;
  client?: Client;
}

/**
 * The DataStore class is used to find, create, update, remove, count and group entities.
 */
export class DataStore<T extends Entity> {
  collection: string;
  private _type = DataStoreType.Network;
  private config: DataStoreConfig;

  protected constructor(collection: string, type = DataStoreType.Cache, config: DataStoreConfig) {
    if (collection && isString(collection) === false) {
      throw new KinveyError('Collection must be a string.');
    }

    /**
     * @type {string}
     */
    this.collection = collection;

    /**
     * @type {DataStoreType}
     */
    this._type = type;

    /**
     * @type {DataStoreConfig}
     */
    this.config = config || <DataStoreConfig>{};
  }

  get type(): DataStoreType {
    return this._type;
  }

  /**
   * The client for the store.
   * @return {Client} Client
   */
  get client(): Client {
    if (isDefined(this.config.client)) {
      return this.config.client;
    }

    return Client.sharedInstance();
  }

  /**
   * Set the client for the store
   * @param {Client} [client] Client
   */
  set client(client: Client) {
    if (client instanceof Client) {
      this.config.client = client;
    }
  }

  /**
   * The pathname for the store.
   * @return  {string}  Pathname
   */
  protected get pathname() {
    let pathname = `/appdata/${this.client.appKey}`;

    if (this.collection) {
      pathname = `${pathname}/${this.collection}`;
    }

    return pathname;
  }

  /**
   * Find all entities in the data store. A query can be optionally provided to return
   * a subset of all entities in a collection or omitted to return all entities in
   * a collection. The number of entities returned adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                             Query used to filter entities.
   * @param   {Object}                [options]                           Options
   * @param   {Properties}            [options.properties]                Custom properties to send with
   *                                                                      the request.
   * @param   {Number}                [options.timeout]                   Timeout for the request.
   * @param   {Boolean}               [options.useDeltaFetch]             Turn on or off the use of delta fetch.
   * @return  {Observable}                                                Observable.
   */
  find(query?: Query, options = <DataStoreRequestOptions>{}): KinveyObservable<T[]> {
    return KinveyObservable.create((observer) => {
      if (isDefined(query) && (query instanceof Query) === false) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new KinveyCacheRequest({
              method: RequestMethod.GET,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: this.pathname
              }),
              query: query,
              properties: options.properties,
              timeout: options.timeout
            });
            return request.execute()
              .then(response => response.data)
              .then((entities) => {
                observer.next(entities);
                return entities;
              });
          }

          return [];
        })
        .then((entities) => {
          if (this.type === DataStoreType.Cache) {
            return this.pendingSyncCount(query, options)
              .then((syncCount) => {
                if (syncCount > 0) {
                  return this.push(query, options)
                    .then(() => this.pendingSyncCount(query, options));
                }

                return syncCount;
              })
              .then((syncCount) => {
                if (syncCount > 0) {
                  throw new KinveyError('Unable to fetch the entities from the backend.'
                    + ` There ${syncCount === 1 ? 'is' : 'are'} ${syncCount} ${syncCount === 1 ? 'entity' : 'entities'} that need`
                    + ' to be synced.');
                }

                return entities;
              });
          }

          return entities;
        })
        .then((cacheEntities) => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Network) {
            const useDeltaFetch = options.useDeltaFetch === true || this.config.useDeltaFetch === true;
            let request = new KinveyNetworkRequest({
              method: RequestMethod.GET,
              authType: AuthType.Default,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: this.pathname
              }),
              query: query,
              properties: options.properties,
              timeout: options.timeout,
              client: this.client
            });

            if (useDeltaFetch === true) {
              request = new KinveyDeltaFetchRequest({
                method: RequestMethod.GET,
                authType: AuthType.Default,
                url: url.format({
                  protocol: this.client.apiProtocol,
                  host: this.client.apiHost,
                  pathname: this.pathname
                }),
                query: query,
                properties: options.properties,
                timeout: options.timeout,
                client: this.client
              });
            }

            return request.execute()
              .then(response => response.data)
              .then(networkEntities => {
                if (this.type === DataStoreType.Cache) {
                  const removedEntities = differenceBy(cacheEntities, networkEntities, '_id');
                  const removedIds = Object.keys(keyBy(removedEntities, '_id'));
                  const removeQuery = new Query().contains('_id', removedIds);
                  return this.clear(removeQuery, options)
                    .then(() => networkEntities);
                }

                return networkEntities;
              })
              .then((networkEntities) => {
                if (this.type === DataStoreType.Cache) {
                  const request = new KinveyCacheRequest({
                    method: RequestMethod.PUT,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: this.pathname
                    }),
                    body: networkEntities,
                    timeout: options.timeout,
                    properties: options.properties
                  });
                  return request.execute()
                    .then(response => response.data);
                }

                return networkEntities;
              })
              .then(entities => observer.next(entities));
          }

          return cacheEntities;
        })
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });
  }

  /**
   * Find a single entity in the data store by id.
   *
   * @param   {string}                id                               Entity by id to find.
   * @param   {Object}                [options]                        Options
   * @param   {Properties}            [options.properties]             Custom properties to send with
   *                                                                   the request.
   * @param   {Number}                [options.timeout]                Timeout for the request.
   * @param   {Boolean}               [options.useDeltaFetch]          Turn on or off the use of delta fetch.
   * @return  {Observable}                                             Observable.
   */
  findById(id: string, options?: DataStoreRequestOptions): KinveyObservable<T|undefined> {
    return KinveyObservable.create((observer) => {
      if (isDefined(id) === false) {
        observer.next(undefined);
        return observer.complete();
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new KinveyCacheRequest({
              method: RequestMethod.GET,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `${this.pathname}/${id}`
              }),
              properties: options.properties,
              timeout: options.timeout
            });
            return request.execute()
              .then(response => response.data)
              .then((entity) => {
                observer.next(entity);
                return entity;
              });
          }

          return undefined;
        })
        .then((entity) => {
          if (this.type === DataStoreType.Cache) {
            const query = new Query();
            query.equalTo('_id', id);
            return this.pendingSyncCount(query, options)
              .then((syncCount) => {
                if (syncCount > 0) {
                  return this.push(query, options)
                    .then(() => this.pendingSyncCount(query, options));
                }

                return syncCount;
              })
              .then((syncCount) => {
                if (syncCount > 0) {
                  throw new KinveyError('Unable to fetch the entities on the backend.'
                    + ` There are ${syncCount} entities that need`
                    + ' to be synced.');
                }

                return entity;
              });
          }

          return entity;
        })
        .then((cacheEntity) => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Network) {
            const useDeltaFetch = options.useDeltaFetch === true || this.config.useDeltaFetch === true;
            let request = new KinveyNetworkRequest({
              method: RequestMethod.GET,
              authType: AuthType.Default,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `${this.pathname}/${id}`
              }),
              properties: options.properties,
              timeout: options.timeout,
              client: this.client
            });

            if (useDeltaFetch === true) {
              request = new KinveyDeltaFetchRequest(request);
            }

            return request.execute()
              .then(response => response.data)
              .then((networkEntity) => {
                if (this.type === DataStoreType.Cache) {
                  const request = new KinveyCacheRequest({
                    method: RequestMethod.PUT,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: `${this.pathname}/${networkEntity._id}`
                    }),
                    body: networkEntity,
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  return request.execute()
                    .then(response => response.data);
                }

                return networkEntity;
              })
              .then(entity => observer.next(entity));
          }

          return cacheEntity;
        })
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });
  }

  /**
   * Group entities.
   *
   * @param   {Aggregation}           aggregation                         Aggregation used to group entities.
   * @param   {Object}                [options]                           Options
   * @param   {Properties}            [options.properties]                Custom properties to send with
   *                                                                      the request.
   * @param   {Number}                [options.timeout]                   Timeout for the request.
   * @return  {Observable}                                                Observable.
   */
  group(aggregation: Aggregation, options?: DataStoreRequestOptions): KinveyObservable<any> {
    return KinveyObservable.create((observer) => {
      if ((aggregation instanceof Aggregation) === false) {
        return observer.error(new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.'));
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new KinveyCacheRequest({
              method: RequestMethod.POST,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `${this.pathname}/_group`,
              }),
              aggregation: aggregation,
              properties: options.properties,
              timeout: options.timeout
            });
            return request.execute()
              .then(response => response.data)
              .then((aggregate) => {
                observer.next(aggregate);
                return aggregate;
              });
          }

          return undefined;
        })
        .then((aggregate) => {
          if (this.type === DataStoreType.Cache) {
            return this.pendingSyncCount(null, options)
              .then((syncCount) => {
                if (syncCount > 0) {
                  return this.push(null, options)
                    .then(() => this.pendingSyncCount(null, options));
                }

                return syncCount;
              })
              .then((syncCount) => {
                if (syncCount > 0) {
                  throw new KinveyError('Unable to fetch the entities on the backend.'
                    + ` There are ${syncCount} entities that need`
                    + ' to be synced.');
                }

                return aggregate;
              });
          }

          return aggregate;
        })
        .then((cacheAggregate) => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Network) {
            const useDeltaFetch = options.useDeltaFetch === true || this.config.useDeltaFetch === true;
            const request = new KinveyNetworkRequest({
              method: RequestMethod.POST,
              authType: AuthType.Default,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `${this.pathname}/_group`,
              }),
              aggregation: aggregation,
              properties: options.properties,
              timeout: options.timeout,
              client: this.client
            });

            return request.execute()
              .then(response => response.data)
              .then(aggregate => observer.next(aggregate));
          }

          return cacheAggregate;
        })
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });
  }

  /**
   * Count all entities in the data store. A query can be optionally provided to return
   * a subset of all entities in a collection or omitted to return all entities in
   * a collection. The number of entities returned adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                          Query used to filter entities.
   * @param   {Object}                [options]                        Options
   * @param   {Properties}            [options.properties]             Custom properties to send with
   *                                                                   the request.
   * @param   {Number}                [options.timeout]                Timeout for the request.
   * @return  {Observable}                                             Observable.
   */
  count(query?: Query, options?: DataStoreRequestOptions): KinveyObservable<number> {
     return KinveyObservable.create((observer) => {
      if (isDefined(query) && (query instanceof Query) === false) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new KinveyCacheRequest({
              method: RequestMethod.GET,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `${this.pathname}/_count`
              }),
              query: query,
              properties: options.properties,
              timeout: options.timeout
            });
            return request.execute()
              .then(response => response.data)
              .then((count) => {
                observer.next(count);
                return count;
              });
          }

          return 0;
        })
        .then((cacheCount) => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Network) {
            let request = new KinveyNetworkRequest({
              method: RequestMethod.GET,
              authType: AuthType.Default,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `${this.pathname}/_count`
              }),
              query: query,
              properties: options.properties,
              timeout: options.timeout,
              client: this.client
            });

            return request.execute()
              .then(response => response.data)
              .then(count => observer.next(count));
          }

          return cacheCount;
        })
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });
  }

  /**
   * Create a single or an array of entities on the data store.
   *
   * @param   {Object}                data                              Data that you want to create on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  create(entity: T, options?: DataStoreRequestOptions): Promise<T> {
    return KinveyObservable.create((observer) => {
      if (isDefined(entity) === false) {
        observer.next(null);
        return observer.complete();
      }

      if (isArray(entity)) {
        return observer.error(new KinveyError(
          'Unable to create an array of entities.',
          'Please create entities one by one.'
        ));
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new KinveyCacheRequest({
              method: RequestMethod.POST,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: this.pathname
              }),
              body: entity,
              properties: options.properties,
              timeout: options.timeout
            });
            return request.execute()
              .then(response => response.data)
              .then((entity) => {
                return this.addCreateOperation(entity, options)
                  .then(() => entity);
              })
              .then((entity) => {
                if (this.type === DataStoreType.Cache) {
                  const query = new Query()
                  query.equalTo('_id', entity._id);
                  return this.push(query, options)
                    .then((results) => {
                      const result = results[0];

                      if (isDefined(result.error)) {
                        throw result.error;
                      }

                      return result.entity;
                    });
                }

                return entity;
              })
              .then(entity => observer.next(entity))
          }

          return entity;
        })
        .then(() => {
          if (this.type === DataStoreType.Network) {
            const request = new KinveyNetworkRequest({
              method: RequestMethod.POST,
              authType: AuthType.Default,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: this.pathname
              }),
              body: entity,
              properties: options.properties,
              timeout: options.timeout,
              client: this.client
            });
            return request.execute()
              .then(response => response.data)
              .then(entity => observer.next(entity))
          }

          return entity;
        })
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    }).toPromise();
  }

  /**
   * Update a single or an array of entities on the data store.
   *
   * @param   {Object}          data                                    Data that you want to update on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  update(entity: T, options = <DataStoreRequestOptions>{}): Promise<T> {
    return KinveyObservable.create((observer) => {
      if (isDefined(entity) === false) {
        observer.next(null);
        return observer.complete();
      }

      if (isArray(entity)) {
        return observer.error(new KinveyError(
          'Unable to update an array of entities.',
          'Please update entities one by one.'
        ));
      }

       if (isDefined(entity._id) === false) {
        return observer.error(new KinveyError(
          'Unable to update entity.',
          'Entity must contain an _id to be updated.'
        ));
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new KinveyCacheRequest({
              method: RequestMethod.PUT,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `${this.pathname}/${entity._id}`
              }),
              body: entity,
              properties: options.properties,
              timeout: options.timeout
            });
            return request.execute()
              .then(response => response.data)
              .then((entity) => {
                return this.addUpdateOperation(entity, options)
                  .then(() => entity);
              })
              .then((entity) => {
                if (this.type === DataStoreType.Cache) {
                  const query = new Query()
                  query.equalTo('_id', entity._id);
                  return this.push(query, options)
                    .then((results) => {
                      const result = results[0];

                      if (isDefined(result.error)) {
                        throw result.error;
                      }

                      return result.entity;
                    });
                }

                return entity;
              })
              .then(entity => observer.next(entity))
          }

          return entity;
        })
        .then(() => {
          if (this.type === DataStoreType.Network) {
            const request = new KinveyNetworkRequest({
              method: RequestMethod.PUT,
              authType: AuthType.Default,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `${this.pathname}/${entity._id}`
              }),
              body: entity,
              properties: options.properties,
              timeout: options.timeout,
              client: this.client
            });
            return request.execute()
              .then(response => response.data)
              .then(entity => observer.next(entity))
          }

          return entity;
        })
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    }).toPromise();
  }

  /**
   * Save a single or an array of entities on the data store.
   *
   * @param   {Object|Array}          data                              Data that you want to save on the data store.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  save(entity: T, options?: DataStoreRequestOptions): Promise<T> {
    if (isDefined(entity._id)) {
      return this.update(entity, options);
    }

    return this.create(entity, options);
  }

  /**
   * Remove all entities in the data store. A query can be optionally provided to remove
   * a subset of all entities in a collection or omitted to remove all entities in
   * a collection. The number of entities removed adheres to the limits specified
   * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
   *
   * @param   {Query}                 [query]                           Query used to filter entities.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  remove(query?: Query, options?: DataStoreRequestOptions) {
    return KinveyObservable.create((observer) => {
      if (isDefined(query) && (query instanceof Query) === false) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new KinveyCacheRequest({
              method: RequestMethod.GET,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: this.pathname
              }),
              query: query,
              properties: options.properties,
              timeout: options.timeout
            });
            return request.execute()
              .then(response => response.data)
              .then((entities) => {
                if (entities.length > 0) {
                  return Promise.all(entities.map((entity) => {
                    const metadata = new Metadata(entity);

                    if (metadata.isLocal()) {
                      const query = new Query();
                      query.equalTo('_id', entity._id);
                      return this.clearSync(query, options)
                        .then(() => entity);
                    }

                    return this.addDeleteOperation(entity, options)
                      .then(() => entity);
                  }))
                  .then(() => entities);
                }

                return entities;
              })
              .then((entities) => {
                if (entities.length > 0 && this.type === DataStoreType.Cache) {
                  const localEntities = remove(entities, (entity) => {
                    const metadata = new Metadata(entity);
                    return metadata.isLocal();
                  });

                  const ids = Object.keys(keyBy(entities, '_id'));
                  const query = new Query()
                  query.contains('_id', ids);
                  return this.push(query, options)
                    .then(results => results.concat(localEntities as any));
                }

                return entities;
              })
              .then((results) => {
                return Promise.all(results.map((result) => {
                  if (isDefined(result.error) === false) {
                    const request = new KinveyCacheRequest({
                      method: RequestMethod.DELETE,
                      authType: AuthType.Default,
                      url: url.format({
                        protocol: this.client.apiProtocol,
                        host: this.client.apiHost,
                        pathname: `${this.pathname}/${result._id}`
                      }),
                      properties: options.properties,
                      timeout: options.timeout
                    });
                    return request.execute()
                      .then(response => response.data);
                  }

                  return { count: 0 };
                }));
              })
              .then((results: { count: number }[]) => {
                return results.reduce((totalResult, result) => {
                  totalResult.count += result.count;
                  return totalResult;
                }, { count: 0 });
              })
              .then(result => observer.next(result))
          }

          return [];
        })
        .then(() => {
          const request = new KinveyNetworkRequest({
            method: RequestMethod.DELETE,
            authType: AuthType.Default,
            url: url.format({
              protocol: this.client.apiProtocol,
              host: this.client.apiHost,
              pathname: this.pathname
            }),
            properties: options.properties,
            query: query,
            timeout: options.timeout,
            client: this.client
          });
          return request.execute()
            .then(response => response.data)
            .then(result => observer.next(result));
        })
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    }).toPromise();
  }

  /**
   * Remove a single entity in the data store by id.
   *
   * @param   {string}                id                               Entity by id to remove.
   * @param   {Object}                [options]                        Options
   * @param   {Properties}            [options.properties]             Custom properties to send with
   *                                                                   the request.
   * @param   {Number}                [options.timeout]                Timeout for the request.
   * @return  {Observable}                                             Observable.
   */
  removeById(id: string, options?: DataStoreRequestOptions) {
    return KinveyObservable.create((observer) => {
      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new KinveyCacheRequest({
              method: RequestMethod.GET,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `${this.pathname}/${id}`
              }),
              properties: options.properties,
              timeout: options.timeout
            });
            return request.execute()
              .then(response => response.data)
              .catch((error) => {
                if (error instanceof NotFoundError) {
                  return null;
                }

                throw error;
              })
              .then((entity) => {
                if (isDefined(entity)) {
                  const metadata = new Metadata(entity);

                  if (metadata.isLocal()) {
                    const query = new Query();
                    query.equalTo('_id', entity._id);
                    return this.clearSync(query, options)
                      .then(() => entity);
                  }

                  return this.addDeleteOperation(entity, options)
                    .then(() => entity);
                }

                return entity;
              })
              .then((entity) => {
                if (isDefined(entity) && this.type === DataStoreType.Cache) {
                  const query = new Query()
                  query.equalTo('_id', entity._id);
                  return this.push(query, options)
                    .then(() => entity);
                }

                return entity;
              })
              .then((entity) => {
                if (isDefined(entity)) {
                  const request = new KinveyCacheRequest({
                    method: RequestMethod.DELETE,
                    authType: AuthType.Default,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: `${this.pathname}/${entity._id}`
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  return request.execute()
                    .then(response => response.data)
                    .then(result => observer.next(result));
                }

                return entity;
              });
          }
        })
        .then(() => {
          if (this.type === DataStoreType.Network) {
            const request = new KinveyNetworkRequest({
              method: RequestMethod.DELETE,
              authType: AuthType.Default,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `${this.pathname}/${id}`
              }),
              properties: options.properties,
              timeout: options.timeout,
              client: this.client
            });
            return request.execute()
              .then(response => response.data)
              .then(result => observer.next(result));
          }
        })
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    }).toPromise();
  }

  /**
   * Remove all entities in the data store that are stored locally.
   *
   * @param   {Query}                 [query]                           Query used to filter entities.
   * @param   {Object}                [options]                         Options
   * @param   {Properties}            [options.properties]              Custom properties to send with
   *                                                                    the request.
   * @param   {Number}                [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                                 Promise.
   */
  clear(query?: Query, options?: DataStoreRequestOptions) {
    if (this.type === DataStoreType.Network) {
      return Promise.reject(new KinveyError(
        'A Network DataStore does not support caching. Please use a Cache or Sync DataStore.'
      ));
    }

    if (isDefined(query) && (query instanceof Query) === false) {
      return Promise.reject(new KinveyError(
        'Invalid query. It must be an instance of the Query class.'
      ));
    }

    const request = new KinveyCacheRequest({
      method: RequestMethod.GET,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: this.pathname
      }),
      query: query,
      properties: options.properties,
      timeout: options.timeout
    });
    return request.execute()
      .then(response => response.data)
      .then((entities = []) => {
        return Promise.all(entities.map((entity) => {
          return Promise.resolve(entity)
            .then((entity) => {
              const metadata = new Metadata(entity);

              // Clear any pending sync items if the entity
              // was created locally
              if (metadata.isLocal()) {
                const query = new Query();
                query.equalTo('_id', entity._id);
                return this.clearSync(query, options)
                  .then(() => entity);
              }

              return entity;
            })
            .then((entity) => {
              // Remove from cache
              const request = new KinveyCacheRequest({
                method: RequestMethod.DELETE,
                authType: AuthType.Default,
                url: url.format({
                  protocol: this.client.apiProtocol,
                  host: this.client.apiHost,
                  pathname: `${this.pathname}/${entity._id}`
                }),
                properties: options.properties,
                timeout: options.timeout
              });
              return request.execute()
                .then(response => response.data);
            });
        }));
      })
      .then((results: { count: number }[]) => {
        return results.reduce((totalResult, result) => {
          totalResult.count += result.count;
          return totalResult;
        }, { count: 0 });
      });
  }

  private addCreateOperation(entity, options: DataStoreRequestOptions) {
    return this.addOperation(RequestMethod.POST, entity, options);
  }

  private addUpdateOperation(entity, options: DataStoreRequestOptions) {
    return this.addOperation(RequestMethod.PUT, entity, options);
  }

  private addDeleteOperation(entity, options: DataStoreRequestOptions) {
    return this.addOperation(RequestMethod.DELETE, entity, options);
  }

  private addOperation(operation = RequestMethod.POST, entity: T, options: DataStoreRequestOptions): Promise<T> {
    // Just return null if nothing was provided
    // to be added to the sync table
    if (isDefined(entity) === false) {
      return Promise.resolve(null);
    }

    // Validate that the entity has an id
    const id = entity._id;
    if (isDefined(id) === false) {
      return Promise.reject(
        new SyncError('An entity is missing an _id. All entities must have an _id in order to be added to the sync table.')
      );
    }

    // Find an existing sync operation for the entity
    const query = new Query().equalTo('entityId', id);
    const findRequest = new KinveyCacheRequest({
      method: RequestMethod.GET,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/appdata/${this.client.appKey}/kinvey_sync`
      }),
      query: query,
      timeout: options.timeout,
      properties: options.properties
    });
    return findRequest.execute()
      .then(response => response.data)
      .then((entities) => {
        const syncEntity = entities.length === 1
          ? entities[0]
          : { collection: this.collection, state: {}, entityId: id };

        // Update the state
        syncEntity.state = syncEntity.state || {};
        syncEntity.state.operation = operation;

        // Send a request to save the sync entity
        const request = new KinveyCacheRequest({
          method: RequestMethod.PUT,
          url: url.format({
            protocol: this.client.apiProtocol,
            host: this.client.apiHost,
            pathname: `/appdata/${this.client.appKey}/kinvey_sync`
          }),
          body: syncEntity,
          timeout: options.timeout,
          properties: options.properties,
          client: this.client
        });
        return request.execute();
      })
      .then(() => {
        return entity;
      });
  }

  /**
   * Count the number of entities waiting to be pushed to the network. A promise will be
   * returned with the count of entities or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to count a subset of entities.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the local cache.
   * @return  {Promise}                                                         Promise
   */
  pendingSyncEntities(query?: Query, options = <DataStoreRequestOptions>{}): Promise<SyncEntity[]> {
    if (this.type === DataStoreType.Network) {
      return Promise.reject(new KinveyError(
        'A Network DataStore does not support sync. Please use a Cache or Sync DataStore.'
      ));
    }

    if (isDefined(query) && (query instanceof Query) === false) {
      return Promise.reject(new KinveyError(
        'Invalid query. It must be an instance of the Query class.'
      ));
    }

    const request = new KinveyCacheRequest({
      method: RequestMethod.GET,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: this.pathname
      }),
      query: query,
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });
    return request.execute()
      .then(response => response.data)
      .then((entities) => {
        const syncQuery = new Query();
        syncQuery.equalTo('collection', this.collection);

        if (isDefined(query)) {
          syncQuery.contains('entityId', entities.map(entity => entity._id));
        }

        const request = new KinveyCacheRequest({
          method: RequestMethod.GET,
          url: url.format({
            protocol: this.client.apiProtocol,
            host: this.client.apiHost,
            pathname: `/appdata/${this.client.appKey}/kinvey_sync`
          }),
          query: syncQuery,
          properties: options.properties,
          timeout: options.timeout,
          client: this.client
        });
        return request.execute()
          .then(response => response.data);
      });
  }

  /**
   * Count the number of entities waiting to be pushed to the network. A promise will be
   * returned with the count of entities or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to count a subset of entities.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @param   {Number}                [options.ttl]                             Time to live for data retrieved
   *                                                                            from the local cache.
   * @return  {Promise}                                                         Promise
   */
  pendingSyncCount(query?: Query, options?: DataStoreRequestOptions): Promise<number> {
    return this.pendingSyncEntities(query, options)
      .then(entities => entities.length);
  }

  /**
   * Push sync items for the data store to the network. A promise will be returned that will be
   * resolved with the result of the push or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to push a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  push(query?: Query, options?: DataStoreRequestOptions): Promise<PushSyncResult<T>[]> {
    const batchSize = 100;
    let i = 0;

    if (this.type === DataStoreType.Network) {
      return Promise.reject(new KinveyError(
        'A Network DataStore does not support sync. Please use a Cache or Sync DataStore.'
      ));
    }

    if (isDefined(query) && (query instanceof Query) === false) {
      return Promise.reject(new KinveyError(
        'Invalid query. It must be an instance of the Query class.'
      ));
    }

    // Don't push data to the backend if we are in the middle
    // of already pushing data
    if (pushInProgress.get(this.collection) === true) {
      return Promise.reject(new KinveyError(
        'Data is already being pushed to the backend.'
        + ' Please wait for it to complete before pushing new data to the backend.'
      ));
    }

    // Set pushInProgress to true
    pushInProgress.set(this.collection, true);

    return this.pendingSyncEntities(query)
      .then((syncEntities) => {
        if (syncEntities.length > 0) {
          // Sync the entities in batches to prevent exhausting
          // available network connections
          const batchSync = (syncResults = []) => {
            return new Promise((resolve) => {
              const batch = syncEntities.slice(i, i + batchSize);
              i += batchSize;

              // Get the results of syncing all of the entities
              return Promise.all(batch.map((syncEntity) => {
                const { entityId, state = {} } = syncEntity;
                const operation = state.operation || state.method;

                if (operation === RequestMethod.DELETE) {
                  // Remove the entity from the network.
                  const request = new KinveyNetworkRequest({
                    method: RequestMethod.DELETE,
                    authType: AuthType.Default,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: `${this.pathname}/${entityId}`
                    }),
                    properties: options.properties,
                    timeout: options.timeout,
                    client: this.client
                  });
                  return request.execute()
                    .then(() => {
                      // Remove the sync entity from the cache
                      const request = new KinveyCacheRequest({
                        method: RequestMethod.DELETE,
                        url: url.format({
                          protocol: this.client.apiProtocol,
                          host: this.client.apiHost,
                          pathname: `/appdata/${this.client.appKey}/kinvey_sync/${syncEntity._id}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout
                      });
                      return request.execute();
                    })
                    .then(() => {
                      // Return the result
                      const result = { _id: entityId, operation: operation };
                      return result;
                    })
                    .catch((error) => {
                      // Return the result of the sync operation.
                      const result = {
                        _id: entityId,
                        operation: operation,
                        error: error
                      };
                      return result;
                    });
                } else if (operation === RequestMethod.POST || operation === RequestMethod.PUT) {
                  let local = false;

                  // Get the entity from cache
                  const request = new KinveyCacheRequest({
                    method: RequestMethod.GET,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: `${this.pathname}/${entityId}`
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  return request.execute()
                    .then(response => response.data)
                    .then((entity) => {
                      // Save the entity to the backend.
                      const request = new KinveyNetworkRequest({
                        method: RequestMethod.PUT,
                        authType: AuthType.Default,
                        url: url.format({
                          protocol: this.client.apiProtocol,
                          host: this.client.apiHost,
                          pathname: `${this.pathname}/${entityId}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout,
                        body: entity,
                        client: this.client
                      });

                      // Send a POST request, and update the url.
                      if (operation === RequestMethod.POST) {
                        // If the entity was created locally then delete the autogenerated _id
                        if (isDefined(entity._kmd) && entity._kmd.local === true) {
                          local = true;
                          delete entity._id;
                        }

                        request.method = RequestMethod.POST;
                        request.url = url.format({
                          protocol: this.client.apiProtocol,
                          host: this.client.apiHost,
                          pathname: this.pathname
                        });
                      }

                      return request.execute()
                        .then(response => response.data)
                        .then((entity) => {
                          // Remove the sync entity
                          const request = new KinveyCacheRequest({
                            method: RequestMethod.DELETE,
                            url: url.format({
                              protocol: this.client.apiProtocol,
                              host: this.client.apiHost,
                              pathname: `/appdata/${this.client.appKey}/kinvey_sync/${syncEntity._id}`
                            }),
                            properties: options.properties,
                            timeout: options.timeout
                          });
                          return request.execute()
                            .then(() => {
                              // Save the result of the network request locally.
                              const request = new KinveyCacheRequest({
                                method: RequestMethod.PUT,
                                url: url.format({
                                  protocol: this.client.apiProtocol,
                                  host: this.client.apiHost,
                                  pathname: `${this.pathname}/${entity._id}`
                                }),
                                properties: options.properties,
                                timeout: options.timeout,
                                body: entity
                              });
                              return request.execute()
                                .then(response => response.data);
                            })
                            .then((entity) => {
                              // Remove the original entity if it was created locally
                              if (local) {
                                const request = new KinveyCacheRequest({
                                  method: RequestMethod.DELETE,
                                  url: url.format({
                                    protocol: this.client.apiProtocol,
                                    host: this.client.apiHost,
                                    pathname: `${this.pathname}/${entityId}`
                                  }),
                                  properties: options.properties,
                                  timeout: options.timeout
                                });

                                return request.execute()
                                  .then(() => entity);
                              }

                              return entity;
                            })
                            .then((entity) => {
                              // Return the result of the sync operation.
                              const result = {
                                _id: entityId,
                                operation: operation,
                                entity: entity
                              };
                              return result;
                            });
                        })
                        .catch((error) => {
                          // Set then id back on the entity
                          entity._id = entityId;

                          // Return the result of the sync operation.
                          const result = {
                            _id: entityId,
                            operation: operation,
                            entity: entity,
                            error: error
                          };
                          return result;
                        });
                    })
                    .catch((error) => {
                      const result = {
                        _id: entityId,
                        operation: operation,
                        entity: undefined,
                        error: error
                      };
                      return result;
                    });
                }

                return {
                  _id: entityId,
                  operation: operation,
                  entity: undefined,
                  error: new SyncError('Unable to sync the entity since the operation was not recognized.')
                };
              })).then((results) => {
                // Concat the results
                syncResults = syncResults.concat(results);

                // Sync the remaining entities
                if (i < syncEntities.length) {
                  return resolve(batchSync(syncResults));
                }

                // Resolve with the sync results
                return resolve(syncResults);
              });
            });
          };

          // Return the result
          return batchSync([]);
        }

        // Return an empty array
        return [];
      })
      .then((result) => {
        // Set pushInProgress to false
        pushInProgress.set(this.collection, false);
        return result;
      })
      .catch((error) => {
        // Set pushInProgress to false
        pushInProgress.set(this.collection, false);
        throw error;
      });
  }

  /**
   * Pull items for the data store from the network to your local cache. A promise will be
   * returned that will be resolved with the result of the pull or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to pull a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  pull(query?: Query, options?: DataStoreRequestOptions): Promise<T[]> {
    if (this.type === DataStoreType.Network) {
      return Promise.reject(new KinveyError(
        'A Network DataStore does not support sync. Please use a Cache or Sync DataStore.'
      ));
    }

    if (isDefined(query) && (query instanceof Query) === false) {
      return Promise.reject(new KinveyError(
        'Invalid query. It must be an instance of the Query class.'
      ));
    }

    return this.pendingSyncCount(query, options)
      .then((count) => {
        if (count > 0 && this.type === DataStoreType.Cache) {
          return this.push(query, options)
            .then(() => this.pendingSyncCount(query, options));
        }

        return count;
      })
      .then((count) => {
        // Throw an error if there are still items that need to be synced
        if (count > 0) {
          throw new SyncError('Unable to pull data from the network.'
            + ` There are ${count} entities that need`
            + ' to be synced before data is pulled from the network.');
        }


        const useDeltaFetch = options.useDeltaFetch === true || this.config.useDeltaFetch === true;
        let request = new KinveyNetworkRequest({
          method: RequestMethod.GET,
          authType: AuthType.Default,
          url: url.format({
            protocol: this.client.apiProtocol,
            host: this.client.apiHost,
            pathname: this.pathname
          }),
          query: query,
          properties: options.properties,
          timeout: options.timeout,
          client: this.client
        });

        // Should we use delta fetch?
        if (useDeltaFetch === true) {
          request = new KinveyDeltaFetchRequest(request);
        }

        // Execute the request
        return request.execute();
      })
      .then(response => response.data)
      .then((entities) => {
        return this.clear(query, options)
          .then(() => {
            const request = new KinveyCacheRequest({
              method: RequestMethod.PUT,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: this.pathname
              }),
              body: entities,
              properties: options.properties,
              timeout: options.timeout
            });
            return request.execute();
          })
          .then(() => entities);
      });
  }

  /**
   * Sync items for the data store. This will push pending sync items first and then
   * pull items from the network into your local cache. A promise will be
   * returned that will be resolved with the result of the pull or rejected with an error.
   *
   * @param   {Query}                 [query]                                   Query to pull a subset of items.
   * @param   {Object}                options                                   Options
   * @param   {Properties}            [options.properties]                      Custom properties to send with
   *                                                                            the request.
   * @param   {Number}                [options.timeout]                         Timeout for the request.
   * @return  {Promise}                                                         Promise
   */
  sync(query?: Query, options?: DataStoreRequestOptions): Promise<{ push: PushSyncResult<T>[], pull: T[] }> {
    return this.push(query, options)
      .then((push) => {
        return this.pull(query, options)
          .then((pull) => {
            const result = {
              push: push,
              pull: pull
            };
            return result;
          });
      });
  }

  clearSync(query?: Query, options?: DataStoreRequestOptions) {
    if (this.type === DataStoreType.Network) {
      return Promise.reject(new KinveyError(
        'A Network DataStore does not support sync. Please use a Cache or Sync DataStore.'
      ));
    }

    if (isDefined(query) && (query instanceof Query) === false) {
      return Promise.reject(new KinveyError(
        'Invalid query. It must be an instance of the Query class.'
      ));
    }

    return this.pendingSyncEntities(query, options)
      .then((entities) => {
        return Promise.all(entities.map((entity) => {
          const request = new KinveyCacheRequest({
            method: RequestMethod.DELETE,
            url: url.format({
              protocol: this.client.apiProtocol,
              host: this.client.apiHost,
              pathname: `/appdata/${this.client.appKey}/kinvey_sync/${entity._id}`
            }),
            properties: options.properties,
            timeout: options.timeout
          });
          return request.execute()
            .then(response => response.data);
        }));
      });
  }

  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}       [collection]                  Name of the collection.
   * @param  {StoreType}    [type=DataStoreType.Network]  Type of store to return.
   * @return {DataStore}                                  DataStore instance.
   */
  static collection<T extends Entity>(collection, type = DataStoreType.Cache, config?: DataStoreConfig): DataStore<T> {
    if (isDefined(collection) === false || isString(collection) === false) {
      throw new KinveyError('A collection is required and must be a string.');
    }

    return new DataStore<T>(collection, type, config);
  }

  /**
   * Clear the cache. This will delete all data in the cache.
   *
   * @param  {Object} [options={}] Options
   * @return {Promise<Object>} The result of clearing the cache.
   */
  static clearCache(options: DataStoreRequestOptions) {
    const client = options.client || Client.sharedInstance();
    const pathname = `/appdata/${client.appKey}`;
    const request = new KinveyCacheRequest({
      method: RequestMethod.DELETE,
      url: url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: pathname
      }),
      properties: options.properties,
      timeout: options.timeout
    });
    return request.execute()
      .then(response => response.data);
  }
}
