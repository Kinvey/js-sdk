import DataStoreCache from './datastoreCache';

export default async function find(collectionName, tag, query) {
  const cache = new DataStoreCache(this.collectionName, this.tag);
  return cache.find(query);
}
