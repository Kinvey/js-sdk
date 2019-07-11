/* eslint class-methods-use-this: "off" */

import isArray from 'lodash/isArray';
import PQueue from 'p-queue';
import { KinveyError } from '../errors';
import { KmdObject } from '../kmd';
import { AclObject } from '../acl';
import { generateId } from './utils';

const QUEUE = new PQueue({ concurrency: 1 });

export interface Doc {
  _id?: string;
  _acl?: AclObject;
  _kmd?: KmdObject;
}

export interface StorageAdapter {
  count(namespace: string, collectionName: string): Promise<number>;
  find(namespace: string, collectionName: string): Promise<any[]>;
  findById(namespace: string, collectionName: string, id: string): Promise<any>;
  save(namespace: string, collectionName: string, docs: any[]): Promise<any[]>;
  removeById(namespace: string, collectionName: string, id: string): Promise<number>;
  clear(namespace: string, collectionName: string): Promise<number>;
  clearDatabase(namespace: string, exclude?: string[]): Promise<void>;
}

let adapter: StorageAdapter = {
  count(namespace: string, collectionName: string): Promise<number> {
    throw new KinveyError('You must override the default storage adapter with a platform specific storage adapter.');
  },
  find(namespace: string, collectionName: string): Promise<any[]> {
    throw new KinveyError('You must override the default storage adapter with a platform specific storage adapter.');
  },
  findById(namespace: string, collectionName: string, id: string): Promise<any> {
    throw new KinveyError('You must override the default storage adapter with a platform specific storage adapter.');
  },
  save(namespace: string, collectionName: string, docs: any[]): Promise<any[]> {
    throw new KinveyError('You must override the default storage adapter with a platform specific storage adapter.');
  },
  removeById(namespace: string, collectionName: string, id: string): Promise<number> {
    throw new KinveyError('You must override the default storage adapter with a platform specific storage adapter.');
  },
  clear(namespace: string, collectionName: string): Promise<number> {
    throw new KinveyError('You must override the default storage adapter with a platform specific storage adapter.');
  },
  clearDatabase(namespace: string, exclude?: string[]): Promise<void> {
    throw new KinveyError('You must override the default storage adapter with a platform specific storage adapter.');
  }
};

export function setStorageAdapter(_adapter: StorageAdapter): void {
  adapter = _adapter;
}

export function getStorageAdapter(): StorageAdapter {
  return adapter;
}

export class Storage<T extends Doc> {
  public namespace: string;
  public collectionName: string;

  constructor(namespace: string, collectionName: string) {
    this.namespace = namespace;
    this.collectionName = collectionName;
  }

  count(): Promise<number> {
    return QUEUE.add((): Promise<number> => getStorageAdapter().count(this.namespace, this.collectionName));
  }

  find(): Promise<T[]> {
    return QUEUE.add((): Promise<T[]> => getStorageAdapter().find(this.namespace, this.collectionName));
  }

  findById(id: string): Promise<T> {
    return QUEUE.add((): Promise<T> => getStorageAdapter().findById(this.namespace, this.collectionName, id));
  }

  save(docsToSave: T): Promise<T>;
  save(docsToSave: T[]): Promise<T[]>;
  async save(docsToSave: any): Promise<any> {
    if (!isArray(docsToSave)) {
      const savedDocs = await this.save([docsToSave]);
      return savedDocs.shift();
    }

    return QUEUE.add(
      async (): Promise<T[]> => {
        // Clone the docs
        let docs = docsToSave.slice(0, docsToSave.length);

        // Add _id if it is missing
        if (docs.length > 0) {
          docs = docs.map(
            (doc: T): T => {
              if (!doc._id) {
                return Object.assign({}, doc, {
                  _id: generateId(),
                  _kmd: Object.assign({}, doc._kmd, { local: true })
                });
              }
              return doc;
            }
          );
        }

        await getStorageAdapter().save(this.namespace, this.collectionName, docs);
        return docs;
      }
    );
  }

  removeById(id: string): Promise<number> {
    return QUEUE.add((): Promise<number> => getStorageAdapter().removeById(this.namespace, this.collectionName, id));
  }

  clear(): Promise<number> {
    return QUEUE.add((): Promise<number> => getStorageAdapter().clear(this.namespace, this.collectionName));
  }
}
