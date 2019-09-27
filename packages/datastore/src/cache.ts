import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import { getAppKey } from '@progresskinvey/js-sdk-init';
import { clear, Storage, Entity } from '@progresskinvey/js-sdk-storage';
import { Query } from '@progresskinvey/js-sdk-query';
import { Aggregation } from '@progresskinvey/js-sdk-aggregation';

const SYNC_CACHE_TAG = 'kinvey_sync';
const QUERY_CACHE_TAG = '_QueryCache';

export function isValidTag(tag: string): boolean {
  const regexp = /^[a-z0-9-]+$/i;
  return isString(tag) && regexp.test(tag);
}

export class DataStoreCache<T extends Entity> extends Storage<T> {
  constructor(collectionName: string, tag?: string) {
    if (tag && !isValidTag(tag)) {
      throw new Error('A tag can only contain letters, numbers, and "-".');
    }

    if (tag) {
      super(getAppKey(), `${collectionName}.${tag}`);
    } else {
      super(getAppKey(), collectionName);
    }
  }

  async find(query?: Query): Promise<T[]> {
    const entities = await super.find();

    if (query) {
      return query.process(entities);
    }

    return entities;
  }

  async count(query?: Query): Promise<number> {
    const entities = await this.find(query);
    return entities.length;
  }

  async group<K>(aggregation: Aggregation<K>): Promise<K> {
    const entities = await this.find(aggregation.query);
    return aggregation.process(entities);
  }

  save(entity: T): Promise<T>;
  save(entities: T[]): Promise<T[]>;
  async save(entities: any): Promise<any> {
    if (!isArray(entities)) {
      const result = await this.save([entities]);
      return result.shift();
    }

    return super.save(entities);
  }

  async remove(query?: Query): Promise<number> {
    const entities = await this.find(query);
    const results = await Promise.all(
      entities.map(
        (entity): Promise<number> => {
          if (!entity._id) {
            throw new Error(`Unable to remove entity: ${JSON.stringify(entity)}. This doc is missing an _id.`);
          }
          return this.removeById(entity._id);
        }
      )
    );
    return results.reduce((totalCount: number, count: number): number => totalCount + count, 0);
  }

  static clear(): Promise<boolean> {
    return clear(getAppKey());
  }
}

export enum SyncOperation {
  Create = 'POST',
  Update = 'PUT',
  Delete = 'DELETE',
}

export interface SyncEntity extends Entity {
  entityId: string;
  collection: string;
  state: {
    operation: SyncOperation;
  };
}

export class SyncCache extends DataStoreCache<SyncEntity> {
  constructor(tag?: string) {
    super(SYNC_CACHE_TAG, tag);
  }
}

export interface QueryEntity extends Entity {
  collectionName: string;
  query: string;
  lastRequest: string | null;
}

export class QueryCache extends DataStoreCache<QueryEntity> {
  constructor(tag?: string) {
    super(QUERY_CACHE_TAG, tag);
  }
}
