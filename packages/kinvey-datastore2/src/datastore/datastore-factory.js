import { DataStoreType } from './datastore-type';

export function collection(collection, type = DataStoreType.Cache) {
  return new DataStore(collection);
}
