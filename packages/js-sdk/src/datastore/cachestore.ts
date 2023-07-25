import { isArray, times } from 'lodash-es';
import { Observable } from 'rxjs';
import { Query } from '../query';
import { KinveyError } from '../errors/kinvey';
import { MissingConfigurationError } from '../errors/missingConfiguration';
import { ParameterValueOutOfRangeError } from '../errors/parameterValueOutOfRange';
import { NotFoundError } from '../errors/notFound';
import { Aggregation } from '../aggregation';
import { formatKinveyBaasUrl, KinveyBaasNamespace, KinveyHttpRequest, HttpRequestMethod, KinveyHttpAuth, KinveyHttpHeaders } from '../http';
import { LiveServiceReceiver } from '../live';
import { DataStoreCache, QueryCache } from './cache';
import { queryToSyncQuery, Sync } from './sync';
import { NetworkStore } from './networkstore';
import { getApiVersion } from '../kinvey';

const PAGE_LIMIT = 10000;

export class InvalidDeltaSetQueryError extends KinveyError {
  constructor(message = 'Invalid delta set query.') {
    super(message);
    this.name = 'InvalidDeltaSetQueryError';
  }
}

export class CacheStore {
  public collectionName: string;
  public tag?: string;
  public useDeltaSet: boolean;
  public useAutoPagination: boolean;
  public autoSync: boolean;

  constructor(collectionName: string, options: any = { tag: undefined, useDeltaSet: false, useAutoPagination: false, autoSync: true }) {
    this.collectionName = collectionName;
    this.tag = options.tag;
    this.useDeltaSet = options.useDeltaSet === true;
    this.useAutoPagination = options.useAutoPagination === true || options.autoPagination;
    this.autoSync = options.autoSync === true;
  }

  get pathname() {
    return `/${this.collectionName}`;
  }

