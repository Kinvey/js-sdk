import { isDefined, isEmpty } from '../../core/utils';
import { CacheMiddleware as CoreCacheMiddleware, Storage as CoreStorage, StorageAdapter as CoreStorageAdapter } from '../../core/request';
import { sqLite } from './sqlite';

export const StorageAdapter = Object.assign({}, CoreStorageAdapter, {
  SQLite: 'SQLite'
});
Object.freeze(StorageAdapter);

class Storage extends CoreStorage {
  name: string;
  storageAdapters: Array<string>;

  constructor(name, storageAdapters = [StorageAdapter.SQLite, StorageAdapter.Memory]) {
    super(name, storageAdapters);
  }

  loadAdapter() {
    return this.storageAdapters.reduce((promise, storageAdapter) => {
      return promise.then((adapter) => {
        if (adapter) {
          return adapter;
        }

        switch (storageAdapter) {
          case StorageAdapter.SQLite:
            return sqLite.load(this.name);
          default:
            return super.loadAdapter();
        }
      });
    }, Promise.resolve());
  }
}

export class CacheMiddleware extends CoreCacheMiddleware {
  loadStorage(name, storageAdapters) {
    return new Storage(name, storageAdapters);
  }
}

