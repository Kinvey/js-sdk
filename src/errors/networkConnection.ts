import { KinveyError } from './kinvey';

function NetworkConnectionError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'NetworkConnectionError';
  this.message = message || 'There was an error connecting to the network.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
NetworkConnectionError.prototype = Object.create(KinveyError.prototype);
NetworkConnectionError.prototype.constructor = NetworkConnectionError;
export { NetworkConnectionError };
