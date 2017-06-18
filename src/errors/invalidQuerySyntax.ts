import { KinveyError } from './kinvey';

function InvalidQuerySyntaxError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'InvalidQuerySyntaxError';
  this.message = message || 'The query string in the request has an invalid syntax.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
InvalidQuerySyntaxError.prototype = Object.create(KinveyError.prototype);
InvalidQuerySyntaxError.prototype.constructor = InvalidQuerySyntaxError;
export { InvalidQuerySyntaxError };
