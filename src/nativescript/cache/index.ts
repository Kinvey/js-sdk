import { isDefined, isEmpty } from '../../core/utils';
import { CacheMiddleware as CoreCacheMiddleware, Storage as CoreStorage, StorageProvider as CoreStorageProvider } from '../../core/request';
import { sqLite } from './sqlite';

export const StorageProvider = Object.assign({}, CoreStorageProvider, {
  SQLite: 'SQLite'
});
Object.freeze(StorageProvider);

class Storage extends CoreStorage {
  name?: string;
  storageProviders: Array<string>;
  encryptionKey?: string;

  constructor(name?: string, storageProviders = [StorageProvider.SQLite, StorageProvider.Memory], encryptionKey?: string) {
    super(name, storageProviders);
    this.encryptionKey = encryptionKey;
  }

  loadAdapter() {
    return this.storageProviders.reduce((promise, storageProvider) => {
      return promise.then((adapter) => {
        if (adapter) {
          return adapter;
        }

        switch (storageProvider) {
          case StorageProvider.SQLite:
            return sqLite.load(this.name, this.encryptionKey);
          default:
            return super.loadAdapter();
        }
      });
    }, Promise.resolve());
  }
}

export class CacheMiddleware extends CoreCacheMiddleware {
  loadStorage(name, storageProviders, encryptionKey) {
    return new Storage(name, storageProviders, encryptionKey);
  }
}

