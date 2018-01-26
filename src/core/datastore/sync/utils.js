import { SyncOperation } from './sync-operation';

const syncOpToPushOpMap = {
  [SyncOperation.Create]: 'create',
  [SyncOperation.Update]: 'update',
  [SyncOperation.Delete]: 'delete'
};

export function syncOpToCrudOp(syncOp) {
  return syncOpToPushOpMap[syncOp];
}

export const syncCollectionName = 'kinvey_sync';
export const syncBatchSize = 100;
