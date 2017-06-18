import { KinveyError } from './kinvey';

function KinveyInternalErrorRetry(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'KinveyInternalErrorRetry';
  this.message = message || 'The Kinvey server encountered an unexpected error. Please retry your request.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
KinveyInternalErrorRetry.prototype = Object.create(KinveyError.prototype);
KinveyInternalErrorRetry.prototype.constructor = KinveyInternalErrorRetry;
export { KinveyInternalErrorRetry };
