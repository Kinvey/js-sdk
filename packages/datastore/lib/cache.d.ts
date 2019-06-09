import { Storage, Doc } from '@kinveysdk/storage';
import { Query } from '@kinveysdk/query';
export declare function isValidTag(tag: string): boolean;
export declare class DataStoreCache<T extends Doc> extends Storage<T> {
    constructor(collectionName: string, tag?: string);
    find(query?: Query<T>): Promise<T[]>;
    save(doc: T): Promise<T>;
    save(docs: T[]): Promise<T[]>;
    remove(query?: Query<T>): Promise<number>;
}
export declare enum SyncOperation {
    Create = "POST",
    Update = "PUT",
    Delete = "DELETE"
}
export interface SyncDoc extends Doc {
    doc: Doc;
    state: {
        operation: SyncOperation;
    };
}
export declare class SyncCache extends DataStoreCache<SyncDoc> {
    constructor(collectionName: string, tag?: string);
}
