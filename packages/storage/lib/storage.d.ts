export interface Doc {
    _id?: string;
    _kmd?: {
        local?: boolean;
    };
}
export interface StorageAdapter<T extends Doc> {
    count(namespace: string, collectionName: string): Promise<number>;
    find(namespace: string, collectionName: string): Promise<T[]>;
    findById(namespace: string, collectionName: string, id: string): Promise<T>;
    save(namespace: string, collectionName: string, docs: T[]): Promise<T[]>;
    removeById(namespace: string, collectionName: string, id: string): Promise<number>;
    clear(namespace: string, collectionName: string): Promise<number>;
    clearDatabase(namespace: string, exclude?: string[]): Promise<void>;
}
export declare class Storage<T extends Doc> {
    namespace: string;
    collectionName: string;
    constructor(namespace: string, collectionName: string);
    readonly storageAdapter: StorageAdapter<T>;
    count(): Promise<number>;
    find(): Promise<T[]>;
    findById(id: string): Promise<T>;
    save(docsToSave: T[]): Promise<T[]>;
    remove(docs: T[]): Promise<number>;
    removeById(id: string): Promise<number>;
    clear(): Promise<number>;
}
