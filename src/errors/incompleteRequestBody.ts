import { KinveyError } from './kinvey';

function IncompleteRequestBodyError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'IncompleteRequestBodyError';
  this.message = message || 'The request body is either missing or incomplete.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
IncompleteRequestBodyError.prototype = Object.create(KinveyError.prototype);
IncompleteRequestBodyError.prototype.constructor = IncompleteRequestBodyError;
export { IncompleteRequestBodyError };