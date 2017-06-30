import { KinveyError } from './kinvey';

function MissingRequestParameterError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'MissingRequestParameterError';
  this.message = message || 'A required parameter is missing from the request.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
MissingRequestParameterError.prototype = Object.create(KinveyError.prototype);
MissingRequestParameterError.prototype.constructor = MissingRequestParameterError;
export { MissingRequestParameterError };
