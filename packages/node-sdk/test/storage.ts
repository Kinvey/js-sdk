/* eslint class-methods-use-this: "off" */

import { StorageAdapter, setStorageAdapter, Doc } from '../src/storage';

const store = new Map<string, Map<string, any>>();

function getCollection(namespace: string, collectionName: string): Map<string, any> {
  return store.get(`${namespace}.${collectionName}`) || new Map<string, any>();
}

function setCollection(namespace: string, collectionName: string, collection: Map<string, any>): void {
  store.set(`${namespace}.${collectionName}`, collection);
}

export class Memory implements StorageAdapter<Doc> {
  async count(namespace: string, collectionName: string): Promise<number> {
    const docs = await this.find(namespace, collectionName);
    return docs.length;
  }

  async find(namespace: string, collectionName: string): Promise<any[]> {
    const collection = getCollection(namespace, collectionName);
    return Array.from(collection.values());
  }

  async findById(namespace: string, collectionName: string, id: string): Promise<Doc> {
    const docs = await this.find(namespace, collectionName);
    return docs.find((doc): boolean => doc._id === id);
  }

  async save(namespace: string, collectionName: string, docs: Doc[]): Promise<Doc[]> {
    const collection = getCollection(namespace, collectionName);
    docs.forEach(
      (doc): void => {
        collection.set(doc._id, doc);
      }
    );
    setCollection(namespace, collectionName, collection);
    return docs;
  }

  async removeById(namespace: string, collectionName: string, id: string): Promise<number> {
    const collection = getCollection(namespace, collectionName);
    if (collection.delete(id)) {
      setCollection(namespace, collectionName, collection);
      return 1;
    }
    return 0;
  }

  async clear(namespace: string, collectionName: string): Promise<number> {
    const count = await this.count(namespace, collectionName);
    store.delete(`${namespace}.${collectionName}`);
    return count;
  }

  clearDatabase(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export function register(): void {
  setStorageAdapter(new Memory());
}
