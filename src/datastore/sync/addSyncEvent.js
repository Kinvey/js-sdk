import SyncError from '../../errors/sync';
import Query from '../../query';
import SyncCache from './syncCache';

export const SyncEvent = {
  Create: 'POST',
  Update: 'PUT',
  Delete: 'DELETE'
};

export async function addSyncEvent(tag, event, docs) {
  const syncCache = new SyncCache(tag);
  let singular = false;
  let syncDocs = [];
  let docsToSync = docs;

  if (!Array.isArray(docs)) {
    singular = true;
    docsToSync = [docs];
  }

  if (docsToSync.length > 0) {
    const docWithNoId = docsToSync.find(doc => !doc._id);
    if (docWithNoId) {
      throw new SyncError('A doc is missing an _id. All docs must have an _id in order to be added to the sync collection.');
    }

    // Remove existing sync events that match the docs
    const query = new Query().contains('entityId', docsToSync.map(doc => doc._id));
    await this.remove(query);

    // Don't add delete events for docs that were created offline
    if (event === SyncEvent.Delete) {
      docsToSync = docsToSync.filter((doc) => {
        if (doc._kmd && doc._kmd.local === true) {
          return false;
        }

        return true;
      });
    }

    // Add sync events for the docs
    syncDocs = await syncCache.save(docsToSync.map((doc) => {
      return {
        entityId: doc._id,
        entity: doc,
        collection: this.collectionName,
        state: {
          operation: event
        }
      };
    }));
  }

  return singular ? syncDocs.shift() : syncDocs;
}
