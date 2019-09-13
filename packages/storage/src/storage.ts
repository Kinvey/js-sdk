import PQueue from 'p-queue';
import { AclObject } from '@progresskinvey/js-sdk-acl';
import { KmdObject } from '@progresskinvey/js-sdk-kmd';

const queue = new PQueue({ concurrency: 1 });

function generateId(length = 24): string {
  const chars = 'abcdef0123456789';
  let id = '';

  for (let i = 0, j = chars.length; i < length; i += 1) {
    const pos = Math.floor(Math.random() * j);
    id += chars.substring(pos, pos + 1);
  }

  return id;
}

export interface Entity {
  _id?: string;
  _acl?: AclObject;
  _kmd?: KmdObject;
}

export interface StorageAdapter {
  find<T>(namespace: string, collectionName: string): Promise<T[]>;
  findById<T>(namespace: string, collectionName: string, id: string): Promise<T>;
  save<T>(namespace: string, collectionName: string, docs: T[]): Promise<T[]>;
  removeById(namespace: string, collectionName: string, id: string): Promise<number>;
  clear(namespace: string, collectionName: string): Promise<boolean>;
  clearAll(namespace: string, exclude?: string[]): Promise<boolean>;
}

let adapter: StorageAdapter = {
  async find() {
    throw new Error('Please override the default storage adapter.');
  },
  async findById() {
    throw new Error('Please override the default storage adapter.');
  },
  async save() {
    throw new Error('Please override the default storage adapter.');
  },
  async removeById() {
    throw new Error('Please override the default storage adapter.');
  },
  async clear() {
    throw new Error('Please override the default storage adapter.');
  },
  async clearAll() {
    throw new Error('Please override the default storage adapter.');
  },
};

export function setStorageAdapter(_adapter: StorageAdapter): void {
  adapter = _adapter;
}

export class Storage<T extends Entity> {
  public namespace: string;
  public collectionName: string;

  constructor(namespace: string, collectionName: string) {
    this.namespace = namespace;
    this.collectionName = collectionName;
  }

  find(): Promise<T[]> {
    return queue.add(() => adapter.find<T>(this.namespace, this.collectionName));
  }

  findById(id: string): Promise<T> {
    return queue.add(() => adapter.findById<T>(this.namespace, this.collectionName, id));
  }

  save(entities: T[]): Promise<T[]> {
    return queue.add(async () => {
      if (entities.length > 0) {
        const entitiesToSave = entities.map((entity: T) => {
          if (!entity._id) {
            return { ...entity, _id: generateId(), _kmd: { ...entity._kmd, local: true } };
          }

          return { ...entity };
        });

        await adapter.save<T>(this.namespace, this.collectionName, entitiesToSave);
        return entitiesToSave;
      }

      return entities;
    });
  }

  removeById(id: string): Promise<number> {
    return queue.add(() => adapter.removeById(this.namespace, this.collectionName, id));
  }

  clear(): Promise<boolean> {
    return queue.add(() => adapter.clear(this.namespace, this.collectionName));
  }
}

export function clear(namespace: string): Promise<boolean> {
  // const exclude = [getSessionKey()];
  return queue.add(() => adapter.clearAll(namespace));
}
