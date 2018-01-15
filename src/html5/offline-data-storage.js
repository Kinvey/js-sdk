import {
  WebSqlKeyValueStorePersister,
  IndexedDbKeyValueStorePersister,
  BrowserKeyValuePersister
} from '../core/datastore/persisters';

import {
  repositoryProvider,
  storageType,
  KeyValueStoreOfflineRepository,
  InmemoryOfflineRepository
} from '../core/datastore/repositories';

const webSqlBuilder = (queue) => {
  const persister = new WebSqlKeyValueStorePersister();
  return new KeyValueStoreOfflineRepository(persister, queue);
};

const indexedDbBuilder = (queue) => {
  const persister = new IndexedDbKeyValueStorePersister();
  return new KeyValueStoreOfflineRepository(persister, queue);
};

const localStorageBuilder = (queue) => {
  const persister = new BrowserKeyValuePersister(global.localStorage);
  return new InmemoryOfflineRepository(persister, queue);
};

const sessionStorageBuilder = (queue) => {
  const persister = new BrowserKeyValuePersister(global.sessionStorage);
  return new InmemoryOfflineRepository(persister, queue);
};

// TODO: this will grow, refactor
const repoConstructors = {
  [storageType.default]: indexedDbBuilder, // TODO: get the default support chain
  [storageType.webSql]: webSqlBuilder,
  [storageType.indexedDb]: indexedDbBuilder,
  [storageType.localStorage]: localStorageBuilder,
  [storageType.sessionStorage]: sessionStorageBuilder
};

repositoryProvider.setSupportedConstructors(repoConstructors);
