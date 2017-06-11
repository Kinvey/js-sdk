function KinveyError(message = '', debug = '', code = -1, kinveyRequestId?: string) {
  this.name = 'KinveyError';
  this.message = message || 'An error occurred.';
  this.debug = debug;
  this.code = code;
  this.kinveyRequestId = kinveyRequestId;
  this.stack = (new Error()).stack;
}
KinveyError.prototype = Object.create(Error.prototype);
KinveyError.prototype.constructor = KinveyError;
export { KinveyError };