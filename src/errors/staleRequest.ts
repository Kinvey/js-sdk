import { KinveyError } from './kinvey';

function StaleRequestError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'StaleRequestError';
  this.message = message || 'The time window for this request has expired.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
StaleRequestError.prototype = Object.create(KinveyError.prototype);
StaleRequestError.prototype.constructor = StaleRequestError;
export { StaleRequestError };
