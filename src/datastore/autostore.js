import isArray from 'lodash/isArray';
import KinveyError from '../errors/kinvey';
import NetworkConnectionError from '../errors/networkConnection';
import Query from '../query';
import Network from './network';
import Cache from './cache';
import Sync from './sync';
import QueryCache from './queryCache';
import { queryToSyncQuery } from './utils';

export default class AutoStore {
  constructor(collectionName, options = { tag: undefined, useDeltaSet: false, useAutoPagination: false }) {
    this.collectionName = collectionName;
    this.tag = options.tag;
    this.useDeltaSet = options.useDeltaSet === true;
    this.useAutoPagination = options.useAutoPagination === true || options.autoPagination;
  }

  async find(query, options) {
    const cache = new Cache(this.collectionName, this.tag);

    try {
      await this.pull(query, options);
      return cache.find(query);
    } catch (error) {
      if (error instanceof NetworkConnectionError) {
        return cache.find(query);
      }

      throw error;
    }
  }

  count(query, options) {
    try {
      const network = new Network(this.collectionName);
      return network.count(query, options);
    } catch (error) {
      if (error instanceof NetworkConnectionError) {
        const cache = new Cache(this.collectionName, this.tag);
        return cache.count(query);
      }

      throw error;
    }
  }

  group(aggregation, options) {
    try {
      const network = new Network(this.collectionName);
      return network.group(aggregation, options);
    } catch (error) {
      if (error instanceof NetworkConnectionError) {
        const cache = new Cache(this.collectionName, this.tag);
        return cache.group(aggregation);
      }

      throw error;
    }
  }

  async findById(id, options) {
    const cache = new Cache(this.collectionName, this.tag);

    try {
      const sync = new Sync(this.collectionName, this.tag);
      await sync.pullById(id, options);
      return cache.findById(id);
    } catch (error) {
      if (error instanceof NetworkConnectionError) {
        return cache.findById(id);
      }

      throw error;
    }
  }

  async create(doc, options) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to create an array of entities.', 'Please create entities one by one.');
    }

    const cache = new Cache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    const cachedDoc = await cache.save(doc);
    const syncDoc = await sync.addCreateSyncEvent(cachedDoc);
    const query = new Query().equalTo('_id', syncDoc._id);
    const pushResults = await sync.push(query, options);
    const pushResult = pushResults.shift();

    if (pushResult.error) {
      return cachedDoc;
    }

    return pushResult.entity;
  }

  async update(doc, options) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to update an array of entities.', 'Please update entities one by one.');
    }

    if (!doc._id) {
      throw new KinveyError('The entity provided does not contain an _id. An _id is required to update the entity.', doc);
    }

    const cache = new Cache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    const cachedDoc = await cache.save(doc);
    const syncDoc = await sync.addUpdateSyncEvent(cachedDoc);
    const query = new Query().equalTo('_id', syncDoc._id);
    const pushResults = await sync.push(query, options);
    const pushResult = pushResults.shift();

    if (pushResult.error) {
      return cachedDoc;
    }

    return pushResult.entity;
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

      // Remove the docs from the backend
      const findQuery = queryToSyncQuery(query, this.collectionName);
      const syncDocs = await sync.find(findQuery);

      if (syncDocs.length > 0) {
        const pushQuery = new Query().contains('_id', syncDocs.map(doc => doc._id));
        const pushResults = await sync.push(pushQuery);
        count = pushResults.reduce((count, pushResult) => {
          if (pushResult.error) {
            return count - 1;
          }

          return count;
        }, count || syncDocs.length);
      }
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
        const syncDoc = await sync.addDeleteSyncEvent(doc);

        // Remove the doc from the backend
        if (syncDoc) {
          const query = new Query().equalTo('_id', syncDoc._id);
          const pushResults = await sync.push(query);

          if (pushResults.length > 0) {
            const pushResult = pushResults.shift();
            if (pushResult.error) {
              count -= 1;
            }
          }
        }
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

  async pull(query, options = {}) {
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
