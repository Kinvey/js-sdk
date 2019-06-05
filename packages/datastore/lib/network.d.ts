import { KinveyHttpResponse } from '@kinveysdk/http';
import { Query } from '@kinveysdk/query';
import { Doc } from '@kinveysdk/storage';
export interface NetworkOptions {
    trace?: boolean;
    skipBL?: boolean;
    properties?: any;
}
export interface FindNetworkOptions extends NetworkOptions {
    kinveyFileTTL?: number;
    kinveyFileTLS?: boolean;
}
export declare class DataStoreNetwork<T extends Doc> {
    collectionName: string;
    constructor(collectionName: string);
    find(query?: Query<T>, options?: FindNetworkOptions): Promise<KinveyHttpResponse>;
    findById(id: string, options?: FindNetworkOptions): Promise<KinveyHttpResponse>;
    count(query?: Query<T>, options?: FindNetworkOptions): Promise<KinveyHttpResponse>;
    create(doc: T, options?: NetworkOptions): Promise<KinveyHttpResponse>;
    update(doc: T, options?: NetworkOptions): Promise<KinveyHttpResponse>;
    remove(query?: Query<T>, options?: NetworkOptions): Promise<KinveyHttpResponse>;
    removeById(id: string, options?: NetworkOptions): Promise<KinveyHttpResponse>;
}
