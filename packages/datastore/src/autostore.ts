import { Doc } from '@kinveysdk/storage';
import { NetworkError } from '@kinveysdk/errors';
import { Query } from '@kinveysdk/query';
import { NetworkStore } from './networkstore';
import { DataStoreNetwork, FindNetworkOptions } from './network';
import { DataStoreCache } from './cache';

export class AutoStore<T extends Doc> extends NetworkStore<T> {
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

  async pull(query?: Query<T>, options: FindNetworkOptions = {}): Promise<number> {
    const network = new DataStoreNetwork(this.collectionName);
    const cache = new DataStoreCache<T>(this.collectionName);
    const response = await network.find(query, options);
    const docs = response.data;
    await cache.save(docs);
    return docs.length;
  }
}
