import { KinveyError } from './kinvey';

function WritesToCollectionDisallowedError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'WritesToCollectionDisallowedError';
  this.message = message || 'This collection is configured to disallow any modifications to an existing entity or creation of new entities.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
WritesToCollectionDisallowedError.prototype = Object.create(KinveyError.prototype);
WritesToCollectionDisallowedError.prototype.constructor = WritesToCollectionDisallowedError;
export { WritesToCollectionDisallowedError };
