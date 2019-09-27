import { KinveyError } from './kinvey';

export class BLViolationError extends KinveyError {
  constructor(
    message = 'The Business Logic script violated a constraint. See debug message for details.',
    debug?: string
  ) {
    super(message, debug);
    this.name = 'BLViolationError';
  }
}
