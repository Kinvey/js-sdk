import DataStoreCache from './datastoreCache';

export default async function count(collectionName, tag, query) {
  const cache = new DataStoreCache(collectionName, tag);
  return cache.count(query);
}
