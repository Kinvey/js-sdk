import { KinveyError } from './kinvey';

function MobileIdentityConnectError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'MobileIdentityConnectError';
  this.message = message || 'An error has occurred with Mobile Identity Connect.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
MobileIdentityConnectError.prototype = Object.create(KinveyError.prototype);
MobileIdentityConnectError.prototype.constructor = MobileIdentityConnectError;
export { MobileIdentityConnectError };
