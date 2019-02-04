import isArray from 'lodash/isArray';
import KinveyError from '../errors/kinvey';
import NotFoundError from '../errors/notFound';
import Cache from './cache';
import Sync from './sync';
import QueryCache from './queryCache';
import { queryToSyncQuery } from './utils';

// export default class InvalidDeltaSetQueryError extends BaseError {
//   constructor(message = 'Invalid delta set query.', ...args) {
//     // Pass remaining arguments (including vendor specific ones) to parent constructor
//     super(message, ...args);

//     // Maintains proper stack trace for where our error was thrown (only available on V8)
//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, InvalidDeltaSetQueryError);
//     }

//     // Custom debugging information
//     this.name = 'InvalidDeltaSetQueryError';
//   }
// }

export default class SyncStore {
  constructor(collectionName, options = { tag: undefined, useDeltaSet: false, useAutoPagination: false }) {
    this.collectionName = collectionName;
    this.tag = options.tag;
    this.useDeltaSet = options.useDeltaSet === true;
    this.useAutoPagination = options.useAutoPagination === true || options.autoPagination;
  }

  async find(query) {
    const cache = new Cache(this.collectionName, this.tag);
    return cache.find(query);
  }

  async count(query) {
    const cache = new Cache(this.collectionName, this.tag);
    return cache.count(query);
  }

  async group(aggregation) {
    const cache = new Cache(this.collectionName, this.tag);
    return cache.group(aggregation);
  }

  async findById(id) {
    const cache = new Cache(this.collectionName, this.tag);
    return cache.findById(id);
  }

  async create(doc) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to create an array of entities.', 'Please create entities one by one.');
    }

    const cache = new Cache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    const cachedDoc = await cache.save(doc);
    await sync.addCreateSyncEvent(cachedDoc);
    return cachedDoc;
  }

  async update(doc) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to update an array of entities.', 'Please update entities one by one.');
    }

    if (!doc._id) {
      throw new KinveyError('The entity provided does not contain an _id. An _id is required to update the entity.', doc);
    }

    const cache = new Cache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    const cachedDoc = await cache.save(doc);
    sync.addUpdateSyncEvent(cachedDoc);
    return cachedDoc;
  }

  save(doc, options) {
    if (doc._id) {
      return this.update(doc, options);
    }

    return this.create(doc, options);
  }

  async remove(query) {
    const cache = new Cache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    let count = 0;

    // Find the docs that will be removed from the cache that match the query
    const docs = await cache.find(query);

    if (docs.length > 0) {
      // Remove docs from the cache
      count = await cache.remove(query);

      // Add delete events for the removed docs to sync
      await sync.addDeleteSyncEvent(docs);
    }

    return { count };
  }

  async removeById(id) {
    const cache = new Cache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    let count = 0;

    if (id) {
      // Find the doc that will be removed
      const doc = await cache.findById(id);

      if (doc) {
        // Remove the doc from the cache
        count = await cache.removeById(id);

        // Add delete event for the removed doc to sync
        await sync.addDeleteSyncEvent(doc);
      } else {
        throw new NotFoundError();
      }
    }

    return { count };
  }

  async clear(query) {
    // Remove the docs from the cache
    const cache = new Cache(this.collectionName, this.tag);
    const count = await cache.remove(query);

    // Remove the sync events
    await this.clearSync(query);

    // Clear the query cache
    if (!query) {
      const queryCache = new QueryCache(this.tag);
      queryCache.remove();
    }

    // Return the cound
    return { count };
  }

  push(query, options) {
    const sync = new Sync(this.collectionName, this.tag);
    return sync.push(null, options);
  }

  pull(query, options = {}) {
    const sync = new Sync(this.collectionName, this.tag);
    return sync.pull(query, options);
  }

  async sync(query, options) {
    const push = await this.push(null, options);
    const pull = await this.pull(query, options);
    return { push, pull };
  }

  pendingSyncDocs(query) {
    const sync = new Sync(this.collectionName, this.tag);
    const findQuery = queryToSyncQuery(query, this.collectionName);
    return sync.find(findQuery);
  }

  pendingSyncCount(query) {
    const sync = new Sync(this.collectionName, this.tag);
    const findQuery = queryToSyncQuery(query, this.collectionName);
    return sync.count(findQuery);
  }

  async clearSync(query) {
    const sync = new Sync(this.collectionName, this.tag);
    const clearQuery = queryToSyncQuery(query, this.collectionName);
    return sync.remove(clearQuery);
  }
}
