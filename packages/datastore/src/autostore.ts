// import isArray from 'lodash/isArray';
import { Doc } from '@kinveysdk/storage';
import { NetworkError, KinveyError } from '@kinveysdk/errors';
import { Query } from '@kinveysdk/query';
// import { getApiVersion } from '@kinveysdk/app';
import { NetworkStore } from './networkstore';
import { DataStoreNetwork, FindNetworkOptions, NetworkOptions } from './network';
import { DataStoreCache, isValidTag } from './cache';
import { Sync, SyncPushResult } from './sync';

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

  // create(doc: T, options?: NetworkOptions): Promise<SyncPushResult>
  // create(docs: T[], options?: NetworkOptions): Promise<SyncPushResult[]>
  // async create(docs: any, options?: NetworkOptions): Promise<any> {
  //   const apiVersion = getApiVersion();

  //   if (apiVersion < 5 && isArray(docs)) {
  //     throw new KinveyError('Unable to create an array of docs. Please create docs one by one.');
  //   }

  //   if (!isArray()) {
  //     const results = await this.create([docs], options);
  //     return results.shift();
  //   }

  //   const cache = new DataStoreCache(this.collectionName, this.tag);
  //   const sync = new Sync(this.collectionName, this.tag);

  //   // Save the docs to the cache
  //   const cachedDocs = await cache.save(docs as T[]);

  //   // Attempt to sync the docs with the backend
  //   const syncDocs = await sync.addCreateSyncOperation(cachedDocs);
  //   return sync.push(syncDocs, options);
  // }

  // async update(doc: T, options?: NetworkOptions): Promise<SyncPushResult> {
  //   if (isArray(doc)) {
  //     throw new KinveyError('Unable to update an array of docs. Please update docs one by one.');
  //   }

  //   const cache = new DataStoreCache(this.collectionName, this.tag);
  //   const sync = new Sync(this.collectionName, this.tag);

  //   // Save the doc to the cache
  //   const cachedDoc = await cache.save(doc);

  //   // Attempt to sync the docs with the backend
  //   const syncDocs = await sync.addCreateSyncOperation([cachedDoc]);
  //   const results = await sync.push(syncDocs, options);
  //   return results.shift();
  // }

  async pull(query?: Query<T>, options?: FindNetworkOptions): Promise<number> {
    const network = new DataStoreNetwork(this.collectionName);
    const cache = new DataStoreCache<T>(this.collectionName);
    const response = await network.find(query, options);
    const docs = response.data;
    await cache.save(docs);
    return docs.length;
  }

  async push(options?: NetworkOptions): Promise<SyncPushResult[]> {
    const sync = new Sync(this.collectionName, this.tag);
    const syncDocs = await sync.find();
    return sync.push(syncDocs, options);
  }
}
