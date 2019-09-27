import { KinveyError } from './kinvey';

export class UserNotFoundError extends KinveyError {
  constructor(message = 'This user does not exist for this app backend.', debug?: string) {
    super(message, debug);
    this.name = 'UserNotFoundError';
  }
}
