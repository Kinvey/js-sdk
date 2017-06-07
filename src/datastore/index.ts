import url from 'url';
import isString from 'lodash/isString';

import { CacheRequest } from './request/cache';
import { KinveyError } from './errors';
import { isDefined } from './object';
import { Client } from './client';
import { KinveyObservable } from './observable';
import { AuthType, RequestOptions, RequestMethod } from './request/request';
import { KinveyRequest } from './request/network';
import { DeltaFetchRequest } from './request/deltafetch.js';
import { Query } from './query';
import { Aggregation } from './aggregation';

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

export interface DataStoreConfig {
  client?: Client;
  useDeltaFetch?: boolean;
  ttl?: number;
}

export interface DataStoreRequestOptions extends RequestOptions {
  useDeltaFetch?: boolean;
}

/**
 * The DataStore class is used to find, create, update, remove, count and group entities.
 */
export class DataStore {
  collection: string;
  type = DataStoreType.Network;
  config: DataStoreConfig;

  protected constructor(collection: string, type = DataStoreType.Network, config: DataStoreConfig) {
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
    this.type = type;

    /**
     * @type {DataStoreConfig}
     */
    this.config = config || <DataStoreConfig>{};
  }

  /**
   * The client for the store.
   * @return {Client} Client
   */
  get client() {
    if (isDefined(this.config.client)) {
      return this.config.client;
    }

    return Client.sharedInstance();
  }

