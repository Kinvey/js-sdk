import times from 'lodash/times';
import isArray from 'lodash/isArray';
import SyncError from '../errors/sync';
import KinveyError from '../errors/kinvey';
import MissingConfigurationError from '../errors/missingConfiguration';
import ParameterValueOutOfRangeError from '../errors/parameterValueOutOfRange';
import NotFoundError from '../errors/notFound';
import Query from '../query';
import { KinveyHeaders } from '../http/headers';
import SyncCache from './syncCache';
import SyncEvent from './syncEvent';
import Network from './network';
import Cache from './cache';
import QueryCache from './queryCache';

const PAGE_LIMIT = 10000;
const PUSH_IN_PROGRESS = {};

function markPushStart(collectionName) {
  PUSH_IN_PROGRESS[collectionName] = true;
}

function markPushEnd(collectionName) {
  PUSH_IN_PROGRESS[collectionName] = false;
}

// export function queryToSyncQuery(query, collectionName) {
//   if (query && query instanceof Query) {
//     const newFilter = Object.keys(query.filter)
//       .reduce((filter, field) => Object.assign({}, filter, { [`entity.${field}`]: query.filter[field] }), {});
//     const newSort = Object.keys(query.sort)
//       .reduce((sort, field) => Object.assign({}, sort, { [`entity.${field}`]: query.sort[field] }), {});
//     const syncQuery = new Query({
//       filter: newFilter,
//       sort: newSort,
//       skip: query.skip,
//       limit: query.limit
//     });

//     if (collectionName) {
//       syncQuery.equalTo('collection', collectionName);
//     }

//     return syncQuery;
//   }

//   return null;
// }

export default class Sync {
  constructor(collectionName, tag) {
    this.collectionName = collectionName;
    this.tag = tag;
  }

  isPushInProgress() {
    return PUSH_IN_PROGRESS[this.collectionName] === true;
  }

