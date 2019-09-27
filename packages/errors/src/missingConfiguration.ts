import { KinveyError } from './kinvey';

export class MissingConfigurationError extends KinveyError {
  constructor(
    message = 'The app backend is missing configuration that prevents execution of this operation.',
    debug?: string
  ) {
    super(message, debug);
    this.name = 'MissingConfigurationError';
  }
}
