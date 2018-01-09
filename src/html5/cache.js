import { WebSqlKeyValueStorePersister } from '../core/datastore/persisters';
import { repositoryProvider, storageType, KeyValueStoreOfflineRepository } from '../core/datastore/repositories';

const webSqlBuilder = (queue) => {
  const persister = new WebSqlKeyValueStorePersister();
  return new KeyValueStoreOfflineRepository(persister, queue);
};

// TODO: this will grow, refactor
const repoConstructors = {
  [storageType.default]: webSqlBuilder, // TODO: get the default support chain
  [storageType.webSql]: webSqlBuilder
};

repositoryProvider.setSupportedConstructors(repoConstructors);