  find(query) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.find(query);
  }

  findById(id) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.findById(id);
  }

  count(query) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.count(query);
  }

  addCreateSyncEvent(docs) {
    return this.addSyncEvent(SyncEvent.Create, docs);
  }

  addUpdateSyncEvent(docs) {
    return this.addSyncEvent(SyncEvent.Update, docs);
  }

  addDeleteSyncEvent(docs) {
    return this.addSyncEvent(SyncEvent.Delete, docs);
  }

  async addSyncEvent(event, docs) {
    const syncCache = new SyncCache(this.tag);
    let singular = false;
    let syncDocs = [];
    let docsToSync = docs;

    if (!isArray(docs)) {
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

  async push(query, options) {
    const network = new Network(this.collectionName);
    const cache = new Cache(this.collectionName, this.tag);
    const syncCache = new SyncCache(this.tag);

    if (this.isPushInProgress()) {
      throw new SyncError('Data is already being pushed to the backend. Please wait for it to complete before pushing new data to the backend.');
    }

    const batchSize = 100;
    const syncDocs = await syncCache.find(query);

    if (syncDocs.length > 0) {
      let i = 0;

      const batchPush = async (pushResults = []) => {
        markPushStart(this.collectionName);

        if (i >= syncDocs.length) {
          markPushEnd(this.collectionName);
          return pushResults;
        }

        const batch = syncDocs.slice(i, i + batchSize);
        i += batchSize;

        const results = await Promise.all(batch.map(async (syncDoc) => {
          const { _id, entityId, state = { operation: undefined } } = syncDoc;
          const event = state.operation;

          if (event === SyncEvent.Delete) {
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
              await syncCache.removeById(_id);

              // Return a result
              return {
                _id: entityId,
                operation: event
              };
            } catch (error) {
              // Return a result with the error
              return {
                _id: entityId,
                operation: event,
                error
              };
            }
          } else if (event === SyncEvent.Create || event === SyncEvent.Update) {
            let doc = await cache.findById(entityId);
            let local = false;

            try {
              // Save the doc to the backend
              if (event === SyncEvent.Create) {
                if (doc._kmd && doc._kmd.local === true) {
                  local = true;
                  // tslint:disable-next-line:no-delete
                  delete doc._id;
                  // tslint:disable-next-line:no-delete
                  delete doc._kmd.local;
                }

                doc = await network.create(doc, options);
              } else {
                doc = await network.update(doc, options);
              }

              // Remove the sync doc
              await syncCache.removeById(_id);

              // Save the doc to cache
              await cache.save(doc);

              // Remove the original doc that was created
              if (local) {
                await cache.removeById(entityId);
              }

              // Return a result
              return {
                _id: entityId,
                operation: event,
                entity: doc
              };
            } catch (error) {
              // Return a result with the error
              return {
                _id: entityId,
                operation: event,
                entity: doc,
                error
              };
            }
          }

          // Return a default result
          return {
            _id,
            operation: event,
            error: new Error('Unable to push item in sync table because the event was not recognized.')
          };
        }));

        markPushEnd(this.collectionName);

        // Push remaining docs
        return batchPush(pushResults.concat(results));
      };

      return batchPush();
    }

    return [];
  }

  async pull(query, options = {}) {
    const network = new Network(this.collectionName);
    const cache = new Cache(this.collectionName, this.tag);
    const queryCache = new QueryCache(this.tag);
    const useDeltaSet = options.useDeltaSet === true || this.useDeltaSet;
    const useAutoPagination = options.useAutoPagination === true || options.autoPagination || this.useAutoPagination;

    // Push sync queue
    const count = await this.pendingSyncCount();
    if (count > 0) {
      // TODO in newer version
      // if (autoSync) {
      //   await sync.push();
      //   return this.pull(query, Object.assign({}, { useDeltaSet, useAutoPagination, autoSync }, options));
      // }

      if (count === 1) {
        throw new KinveyError(`Unable to pull entities from the backend. There is ${count} entity`
          + ' that needs to be pushed to the backend.');
      }

      throw new KinveyError(`Unable to pull entities from the backend. There are ${count} entities`
        + ' that need to be pushed to the backend.');
    }

    // Delta set
    if (useDeltaSet && (!query || (query.skip === 0 && query.limit === Infinity))) {
      try {
        const key = queryCache.serializeQuery(query);
        const queryCacheDoc = await queryCache.findByKey(key);

        if (queryCacheDoc && queryCacheDoc.lastRequest) {
          const response = await network.findWithDeltaSet(query, Object.assign({}, options, { since: queryCacheDoc.lastRequest }));
          const { changed, deleted } = response.data;

          // Delete the docs that have been deleted
          if (Array.isArray(deleted) && deleted.length > 0) {
            const removeQuery = new Query().contains('_id', deleted.map(doc => doc._id));
            await cache.remove(removeQuery);
          }

          // Save the docs that changed
          if (Array.isArray(changed) && changed.length > 0) {
            await cache.save(changed);
          }

          // Update the query cache
          const headers = new KinveyHeaders(response.headers);
          queryCacheDoc.lastRequest = headers.requestStart;
          await queryCache.save(queryCacheDoc);

          // Return the number of changed docs
          return changed.length;
        }
      } catch (error) {
        if (!(error instanceof MissingConfigurationError) && !(error instanceof ParameterValueOutOfRangeError)) {
          throw error;
        }
      }
    }

    // Auto pagination
    if (useAutoPagination) {
      // Clear the cache
      await cache.clear();

      // Get the total count of docs
      const response = await network.count(query, Object.assign({}, options, { rawResponse: true }));
      const count = 'count' in response.data ? response.data.count : Infinity;

      // Create the pages
      const pageSize = options.autoPaginationPageSize || (options.autoPagination && options.autoPagination.pageSize) || PAGE_LIMIT;
      const pageCount = Math.ceil(count / pageSize);
      const pageQueries = times(pageCount, (i) => {
        const pageQuery = new Query(query);
        pageQuery.skip = i * pageSize;
        pageQuery.limit = Math.min(count - (i * pageSize), pageSize);
        return pageQuery;
      });

      // Process the pages
      const pagePromises = pageQueries.map((pageQuery) => {
        return network.find(pageQuery, options)
          .then(docs => cache.save(docs))
          .then(docs => docs.length);
      });
      const pageCounts = await Promise.all(pagePromises);
      const totalPageCount = pageCounts.reduce((totalCount, pageCount) => totalCount + pageCount, 0);

      // Update the query cache
      const key = queryCache.serializeQuery(query);
      let queryCacheDoc = await queryCache.findByKey(key);
      if (!queryCacheDoc) {
        queryCacheDoc = { collectionName: this.collectionName, query: key };
      }
      const headers = new KinveyHeaders(response.headers);
      queryCacheDoc.lastRequest = headers.requestStart;
      await queryCache.save(queryCacheDoc);

      // Return the total page count
      return totalPageCount;
    }

    // Find the docs on the backend
    const response = await network.find(query, Object.assign({}, options, { rawResponse: true }));
    const docs = response.data;

    // Clear the cache if a query was not provided
    if (!query) {
      await cache.clear();
    }

    // Update the cache
    await cache.save(docs);

    // Update the query cache
    const key = queryCache.serializeQuery(query);
    let queryCacheDoc = await queryCache.findByKey(key);
    if (!queryCacheDoc) {
      queryCacheDoc = { collectionName: this.collectionName, query: key };
    }
    const headers = new KinveyHeaders(response.headers);
    queryCacheDoc.lastRequest = headers.requestStart;
    await queryCache.save(queryCacheDoc);

    // Return the number of docs
    return docs.length;
  }

  async pullById(id, options = {}) {
    const network = new Network(this.collectionName);
    const cache = new Cache(this.collectionName, this.tag);

    // Push sync queue
    const count = await this.pendingSyncCount();
    if (count > 0) {
      // TODO in newer version
      // if (autoSync) {
      //   await sync.push();
      //   return this.pull(query, Object.assign({}, { useDeltaSet, useAutoPagination, autoSync }, options));
      // }

      if (count === 1) {
        throw new KinveyError(`Unable to pull entities from the backend. There is ${count} entity`
          + ' that needs to be pushed to the backend.');
      }

      throw new KinveyError(`Unable to pull entities from the backend. There are ${count} entities`
        + ' that need to be pushed to the backend.');
    }

    try {
      // Find the doc on the backend
      const doc = await network.findById(id, options);

      // Update the doc in the cache
      await cache.save(doc);

      // Return the doc
      return doc;
    } catch (error) {
      if (error instanceof NotFoundError) {
        // Remove the doc from the cache
        await cache.removeById(id);
      }

      throw error;
    }
  }

  async remove(query) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.remove(query);
  }

  async removeById(id) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.removeById(id);
  }

  async clear() {
    const syncCache = new SyncCache(this.tag);
    return syncCache.remove();
  }
}
