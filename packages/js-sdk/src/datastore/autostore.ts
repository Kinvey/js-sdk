import isArray from 'lodash/isArray';
import times from 'lodash/times';
import { Doc } from '../storage';
import { NetworkError, KinveyError, MissingConfigurationError, ParameterValueOutOfRangeError } from '../errors';
import { Query } from '../query';
import { getApiVersion } from '../init';
import { NetworkStore, MultiInsertResult } from './networkstore';
import { DataStoreNetwork, FindNetworkOptions, NetworkOptions } from './network';
import { DataStoreCache, QueryCache, SyncDoc, isValidTag, QueryDoc } from './cache';
import { Sync, SyncPushResult } from './sync';

const PAGE_LIMIT = 10000;

export interface PullOptions extends FindNetworkOptions {
  useDeltaSet?: boolean;
  useAutoPagination?: boolean;
}

export class AutoStore<T extends Doc> extends NetworkStore<T> {
  public tag?: string;

  constructor(collectionName: string, tag?: string) {
    super(collectionName);

    if (tag && !isValidTag(tag)) {
      throw new KinveyError('The provided tag is not valid.', 'A tag can only contain letters, numbers, and "-".');
    }

    this.tag = tag;
  }

  async find(query?: Query<T>, options?: FindNetworkOptions): Promise<T[]> {
    const cache = new DataStoreCache<T>(this.collectionName);

    try {
      await this.pull(query, options);
      return cache.find(query);
    } catch (error) {
      if (error instanceof NetworkError) {
        return cache.find(query);
      }
      throw error;
    }
  }

  async findById(id: string, options?: FindNetworkOptions): Promise<T> {
    const cache = new DataStoreCache<T>(this.collectionName);

    try {
      const query = new Query<T>().equalTo('_id', id);
      await this.pull(query, options);
      return cache.findById(id);
    } catch (error) {
      if (error instanceof NetworkError) {
        return cache.findById(id);
      }
      throw error;
    }
  }

  create(doc: T, options?: NetworkOptions): Promise<T>;
  create(docs: T[], options?: NetworkOptions): Promise<MultiInsertResult<T>>;
  async create(docs: any, options?: NetworkOptions): Promise<any> {
    const apiVersion = getApiVersion();

    if (apiVersion < 5 && isArray(docs)) {
      throw new KinveyError('Unable to create an array of docs. Please create docs one by one.');
    }

    if (!isArray()) {
      const result = await this.create([docs], options);
      const error = result.errors.shift();
      if (error) {
        throw error;
      }
      return result.entities.shift();
    }

    const cache = new DataStoreCache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);

    // Save the docs to the cache
    const cachedDocs = await cache.save(docs as T[]);

