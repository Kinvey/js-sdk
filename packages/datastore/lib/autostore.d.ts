import { Doc } from '@kinveysdk/storage';
import { Query } from '@kinveysdk/query';
import { NetworkStore } from './networkstore';
import { FindNetworkOptions, NetworkOptions } from './network';
import { SyncPushResult } from './sync';
export declare class AutoStore<T extends Doc> extends NetworkStore<T> {
    tag?: string;
    constructor(collectionName: string, tag?: string);
    find(query?: Query<T>, options?: FindNetworkOptions): Promise<T[]>;
    findById(id: string, options?: FindNetworkOptions): Promise<T>;
    pull(query?: Query<T>, options?: FindNetworkOptions): Promise<number>;
    push(options?: NetworkOptions): Promise<SyncPushResult[]>;
}
