import { KinveyError } from './kinvey';

function KinveyInternalErrorStop(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'KinveyInternalErrorStop';
  this.message = message || 'The Kinvey server encountered an unexpected error. Please contact support@kinvey.com for assistance.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
KinveyInternalErrorStop.prototype = Object.create(KinveyError.prototype);
KinveyInternalErrorStop.prototype.constructor = KinveyInternalErrorStop;
export { KinveyInternalErrorStop };
