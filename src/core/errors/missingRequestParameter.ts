import BaseError from './base';

export default class MissingRequestParameterError extends BaseError {
  constructor(message = 'A required parameter is missing from the request.', ...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // if (Error.captureStackTrace) {
    //   Error.captureStackTrace(this, MissingRequestParameterError);
    // }

    // Custom debugging information
    this.name = 'MissingRequestParameterError';
  }
}