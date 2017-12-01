import { RequestMethod } from 'kinvey-request';
import { generateEntityId } from '../utils';

export function groupBy(array, propOrPredicate) {
  return array.reduce((result, elem) => {
    let currVal = elem[propOrPredicate];
    if (typeof propOrPredicate === 'function') {
      currVal = propOrPredicate(elem);
    }
    result[currVal] = result[currVal] || [];
    result[currVal].push(elem);
    return result;
  }, {});
}

export const CrudOps = {
  Create: 'create',
  Update: 'update',
  Delete: 'delete'
};

const syncOpToPushOpMap = {
  [RequestMethod.POST]: 'create',
  [RequestMethod.PUT]: 'update',
  [RequestMethod.DELETE]: 'delete'
};

// TODO: this exists in old sync-manager.js
export const SyncOps = {
  Create: RequestMethod.POST,
  Update: RequestMethod.PUT,
  Delete: RequestMethod.DELETE
};

export function syncOpToCrudOp(syncOp) {
  return syncOpToPushOpMap[syncOp];
}

export function buildSyncItem(collection, type, entityId) {
  return {
    _id: generateEntityId(),
    collection,
    entityId,
    state: {
      operation: type
    }
  };
}

export const syncCollectionName = 'kinvey_sync';
export const syncBatchSize = 100;
