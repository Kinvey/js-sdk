import { KinveyError } from './kinvey';

function JSONParseError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'JSONParseError';
  this.message = message || 'Unable to parse the JSON in the request.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
JSONParseError.prototype = Object.create(KinveyError.prototype);
JSONParseError.prototype.constructor = JSONParseError;
export { JSONParseError };
