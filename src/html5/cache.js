import {
  WebSqlKeyValueStorePersister,
  IndexedDbKeyValueStorePersister
} from '../core/datastore/persisters';
import { repositoryProvider, storageType, KeyValueStoreOfflineRepository } from '../core/datastore/repositories';

const webSqlBuilder = (queue) => {
  const persister = new WebSqlKeyValueStorePersister();
  return new KeyValueStoreOfflineRepository(persister, queue);
};

const indexedDbBuilder = (queue) => {
  const persister = new IndexedDbKeyValueStorePersister();
  return new KeyValueStoreOfflineRepository(persister, queue);
};

// TODO: this will grow, refactor
const repoConstructors = {
  [storageType.default]: indexedDbBuilder, // TODO: get the default support chain
  [storageType.webSql]: webSqlBuilder,
  [storageType.indexedDb]: indexedDbBuilder
};

repositoryProvider.setSupportedConstructors(repoConstructors);
