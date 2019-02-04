import isString from 'lodash/isString';
import KinveyError from '../errors/kinvey';
import { clear as _clear } from './cache';
import NetworkStore from './networkstore';
import { SyncStore } from './syncstore';
import AutoStore from './autostore';

export const DataStoreType = {
  Auto: 'Auto',
  Network: 'Network',
  Sync: 'Sync'
};

export function collection(collectionName, type = DataStoreType.Cache, options = {}) {
  let datastore;

  if (!collectionName || !isString(collectionName)) {
    throw new KinveyError('A collection is required and must be a string.');
  }

  if (type === DataStoreType.Auto) {
    datastore = new AutoStore(collectionName, Object.assign({}, options));
  } else if (type === DataStoreType.Network) {
    datastore = new NetworkStore(collectionName);
  } else if (type === DataStoreType.Sync) {
    datastore = new SyncStore(collectionName, Object.assign({}, options));
  } else {
    throw new Error('Unknown data store type.');
  }

  return datastore;
}

export async function clear() {
  return _clear();
}

export async function clearCache() {
  return clear();
}