  find(query?: Query, options: any = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const stream = Observable.create(async (observer: any) => {
      try {
        const cachedDocs = await cache.find(query);
        observer.next(cachedDocs);

        if (autoSync) {
          await this.pull(query, options);
          const docs = await cache.find(query);
          observer.next(docs);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  count(query?: Query, options: any = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const stream = Observable.create(async (observer: any) => {
      try {
        const cacheCount = await cache.count(query);
        observer.next(cacheCount);

        if (autoSync) {
          const network = new NetworkStore(this.collectionName);
          const count = await network.count(query, options).toPromise();
          observer.next(count);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  group(aggregation: Aggregation, options: any = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const stream = Observable.create(async (observer: any) => {
      try {
        const cacheResult = await cache.group(aggregation);
        observer.next(cacheResult);

        if (autoSync) {
          const network = new NetworkStore(this.collectionName);
          const networkResult = await network.group(aggregation, options).toPromise();
          observer.next(networkResult);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  findById(id: string, options: any = {}) {
    const stream = Observable.create(async (observer: any) => {
      try {
        // if (!id) {
        //   throw new Error('No id was provided. A valid id is required.');
        // }

        if (!id) {
          observer.next(undefined);
        } else {
          const autoSync = options.autoSync === true || this.autoSync;
          const cache = new DataStoreCache(this.collectionName, this.tag);
          const cachedDoc = await cache.findById(id);

          if (!cachedDoc) {
            if (!autoSync) {
              throw new NotFoundError();
            }

            observer.next(undefined);
          } else {
            observer.next(cachedDoc);
          }

          if (autoSync) {
            const doc = await this.pullById(id, options);
            observer.next(doc);
          }
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  private async _checkForDuplicateId(docs, cache) {
    // Check if the array itself has duplicate ids
    if (docs.length > 1) {
      const ids = new Set();
      docs.forEach((doc) => {
        if (doc._id) {
          if (ids.has(doc._id)) {
            throw new KinveyError(`The array contains more than one entity with _id '${doc._id}'.`);
          }

          ids.add(doc._id);
        }
      });
    }

    // Check if the id of any doc already exists in the cache
    return Promise.all(docs.map(async (doc) => {
      if (doc._id && await cache.findById(doc._id) != null) {
        throw new KinveyError(`An entity with _id '${doc._id}' already exists.`);
      }
    }));
  }

  private async _createOne(doc: any, options: any = {}) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to create an array of entities. Use "create" method to insert multiple entities.');
    }

    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.collectionName, this.tag);
    await this._checkForDuplicateId([doc], cache);
    const cachedDoc = await cache.save(doc);
    const sync = new Sync(this.collectionName, this.tag);
    const syncDoc = await sync.addCreateSyncEvent(cachedDoc);

    if (autoSync) {
      const query = new Query().equalTo('_id', syncDoc._id);
      const pushResults = await sync.push(query, options);
      const pushResult = pushResults.shift();

      if (pushResult.error) {
        throw pushResult.error;
      }

      return pushResult.entity;
    }

    return cachedDoc;
  }

  private async _createMany(docs: any, options: any = {}) {
    const apiVersion = getApiVersion();
    if (apiVersion < 5) {
      throw new KinveyError('Unable to create an array of entities. Please create entities one by one or use API version 5 or newer.');
    }

    if (docs.length === 0) {
      throw new KinveyError('Unable to create an array of entities. The array must not be empty.');
    }

    const createManyResult = {
      entities: new Array(docs.length).fill(null),
      errors: []
    };

    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.collectionName, this.tag);
    await this._checkForDuplicateId(docs, cache);
    const sync = new Sync(this.collectionName, this.tag);
    const cachedDocs = await cache.save(docs);
    let syncDocs = await sync.addCreateSyncEvent(cachedDocs);

    if (autoSync) {
      const query = new Query().contains('_id', syncDocs.map((doc) => doc._id));
      syncDocs = await sync.push(query, options);
    }

    syncDocs.map((syncDoc, index) => {
      if (syncDoc.error) {
        createManyResult.errors.push(syncDoc.error);
      } else {
        createManyResult.entities[index] = syncDoc.entity;
      }
    });

    return createManyResult;
  }

  async create(docs: any, options: any = {}) {
    if (!isArray(docs)) {
      return this._createOne(docs, options);
    }

    return this._createMany(docs, options);
  }

  async update(doc: any, options: any = {}) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to update an array of entities. Please update entities one by one.');
    }

    if (!doc._id) {
      throw new KinveyError('The entity provided does not contain an _id. An _id is required to update the entity.');
    }

    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    const cachedDoc = await cache.save(doc);
    const syncDoc = await sync.addUpdateSyncEvent(cachedDoc);

    if (autoSync) {
      const query = new Query().equalTo('_id', syncDoc._id);
      const pushResults = await sync.push(query, options);
      const pushResult = pushResults.shift();

      if (pushResult.error) {
        throw pushResult.error;
      }

      return pushResult.entity;
    }

    return cachedDoc;
  }

  async save(doc: any, options?: any) {
    const apiVersion = getApiVersion();
    if (apiVersion >= 5 && isArray(doc)) {
      throw new KinveyError('Unable to save an array of entities. Use "create" method to insert multiple entities.');
    }

    if (doc._id) {
      return this.update(doc, options);
    }

    return this.create(doc, options);
  }

  async remove(query?: Query, options: any = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    let count = 0;

    // Find the docs that will be removed from the cache that match the query
    const docs = await cache.find(query);

    if (docs.length > 0) {
      // Remove docs from the cache
      count = await cache.remove(query);

      // Add delete events for the removed docs to sync
      await sync.addDeleteSyncEvent(docs);
    }

    // Remove the docs from the backend
    if (autoSync) {
      // Remove the docs on the backend
      const network = new NetworkStore(this.collectionName);
      const result = await network.remove(query, options);
      count = result.count;

      // Clear the sync items that match the query
      await this.clearSync(query);
    }

    return { count };
  }

  async removeById(id: string, options: any = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    let count = 0;

    if (id) {
      // Find the doc that will be removed
      const doc = await cache.findById(id);

      if (doc) {
        // Remove the doc from the cache
        count = await cache.removeById(id);

        // Add delete event for the removed doc to sync
        const syncDoc = await sync.addDeleteSyncEvent(doc);

        // Remove the doc from the backend
        if (autoSync && syncDoc) {
          const query = new Query().equalTo('_id', syncDoc._id);
          const pushResults = await sync.push(query);

          if (pushResults.length > 0) {
            const pushResult = pushResults.shift();
            if (pushResult.error) {
              count -= 1;
            }
          }
        } else {
          count = 1;
        }
      } else {
        throw new NotFoundError();
      }
    }

    return { count };
  }

  async clear(query?: Query) {
    // Remove the docs from the cache
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const count = await cache.remove(query);

    // Remove the sync events
    await this.clearSync(query);

    // Clear the query cache
    if (!query) {
      const queryCache = new QueryCache(this.tag);
      queryCache.remove();
    }

    // Return the count
    return { count };
  }

  push(query?: Query, options: any = {}) {
    const sync = new Sync(this.collectionName, this.tag);
    // eslint-disable-next-line no-param-reassign
    options.catchGeneralErrors = true;
    return sync.push(undefined, options);
  }

  async _pullInternal(query: Query = new Query(), pullOptions: any = {}, options: { paginationCountsOnly?: boolean } = {}) : Promise<any[]|number> {
    const network = new NetworkStore(this.collectionName);
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const queryCache = new QueryCache(this.tag);
    const useDeltaSet = pullOptions.useDeltaSet === true || this.useDeltaSet;
    const useAutoPagination = pullOptions.useAutoPagination === true || pullOptions.autoPagination || this.useAutoPagination;

    // Retrieve existing queryCacheDoc
    const queryCacheDocs = await queryCache.find(new Query().equalTo('query', query.key).equalTo('collectionName', this.collectionName));
    const queryCacheDoc = queryCacheDocs.shift() || { collectionName: this.collectionName, query: query.key, lastRequest: null };

    // Push sync queue
    const count = await this.pendingSyncCount();
    if (count > 0) {
      // TODO in newer version
      // if (autoSync) {
      //   await sync.push();
      //   return this.pull(query, Object.assign({}, { useDeltaSet, useAutoPagination, autoSync }, options));
      // }

      if (count === 1) {
        throw new KinveyError(`Unable to pull entities from the backend. There is ${count} entity`
          + ' that needs to be pushed to the backend.');
      }

      throw new KinveyError(`Unable to pull entities from the backend. There are ${count} entities`
        + ' that need to be pushed to the backend.');
    }

    // Delta set
    if (useDeltaSet && queryCacheDoc.lastRequest) {
      try {
        const queryObject = Object.assign({ since: queryCacheDoc.lastRequest }, query.toQueryObject());

        // Delta Set request
        const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/_deltaset`, queryObject);
        const request = new KinveyHttpRequest({ method: HttpRequestMethod.GET, auth: KinveyHttpAuth.Session, url });
        const response = await request.execute();
        const { changed, deleted } = response.data;

        // Delete the docs that have been deleted
        if (Array.isArray(deleted) && deleted.length > 0) {
          const removeQuery = new Query().contains('_id', deleted.map(doc => doc._id));
          await cache.remove(removeQuery);
        }

        // Save the docs that changed
        if (Array.isArray(changed) && changed.length > 0) {
          await cache.save(changed);
        }

        // Update the query cache
        const headers = new KinveyHttpHeaders(response.headers.toPlainObject());
        queryCacheDoc.lastRequest = headers.requestStart;
        await queryCache.save(queryCacheDoc);

        return changed;
      } catch (error) {
        if (!(error instanceof MissingConfigurationError) && !(error instanceof ParameterValueOutOfRangeError)) {
          throw error;
        }
      }
    }

    // Auto pagination
    if (useAutoPagination) {
      // Clear the cache
      await cache.clear();

      // Get the total count of docs
      const response = await network.count(query, Object.assign({}, pullOptions, { rawResponse: true })).toPromise();
      const count = 'count' in response.data ? response.data.count : Number.MAX_SAFE_INTEGER;

      // Create the pages
      const pageSize = pullOptions.autoPaginationPageSize || (pullOptions.autoPagination && pullOptions.autoPagination.pageSize) || PAGE_LIMIT;
      const pageCount = Math.ceil(count / pageSize);
      const pageQueries = times(pageCount, (i) => {
        const pageQuery = new Query(query);
        pageQuery.skip = i * pageSize;
        pageQuery.limit = Math.min(count - (i * pageSize), pageSize);
        return pageQuery;
      });

      // Process the pages
      const returnCounts = options && options.paginationCountsOnly;
      const pagePromises: Promise<any[]|number>[] = pageQueries.map((pageQuery) => {
        return network.find(pageQuery, pullOptions).toPromise()
          .then((docs: {}) => cache.save(docs))
          .then((docs: any[]) => {
            if (returnCounts) {
              return docs.length;
            }
            return docs;
          });
      });
      const paginationResults = await Promise.all(pagePromises);

      // Update the query cache
      const headers = new KinveyHttpHeaders(response.headers.toPlainObject());
      queryCacheDoc.lastRequest = headers.requestStart;
      await queryCache.save(queryCacheDoc);

      if (returnCounts) {
        return paginationResults.reduce((result: number, current: number) => (result + current), 0);
      }
      return paginationResults.reduce((result: any[], pageDocs: any[]) => result.concat(pageDocs), []);
    }

    // Find the docs on the backend
    const response = await network.find(query, Object.assign({}, pullOptions, { rawResponse: true })).toPromise();
    const docs = response.data;

    // Remove the docs matching the provided query
    if (query) {
      await cache.remove(query);
    } else {
      await cache.clear();
    }

    // Update the cache
    await cache.save(docs);

    /// Update the query cache
    const headers = new KinveyHttpHeaders(response.headers.toPlainObject());
    queryCacheDoc.lastRequest = headers.requestStart;
    await queryCache.save(queryCacheDoc);

    return docs;
  }

  async pull(query: Query = new Query(), options: any = {}) {
    const docs = await this._pullInternal(new Query({ filter: query.filter }), options, { paginationCountsOnly: true });
    return Array.isArray(docs) ? docs.length : docs;
  }

  async pullById(id: string, options: any = {}) {
    const network = new NetworkStore(this.collectionName);
    const cache = new DataStoreCache(this.collectionName, this.tag);

    // Push sync queue
    const count = await this.pendingSyncCount();
    if (count > 0) {
      // TODO in newer version
      // if (autoSync) {
      //   await sync.push();
      //   return this.pull(query, Object.assign({}, { useDeltaSet, useAutoPagination, autoSync }, options));
      // }

      if (count === 1) {
        throw new KinveyError(`Unable to pull entities from the backend. There is ${count} entity`
          + ' that needs to be pushed to the backend.');
      }

      throw new KinveyError(`Unable to pull entities from the backend. There are ${count} entities`
        + ' that need to be pushed to the backend.');
    }

    try {
      // Find the doc on the backend
      const doc = await network.findById(id, options).toPromise();

      // Update the doc in the cache
      await cache.save(doc);

      // Return the doc
      return doc;
    } catch (error) {
      if (error instanceof NotFoundError) {
        // Remove the doc from the cache
        await cache.removeById(id);
      }

      throw error;
    }
  }

  async sync(query?: Query, options?: any) {
    const push = await this.push(undefined, options);
    const pull = await this.pull(query, options);
    return { push, pull };
  }

  async pendingSyncDocs(query?: Query) {
    const sync = new Sync(this.collectionName, this.tag);
    return sync.find(queryToSyncQuery(query));
  }

  pendingSyncEntities(query?: Query) {
    return this.pendingSyncDocs(query);
  }

  async pendingSyncCount(query?: Query) {
    const syncDocs = await this.pendingSyncDocs(query);
    return syncDocs.length;
  }

  async clearSync(query?: Query) {
    const sync = new Sync(this.collectionName, this.tag);
    return sync.remove(queryToSyncQuery(query));
  }

  async subscribe(receiver: LiveServiceReceiver, options?: any) {
    const network = new NetworkStore(this.collectionName);
    return network.subscribe(receiver, options);
  }

  async unsubscribe(options?: any) {
    const network = new NetworkStore(this.collectionName);
    return network.unsubscribe(options);
  }
}
