import { Query } from '../query';
import { SyncError } from '../errors/sync';
import { NotFoundError } from '../errors/notFound';
import { NetworkStore } from './networkstore';
import { DataStoreCache, SyncCache, SyncEvent } from './cache';
import { getApiVersion } from '../kinvey';

const pushInProgress = new Map<string, boolean>();

function markPushStart(collectionName: string) {
  pushInProgress.set(collectionName, true);
}

function markPushEnd(collectionName: string) {
  pushInProgress.set(collectionName, false);;
}

export function queryToSyncQuery(query?: Query) {
  if (query && query instanceof Query) {
    const newFilter = Object.keys(query.filter)
      .reduce((filter, field) => Object.assign({}, filter, { [`entity.${field}`]: query.filter[field] }), {});
    const newSort = Object.keys(query.sort)
      .reduce((sort, field) => Object.assign({}, sort, { [`entity.${field}`]: query.sort[field] }), {});
    return new Query({
      filter: newFilter,
      sort: newSort,
      skip: query.skip,
      limit: query.limit
    });
  }

  return undefined;
}

export class Sync {
  public collectionName: string;
  public tag?: string;

  constructor(collectionName: string, tag?: string) {
    this.collectionName = collectionName;
    this.tag = tag;
  }

  isPushInProgress() {
    return pushInProgress.get(this.collectionName) === true;
  }

  find(providedQuery?: Query) {
    const syncCache = new SyncCache(this.tag);
    const query = new Query(providedQuery).equalTo('collection', this.collectionName);
    return syncCache.find(query);
  }

