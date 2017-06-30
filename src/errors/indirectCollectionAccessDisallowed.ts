import { KinveyError } from './kinvey';

function IndirectCollectionAccessDisallowedError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'IndirectCollectionAccessDisallowedError';
  this.message = message || 'Please use the appropriate API to access this collection for this app backend.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
IndirectCollectionAccessDisallowedError.prototype = Object.create(KinveyError.prototype);
IndirectCollectionAccessDisallowedError.prototype.constructor = IndirectCollectionAccessDisallowedError;
export { IndirectCollectionAccessDisallowedError };
