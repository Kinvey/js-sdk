import { Doc } from '../storage';
import { Query } from '../query';
import { NetworkStore, MultiInsertResult } from './networkstore';
import { FindNetworkOptions, NetworkOptions } from './network';
import { SyncDoc } from './cache';
import { SyncPushResult } from './sync';
export interface PullOptions extends FindNetworkOptions {
    useDeltaSet?: boolean;
    useAutoPagination?: boolean;
    autoPaginationPageSize?: number;
}
export declare class AutoStore<T extends Doc> extends NetworkStore<T> {
    tag?: string;
    constructor(collectionName: string, tag?: string);
    find(query?: Query<T>, options?: FindNetworkOptions): Promise<T[]>;
    findById(id: string, options?: FindNetworkOptions): Promise<T>;
    create(doc: T, options?: NetworkOptions): Promise<T>;
    create(docs: T[], options?: NetworkOptions): Promise<MultiInsertResult<T>>;
    update(doc: T, options?: NetworkOptions): Promise<T>;
    pendingSyncDocs(): Promise<SyncDoc[]>;
    pendingSyncCount(): Promise<number>;
    pull(query?: Query<T>, options?: FindNetworkOptions): Promise<number>;
    push(options?: NetworkOptions): Promise<SyncPushResult[]>;
}
