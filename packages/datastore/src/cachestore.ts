// import isArray from 'lodash/isArray';
// import times from 'lodash/times';
// import { Query } from '@progresskinvey/js-sdk-query';
// import { Aggregation } from '@progresskinvey/js-sdk-aggregation';
// import { MissingConfigurationError, ParameterValueOutOfRangeError } from '@progresskinvey/js-sdk-errors';
// import { Entity } from '@progresskinvey/js-sdk-storage';
// import { DataStore, MultiInsertResult } from './datastore';
// import { DataStoreCache, QueryCache, QueryEntity } from './cache';
// import { FindNetworkOptions, NetworkOptions, DataStoreNetwork } from './network';
// import { Sync, SyncPushResult } from './sync';

// export interface CacheStoreOptions {
//   tag?: string;
//   useDeltaSet?: boolean;
//   useAutoPagination?: boolean;
// }

// export class CacheStore<T extends Entity> implements DataStore<T> {
//   public collectionName: string;
//   protected cache?: DataStoreCache<T>;
//   protected queryCache?: QueryCache;
//   protected network: DataStoreNetwork;
//   protected sync?: Sync;
//   protected useDeltaSet: boolean;
//   protected useAutoPagination: boolean;

//   constructor(collectionName: string, options: CacheStoreOptions = {}) {
//     this.collectionName = collectionName;
//     this.cache = new DataStoreCache(collectionName, options.tag);
//     this.queryCache = new QueryCache(options.tag);
//     this.network = new DataStoreNetwork(collectionName);
//     this.sync = new Sync(collectionName, options.tag);
//     this.useDeltaSet = options.useDeltaSet === true;
//     this.useAutoPagination = options.useAutoPagination === true;
//   }

//   find(query?: Query): Promise<T[]> {
//     return this.cache.find(query);
//   }

//   count(query?: Query): Promise<number> {
//     return this.cache.count(query);
//   }

//   group<K>(aggregation: Aggregation<K>): Promise<K> {
//     return this.cache.group<K>(aggregation);
//   }

//   findById(id: string): Promise<T> {
//     return this.cache.findById(id);
//   }

//   async create(entities: T | T[]): Promise<T | T[]> {
//     const savedEntities = await this.cache.save([].concat(entities));
//     await this.sync.addCreateOperation(savedEntities);
//     return savedEntities;
//   }

//   update(entities: T | T[]): Promise<T | T[]> {
//     return this.cache.save([].concat(entities));
//   }

//   save(entities: T | T[]): Promise<T | T[]> {
//     return this.cache.save([].concat(entities));
//   }

//   remove(query?: Query): Promise<number> {
//     return this.cache.remove(query);
//   }

//   removeById(id: string): Promise<number> {
//     return this.cache.removeById(id);
//   }

//   async push(options?: NetworkOptions): Promise<SyncPushResult[]> {
//     const syncEntities = await this.sync.find();
//     return this.sync.push(syncEntities, options);
//   }

//   async pull(query?: Query, options?: FindNetworkOptions): Promise<number> {
//     const pullQuery = new Query({ filter: query.filter });

//     const count = await this.sync.count();
//     if (count > 0) {
//       if (count === 1) {
//         throw new Error(
//           `Unable to pull entities from the backend. There is ${count} entity that needs to be pushed to the backend.`
//         );
//       }

//       throw new Error(
//         `Unable to pull entities from the backend. There are ${count} entities that need to be pushed to the backend.`
//       );
//     }

//     // Retrieve existing queryDoc
//     const queryEntity: QueryEntity = (await this.queryCache.findById(pullQuery._id)) || {
//       _id: pullQuery._id,
//       query: pullQuery._id,
//       collectionName: this.collectionName,
//       lastRequest: null,
//     };

//     // Delta Set
//     if (this.useDeltaSet) {
//       try {
//         const response = await this.network.findByDeltaSet(pullQuery, { ...options, since: queryEntity.lastRequest });
//         const { changed, deleted } = response.data;

//         // Delete the docs that have been deleted
//         if (isArray(deleted) && deleted.length > 0) {
//           const removeQuery = new Query().contains('_id', deleted.map((doc): string => doc._id));
//           await this.cache.remove(removeQuery);
//         }

//         // Save the docs that changed
//         if (isArray(changed) && changed.length > 0) {
//           await this.cache.save(changed);
//         }

//         // Update the query cache
//         queryEntity.lastRequest = response.headers.requestStart;
//         await this.queryCache.save(queryEntity);

//         // Return the number of changed docs
//         return changed.length;
//       } catch (error) {
//         if (!(error instanceof MissingConfigurationError) && !(error instanceof ParameterValueOutOfRangeError)) {
//           throw error;
//         }
//       }
//     }

//     // Auto Pagination
//     if (this.useAutoPagination) {
//       const pageLimit = 1000;

//       // Clear the cache
//       await this.cache.clear();

//       // Get the total count of docs
//       const response = await this.network.count(pullQuery, options);
//       const { count } = response.data;

//       // Create the pages
//       const pages = times(
//         Math.ceil(count / pageLimit),
//         (i): Query => {
//           const pageQuery = new Query(pullQuery);
//           pageQuery.skip = i * pageLimit;
//           pageQuery.limit = Math.min(count - i * pageLimit, pageLimit);
//           return pageQuery;
//         }
//       );

//       // Process the pages
//       const promises = pages.map(
//         async (page): Promise<number> => {
//           const response = await this.network.find(page, options);
//           const entities = response.data;
//           await this.cache.save(entities);
//           return entities.length;
//         }
//       );
//       const counts = await Promise.all(promises);
//       const total = counts.reduce((totalCount: number, count: number): number => totalCount + count, 0);

//       // Update the query cache
//       queryEntity.lastRequest = response.headers.requestStart;
//       await this.queryCache.save(queryEntity);

//       // Return the total page count
//       return total;
//     }

//     // Find the entities on the backend
//     const response = await this.network.find(pullQuery, options);
//     const entities = response.data;

//     // Remove the entities matching the provided query
//     await this.cache.remove(pullQuery);

//     // Save the entities to cache
//     await this.cache.save(entities);

//     // Update the query cache
//     queryEntity.lastRequest = response.headers.requestStart;
//     await this.queryCache.save(queryEntity);

//     // Return the number of entities
//     return entities.length;
//   }
// }
