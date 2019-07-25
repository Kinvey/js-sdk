export class KinveyError extends Error {
  public name: string;
  public debug: string;

  constructor(message = 'An error occurred.', debug = '') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'KinveyError';
    this.debug = debug;
  }
}
