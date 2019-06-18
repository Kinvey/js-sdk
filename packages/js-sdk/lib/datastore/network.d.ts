import { KinveyHttpResponse } from '../http';
import { Query } from '../query';
import { Doc } from '../storage';
export interface NetworkOptions {
    trace?: boolean;
    skipBL?: boolean;
    properties?: any;
}
export interface FindNetworkOptions extends NetworkOptions {
    kinveyFileTTL?: number;
    kinveyFileTLS?: boolean;
}
export declare class DataStoreNetwork {
    collectionName: string;
    constructor(collectionName: string);
    find(query?: Query<Doc>, options?: FindNetworkOptions): Promise<KinveyHttpResponse>;
    findById(id: string, options?: FindNetworkOptions): Promise<KinveyHttpResponse>;
    count(query?: Query<Doc>, options?: FindNetworkOptions): Promise<KinveyHttpResponse>;
    create(doc: Doc, options?: NetworkOptions): Promise<KinveyHttpResponse>;
    create(docs: Doc[], options?: NetworkOptions): Promise<KinveyHttpResponse>;
    update(doc: Doc, options?: NetworkOptions): Promise<KinveyHttpResponse>;
    remove(query?: Query<Doc>, options?: NetworkOptions): Promise<KinveyHttpResponse>;
    removeById(id: string, options?: NetworkOptions): Promise<KinveyHttpResponse>;
}
