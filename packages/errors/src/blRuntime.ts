import { KinveyError } from './kinvey';

export class BLRuntimeError extends KinveyError {
  constructor(
    message = 'The Business Logic script has a runtime error(s). See debug message for details.',
    debug?: string
  ) {
    super(message, debug);
    this.name = 'BLRuntimeError';
  }
}
