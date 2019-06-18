import { Doc } from '../storage';
import { KinveyError } from '../errors';
import { SyncDoc, SyncOperation } from './cache';
import { NetworkOptions } from './network';
export interface SyncPushResult {
    operation: SyncOperation;
    doc: Doc;
    error?: KinveyError;
}
export declare class Sync {
    collectionName: string;
    tag?: string;
    constructor(collectionName: string, tag?: string);
    find(): Promise<SyncDoc[]>;
    addCreateSyncOperation(docs: Doc[]): Promise<SyncDoc[]>;
    addUpdateSyncOperation(docs: Doc[]): Promise<SyncDoc[]>;
    addDeleteSyncOperation(docs: Doc[]): Promise<SyncDoc[]>;
    addSyncOperation(operation: SyncOperation, docs: Doc[]): Promise<SyncDoc[]>;
    push(docs?: SyncDoc[], options?: NetworkOptions): Promise<SyncPushResult[]>;
}
