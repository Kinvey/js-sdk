import { KinveyError } from './kinvey';

function BadRequestError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'BadRequestError';
  this.message = message || 'Unable to understand request.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
BadRequestError.prototype = Object.create(KinveyError.prototype);
BadRequestError.prototype.constructor = BadRequestError;
export { BadRequestError };