import { KinveyError } from './kinvey';

export class CollectionNotFoundError extends KinveyError {
  constructor(message = 'The collection was not found for this app backend.', debug?: string) {
    super(message, debug);
    this.name = 'CollectionNotFoundError';
  }
}
