import { KinveyError } from './kinvey';

function CORSDisabledError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'CORSDisabledError';
  this.message = message || 'Cross Origin Support is disabled for this application.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
CORSDisabledError.prototype = Object.create(KinveyError.prototype);
CORSDisabledError.prototype.constructor = CORSDisabledError;
export { CORSDisabledError };