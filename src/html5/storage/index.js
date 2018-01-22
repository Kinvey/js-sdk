import { Storage, StorageAdapter as CoreStorageAdapter } from '../../core/request';
import { IndexedDBAdapter } from './indexeddb';
import { WebSQLAdapter } from './websql';
import { LocalStorageAdapter, SessionStorageAdapter } from './webstorage';

export const StorageAdapter = Object.assign({}, CoreStorageAdapter, {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  SessionStorage: 'SessionStorage',
  WebSQL: 'WebSQL'
});
Object.freeze(StorageAdapter);

export class Html5Storage extends Storage {
  constructor(name, storageAdapters = [StorageAdapter.WebSQL, StorageAdapter.IndexedDB, StorageAdapter.LocalStorage, StorageAdapter.SessionStorage, StorageAdapter.Memory]) {
    super(name, storageAdapters);
  }

  loadAdapter() {
    return this.storageAdapters.reduce((promise, storageAdapter) => {
      return promise.then((adapter) => {
        if (adapter) {
          return adapter;
        }

        switch (storageAdapter) {
          case StorageAdapter.IndexedDB:
            return IndexedDBAdapter.load(this.name);
          case StorageAdapter.LocalStorage:
            return LocalStorageAdapter.load(this.name);
          case StorageAdapter.SessionStorage:
            return SessionStorageAdapter.load(this.name);
          case StorageAdapter.WebSQL:
            return WebSQLAdapter.load(this.name);
          default:
            return super.loadAdapter();
        }
      });
    }, Promise.resolve());
  }
}
