import { KinveyError } from './kinvey';

function SyncError(message = '', debug = '', code = -1, kinveyRequestId?: string) {
  this.name = 'SyncError';
  this.message = message || 'An error occurred during sync.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
SyncError.prototype = Object.create(KinveyError.prototype);
SyncError.prototype.constructor = SyncError;
export { SyncError };