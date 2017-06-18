import { KinveyError } from './kinvey';

function BLError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'BLError';
  this.message = message || 'The Business Logic script did not complete.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
BLError.prototype = Object.create(KinveyError.prototype);
BLError.prototype.constructor = BLError;
export { BLError };