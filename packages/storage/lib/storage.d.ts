export interface Doc {
    _id?: string;
    _kmd?: {
        local?: boolean;
    };
}
export interface StorageAdapter<T extends Doc> {
    find(dbName: string, collectionName: string): Promise<T[]>;
    count(dbName: string, collectionName: string): Promise<number>;
    findById(dbName: string, collectionName: string, id: string): Promise<T>;
    save(dbName: string, collectionName: string, docs: T[]): Promise<T[]>;
    removeById(dbName: string, collectionName: string, id: string): Promise<number>;
    clear(dbName: string, collectionName: string): Promise<number>;
    clearDatabase(dbName: string, exclude?: string[]): Promise<void>;
}
export declare class Storage<T extends Doc> {
    dbName: string;
    collectionName: string;
    constructor(dbName: string, collectionName: string);
    readonly storageAdapter: StorageAdapter<T>;
    find(): Promise<T[]>;
    findById(id: string): Promise<T>;
    save(docsToSave: T[]): Promise<T[]>;
    remove(docs: T[]): Promise<number>;
    removeById(id: string): Promise<number>;
    clear(): Promise<number>;
}
