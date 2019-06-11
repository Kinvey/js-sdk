/* eslint no-underscore-dangle: "off" */

import isArray from 'lodash/isArray';
import { Doc } from '@kinveysdk/storage';
import { NetworkError, KinveyError } from '@kinveysdk/errors';
import { Query } from '@kinveysdk/query';
import { getApiVersion } from '@kinveysdk/app';
import { NetworkStore, MultiInsertResult } from './networkstore';
import { DataStoreNetwork, FindNetworkOptions, NetworkOptions } from './network';
import { DataStoreCache, QueryCache, SyncDoc, isValidTag, QueryDoc } from './cache';
import { Sync, SyncPushResult } from './sync';

export interface PullOptions extends FindNetworkOptions {
  useDeltaSet?: boolean;
  useAutoPagination?: boolean;
  autoPaginationPageSize?: number;
}

export class AutoStore<T extends Doc> extends NetworkStore<T> {
  public tag?: string;

  constructor(collectionName: string, tag?: string) {
    super(collectionName);

    if (tag && !isValidTag(tag)) {
      throw new KinveyError('The provided tag is not valid.', 'A tag can only contain letters, numbers, and "-".');
    }

    this.tag = tag;
  }

  async find(query?: Query<T>, options?: FindNetworkOptions): Promise<T[]> {
    const cache = new DataStoreCache<T>(this.collectionName);

    try {
      await this.pull(query, options);
      return cache.find(query);
    } catch (error) {
      if (error instanceof NetworkError) {
        return cache.find(query);
      }
      throw error;
    }
  }

  async findById(id: string, options?: FindNetworkOptions): Promise<T> {
    const cache = new DataStoreCache<T>(this.collectionName);

    try {
      const query = new Query<T>().equalTo('_id', id);
      await this.pull(query, options);
      return cache.findById(id);
    } catch (error) {
      if (error instanceof NetworkError) {
        return cache.findById(id);
      }
      throw error;
    }
  }

  create(doc: T, options?: NetworkOptions): Promise<T>
  create(docs: T[], options?: NetworkOptions): Promise<MultiInsertResult<T>>
  async create(docs: any, options?: NetworkOptions): Promise<any> {
    const apiVersion = getApiVersion();

    if (apiVersion < 5 && isArray(docs)) {
      throw new KinveyError('Unable to create an array of docs. Please create docs one by one.');
    }

    if (!isArray()) {
      const result = await this.create([docs], options);
      const error = result.errors.shift();
      if (error) {
        throw error;
      }
      return result.entities.shift();
    }

    const cache = new DataStoreCache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);

    // Save the docs to the cache
    const cachedDocs = await cache.save(docs as T[]);

    // Attempt to sync the docs with the backend
    const syncDocs = await sync.addCreateSyncOperation(cachedDocs);
    const results = await sync.push(syncDocs, options);
    return results.reduce((multiInsertResult, result): MultiInsertResult<T> => {
      multiInsertResult.entities.push(result.doc);
      multiInsertResult.errors.push(result.error);
      return multiInsertResult;
    }, { entities: [], errors: [] });
  }

  async update(doc: T, options?: NetworkOptions): Promise<T> {
    if (isArray(doc)) {
      throw new KinveyError('Unable to update an array of docs. Please update docs one by one.');
    }

    if (!doc._id) {
      throw new KinveyError('Doc is missing _id.');
    }

    const cache = new DataStoreCache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);

    // Save the doc to the cache
    const cachedDoc = await cache.save(doc);

    // Attempt to sync the docs with the backend
    const syncDocs = await sync.addCreateSyncOperation([cachedDoc]);
    const results = await sync.push(syncDocs, options);
    const result = results.shift();
    if (result.error) {
      throw result.error;
    }
    return result.doc as T;
  }

  async pendingSyncDocs(): Promise<SyncDoc[]> {
    const sync = new Sync(this.collectionName, this.tag);
    return sync.find();
  }

  async pendingSyncCount(): Promise<number> {
    const syncDocs = await this.pendingSyncDocs();
    return syncDocs.length;
  }

  async pull(query?: Query<T>, options?: FindNetworkOptions): Promise<number> {
    const pullQuery = new Query({ filter: query.filter });
    const network = new DataStoreNetwork(this.collectionName);
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const queryCache = new QueryCache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);

    // Push sync queue
    const count = await this.pendingSyncCount();
    if (count > 0) {
      await sync.push();
      return this.pull(query, options);
    }

    // Retrieve existing queryCacheDoc
    const queryCacheDoc: QueryDoc = (await queryCache.findById(pullQuery.key)) || { collectionName: this.collectionName, query: pullQuery.key, lastRequest: null };

    // Find the docs on the backend
    const response = await network.find(pullQuery, options);
    const docs = response.data;

    // Remove the docs matching the provided query
    if (pullQuery) {
      await cache.remove(pullQuery);
    } else {
      await cache.remove();
    }

    // Update the cache
    await cache.save(docs);

    // Update the query cache
    queryCacheDoc.lastRequest = response.headers.requestStart;
    await queryCache.save(queryCacheDoc);

    // Return the number of docs
    return docs.length;
  }

  async push(options?: NetworkOptions): Promise<SyncPushResult[]> {
    const sync = new Sync(this.collectionName, this.tag);
    const syncDocs = await sync.find();
    return sync.push(syncDocs, options);
  }
}
