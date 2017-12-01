import { RequestMethod } from 'kinvey-request';

export const SyncOperation = {
  Create: RequestMethod.POST,
  Update: RequestMethod.PUT,
  Delete: RequestMethod.DELETE
};
Object.freeze(SyncOperation);
