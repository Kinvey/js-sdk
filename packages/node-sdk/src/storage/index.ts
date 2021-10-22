import { Errors } from 'kinvey-js-sdk';
import * as Memory from './memory';

export enum StorageProvider {
  Memory = 'Memory'
};

export function getStorageAdapter(storageProvider = StorageProvider.Memory) {
  if (storageProvider === StorageProvider.Memory) {
    return Memory;
  }

  throw new Errors.KinveyError(`Please specify 'storage' option. Supported values are: ${Object.values(StorageProvider)}.`);
}
