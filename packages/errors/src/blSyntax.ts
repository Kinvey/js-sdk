import { KinveyError } from './kinvey';

export class BLSyntaxError extends KinveyError {
  constructor(
    message = 'The Business Logic script has a syntax error(s). See debug message for details.',
    debug?: string
  ) {
    super(message, debug);
    this.name = 'BLSyntaxError';
  }
}
