import { KinveyError } from './kinvey';

function NoResponseError(message = '', debug = '', code = -1, kinveyRequestId?: string) {
  this.name = 'NoResponseError';
  this.message = message || 'No response was provided.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
NoResponseError.prototype = Object.create(KinveyError.prototype);
NoResponseError.prototype.constructor = NoResponseError;
export { NoResponseError };