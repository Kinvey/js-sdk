import { KinveyError } from './kinvey';

function PopupError(message?: string, debug?: string, code?: number, kinveyRequestId?: string) {
  this.name = 'PopupError';
  this.message = message || 'Unable to open a popup on this platform.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
PopupError.prototype = Object.create(KinveyError.prototype);
PopupError.prototype.constructor = PopupError;
export { PopupError };
