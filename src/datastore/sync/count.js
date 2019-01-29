import SyncCache from './syncCache';

export default function count(tag, query) {
  const syncCache = new SyncCache(tag);
  return syncCache.count(query);
}
