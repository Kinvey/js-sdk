import { KinveyError } from './kinvey';

function InvalidCredentialsError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'InvalidCredentialsError';
  this.message = message || 'Invalid credentials.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
InvalidCredentialsError.prototype = Object.create(KinveyError.prototype);
InvalidCredentialsError.prototype.constructor = InvalidCredentialsError;
export { InvalidCredentialsError };
