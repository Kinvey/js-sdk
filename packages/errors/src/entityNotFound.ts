import { KinveyError } from './kinvey';

export class EntityNotFoundError extends KinveyError {
  constructor(message = 'This entity was not found in the collection.', debug?: string) {
    super(message, debug);
    this.name = 'EntityNotFoundError';
  }
}
