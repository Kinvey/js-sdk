import { KinveyError } from './kinvey';

function APIVersionNotAvailableError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'APIVersionNotAvailableError';
  this.message = message || 'This API version is not available for your app';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
APIVersionNotAvailableError.prototype = Object.create(KinveyError.prototype);
APIVersionNotAvailableError.prototype.constructor = APIVersionNotAvailableError;
export { APIVersionNotAvailableError };