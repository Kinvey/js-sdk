import { KinveyError } from './kinvey';

function MissingRequestHeaderError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'MissingRequestHeaderError';
  this.message = message || 'The request is missing a required header.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
MissingRequestHeaderError.prototype = Object.create(KinveyError.prototype);
MissingRequestHeaderError.prototype.constructor = MissingRequestHeaderError;
export { MissingRequestHeaderError };
