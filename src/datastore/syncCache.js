import Cache from './cache';

const SYNC_CACHE_TAG = 'kinvey_sync';

export default class SyncCache extends Cache {
  constructor(tag) {
    super(SYNC_CACHE_TAG, tag);
  }
}
