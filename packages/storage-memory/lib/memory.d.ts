import { Storage, StorageAdapter, Doc } from '@kinveysdk/storage';
export declare class Memory<T extends Doc> implements StorageAdapter<T> {
    count(namespace: string, collectionName: string): Promise<number>;
    find(namespace: string, collectionName: string): Promise<T[]>;
    findById(namespace: string, collectionName: string, id: string): Promise<T>;
    save(namespace: string, collectionName: string, docs: T[]): Promise<T[]>;
    removeById(namespace: string, collectionName: string, id: string): Promise<number>;
    clear(namespace: string, collectionName: string): Promise<number>;
    clearDatabase(namespace: string, exclude?: string[]): Promise<void>;
}
export declare class MemoryStorage<T extends Doc> extends Storage<T> {
    readonly storageAdapter: Memory<T>;
}
