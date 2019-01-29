import SyncCache from './syncCache';

export default function findById(tag, id) {
  const syncCache = new SyncCache(tag);
  return syncCache.findById(id);
}
