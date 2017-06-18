import { KinveyError } from './kinvey';

function DuplicateEndUsersError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'DuplicateEndUsersError';
  this.message = message || 'More than one user registered with this username for this application.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
DuplicateEndUsersError.prototype = Object.create(KinveyError.prototype);
DuplicateEndUsersError.prototype.constructor = DuplicateEndUsersError;
export { DuplicateEndUsersError };