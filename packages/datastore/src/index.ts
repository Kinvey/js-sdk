// import { AutoStore } from './autostore';
import { NetworkStore } from './networkstore';
import { DataStore } from './datastore';
// import { CacheStoreOptions } from './cachestore';

export enum DataStoreType {
  Auto = 'Auto',
  Cache = 'Cache',
  Network = 'Network',
  Sync = 'Sync',
}

export function collection<T>(collectionName: string, type = DataStoreType.Network): DataStore<T> {
  // if (type === DataStoreType.Auto) {
  //   return new AutoStore<T>(collectionName, options);
  // }

  if (type === DataStoreType.Network) {
    return new NetworkStore<T>(collectionName);
  }

  throw new Error('Unknown data store type.');

  // if (type === DataStoreType.Auto) {
  //   datastore = new AutoStore(collectionName, Object.assign({}, options, { autoSync: true }));
  // } else if (type === DataStoreType.Cache) {
  //   logger.warn('DataStoreType.Cache will be deprecated soon. Please use DataStoreType.Auto instead.');
  //   datastore = new CacheStore(collectionName, Object.assign({}, options, { autoSync: true }));
  // } else if (type === DataStoreType.Network) {
  //   if (tagWasPassed) {
  //     throw new KinveyError('The tagged option is not valid for data stores of type "Network"');
  //   }

  //   datastore = new NetworkStore(collectionName);
  // } else if (type === DataStoreType.Sync) {
  //   datastore = new CacheStore(collectionName, Object.assign({}, options, { autoSync: false }));
  // } else {
  //   throw new KinveyError('Unknown data store type.');
  // }
}

export function getInstance<T>(collectionName: string, type?: DataStoreType): DataStore<T> {
  return collection(collectionName, type);
}

// export function clearCache() {
//   return DataStoreCache.clear();
// }
