import isString from 'lodash/isString';
import { Storage, Doc } from '../storage';
import { getAppKey } from '../init';
import { KinveyError } from '../errors';
import { Query } from '../query';

const SYNC_CACHE_COLLECTION_NAME = 'Sync';
const QUERY_CACHE_COLLECTION_NAME = 'Query';

export function isValidTag(tag: string): boolean {
  const regexp = /^[a-z0-9-]+$/i;
  return isString(tag) && regexp.test(tag);
}

export class DataStoreCache<T extends Doc> extends Storage<T> {
  constructor(collectionName: string, tag?: string) {
    if (tag && !isValidTag(tag)) {
      throw new KinveyError('A tag can only contain letters, numbers, and "-".');
    }

    if (tag) {
      super(getAppKey(), `${collectionName}.${tag}`);
    } else {
      super(getAppKey(), collectionName);
    }
  }

  async find(query?: Query<T>): Promise<T[]> {
    const docs = await super.find();
    if (query) {
      return query.process(docs);
    }
    return docs;
  }

  async remove(query?: Query<T>): Promise<number> {
    const docs = await this.find(query);
    const results = await Promise.all(
      docs.map(
        (doc): Promise<number> => {
          if (!doc._id) {
            throw new KinveyError(`Unable to remove doc ${JSON.stringify(doc)}`, 'This doc is missing an _id.');
          }
          return this.removeById(doc._id);
        }
      )
    );
    return results.reduce((totalCount: number, count: number): number => totalCount + count, 0);
  }
}

export enum SyncOperation {
  Create = 'POST',
  Update = 'PUT',
  Delete = 'DELETE'
}

export interface SyncDoc extends Doc {
  doc: Doc;
  state: {
    operation: SyncOperation;
  };
}

export class SyncCache extends DataStoreCache<SyncDoc> {
  constructor(collectionName: string, tag?: string) {
    super(`${SYNC_CACHE_COLLECTION_NAME}.${collectionName}`, tag);
  }
}

export interface QueryDoc extends Doc {
  collectionName: string;
  since?: string;
}

export class QueryCache extends DataStoreCache<QueryDoc> {
  constructor(collectionName: string, tag?: string) {
    super(`${QUERY_CACHE_COLLECTION_NAME}.${collectionName}`, tag);
  }
}