    // Attempt to sync the docs with the backend
    const syncDocs = await sync.addCreateSyncOperation(cachedDocs);
    const results = await sync.push(syncDocs, options);
    return results.reduce(
      (multiInsertResult, result): MultiInsertResult<T> => {
        multiInsertResult.entities.push(result.doc);
        multiInsertResult.errors.push(result.error);
        return multiInsertResult;
      },
      { entities: [], errors: [] }
    );
  }

  async update(doc: T, options?: NetworkOptions): Promise<T> {
    if (isArray(doc)) {
      throw new KinveyError('Unable to update an array of docs. Please update docs one by one.');
    }

    if (!doc._id) {
      throw new KinveyError('Doc is missing _id.');
    }

    const cache = new DataStoreCache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);

    // Save the doc to the cache
    const cachedDoc = await cache.save(doc);

    // Attempt to sync the docs with the backend
    const syncDocs = await sync.addCreateSyncOperation([cachedDoc]);
    const results = await sync.push(syncDocs, options);
    const result = results.shift();
    if (result.error) {
      throw result.error;
    }
    return result.doc as T;
  }

  async remove(query?: Query<T>, options?: NetworkOptions): Promise<number> {
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    const network = new DataStoreNetwork(this.collectionName);

    // Remove the docs from the network
    const response = await network.remove(query, options);
    const count = 'count' in response.data ? response.data.count : 0;

    // Remove the docs from the cache
    const docs = await cache.find(query);
    const syncDocs = await sync.addDeleteSyncOperation(docs);
    await sync.push(syncDocs, options);

    // Return the count
    return count;
  }

  async removeById(id: string, options?: NetworkOptions): Promise<number> {
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const sync = new Sync(this.collectionName, this.tag);
    const network = new DataStoreNetwork(this.collectionName);

    // Remove the docs from the network
    const response = await network.removeById(id, options);
    const count = 'count' in response.data ? response.data.count : 0;

    // Remove the doc from the cache
    const doc = await cache.findById(id);
    const syncDocs = await sync.addDeleteSyncOperation([doc]);
    await sync.push(syncDocs, options);

    // Return the count
    return count;
  }

  async pendingSyncDocs(): Promise<SyncDoc[]> {
    const sync = new Sync(this.collectionName, this.tag);
    return sync.find();
  }

  async pendingSyncCount(): Promise<number> {
    const syncDocs = await this.pendingSyncDocs();
    return syncDocs.length;
  }

  async pull(query: Query<T> = new Query<T>(), options: PullOptions = {}): Promise<number> {
    const pullQuery = new Query({ filter: query.filter });
    const network = new DataStoreNetwork(this.collectionName);
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const queryCache = new QueryCache(this.collectionName, this.tag);

    // Push sync queue
    const pendingSyncCount = await this.pendingSyncCount();
    if (pendingSyncCount > 0) {
      await this.push(options);
      return this.pull(query, options);
    }

    // Retrieve existing queryCacheDoc
    const queryDoc: QueryDoc = (await queryCache.findById(pullQuery._id)) || {
      _id: pullQuery._id,
      collectionName: this.collectionName,
      since: null
    };

    // Delta Set
    if (options.useDeltaSet) {
      try {
        // Delta Set request
        const response = await network.findByDeltaSet(pullQuery, Object.assign({}, options, { since: queryDoc.since }));
        const { changed, deleted } = response.data;

        // Delete the docs that have been deleted
        if (isArray(deleted) && deleted.length > 0) {
          const removeQuery = new Query().contains('_id', deleted.map((doc): string => doc._id));
          await cache.remove(removeQuery);
        }

        // Save the docs that changed
        if (isArray(changed) && changed.length > 0) {
          await cache.save(changed);
        }

        // Update the query cache
        queryDoc.since = response.headers.requestStart;
        await queryCache.save(queryDoc);

        // Return the number of changed docs
        return changed.length;
      } catch (error) {
        if (!(error instanceof MissingConfigurationError) && !(error instanceof ParameterValueOutOfRangeError)) {
          throw error;
        }
      }
    }

    // Auto pagination
    if (options.useAutoPagination) {
      // Clear the cache
      await cache.clear();

      // Get the total count of docs
      const response = await network.count(pullQuery, options);
      const { count } = response.data;

      // Create the pages
      const pageQueries = times(
        Math.ceil(count / PAGE_LIMIT),
        (i): Query<Doc> => {
          const pageQuery = new Query(pullQuery);
          pageQuery.skip = i * PAGE_LIMIT;
          pageQuery.limit = Math.min(count - i * PAGE_LIMIT, PAGE_LIMIT);
          return pageQuery;
        }
      );

      // Process the pages
      const pagePromises = pageQueries.map(
        async (pageQuery): Promise<number> => {
          const pageResponse = await network.find(pageQuery, options);
          const docs = pageResponse.data;
          await cache.save(docs);
          return docs.length;
        }
      );
      const pageCounts = await Promise.all(pagePromises);
      const totalPageCount = pageCounts.reduce(
        (totalCount: number, pageCount: number): number => totalCount + pageCount,
        0
      );

      // Update the query cache
      queryDoc.since = response.headers.requestStart;
      await queryCache.save(queryDoc);

      // Return the total page count
      return totalPageCount;
    }

    // Find the docs on the backend
    const response = await network.find(pullQuery, options);
    const docs = response.data;

    // Remove the docs matching the provided query
    await cache.remove(pullQuery);

    // Update the cache
    await cache.save(docs);

    // Update the query cache
    queryDoc.since = response.headers.requestStart;
    await queryCache.save(queryDoc);

    // Return the number of docs
    return docs.length;
  }

  async push(options?: NetworkOptions): Promise<SyncPushResult[]> {
    const sync = new Sync(this.collectionName, this.tag);
    const syncDocs = await sync.find();
    return sync.push(syncDocs, options);
  }
}
