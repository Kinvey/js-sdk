import { Doc } from '@kinveysdk/storage';
import { DataStoreNetwork, FindNetworkOptions } from './network';

export class NetworkStore<T extends Doc> {
  public collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async find(query?: any, options?: FindNetworkOptions): Promise<T[]> {
    const network = new DataStoreNetwork(this.collectionName);
    const response = await network.find(query, options);
    return response.data;
  }
}
