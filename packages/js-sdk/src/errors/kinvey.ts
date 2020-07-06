export class KinveyError extends Error {
  public debug: string;

  public index: number;

  constructor(message = 'An error occurred.', debug = '') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'KinveyError';
    this.debug = debug;
  }
}
