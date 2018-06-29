import { Html5Storage, StorageProvider } from '../../html5/storage';
import { WebSQLAdapter } from './websql';

export class PhoneGapStorage extends Html5Storage {
  constructor(name, storageProviders, encyrptionKey) {
    super(name, storageProviders);
    this.encyrptionKey = encyrptionKey;
  }

  loadAdapter() {
    return this.storageProviders.reduce((promise, storageProvider) => {
      return promise.then((adapter) => {
        if (adapter) {
          return adapter;
        }

        switch (storageProvider) {
          case StorageProvider.WebSQL:
            return WebSQLAdapter.load(this.name, this.encyrptionKey);
          default:
            return super.loadAdapter();
        }
      });
    }, Promise.resolve());
  }
}
