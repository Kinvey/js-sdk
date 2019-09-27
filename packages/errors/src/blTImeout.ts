import { KinveyError } from './kinvey';

export class BLTimeoutError extends KinveyError {
  constructor(
    message = 'The Business Logic script did not complete in time. See debug message for details.',
    debug?: string
  ) {
    super(message, debug);
    this.name = 'BLTimeoutError';
  }
}
