import { Doc } from '@kinveysdk/storage';
import { Query } from '@kinveysdk/query';
import { NetworkStore } from './networkstore';
import { FindNetworkOptions } from './network';
export declare class AutoStore<T extends Doc> extends NetworkStore<T> {
    find(query?: Query<T>, options?: FindNetworkOptions): Promise<T[]>;
    findById(id: string, options?: FindNetworkOptions): Promise<T>;
    pull(query?: Query<T>, options?: FindNetworkOptions): Promise<number>;
}
