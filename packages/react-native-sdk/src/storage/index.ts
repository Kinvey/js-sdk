import { Errors } from "kinvey-js-sdk";
import * as Memory from "./memory";
import * as AsyncStorage from "./asyncStorage";

export enum StorageProvider {
  AsyncStorage = "AsyncStorage",
  Memory = "Memory"
}

export function getStorageAdapter(storageProvider = StorageProvider.AsyncStorage) {
  if (storageProvider === StorageProvider.Memory) {
    return Memory;
  } else if (storageProvider === StorageProvider.AsyncStorage) {
    return AsyncStorage;
  }

  throw new Errors.KinveyError("You must override the default cache store.");
}
