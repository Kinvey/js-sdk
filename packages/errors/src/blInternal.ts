import { KinveyError } from './kinvey';

export class BLInternalError extends KinveyError {
  constructor(message = 'The Business Logic script did not complete. See debug message for details.', debug?: string) {
    super(message, debug);
    this.name = 'BLInternalError';
  }
}
