import { KinveyError } from './kinvey';

function ActiveUserError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'ActiveUserError';
  this.message = message || 'An error occurred.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
ActiveUserError.prototype = Object.create(KinveyError.prototype);
ActiveUserError.prototype.constructor = ActiveUserError;
export { ActiveUserError };