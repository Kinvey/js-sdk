import { Doc } from '../storage';
import { KinveyError, NotFoundError } from '../errors';
import { Query } from '../query';
import { SyncDoc, SyncOperation, SyncCache, DataStoreCache } from './cache';
import { DataStoreNetwork, NetworkOptions } from './network';

export interface SyncPushResult {
  operation: SyncOperation;
  doc: Doc;
  error?: KinveyError;
}

export class Sync {
  public collectionName: string;
  public tag?: string;

  constructor(collectionName: string, tag?: string) {
    this.collectionName = collectionName;
    this.tag = tag;
  }

  find(): Promise<SyncDoc[]> {
    const syncCache = new SyncCache(this.collectionName, this.tag);
    return syncCache.find();
  }

  addCreateSyncOperation(docs: Doc[]): Promise<SyncDoc[]> {
    return this.addSyncOperation(SyncOperation.Create, docs);
  }

  addUpdateSyncOperation(docs: Doc[]): Promise<SyncDoc[]> {
    return this.addSyncOperation(SyncOperation.Update, docs);
  }

  addDeleteSyncOperation(docs: Doc[]): Promise<SyncDoc[]> {
    return this.addSyncOperation(SyncOperation.Delete, docs);
  }

  async addSyncOperation(operation: SyncOperation, docs: Doc[]): Promise<SyncDoc[]> {
    const syncCache = new SyncCache(this.collectionName, this.tag);
    let docsToSync: Doc[] = [].concat(docs);
    let syncDocs: SyncDoc[] = [];

    if (docsToSync.length > 0) {
      const docWithNoId = docsToSync.find((doc): boolean => !doc._id);
      if (docWithNoId) {
        throw new KinveyError(
          'A doc is missing an _id. All docs must have an _id in order to be added to the Kinvey sync collection.'
        );
      }

      // Remove existing sync events that match the docs
      await syncCache.remove(new Query<SyncDoc>().contains('doc._id', docsToSync.map((doc): string => doc._id)));

      // Don't add delete operations for docs that were created offline
      if (operation === SyncOperation.Delete) {
        docsToSync = docsToSync.filter((doc): boolean => {
          if (doc._kmd && doc._kmd.local === true) {
            return false;
          }
          return true;
        });
      }

      // Add sync operations for the docs
      syncDocs = await syncCache.save(
        docsToSync.map(
          (doc): SyncDoc => {
            return {
              doc,
              state: {
                operation
              }
            };
          }
        )
      );
    }

    return syncDocs;
  }

  async push(docs: SyncDoc[] = [], options?: NetworkOptions): Promise<SyncPushResult[]> {
    const network = new DataStoreNetwork(this.collectionName);
    const cache = new DataStoreCache<Doc>(this.collectionName, this.tag);
    const syncCache = new SyncCache(this.collectionName, this.tag);
    const batchSize = 100;

    if (docs.length > 0) {
      let i = 0;

      const batchPush = async (pushResults: SyncPushResult[] = []): Promise<SyncPushResult[]> => {
        const batch = docs.slice(i, i + batchSize);
        i += batchSize;

        const results = await Promise.all(
          batch.map(
            async (syncDoc): Promise<SyncPushResult> => {
              const { _id, doc, state } = syncDoc;
              const { operation } = state;

              if (operation === SyncOperation.Delete) {
                try {
                  try {
                    // Remove the doc from the backend
                    await network.removeById(doc._id, options);
                  } catch (error) {
                    // Rethrow the error if it is not a NotFoundError
                    if (!(error instanceof NotFoundError)) {
                      throw error;
                    }
                  }

                  // Remove the doc from the cache
                  await cache.removeById(doc._id);

                  // Remove the sync doc
                  await syncCache.removeById(_id);

                  // Return a result
                  return {
                    doc,
                    operation
                  };
                } catch (error) {
                  // Return a result with the error
                  return {
                    doc,
                    operation,
                    error
                  };
                }
              } else if (operation === SyncOperation.Create || SyncOperation.Update) {
                let local = false;
                let savedDoc: Doc;

                try {
                  // Save the doc to the backend
                  if (operation === SyncOperation.Create) {
                    if (doc._kmd && doc._kmd.local === true) {
                      local = true;
                      delete doc._id;
                      delete doc._kmd.local;
                    }

                    const response = await network.create(doc, options);
                    savedDoc = response.data;
                  } else {
                    const response = await network.update(doc, options);
                    savedDoc = response.data;
                  }

                  // Remove the sync doc
                  await syncCache.removeById(_id);

                  // Save the doc to cache
                  await cache.save(savedDoc);

                  // Remove the original doc that was created
                  if (local) {
                    await cache.removeById(doc._id);
                  }

                  // Return a result
                  return {
                    doc: savedDoc,
                    operation
                  };
                } catch (error) {
                  // Return a result with the error
                  return {
                    doc: savedDoc,
                    operation,
                    error
                  };
                }
              }

              // Return a default result
              return {
                doc,
                operation,
                error: new KinveyError(
                  'Unable to push item in sync collection because the operation was not recognized.'
                )
              };
            }
          )
        );

        // Push remaining docs
        return batchPush(pushResults.concat(results));
      };

      return batchPush([]);
    }

    return [];
  }
}
