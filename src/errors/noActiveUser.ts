import { KinveyError } from './kinvey';

function NoActiveUserError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'NoActiveUserError';
  this.message = message || 'There is not an active user.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
NoActiveUserError.prototype = Object.create(KinveyError.prototype);
NoActiveUserError.prototype.constructor = NoActiveUserError;
export { NoActiveUserError };
