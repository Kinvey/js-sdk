import {
  repositoryProvider,
  storageType,
  KeyValueStoreOfflineRepository,
  SqlKeyValueStorePersister
} from '../core/datastore';
import { Client } from './client';
import { NativescriptSqlModule } from './nativescript-sql-module';

const sqliteStorageBuilder = (queue) => {
  const sqlModule = new NativescriptSqlModule(Client.sharedInstance().appKey);
  const persister = new SqlKeyValueStorePersister(sqlModule);
  return new KeyValueStoreOfflineRepository(persister, queue);
};

const repoConstructors = {
  [storageType.sqlite]: sqliteStorageBuilder
};

repositoryProvider.setSupportedRepoBuilders(repoConstructors);
