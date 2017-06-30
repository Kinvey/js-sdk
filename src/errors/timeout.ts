import { KinveyError } from './kinvey';

function TimeoutError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'TimeoutError';
  this.message = message || 'The request timed out.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
TimeoutError.prototype = Object.create(KinveyError.prototype);
TimeoutError.prototype.constructor = TimeoutError;
export { TimeoutError };
