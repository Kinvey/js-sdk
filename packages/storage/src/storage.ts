import PQueue = require('p-queue');
import { KinveyError } from '@kinveysdk/errors';
import { generateId } from './utils';

const queue = new PQueue({ concurrency: 1 });

export interface Doc {
  _id?: string;
  _kmd?: {
    local?: boolean
  }
}

export interface StorageAdapter<T extends Doc> {
  count(namespace: string, collectionName: string): Promise<number>;
  find(namespace: string, collectionName: string): Promise<T[]>;
  findById(namespace: string, collectionName: string, id: string): Promise<T>;
  save(namespace: string, collectionName: string, docs: T[]): Promise<T[]>;
  removeById(namespace: string, collectionName: string, id: string): Promise<number>;
  clear(namespace: string, collectionName: string): Promise<number>;
  clearDatabase(namespace: string, exclude?: string[]): Promise<void>;
}

export class Storage<T extends Doc> {
  public namespace: string;
  public collectionName: string;

  constructor(namespace: string, collectionName: string) {
    this.namespace = namespace;
    this.collectionName = collectionName;
  }

  get storageAdapter(): StorageAdapter<T> {
    throw new KinveyError('You must override the Storage class and provide a storage adapter.');
  }

  count(): Promise<number> {
    return queue.add((): Promise<number> => this.storageAdapter.count(this.namespace, this.collectionName));
  }

  find(): Promise<T[]> {
    return queue.add((): Promise<T[]> => this.storageAdapter.find(this.namespace, this.collectionName));
  }

  findById(id: string): Promise<T> {
    return queue.add((): Promise<T> => this.storageAdapter.findById(this.namespace, this.collectionName, id));
  }

  save(docsToSave: T[]): Promise<T[]> {
    return queue.add(async (): Promise<T[]> => {
      // Clone the docs
      let docs = docsToSave.slice(0, docsToSave.length);

      // Add _id if it is missing
      if (docs.length > 0) {
        docs = docs.map((doc: T): T => {
          if (!doc._id) {
            return Object.assign({}, doc, {
              _id: generateId(),
              _kmd: Object.assign({}, doc._kmd, { local: true })
            });
          }
          return doc;
        });
      }

      await this.storageAdapter.save(this.namespace, this.collectionName, docs);
      return docs;
    });
  }

  async remove(docs: T[]): Promise<number> {
    return queue.add(async (): Promise<number> => {
      const results = await Promise.all(docs.map((doc): Promise<number> => {
        if (!doc._id) {
          throw new KinveyError(`Unable to remove doc ${JSON.stringify(doc)}`, 'This is missing an _id.');
        }
        return this.removeById(doc._id);
      }));
      return results.reduce((totalCount: number, count: number): number => totalCount + count, 0);
    });
  }

  removeById(id: string): Promise<number> {
    return queue.add((): Promise<number> => this.storageAdapter.removeById(this.namespace, this.collectionName, id));
  }

  clear(): Promise<number> {
    return queue.add((): Promise<number> => this.storageAdapter.clear(this.namespace, this.collectionName));
  }
}