  /**
   * Set the client for the store
   * @param {Client} [client] Client
   */
  set client(client) {
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
  find(query?: Query, options?: DataStoreRequestOptions) {
    return KinveyObservable.create((observer) => {
      if (isDefined(query) && (query instanceof Query) === false) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new CacheRequest({
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
                  throw new KinveyError('Unable to fetch the entities on the backend.'
                    + ` There are ${syncCount} entities that need`
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
            let request = new KinveyRequest({
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
              request = new DeltaFetchRequest(request);
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
                  const request = new CacheRequest({
                    method: RequestMethod.PUT,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: this.pathname
                    }),
                    properties: options.properties,
                    body: networkEntities,
                    timeout: options.timeout
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
  findById(id: string, options?: DataStoreRequestOptions) {
    return KinveyObservable.create((observer) => {
      if (isDefined(id) === false) {
        observer.next(undefined);
        return observer.complete();
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new CacheRequest({
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
            let request = new KinveyRequest({
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
              request = new DeltaFetchRequest(request);
            }

            return request.execute()
              .then(response => response.data)
              .then((networkEntity) => {
                if (this.type === DataStoreType.Cache) {
                  const request = new CacheRequest({
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
  group(aggregation: Aggregation, options?: DataStoreRequestOptions) {
    return KinveyObservable.create((observer) => {
      if ((aggregation instanceof Aggregation) === false) {
        return observer.error(new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.'));
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new CacheRequest({
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
            const request = new KinveyRequest({
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
  count(query?: Query, options?: DataStoreRequestOptions) {
     return KinveyObservable.create((observer) => {
      if (isDefined(query) && (query instanceof Query) === false) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      Promise.resolve()
        .then(() => {
          if (this.type === DataStoreType.Cache || this.type === DataStoreType.Sync) {
            const request = new CacheRequest({
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
            let request = new KinveyRequest({
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
  create(entity: {}, options?: DataStoreRequestOptions) {
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
            const request = new CacheRequest({
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
                return this.syncManager.addCreateOperation(entity, options)
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
            const request = new KinveyRequest({
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
  update(entity: {}, options?: DataStoreRequestOptions) {
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
            const request = new CacheRequest({
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
                return this.syncManager.addUpdateOperation(entity, options)
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
            const request = new KinveyRequest({
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
  save(entity: {}, options?: DataStoreRequestOptions) {
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
            const request = new CacheRequest({
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

                    return this.syncManager.addDeleteOperation(entity, options)
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
                    .then(results => results.concat(localEntities));
                }

                return entities;
              })
              .then((results) => {
                return Promise.all(results.map((result) => {
                  if (isDefined(result.error) === false) {
                    const request = new CacheRequest({
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
              .then((results) => {
                return reduce(results, (totalResult, result) => {
                  totalResult.count += result.count;
                  return totalResult;
                }, { count: 0 });
              })
              .then(result => observer.next(result))
          }

          return [];
        })
        .then(() => {
          const request = new KinveyRequest({
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
            const request = new CacheRequest({
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

                  return this.syncManager.addDeleteOperation(entity, options)
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
                  const request = new CacheRequest({
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
            const request = new KinveyRequest({
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

    const request = new CacheRequest({
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
              const request = new CacheRequest({
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
      .then((results) => {
        return reduce(results, (totalResult, result) => {
          totalResult.count += result.count;
          return totalResult;
        }, { count: 0 });
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
  pendingSyncEntities(query?: Query, options?: DataStoreRequestOptions) {
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

    const request = new CacheRequest({
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

        const request = new CacheRequest({
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
  pendingSyncCount(query?: Query, options?: DataStoreRequestOptions) {
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
  push(query?: Query, options?: DataStoreRequestOptions) {
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

                if (operation === SyncOperation.Delete) {
                  // Remove the entity from the network.
                  const request = new KinveyRequest({
                    method: RequestMethod.DELETE,
                    authType: AuthType.Default,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: `${this.backendPathname}/${entityId}`
                    }),
                    properties: options.properties,
                    timeout: options.timeout,
                    client: this.client
                  });
                  return request.execute()
                    .then(() => {
                      // Remove the sync entity from the cache
                      const request = new CacheRequest({
                        method: RequestMethod.DELETE,
                        url: url.format({
                          protocol: this.client.apiProtocol,
                          host: this.client.apiHost,
                          pathname: `${this.pathname}/${syncEntity._id}`
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
                } else if (operation === SyncOperation.Create || operation === SyncOperation.Update) {
                  let local = false;

                  // Get the entity from cache
                  const request = new CacheRequest({
                    method: RequestMethod.GET,
                    url: url.format({
                      protocol: this.client.apiProtocol,
                      host: this.client.apiHost,
                      pathname: `${this.backendPathname}/${entityId}`
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  return request.execute()
                    .then(response => response.data)
                    .then((entity) => {
                      // Save the entity to the backend.
                      const request = new KinveyRequest({
                        method: RequestMethod.PUT,
                        authType: AuthType.Default,
                        url: url.format({
                          protocol: this.client.apiProtocol,
                          host: this.client.apiHost,
                          pathname: `${this.backendPathname}/${entityId}`
                        }),
                        properties: options.properties,
                        timeout: options.timeout,
                        body: entity,
                        client: this.client
                      });

                      // Send a POST request, and update the url.
                      if (operation === SyncOperation.Create) {
                        // If the entity was created locally then delete the autogenerated _id
                        if (isDefined(entity._kmd) && entity._kmd.local === true) {
                          local = true;
                          delete entity._id;
                        }

                        request.method = RequestMethod.POST;
                        request.url = url.format({
                          protocol: this.client.apiProtocol,
                          host: this.client.apiHost,
                          pathname: this.backendPathname
                        });
                      }

                      return request.execute()
                        .then(response => response.data)
                        .then((entity) => {
                          // Remove the sync entity
                          const request = new CacheRequest({
                            method: RequestMethod.DELETE,
                            url: url.format({
                              protocol: this.client.apiProtocol,
                              host: this.client.apiHost,
                              pathname: `${this.pathname}/${syncEntity._id}`
                            }),
                            properties: options.properties,
                            timeout: options.timeout
                          });
                          return request.execute()
                            .then(() => {
                              // Save the result of the network request locally.
                              const request = new CacheRequest({
                                method: RequestMethod.PUT,
                                url: url.format({
                                  protocol: this.client.apiProtocol,
                                  host: this.client.apiHost,
                                  pathname: `${this.backendPathname}/${entity._id}`
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
                                const request = new CacheRequest({
                                  method: RequestMethod.DELETE,
                                  url: url.format({
                                    protocol: this.client.apiProtocol,
                                    host: this.client.apiHost,
                                    pathname: `${this.backendPathname}/${entityId}`
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
                  error: new SyncError('Unable to sync the entity since the operation was not recognized.', syncEntity)
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
  pull(query?: Query, options?: DataStoreRequestOptions) {
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
        let request = new KinveyRequest({
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
          request = new DeltaFetchRequest(request);
        }

        // Execute the request
        return request.execute();
      })
      .then(response => response.data)
      .then((entities) => {
        return this.clear(query, options)
          .then(() => {
            const request = new CacheRequest({
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
  sync(query?: Query, options?: DataStoreRequestOptions) {
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
          const request = new CacheRequest({
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
  static collection(collection, type? = DataStoreType.Cache, config?: DataStoreConfig) {
    if (isDefined(collection) === false || isString(collection) === false) {
      throw new KinveyError('A collection is required and must be a string.');
    }

    return new DataStore(collection, type, config);
  }

  /**
   * Clear the cache. This will delete all data in the cache.
   *
   * @param  {Object} [options={}] Options
   * @return {Promise<Object>} The result of clearing the cache.
   */
  static clearCache(options = {}) {
    const client = options.client || Client.sharedInstance();
    const pathname = `/${appdataNamespace}/${client.appKey}`;
    const request = new CacheRequest({
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
