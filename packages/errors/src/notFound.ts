import { KinveyError } from './kinvey';

export class NotFoundError extends KinveyError {
  constructor(message = '', debug?: string) {
    super(message, debug);
    this.name = 'NotFoundError';
  }
}
