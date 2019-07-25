import { KinveyError } from './kinveyError';

export class MissingConfigurationError extends KinveyError {
  constructor(message = 'The app is missing a configuration.', debug?: string) {
    super(message, debug);
    this.name = 'MissingConfigurationError';
  }
}