  findById(id: string) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.findById(id);
  }

  count(providedQuery?: Query) {
    const syncCache = new SyncCache(this.tag);
    const query = new Query(providedQuery).equalTo('collection', this.collectionName);
    return syncCache.count(query);
  }

  addCreateSyncEvent(docs: any) {
    return this.addSyncEvent(SyncEvent.Create, docs);
  }

  addUpdateSyncEvent(docs: any) {
    return this.addSyncEvent(SyncEvent.Update, docs);
  }

  addDeleteSyncEvent(docs: any) {
    return this.addSyncEvent(SyncEvent.Delete, docs);
  }

  async addSyncEvent(event: SyncEvent, docs: any) {
    const syncCache = new SyncCache(this.tag);
    let singular = false;
    let syncDocs: any = [];
    let docsToSync = docs;

    if (!Array.isArray(docs)) {
      singular = true;
      docsToSync = [docs];
    }

    if (docsToSync.length > 0) {
      const docWithNoId = docsToSync.find((doc: { _id: any; }) => !doc._id);
      if (docWithNoId) {
        throw new SyncError('A doc is missing an _id. All docs must have an _id in order to be added to the sync collection.');
      }

      // Remove existing sync events that match the docs
      const query = new Query().contains('entityId', docsToSync.map((doc: { _id: any; }) => doc._id));
      await this.remove(query);

      // Don't add delete events for docs that were created offline
      if (event === SyncEvent.Delete) {
        docsToSync = docsToSync.filter((doc: { _kmd: { local: boolean; }; }) => {
          if (doc._kmd && doc._kmd.local === true) {
            return false;
          }

          return true;
        });
      }

      // Add sync events for the docs
      syncDocs = await syncCache.save(docsToSync.map((doc: { _id: any; }) => {
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

  async push(providedQuery?: Query, options?: any) {
    if (this.isPushInProgress()) {
      throw new SyncError('Data is already being pushed to the backend. Please wait for it to complete before pushing new data to the backend.');
    }

    const apiVersion = getApiVersion();
    const network = new NetworkStore(this.collectionName);
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const syncCache = new SyncCache(this.tag);
    const collectionQuery = new Query(providedQuery).equalTo('collection', this.collectionName);
    const totalPushResults = [];

    const batchCreateEntities = async (): Promise<any> => {
      // Batch insert entities for create
      const queryForInsert = new Query(collectionQuery).equalTo('state.operation', SyncEvent.Create);
      const syncDocsForInsert = await syncCache.find(queryForInsert);

      if (syncDocsForInsert.length > 0) {
        const localIdsToRemove = [];
        const entitiesForInsert = await Promise.all(
          syncDocsForInsert.map(async (doc, index) => {
            const entity = await cache.findById(doc.entityId);
            if (entity._kmd && entity._kmd.local === true) {
              localIdsToRemove[index] = doc.entityId;
              delete entity._id;
              delete entity._kmd.local;
            }
            return entity;
          })
        );

        const multiInsertResult = await network.create(entitiesForInsert, options);

        // Process successful inserts
        if (multiInsertResult.entities != null) {
          await Promise.all(
            multiInsertResult.entities.map(async (insertedEntity, index) => {
              if (insertedEntity != null) {
                // Successful insert, clean up metadata
                const syncDoc = syncDocsForInsert[index];
                await syncCache.removeById(syncDoc._id!);        // Remove the sync doc
                await cache.save(insertedEntity);                // Save the doc to cache
                await cache.removeById(localIdsToRemove[index]); // Remove the original doc that was created
                // Add the inserted entity to the end result
                totalPushResults.push({
                  _id: syncDocsForInsert[index].entityId,
                  operation: SyncEvent.Create,
                  entity: insertedEntity
                });
              }
            })
          );
        }

        // Process insert errors
        if (multiInsertResult.errors != null) {
          await Promise.all(
            multiInsertResult.errors.map(async (insertError) => {
              // Add the error to the end result and keep the order relative to other inserts
              totalPushResults.splice(insertError.index, 0, {
                _id: syncDocsForInsert[insertError.index].entityId,
                operation: SyncEvent.Create,
                entity: entitiesForInsert[insertError.index],
                error: insertError
              });
            })
          );
        }
      }
    };

    const createEntity = async (syncDocId, entityId): Promise<any> => {
      let doc: any = await cache.findById(entityId);
      let local = false;

      try {
        // Save the doc to the backend
        if (doc._kmd && doc._kmd.local === true) {
          local = true;
          // tslint:disable-next-line:no-delete
          delete doc._id;
          // tslint:disable-next-line:no-delete
          delete doc._kmd.local;
        }

        doc = await network.create(doc, options);

        // Remove the sync doc
        await syncCache.removeById(syncDocId!);

        // Save the doc to cache
        await cache.save(doc);

        // Remove the original doc that was created
        if (local) {
          await cache.removeById(entityId);
        }

        // Return a result
        return {
          _id: entityId,
          operation: SyncEvent.Create,
          entity: doc
        };
      } catch (error) {
        // Return a result with the error
        return {
          _id: entityId,
          operation: SyncEvent.Create,
          entity: doc,
          error
        };
      }
    };

    const updateEntity = async (syncDocId, entityId): Promise<any> => {
      let doc: any = await cache.findById(entityId);

      try {
        // Save the doc to the backend
        doc = await network.update(doc, options);

        // Remove the sync doc
        await syncCache.removeById(syncDocId!);

        // Save the doc to cache
        await cache.save(doc);

        // Return a result
        return {
          _id: entityId,
          operation: SyncEvent.Update,
          entity: doc
        };
      } catch (error) {
        // Return a result with the error
        return {
          _id: entityId,
          operation: SyncEvent.Update,
          entity: doc,
          error
        };
      }
    };

    const deleteEntity = async (syncDocId, entityId): Promise<any> => {
      try {
        try {
          // Remove the doc from the backend
          await network.removeById(entityId, options);
        } catch (error) {
          // Rethrow the error if it is not a NotFoundError
          if (!(error instanceof NotFoundError)) {
            throw error;
          }
        }

        // Remove the sync doc
        await syncCache.removeById(syncDocId!);

        // Return a result
        return {
          _id: entityId,
          operation: SyncEvent.Delete
        };
      } catch (error) {
        // Return a result with the error
        return {
          _id: entityId,
          operation: SyncEvent.Delete,
          error
        };
      }
    };

    const pushEntity = async (syncDoc): Promise<any> => {
      const { _id, entityId, state = { operation: undefined } } = syncDoc;
      switch (state.operation) {
        case SyncEvent.Create: {
          if (apiVersion >= 5) {
            return null; // Inserts must have already been batched
          }
          return createEntity(_id, entityId);
        }
        case SyncEvent.Update: {
          return updateEntity(_id, entityId);
        }
        case SyncEvent.Delete: {
          return deleteEntity(_id, entityId);
        }
        default: {
          return {
            _id,
            operation: state.operation,
            error: new Error('Unable to push item in sync table because the event was not recognized.')
          };
        }
      }
    };

    // First try inserting new entities at once
    if (apiVersion >= 5) {
      try {
        markPushStart(this.collectionName);
        await batchCreateEntities();
      } finally {
        markPushEnd(this.collectionName);
      }
    }

    // Push other entities one by one in batches of 100 parallel requests
    const syncDocs = await syncCache.find(collectionQuery);
    if (syncDocs.length > 0) {
      const batchSize = 100;
      let i = 0;
      const batchPush = async (): Promise<any> => {
        if (i >= syncDocs.length) {
          return;
        }

        const batch = syncDocs.slice(i, i + batchSize);
        i += batchSize;

        try {
          markPushStart(this.collectionName);
          await Promise.all(batch.map((syncDoc) => pushEntity(syncDoc)
            .then((pushResult) => {
              if (pushResult != null) {
                totalPushResults.push(pushResult);
              }
            })
          ));
        } finally {
          markPushEnd(this.collectionName);
        }

        // Push remaining docs
        return batchPush();
      };

      await batchPush();
    }

    return totalPushResults;
  }

  async remove(providedQuery?: Query) {
    const syncCache = new SyncCache(this.tag);
    const query = new Query(providedQuery).equalTo('collection', this.collectionName);
    return syncCache.remove(query);
  }

  async removeById(id: string) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.removeById(id);
  }

  async clear() {
    const syncCache = new SyncCache(this.tag);
    const query = new Query().equalTo('collection', this.collectionName);
    return syncCache.remove(query);
  }
}
