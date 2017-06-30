import { KinveyError } from './kinvey';

function FeatureUnavailableError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'FeatureUnavailableError';
  this.message = message || 'Requested functionality is unavailable in this API version.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
FeatureUnavailableError.prototype = Object.create(KinveyError.prototype);
FeatureUnavailableError.prototype.constructor = FeatureUnavailableError;
export { FeatureUnavailableError };