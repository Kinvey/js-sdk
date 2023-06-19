import { get } from 'lodash-es';
import { Query } from '../query';
import { NetworkError } from '../errors/network';
import { KinveyError } from '../errors/kinvey';
import { Aggregation } from '../aggregation';
import { DataStoreCache, QueryCache } from './cache';
import { NetworkStore } from './networkstore';
import { CacheStore } from './cachestore';

export class AutoStore extends CacheStore {
  constructor(collectionName: string, options: any = { tag: undefined, useDeltaSet: false, useAutoPagination: false }) {
    super(collectionName, options);
  }

  async find(query?: Query, options: any = {}) {
    if (query && !(query instanceof Query)) {
      throw new KinveyError('query is not an instance of the Query class.')
    }

    const cache = new DataStoreCache(this.collectionName, this.tag);
    const useDeltaSet = options.useDeltaSet === true || this.useDeltaSet;
    query = query && new Query(query.toPlainObject());

    try {
      if (useDeltaSet) {
        await this.pull(query, options);
        return await cache.find(query);
      }
      const requiredFields = get(query, 'fields', []);
      if (query) {
        query.fields = [];
      }
      const serverResponse = await this._pullInternal(query, options) as any[];
      if (!requiredFields.length) {
        return serverResponse;
      }
      return new Query({ fields: requiredFields }).process(serverResponse);
    } catch (error) {
      if (error instanceof NetworkError) {
        return cache.find(query);
      }

      throw error;
    }
  }

  async count(query?: Query, options: any = {}) {
    if (query && !(query instanceof Query)) {
      throw new KinveyError('query is not an instance of the Query class.');
    }

    try {
      const network = new NetworkStore(this.collectionName);
      const count = await network.count(query, options).toPromise();
      return count;
    } catch (error) {
      if (error instanceof NetworkError) {
        const cache = new DataStoreCache(this.collectionName, this.tag);
        return cache.count(query);
      }

      throw error;
    }
  }

  async group(aggregation: Aggregation, options: any = {}) {
    if (!(aggregation instanceof Aggregation)) {
      throw new KinveyError('aggregation is not an instance of the Aggregation class.')
    }

    try {
      const network = new NetworkStore(this.collectionName);
      const result = await network.group(aggregation, options).toPromise();
      return result;
    } catch (error) {
      if (error instanceof NetworkError) {
        const cache = new DataStoreCache(this.collectionName, this.tag);
        return cache.group(aggregation);
      }

      throw error;
    }
  }

  async findById(id: string, options: any = {}) {
    const cache = new DataStoreCache(this.collectionName, this.tag);

    try {
      const doc = await this.pullById(id, options);
      return doc;
    } catch (error) {
      if (error instanceof NetworkError) {
        return cache.findById(id);
      }

      throw error;
    }
  }
}
