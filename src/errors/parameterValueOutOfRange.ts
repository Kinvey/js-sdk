import { KinveyError } from './kinvey';

function ParameterValueOutOfRangeError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'ParameterValueOutOfRangeError';
  this.message = message || 'The value specified for one of the request parameters is out of range.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
ParameterValueOutOfRangeError.prototype = Object.create(KinveyError.prototype);
ParameterValueOutOfRangeError.prototype.constructor = ParameterValueOutOfRangeError;
export { ParameterValueOutOfRangeError };
