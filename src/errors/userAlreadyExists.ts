import { KinveyError } from './kinvey';

function UserAlreadyExistsError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'UserAlreadyExistsError';
  this.message = message || 'This username is already taken. Please retry your request with a different username.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
UserAlreadyExistsError.prototype = Object.create(KinveyError.prototype);
UserAlreadyExistsError.prototype.constructor = UserAlreadyExistsError;
export { UserAlreadyExistsError };
