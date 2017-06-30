import { KinveyError } from './kinvey';

function InvalidIdentifierError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'InvalidIdentifierError';
  this.message = message || 'One of more identifier names in the request has an invalid format.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
InvalidIdentifierError.prototype = Object.create(KinveyError.prototype);
InvalidIdentifierError.prototype.constructor = InvalidIdentifierError;
export { InvalidIdentifierError };
