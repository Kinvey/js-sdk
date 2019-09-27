import { KinveyError } from './kinvey';

export class AppNotFoundError extends KinveyError {
  constructor(message = 'The app backend was not found.', debug?: string) {
    super(message, debug);
    this.name = 'AppNotFoundError';
  }
}
