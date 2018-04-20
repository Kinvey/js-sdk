import { BaseError } from './base';

export function InvalidGrantError(message, debug, code, kinveyRequestId) {
  this.name = 'InvalidGrantError';
  this.message = message || 'Invalid grant: refresh token is invalid';
  this.debug = debug || undefined;
  this.code = code || undefined;
  this.kinveyRequestId = kinveyRequestId || undefined;
  this.stack = (new Error()).stack;
}
InvalidGrantError.prototype = Object.create(BaseError.prototype);
InvalidGrantError.prototype.constructor = InvalidGrantError;
