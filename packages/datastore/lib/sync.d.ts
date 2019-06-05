import { Doc } from '@kinveysdk/storage';
import { KinveyError } from '@kinveysdk/errors';
import { Query } from '@kinveysdk/query';
import { SyncDoc, SyncOperation } from './cache';
import { NetworkOptions } from './network';
export interface SyncPushResult {
    _id: string;
    operation: SyncOperation;
    doc: Doc;
    error?: KinveyError;
}
export declare class Sync {
    collectionName: string;
    tag?: string;
    constructor(collectionName: string, tag?: string);
    addCreateSyncOperation(docs: Doc[]): Promise<SyncDoc[]>;
    addUpdateSyncOperation(docs: Doc[]): Promise<SyncDoc[]>;
    addDeleteSyncOperation(docs: Doc[]): Promise<SyncDoc[]>;
    addSyncOperation(operation: SyncOperation, docs: Doc[]): Promise<SyncDoc[]>;
    push(query?: Query<SyncDoc>, options?: NetworkOptions): Promise<SyncPushResult[]>;
    remove(query?: Query<SyncDoc>): Promise<number>;
}
