import { KinveyError } from './kinveyError';

export class NetworkError extends KinveyError {
  constructor(message = 'There was an error with the network.', debug?: string) {
    super(message, debug);
    this.name = 'NetworkError';
  }
}
