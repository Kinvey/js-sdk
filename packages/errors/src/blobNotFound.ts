import { KinveyError } from './kinvey';

export class BlobNotFoundError extends KinveyError {
  constructor(message = 'This blob was not found for this app backend.', debug?: string) {
    super(message, debug);
    this.name = 'BlobNotFoundError';
  }
}
