import { KinveyError } from './kinvey';

function NotFoundError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'NotFoundError';
  this.message = message || 'Entity not found';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
NotFoundError.prototype = Object.create(KinveyError.prototype);
NotFoundError.prototype.constructor = NotFoundError;
export { NotFoundError };