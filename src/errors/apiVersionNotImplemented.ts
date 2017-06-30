import { KinveyError } from './kinvey';

function APIVersionNotImplementedError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'APIVersionNotImplementedError';
  this.message = message || 'This API version is not implemented';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
APIVersionNotImplementedError.prototype = Object.create(KinveyError.prototype);
APIVersionNotImplementedError.prototype.constructor = APIVersionNotImplementedError;
export { APIVersionNotImplementedError };