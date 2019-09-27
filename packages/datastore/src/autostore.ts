// import { Query } from '@progresskinvey/js-sdk-query';
// import { NetworkError } from '@progresskinvey/js-sdk-errors';
// import { Aggregation } from '@progresskinvey/js-sdk-aggregation';
// import { CacheStore } from './cachestore';
// import { FindNetworkOptions, NetworkOptions } from './network';

// export class AutoStore<T> extends CacheStore<T> {
//   async find(query?: Query, options?: FindNetworkOptions): Promise<T[]> {
//     try {
//       await this.pull(query, options);
//       return this.cache.find(query);
//     } catch (error) {
//       if (error instanceof NetworkError) {
//         return this.cache.find(query);
//       }

//       throw error;
//     }
//   }

//   async count(query?: Query, options?: NetworkOptions): Promise<number> {
//     try {
//       const response = await this.network.count(query, options);
//       return 'count' in response.data ? response.data.count : 0;
//     } catch (error) {
//       if (error instanceof NetworkError) {
//         return this.cache.count(query);
//       }

//       throw error;
//     }
//   }

//   async group<K>(aggregation: Aggregation<K>, options?: NetworkOptions): Promise<K> {
//     try {
//       const response = await this.network.group(aggregation, options);
//       return response.data;
//     } catch (error) {
//       if (error instanceof NetworkError) {
//         return this.cache.group(aggregation);
//       }

//       throw error;
//     }
//   }

//   async findById(id: string, options?: FindNetworkOptions): Promise<T> {
//     try {
//       const query = new Query().equalTo('_id', id);
//       await this.pull(query, options);
//       return this.cache.findById(id);
//     } catch (error) {
//       if (error instanceof NetworkError) {
//         return this.cache.findById(id);
//       }

//       throw error;
//     }
//   }
// }
