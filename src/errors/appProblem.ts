import { KinveyError } from './kinvey';

function AppProblemError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'AppProblemError';
  this.message = message || 'There is a problem with this app backend that prevents execution of this operation.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
AppProblemError.prototype = Object.create(KinveyError.prototype);
AppProblemError.prototype.constructor = AppProblemError;
export { AppProblemError };