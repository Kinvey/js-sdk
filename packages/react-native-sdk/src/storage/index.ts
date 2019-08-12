import { Errors } from "kinvey-js-sdk";
import * as Memory from "./memory";
import * as SQLite from "./sqlite";

export enum StorageProvider {
  Memory = "Memory",
  SQLite = "SQLite"
}

export function getStorageAdapter(storageProvider = StorageProvider.SQLite) {
  if (storageProvider === StorageProvider.Memory) {
    return Memory;
  } else if (storageProvider === StorageProvider.SQLite) {
    return SQLite;
  }

  throw new Errors.KinveyError("You must override the default cache store.");
}
