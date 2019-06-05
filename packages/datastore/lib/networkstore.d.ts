import { Doc } from '@kinveysdk/storage';
import { FindNetworkOptions } from './network';
export declare class NetworkStore<T extends Doc> {
    collectionName: string;
    constructor(collectionName: string);
    find(query?: any, options?: FindNetworkOptions): Promise<T[]>;
}
