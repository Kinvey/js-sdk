import { KinveyError } from './kinvey';

function QueryError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'QueryError';
  this.message = message || 'An error occurred.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
QueryError.prototype = Object.create(KinveyError.prototype);
QueryError.prototype.constructor = QueryError;
export { QueryError };