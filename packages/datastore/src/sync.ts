import PQueue from 'p-queue';
import { Query } from '@progresskinvey/js-sdk-query';
import { Entity } from '@progresskinvey/js-sdk-storage';
import { Kmd } from '@progresskinvey/js-sdk-kmd';
import { DataStoreNetwork, NetworkOptions } from './network';
import { DataStoreCache, SyncCache, SyncOperation, SyncEntity } from './cache';

const queues = new Map<string, PQueue>();

function getQueue(key: string): PQueue {
  let queue = queues.get(key);

  if (queue) {
    queue = new PQueue({ concurrency: 1 });
    queues.set(key, queue);
  }

  return queue;
}

export interface SyncPushResult {
  _id?: string;
  entity?: Entity;
  operation: SyncOperation;
  error?: Error;
}

export class Sync {
  public collectionName: string;
  private network: DataStoreNetwork;
  private cache: DataStoreCache<Entity>;
  private syncCache: SyncCache;

  constructor(collectionName: string, tag?: string) {
    this.collectionName = collectionName;
    this.network = new DataStoreNetwork(collectionName);
    this.cache = new DataStoreCache(collectionName, tag);
    this.syncCache = new SyncCache(tag);
  }

  find(): Promise<SyncEntity[]> {
    return this.syncCache.find();
  }

  addCreateSyncOperation(entities: Entity[]): Promise<SyncEntity[]> {
    return this.addSyncOperation(SyncOperation.Create, entities);
  }

  addUpdateSyncOperation(entities: Entity[]): Promise<SyncEntity[]> {
    return this.addSyncOperation(SyncOperation.Update, entities);
  }

  addDeleteSyncOperation(entities: Entity[]): Promise<SyncEntity[]> {
    return this.addSyncOperation(SyncOperation.Delete, entities);
  }

  async addSyncOperation(operation: SyncOperation, entities: Entity[]): Promise<SyncEntity[]> {
    let entitiesToSync = [...entities];

    if (entitiesToSync.length > 0) {
      const entityWithNoId = entitiesToSync.find((entity) => !entity._id);

      if (entityWithNoId) {
        throw new Error(
          'An entity is missing an _id. All entities must have an _id in order to be added to the sync queue.'
        );
      }

      // Remove existing sync operations that match the entities
      const query = new Query().contains('entityId', entitiesToSync.map((entity) => entity._id));
      await this.remove(query);

      // Don't add delete operations for entities that were created offline
      if (operation === SyncOperation.Delete) {
        entitiesToSync = entitiesToSync.filter((entity) => {
          if (entity._kmd && entity._kmd.local === true) {
            return false;
          }

          return true;
        });
      }

      // Add sync operations for the entities
      return this.syncCache.save(
        entitiesToSync.map((entity) => {
          return {
            entityId: entity._id,
            entity,
            collection: this.collectionName,
            state: {
              operation,
            },
          };
        })
      );
    }

    return [];
  }

  push(syncEntities: SyncEntity[], options?: NetworkOptions): Promise<SyncPushResult[]> {
    const queue = getQueue(this.collectionName);
    return queue.add(async () => {
      const batchSize = 100;

      if (syncEntities.length > 0) {
        let i = 0;

        const batchPush = async (pushResults: SyncPushResult[] = []): Promise<SyncPushResult[]> => {
          if (i >= syncEntities.length) {
            return pushResults;
          }

          const batch = syncEntities.slice(i, i + batchSize);
          i += batchSize;

          const results = await Promise.all(
            batch.map(async (syncEntity) => {
              const { _id, entityId, state = { operation: undefined } } = syncEntity;
              const { operation } = state;

              if (operation === SyncOperation.Delete) {
                try {
                  try {
                    await this.network.removeById(entityId, options);
                  } catch (error) {
                    if (!(error instanceof NotFoundError)) {
                      throw error;
                    }
                  }

                  // Remove the sync doc
                  await this.syncCache.removeById(_id);
                  return {
                    _id: entityId,
                    operation,
                  };
                } catch (error) {
                  return {
                    _id: entityId,
                    operation,
                    error,
                  };
                }
              } else if (operation === SyncOperation.Create || operation === SyncOperation.Update) {
                let entity = await this.cache.findById(entityId);
                const kmd = new Kmd(entity);

                try {
                  if (operation === SyncOperation.Create) {
                    if (kmd.isLocal()) {
                      delete entity._id;
                      delete entity._kmd.local;
                    }

                    const response = await this.network.create(entity, options);
                    entity = response.data;
                  } else {
                    const response = await this.network.update(entity, options);
                    entity = response.data;
                  }

                  await this.syncCache.removeById(_id);
                  await this.cache.save(entity);

                  if (kmd.isLocal()) {
                    await this.cache.removeById(entityId);
                  }

                  return {
                    _id: entityId,
                    operation,
                    entity,
                  };
                } catch (error) {
                  return {
                    _id: entityId,
                    operation,
                    entity,
                    error,
                  };
                }
              }

              return {
                _id,
                operation,
                error: new Error('Unable to push item in sync queue because the operation was not recognized.'),
              };
            })
          );

          // Push remaining docs
          return batchPush(pushResults.concat(results));
        };

        return batchPush([]);
      }

      return [];
    });
  }
}
