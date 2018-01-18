import { Storage, StorageAdapter as CoreStorageAdapter } from '../../core/request';
import { IndexedDBAdapter } from './indexeddb';
import { WebSQLAdapter } from './websql';
import { LocalStorageAdapter, SessionStorageAdapter } from './webstorage';

export const StorageAdapter = Object.assign(CoreStorageAdapter, {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  SessionStorage: 'SessionStorage',
  WebSQL: 'WebSQL'
});
Object.freeze(StorageAdapter);

export class Html5Storage extends Storage {
  constructor(name, storageAdapters = [StorageAdapter.WebSQL, StorageAdapter.IndexedDB, StorageAdapter.LocalStorage, StorageAdapter.SessionStorage]) {
    super(name, storageAdapters);
  }

  loadAdapter() {
    if (this.adapter) {
      return Promise.resolve(adapter);
    }

    return this.storageAdapters.reduce((promise, storageAdapter) => {
      return promise.then(() => {
        switch (storageAdapter) {
          case StorageAdapter.IndexedDB:
            return IndexedDBAdapter.load(this.name)
              .then((adapter) => {
                if (!adapter) {
                  return this.loadAdapter(adaptersCopy);
                }

                this.adapter = adapter;
                return adapter;
              });
          case StorageAdapter.LocalStorage:
            return LocalStorageAdapter.load(this.name)
              .then((adapter) => {
                if (!adapter) {
                  return this.loadAdapter(adaptersCopy);
                }

                this.adapter = adapter;
                return adapter;
              });
          case StorageAdapter.SessionStorage:
            return SessionStorageAdapter.load(this.name)
              .then((adapter) => {
                if (!adapter) {
                  return this.loadAdapter(adaptersCopy);
                }

                this.adapter = adapter;
                return adapter;
              });
          case StorageAdapter.WebSQL:
            return WebSQLAdapter.load(this.name)
              .then((adapter) => {
                if (!adapter) {
                  return this.loadAdapter(adaptersCopy);
                }

                this.adapter = adapter;
                return adapter;
              });
          default:
            return super.loadAdapter();
        }
      });
    }, Promise.resolve());
  }
}
