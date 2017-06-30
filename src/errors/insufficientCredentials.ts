import { KinveyError } from './kinvey';

function InsufficientCredentialsError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'InsufficientCredentialsError';
  this.message = message || 'The credentials used to authenticate this request are not authorized to run this operation. Please retry your request with appropriate credentials.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
InsufficientCredentialsError.prototype = Object.create(KinveyError.prototype);
InsufficientCredentialsError.prototype.constructor = InsufficientCredentialsError;
export { InsufficientCredentialsError };
