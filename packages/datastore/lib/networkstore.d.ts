import { Doc } from '@kinveysdk/storage';
import { KinveyError } from '@kinveysdk/errors';
import { FindNetworkOptions, NetworkOptions } from './network';
export interface MultiInsertResult<T extends Doc> {
    entities: T[];
    errors: KinveyError[];
}
export declare class NetworkStore<T extends Doc> {
    collectionName: string;
    constructor(collectionName: string);
    find(query?: any, options?: FindNetworkOptions): Promise<T[]>;
    create(doc: T, options?: NetworkOptions): Promise<T>;
    create(docs: T[], options?: NetworkOptions): Promise<MultiInsertResult<T>>;
    update(doc: T, options?: NetworkOptions): Promise<T>;
    save(doc: T, options?: NetworkOptions): Promise<T>;
    save(docs: T[], options?: NetworkOptions): Promise<T[]>;
}
