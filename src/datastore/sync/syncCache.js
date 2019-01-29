import DataStoreCache from '../cache/datastoreCache';

const SYNC_CACHE_TAG = 'kinvey_sync';

export default class SyncCache extends DataStoreCache {
  constructor(tag) {
    super(SYNC_CACHE_TAG, tag);
  }
}
