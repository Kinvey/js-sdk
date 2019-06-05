/* eslint no-underscore-dangle: "off" */

import isString from 'lodash/isString';
import { Storage, Doc } from '@kinveysdk/storage';
import { getAppKey } from '@kinveysdk/app';
import { KinveyError } from '@kinveysdk/errors';
import { Query } from '@kinveysdk/query';
import { isArray } from 'util';

const SYNC_CACHE_COLLECTION_NAME = '__KinveySync';

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

  save(doc: T): Promise<T>
  save(docs: T[]): Promise<T[]>
  async save(docs: any): Promise<any> {
    let docsToSave;
    let singular = false;

    if (isArray(docs)) {
      docsToSave = [].concat(docs);
    } else {
      docsToSave = [].concat([docs]);
      singular = true;
    }

    const savedDocs = await super.save(docsToSave);
    return singular ? savedDocs.shift() : savedDocs;
  }

  async remove(query?: Query<T>): Promise<number> {
    const docs = await this.find(query);
    const results = await Promise.all(docs.map((doc): Promise<number> => {
      if (!doc._id) {
        throw new KinveyError(`Unable to remove doc ${JSON.stringify(doc)}`, 'This doc is missing an _id.');
      }
      return this.removeById(doc._id);
    }));
    return results.reduce((totalCount: number, count: number): number => totalCount + count, 0);
  }
}

export enum SyncOperation {
  Create = 'POST',
  Update = 'PUT',
  Delete = 'DELETE'
};

export interface SyncDoc extends Doc {
  doc: Doc;
  collectionName: string;
  state: {
    operation: SyncOperation;
  }
}

export class SyncCache extends DataStoreCache<SyncDoc> {
  constructor() {
    super(SYNC_CACHE_COLLECTION_NAME);
  }
}
