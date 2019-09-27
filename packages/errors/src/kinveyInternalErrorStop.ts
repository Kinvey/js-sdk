import { KinveyError } from './kinvey';

export class KinveyInternalErrorStopError extends KinveyError {
  constructor(
    message = 'The Kinvey server encountered an unexpected error. Please contact support@kinvey.com for assistance.',
    debug?: string
  ) {
    super(message, debug);
    this.name = 'KinveyInternalErrorStopError';
  }
}
