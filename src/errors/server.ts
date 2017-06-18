import { KinveyError } from './kinvey';

function ServerError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'ServerError';
  this.message = message || 'An error occurred on the server.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
ServerError.prototype = Object.create(KinveyError.prototype);
ServerError.prototype.constructor = ServerError;
export { ServerError };
