import { KinveyError } from './kinvey';

function MissingQueryError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'MissingQueryError';
  this.message = message || 'The request is missing a query string.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
MissingQueryError.prototype = Object.create(KinveyError.prototype);
MissingQueryError.prototype.constructor = MissingQueryError;
export { MissingQueryError };
