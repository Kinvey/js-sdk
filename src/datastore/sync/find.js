import SyncCache from './syncCache';

export default function find(tag, query) {
  const syncCache = new SyncCache(tag);
  return syncCache.find(query);
}
